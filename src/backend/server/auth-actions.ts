
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

// This is a placeholder. In a real app, you would save the user to a database.
const users: any[] = [];

const registrationSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number is required"),
    residenceDuration: z.string().min(1, "This field is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    profilePhoto: z.any().optional(),
    voterIdNumber: z.string().min(5, "Voter ID number is required"),
    voterIdPhoto: z.any().refine(file => file.size > 0, "Voter ID photo is required"),
});

export type RegistrationFormState = {
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    phone?: string[];
    residenceDuration?: string[];
    password?: string[];
    profilePhoto?: string[];
    voterIdNumber?: string[];
    voterIdPhoto?: string[];
  };
  success: boolean;
}

export async function createUserAction(prevState: RegistrationFormState, formData: FormData): Promise<RegistrationFormState> {
    const validatedFields = registrationSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            message: "Validation failed. Please check your input.",
            errors: validatedFields.error.flatten().fieldErrors,
            success: false,
        };
    }

    try {
        // In a real app, you would hash the password and save the user.
        console.log("Creating user:", validatedFields.data.email);
        
        // In a real app, you would upload the profile photo to a storage service
        // and save the URL. For now, we're just logging it.
        if (validatedFields.data.profilePhoto && validatedFields.data.profilePhoto.size > 0) {
            console.log("Profile photo to upload:", validatedFields.data.profilePhoto.name);
        }

        users.push(validatedFields.data);
        revalidatePath('/profile');
        return { message: "Account created successfully! You can now log in.", success: true };
    } catch (e) {
        return { message: "Failed to create account.", success: false };
    }
}
