"use server"

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { addIssue, incrementUpvote, updateIssueStatus, getUserById, getUserNotifications, deleteIssue, createSOSAlert, getAppNotifications, acceptSOSAlert } from "./data";
import type { IssueStatus } from "@/lib/types";
import { issueCategories } from "@/lib/types";
import { detectDuplicatesAction } from "@/ai/actions";
const issueSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  description: z.string().min(20, "Description must be at least 20 characters long"),
  category: z.enum(issueCategories),
  otherCategory: z.string().optional(),
  location: z.string().min(5, "Location is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  isUrgent: z.boolean().optional(),
  image: z.any().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  licensePlate: z.string().optional(),
  violationType: z.string().optional(),
}).refine(data => {
  if (data.category === 'Other') {
    return data.otherCategory && data.otherCategory.length > 3;
  }
  return true;
}, {
  message: "Please specify the category",
  path: ["otherCategory"],
});


export type FormState = {
  message: string;
  errors?: {
    title?: string[];
    description?: string[];
    category?: string[];
    otherCategory?: string[];
    location?: string[];
    pincode?: string[];
    isUrgent?: string[];
    image?: string[];
  };
  success: boolean;
  issueId?: string;
}

const sosSchema = z.object({
  emergencyType: z.string().min(3, "Emergency type is required"),
  locationAddress: z.string().min(5, "Location is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  details: z.string().max(500).optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

const sosAcceptSchema = z.object({
  helperLocationAddress: z.string().min(3).optional(),
  helperLat: z.string().optional(),
  helperLng: z.string().optional(),
});

export type SOSFormState = {
  message: string;
  success: boolean;
  notifiedHeroes?: number;
};

export async function createIssueAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    otherCategory: formData.get('otherCategory') || undefined,
    location: formData.get('location'),
    pincode: formData.get('pincode'),
    isUrgent: formData.get('isUrgent') === 'on',
    image: formData.get('image'),
    lat: formData.get('lat'),
    lng: formData.get('lng'),
    licensePlate: formData.get('licensePlate'),
    violationType: formData.get('violationType'),
  };

  console.log("Server Action Raw Data:", rawData);

  const validatedFields = issueSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      message: "Validation failed. Please check your input.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token');

    if (!sessionToken?.value) {
      return { message: "You must be logged in to submit an issue.", success: false };
    }

    const userId = sessionToken.value;

    // Handle Image Upload
    let imageUrl = undefined;
    const imageFile = validatedFields.data.image;

    console.log("[DEBUG] Processing Image:", imageFile ? { name: imageFile.name, size: imageFile.size, type: imageFile.type } : "No image file provided");

    if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
      try {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const base64 = buffer.toString('base64');
        const mimeType = imageFile.type || 'image/jpeg';
        imageUrl = `data:${mimeType};base64,${base64}`;
        console.log("[DEBUG] Image converted to Base64 successfully. Length:", base64.length);
      } catch (err) {
        console.error("[ERROR] Error processing issue image:", err);
      }
    } else {
      console.log("[DEBUG] Image file invalid or empty.");
    }

    // AI Analysis
    let aiCategory = validatedFields.data.category;
    let isUrgent = validatedFields.data.isUrgent;
    let duplicateWarning = "";

    try {
      const { analyzeIssueFlow } = await import('@/ai/flows/analyze-issue');


      console.log("[AI] Starting analysis...");
      const aiResult = await analyzeIssueFlow({
        title: validatedFields.data.title,
        description: validatedFields.data.description,
        imageUrl: imageUrl // Optional
      });

      console.log("[AI] Analysis Result:", aiResult);

      if (aiResult) {
        // Auto-correct category if user selected 'Other' or if AI is confident?
        // Let's trust AI if user picked 'Other', otherwise respect user choice but maybe hint?
        // For this MVP, let's override 'Other' if AI found a better one.
        if (aiCategory === 'Other' && aiResult.category !== 'Other') {
          aiCategory = aiResult.category as any; // Cast to issueCategory enum type
        }

        // Use AI priority to set urgency if not already set
        if (!isUrgent && aiResult.priority === 'High') {
          isUrgent = true;
        }

        if (aiResult.isDuplicate) {
          duplicateWarning = " (Note: This looks like a common duplicate issue.)";
        }
      }
    } catch (error) {
      console.error("[AI] Analysis Failed:", error);
      // Fallback to manual inputs
    }

    const newIssue = await addIssue({
      ...validatedFields.data,
      category: aiCategory,
      isUrgent: isUrgent,
      imageUrl,
      licensePlate: validatedFields.data.licensePlate,
      violationType: validatedFields.data.violationType
    }, userId);

    // Run REAL duplicate detection via Python script (MongoDB based)
    let finalMessage = "Issue submitted successfully!";
    if (aiCategory !== validatedFields.data.category) {
      finalMessage += ` (Auto-categorized as ${aiCategory})`;
    }

    try {
      // Small delay to ensure DB write is visible? Usually not needed if awaited, but safe to know.
      const dupResult = await detectDuplicatesAction(newIssue.id);
      if (dupResult.matches && dupResult.matches.length > 0) {
        // Pick the top match
        const topMatch = dupResult.matches[0];
        finalMessage += ` This looks like a duplicate of issue #${topMatch.id} (Match: ${topMatch.score}%).`;
      } else {
        finalMessage += " This is a new issue.";
      }
    } catch (err) {
      console.error("Post-creation duplicate check failed:", err);
      // Don't fail the request, just don't show the msg
    }

    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/admin/dashboard');

    return { message: finalMessage, success: true, issueId: newIssue.id };
  } catch (e) {
    console.error("Create Issue Error:", e);
    return { message: "Failed to create issue.", success: false };
  }
}

