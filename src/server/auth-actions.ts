
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import connectToDatabase, { DatabaseConnectionError } from "@/lib/db";
import UserModel from "@/db/models/User";

const registrationSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number is required"),
    residenceDuration: z.string().min(1, "This field is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    profilePhoto: z.any().optional(),
    voterIdNumber: z.string().min(5, "Voter ID number is required"),
    voterIdPhoto: z.any().optional(),
    voterIdPhotoBack: z.any().optional(),
    walletAddress: z.string().optional(),
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
        voterIdPhotoBack?: string[];
        walletAddress?: string[];
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
        await connectToDatabase();
        const { email, password, name, walletAddress } = validatedFields.data;

        // Check if user already exists
        const existing = await UserModel.findOne({ email });
        if (existing) {
            return { message: "User with this email already exists.", success: false };
        }

        const newId = `user-${Math.floor(Math.random() * 100000)}`;

        // Handle avatar
        let avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${name}`;

        // Helper to process image
        const processImage = async (file: File | null) => {
            if (file && file.size > 0 && file.name !== 'undefined') {
                try {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    return `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
                } catch (e) {
                    console.error("Image processing failed", e);
                }
            }
            return null;
        };

        const profilePhotoInput = validatedFields.data.profilePhoto;
        const processedAvatar = await processImage(profilePhotoInput);
        if (processedAvatar) avatarUrl = processedAvatar;

        const idFrontUrl = await processImage(validatedFields.data.voterIdPhoto);
        const idBackUrl = await processImage(validatedFields.data.voterIdPhotoBack);

        await UserModel.create({
            _id: newId,
            email,
            password,
            name,
            avatar_url: avatarUrl,
            voter_id_front_url: idFrontUrl,
            voter_id_back_url: idBackUrl,
            role: 'user'
        });

        console.log("User created in DB:", email);

        // SET COOKIE
        const cookieStore = await cookies();
        cookieStore.set('session_token', newId, { httpOnly: true, path: '/' });

        revalidatePath('/profile');
        return { message: "Account created successfully! You can now log in.", success: true };
    } catch (e) {
        console.error("Create user error", e);
        const message = e instanceof DatabaseConnectionError
            ? `Failed to create account. ${e.message}`
            : "Failed to create account.";
        return { message, success: false };
    }
}

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export type LoginFormState = {
    message: string;
    errors?: {
        email?: string[];
        password?: string[];
    };
    success: boolean;
}

export type ProfilePhotoFormState = {
    message: string;
    success: boolean;
};

export async function loginUserAction(prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
    const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            message: "Validation failed. Please check your input.",
            errors: validatedFields.error.flatten().fieldErrors,
            success: false,
        };
    }

    const { email, password } = validatedFields.data;

    try {
        await connectToDatabase();
        const user = await UserModel.findOne({ email });

        if (user && user.password === password) {
            // Create session
            const cookieStore = await cookies();
            cookieStore.set('session_token', user._id, { httpOnly: true, path: '/' });

            return { message: "Login successful!", success: true };
        } else {
            return {
                message: "Invalid email or password.",
                success: false,
            };
        }
    } catch (e) {
        console.error("Login Error", e);
        const message = e instanceof DatabaseConnectionError
            ? `Login unavailable. ${e.message}`
            : "An error occurred";
        return { message, success: false };
    }
}

export async function updateProfilePhotoAction(
    _prevState: ProfilePhotoFormState,
    formData: FormData
): Promise<ProfilePhotoFormState> {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('session_token');

        if (!sessionToken?.value) {
            return { message: "Please log in first.", success: false };
        }

        const profilePhoto = formData.get('profilePhoto');

        if (!(profilePhoto instanceof File) || profilePhoto.size === 0) {
            return { message: "Please choose an image to upload.", success: false };
        }

        await connectToDatabase();

        const buffer = Buffer.from(await profilePhoto.arrayBuffer());
        const avatarUrl = `data:${profilePhoto.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;

        await UserModel.updateOne(
            { _id: sessionToken.value },
            { $set: { avatar_url: avatarUrl } }
        );

        revalidatePath('/profile');
        revalidatePath('/');

        return { message: "Profile photo updated.", success: true };
    } catch (e) {
        console.error("Update profile photo error", e);
        const message = e instanceof DatabaseConnectionError
            ? `Profile update unavailable. ${e.message}`
            : "Failed to update profile photo.";
        return { message, success: false };
    }
}
