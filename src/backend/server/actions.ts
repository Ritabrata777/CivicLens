
"use server"

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addIssue, incrementUpvote, updateIssueStatus } from "./data";
import type { IssueStatus } from "@/lib/types";
import { issueCategories } from "@/lib/types";

const issueSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  description: z.string().min(20, "Description must be at least 20 characters long"),
  category: z.enum(issueCategories),
  otherCategory: z.string().optional(),
  location: z.string().min(5, "Location is required"),
  isUrgent: z.boolean().optional(),
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
  };
  success: boolean;
  issueId?: string;
}

export async function createIssueAction(prevState: FormState, formData: FormData): Promise<FormState> {
    const rawData = {
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        otherCategory: formData.get('otherCategory'),
        location: formData.get('location'),
        isUrgent: formData.get('isUrgent') === 'on',
    };

  const validatedFields = issueSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please check your input.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }
  
  try {
    const newIssue = await addIssue(validatedFields.data);
    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/admin/dashboard');
    return { message: "Issue submitted successfully!", success: true, issueId: newIssue.id };
  } catch (e) {
    return { message: "Failed to create issue.", success: false };
  }
}

export async function updateIssueStatusAction(issueId: string, newStatus: IssueStatus, notes?: string) {
    try {
        await updateIssueStatus(issueId, newStatus, notes);
        revalidatePath(`/issues/${issueId}`);
        revalidatePath(`/admin/issues/${issueId}`);
        revalidatePath('/admin/dashboard');
        return { success: true, message: `Status updated to ${newStatus}`};
    } catch (error) {
        return { success: false, message: 'Failed to update status.' };
    }
}

export async function upvoteIssueAction(issueId: string) {
    try {
        await incrementUpvote(issueId);
        revalidatePath(`/issues/${issueId}`);
        revalidatePath('/');
        return { success: true, message: 'Upvoted!'};
    } catch (error) {
        return { success: false, message: 'Failed to upvote.' };
    }
}

export async function remindAdminAction(issueId: string) {
    console.log(`[NOTIFICATION] Reminder sent to admin for issue: ${issueId}`);
    return { success: true, message: 'A reminder has been sent to the administration.'};
}