export async function updateIssueStatusAction(issueId: string, newStatus: IssueStatus, notes?: string, txHash?: string) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token');

    if (!sessionToken?.value) {
      return { success: false, message: 'Unauthorized: You must be logged in.' };
    }

    const user = await getUserById(sessionToken.value);
    if (!user || user.role !== 'admin') {
      return { success: false, message: 'Unauthorized: Admin access required.' };
    }

    if (newStatus === 'Rejected') {
      if (!notes || notes.trim().length === 0) {
        return { success: false, message: 'A reason is required to reject an issue.' };
      }
      // CHANGED: Do not delete issue on rejection. Keep it for records.
      await updateIssueStatus(issueId, newStatus, notes, txHash, user.id);
      revalidatePath('/admin/dashboard');
      revalidatePath('/');
      revalidatePath('/issues');
      revalidatePath('/profile');
      return { success: true, message: 'Issue rejected and recorded on-chain.' };
    }

    await updateIssueStatus(issueId, newStatus, notes, txHash, user.id);
    revalidatePath(`/issues/${issueId}`);
    revalidatePath(`/admin/issues/${issueId}`);
    revalidatePath('/admin/dashboard');
    revalidatePath('/issues');
    revalidatePath('/profile');
    return { success: true, message: `Status updated to ${newStatus}` };
  } catch (error) {
    console.error("Update Status Error", error);
    return { success: false, message: 'Failed to update status.' };
  }
}

export async function upvoteIssueAction(issueId: string) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token');

    if (!sessionToken?.value) {
      return { success: false, message: 'You must be logged in to support an issue.' };
    }

    await incrementUpvote(issueId, sessionToken.value);
    revalidatePath(`/issues/${issueId}`);
    revalidatePath('/');
    return { success: true, message: 'Upvoted!' };
  } catch (error: any) {
    if (error.message === 'You have already upvoted this issue.') {
      return { success: false, message: 'You have already upvoted this issue.' };
    }
    return { success: false, message: 'Failed to upvote.' };
  }
}

export async function remindAdminAction(issueId: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token');

  if (!sessionToken?.value) {
    return { success: false, message: 'You must be logged in to send a reminder.' };
  }

  console.log(`[NOTIFICATION] Reminder sent to admin for issue: ${issueId} by user ${sessionToken.value}`);
  return { success: true, message: 'A reminder has been sent to the administration.' };
}

export async function getNotificationsAction() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token');

    if (!sessionToken?.value) {
      return [];
    }

    const notifications = await getAppNotifications(sessionToken.value);
    return notifications;
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

export async function createSOSAlertAction(_prevState: SOSFormState, formData: FormData): Promise<SOSFormState> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token');

    if (!sessionToken?.value) {
      return { success: false, message: 'You must be logged in to send an SOS alert.' };
    }

    const validatedFields = sosSchema.safeParse({
      emergencyType: formData.get('emergencyType'),
      locationAddress: formData.get('locationAddress'),
      pincode: formData.get('pincode'),
      details: formData.get('details') || undefined,
      lat: formData.get('lat') || undefined,
      lng: formData.get('lng') || undefined,
    });

    if (!validatedFields.success) {
      const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0];
      return { success: false, message: firstError || 'Please check the SOS details and try again.' };
    }

    const result = await createSOSAlert({
      emergencyType: validatedFields.data.emergencyType,
      details: validatedFields.data.details,
      locationAddress: validatedFields.data.locationAddress,
      pincode: validatedFields.data.pincode,
      lat: validatedFields.data.lat ? parseFloat(validatedFields.data.lat) : undefined,
      lng: validatedFields.data.lng ? parseFloat(validatedFields.data.lng) : undefined,
    }, sessionToken.value);

    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/admin/sos');

    return {
      success: true,
      message: result.notifiedHeroes.length > 0
        ? `${result.notifiedHeroes.length} nearby local hero${result.notifiedHeroes.length === 1 ? '' : 'es'} have been notified.`
        : 'SOS saved. We could not find any nearby local heroes yet.',
      notifiedHeroes: result.notifiedHeroes.length,
    };
  } catch (error) {
    console.error("Create SOS Alert Error:", error);
    return { success: false, message: 'Failed to send SOS alert.' };
  }
}

