"use server"

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { addIssue, incrementUpvote, updateIssueStatus, getUserById, getUserNotifications, deleteIssue } from "./data";
import type { IssueStatus } from "@/lib/types";
import { issueCategories } from "@/lib/types";

const issueSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  description: z.string().min(20, "Description must be at least 20 characters long"),
  category: z.enum(issueCategories),
  otherCategory: z.string().optional(),
  location: z.string().min(5, "Location is required"),
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
    isUrgent?: string[];
    image?: string[];
  };
  success: boolean;
  issueId?: string;
}

export async function createIssueAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    otherCategory: formData.get('otherCategory') || undefined,
    location: formData.get('location'),
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

    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/admin/dashboard');

    let successMessage = "Issue submitted successfully!";
    if (duplicateWarning) successMessage += duplicateWarning;
    else if (aiCategory !== validatedFields.data.category) successMessage += ` (Auto-categorized as ${aiCategory})`;

    return { message: successMessage, success: true, issueId: newIssue.id };
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

    const notifications = await getUserNotifications(sessionToken.value);
    return notifications;
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}
