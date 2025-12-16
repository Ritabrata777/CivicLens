
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import db from "@/db";

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
        const { email, password, name, walletAddress } = validatedFields.data;

        // Check if user already exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
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

        const stmt = db.prepare(`
            INSERT INTO users (id, email, password, name, avatar_url, voter_id_front_url, voter_id_back_url, role)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'user')
        `);

        stmt.run(newId, email, password, name, avatarUrl, idFrontUrl, idBackUrl);

        console.log("User created in DB:", email);

        // SET COOKIE
        const cookieStore = await cookies();
        // We store the ID now, or email. The data layer uses getUserById, but our session check uses email? 
        // Let's stick to email as the session token key for now to match verify logic.
        // Ideally we'd store a session ID that maps to a user ID.
        // But for this simplified flow:
        cookieStore.set('session_token', newId, { httpOnly: true, path: '/' });

        revalidatePath('/profile');
        return { message: "Account created successfully! You can now log in.", success: true };
    } catch (e) {
        console.error("Create user error", e);
        return { message: "Failed to create account.", success: false };
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
        const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

        if (row && row.password === password) {
            // Create session
            const cookieStore = await cookies();
            cookieStore.set('session_token', row.id, { httpOnly: true, path: '/' });

            return { message: "Login successful!", success: true };
        } else {
            return {
                message: "Invalid email or password.",
                success: false,
            };
        }
    } catch (e) {
        console.error("Login Error", e);
        return { message: "An error occurred", success: false };
    }
}