export async function createSOSQuickAlertAction(payload: {
  emergencyType: string;
  locationAddress: string;
  pincode: string;
  details?: string;
  lat?: number;
  lng?: number;
}): Promise<SOSFormState> {
  const formData = new FormData();
  formData.set('emergencyType', payload.emergencyType);
  formData.set('locationAddress', payload.locationAddress);
  formData.set('pincode', payload.pincode);
  if (payload.details) {
    formData.set('details', payload.details);
  }
  if (payload.lat != null) {
    formData.set('lat', String(payload.lat));
  }
  if (payload.lng != null) {
    formData.set('lng', String(payload.lng));
  }

  return createSOSAlertAction({ success: false, message: '' }, formData);
}

export async function acceptSOSAlertAction(alertId: string, payload?: {
  helperLocationAddress?: string;
  helperLat?: number;
  helperLng?: number;
}) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token');

    if (!sessionToken?.value) {
      return { success: false, message: 'You must be logged in to accept an SOS alert.' };
    }

    const validatedPayload = sosAcceptSchema.safeParse({
      helperLocationAddress: payload?.helperLocationAddress,
      helperLat: payload?.helperLat != null ? String(payload.helperLat) : undefined,
      helperLng: payload?.helperLng != null ? String(payload.helperLng) : undefined,
    });

    const alert = await acceptSOSAlert(
      alertId,
      sessionToken.value,
      validatedPayload.success
        ? {
            address: validatedPayload.data.helperLocationAddress,
            lat: validatedPayload.data.helperLat ? parseFloat(validatedPayload.data.helperLat) : undefined,
            lng: validatedPayload.data.helperLng ? parseFloat(validatedPayload.data.helperLng) : undefined,
          }
        : undefined
    );
    revalidatePath('/profile');
    revalidatePath('/');
    revalidatePath('/admin/sos');

    return {
      success: true,
      message: 'You accepted the SOS alert. The sender has been notified.',
      alert,
    };
  } catch (error) {
    console.error('Accept SOS Alert Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to accept SOS alert.',
    };
  }
}

export async function resolveIssueAction(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token');

    if (!sessionToken?.value) {
      return { success: false, message: 'Unauthorized: You must be logged in.' };
    }

    const user = await getUserById(sessionToken.value);
    if (!user || user.role !== 'admin') {
      return { success: false, message: 'Unauthorized: Admin access required.' };
    }

    const issueId = formData.get('issueId') as string;
    const notes = formData.get('notes') as string;
    const txHash = formData.get('txHash') as string;
    const imageFile = formData.get('image') as File;

    if (!issueId) return { success: false, message: 'Issue ID missing.' };

    let resolutionImageUrl = undefined;

    if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
      try {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const base64 = buffer.toString('base64');
        const mimeType = imageFile.type || 'image/jpeg';
        resolutionImageUrl = `data:${mimeType};base64,${base64}`;
      } catch (err) {
        console.error("Error processing resolution image:", err);
        return { success: false, message: 'Failed to process image.' };
      }
    }

    if (!resolutionImageUrl) {
      return { success: false, message: 'Proof of Fix (Image) is required to resolve an issue.' };
    }

    await updateIssueStatus(issueId, 'Resolved', notes, txHash || undefined, user.id, resolutionImageUrl);

    revalidatePath(`/issues/${issueId}`);
    revalidatePath(`/admin/issues/${issueId}`);
    revalidatePath('/admin/dashboard');
    revalidatePath('/issues');
    revalidatePath('/profile');

    return { success: true, message: 'Issue resolved with proof!' };
  } catch (error) {
    console.error("Resolve Issue Error:", error);
    return { success: false, message: 'Failed to resolve issue.' };
  }
}



export async function getAdminProfileAction(walletAddress: string) {
  try {
    const { getUserById } = await import('@/server/data');
    if (!walletAddress) return { exists: false };

    // Address is used as ID in our system logic for admins
    const user = await getUserById(walletAddress.toLowerCase());

    if (user && user.role === 'admin') {
      return { exists: true, name: user.name };
    }
    return { exists: false };
  } catch (error) {
    console.error("Get Admin Profile Error:", error);
    return { exists: false };
  }
}

export async function adminLoginAction(walletAddress: string, name: string) {
  try {
    const { ensureAdminUser } = await import('@/server/data');

    if (!walletAddress) {
      return { success: false, message: "Wallet address is required" };
    }

    // Removed whitelist check to allow anyone to register/login as requested
    // const { checkIsAdminEnv } = await import('@/lib/web3');
    // const isWhitelisted = checkIsAdminEnv(walletAddress);
    // if (!isWhitelisted) {
    //   return { success: false, message: "Unauthorized: Wallet not whitelisted" };
    // }

    const user = await ensureAdminUser(walletAddress, name);

    const cookieStore = await cookies();
    // Set session (no expires option = session cookie, deleted on browser close)
    cookieStore.set('session_token', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax'
    });

    return { success: true, message: "Login successful" };
  } catch (error) {
    console.error("Admin Login Error:", error);
    return { success: false, message: "Login failed" };
  }
}

export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('session_token');
  revalidatePath('/');
  return { success: true };
}

