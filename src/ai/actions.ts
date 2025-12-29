'use server';

import { type VerifyVoterIdInput } from "./flows/verify-voter-id-flow";

export async function verifyVoterIdAction(input: VerifyVoterIdInput) {
    const { voterIdNumber, photoDataUri, photoBackDataUri } = input;

    // Check if API is configured
    const pythonApiUrl = (process.env.PYTHON_API_URL || "").replace(/\/$/, "");
    if (!pythonApiUrl) {
        console.warn("[AI] PYTHON_API_URL not set. Skipping verification.");
        return { isValid: false, reason: "Verification service unavailable." };
    }

    try {
        const response = await fetch(`${pythonApiUrl}/verify-voter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                voterId: voterIdNumber,
                frontImage: photoDataUri,
                backImage: photoBackDataUri || "NONE"
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errText}`);
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        return {
            isValid: result.match,
            reason: result.match
                ? "Voter ID verified successfully."
                : `Verification Failed: ${result.reason || "ID Mismatch"}`,
            extractedNumber: result.extracted_text ? (Array.isArray(result.extracted_text) ? result.extracted_text.join(", ") : result.extracted_text) : undefined
        };

    } catch (error: any) {
        console.error("Error verifying voter ID with Python API:", error);
        return {
            isValid: false,
            reason: error.message || "An unexpected error occurred during verification."
        }
    }
}

export async function detectDuplicatesAction(issueId: string) {
    const pythonApiUrl = (process.env.PYTHON_API_URL || "").replace(/\/$/, "");
    if (!pythonApiUrl) {
        console.warn("[AI] PYTHON_API_URL not set. Skipping duplicate detection.");
        return { matches: [] };
    }

    try {
        const mongoUri = process.env.MONGODB_URI || "";
        const dbName = process.env.MONGODB_DB_NAME || "";

        const response = await fetch(`${pythonApiUrl}/detect-duplicates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                issueId: issueId,
                mongoUri: mongoUri,
                dbName: dbName
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errText}`);
        }

        const result = await response.json();

        if (result.error) throw new Error(result.error);

        return { matches: result.matches || [] };

    } catch (error: any) {
        console.error("Error in duplicate detection via API:", error);
        return { matches: [], error: error.message };
    }
}

