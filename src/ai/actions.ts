'use server';

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { type VerifyVoterIdInput } from "./flows/verify-voter-id-flow";

const execFileAsync = promisify(execFile);

function getPythonApiUrl() {
    const configuredUrl = (process.env.PYTHON_API_URL || "").replace(/\/$/, "");
    if (configuredUrl) {
        return configuredUrl;
    }

    if (process.env.NODE_ENV !== "production") {
        return "http://127.0.0.1:7860";
    }

    return "";
}

function getLocalPythonPath() {
    const root = process.cwd();
    const windowsPython = path.join(root, '.venv', 'Scripts', 'python.exe');
    const unixPython = path.join(root, '.venv', 'bin', 'python');
    return process.platform === 'win32' ? windowsPython : unixPython;
}

export async function verifyVoterIdAction(input: VerifyVoterIdInput) {
    const { voterIdNumber, photoDataUri, photoBackDataUri } = input;

    const pythonApiUrl = getPythonApiUrl();
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
            reason: error instanceof TypeError
                ? `Verification service is unreachable at ${pythonApiUrl}. Start the Python backend and try again.`
                : error.message || "An unexpected error occurred during verification."
        }
    }
}

export async function detectDuplicatesAction(issueId: string) {
    const pythonApiUrl = getPythonApiUrl();
    const mongoUri = process.env.MONGODB_URI || "";
    const dbName = process.env.MONGODB_DB_NAME || "";
    let apiError: any;

    try {
        if (!pythonApiUrl) {
            throw new TypeError("PYTHON_API_URL not set");
        }

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
        apiError = error;
        try {
            const pythonPath = getLocalPythonPath();
            const scriptPath = path.join(process.cwd(), 'python_backend', 'run_duplicate_detection.py');
            const { stdout } = await execFileAsync(pythonPath, [scriptPath, mongoUri, dbName, issueId], {
                cwd: process.cwd(),
                maxBuffer: 10 * 1024 * 1024,
            });

            const result = JSON.parse(stdout);
            if (result.error) {
                return { matches: [], error: result.error };
            }

            return { matches: result.matches || [] };
        } catch (fallbackError: any) {
            console.error("Error in duplicate detection via API:", apiError);
            console.error("Local duplicate detection fallback failed:", fallbackError);
            return {
                matches: [],
                error: apiError instanceof TypeError
                    ? `Duplicate detection service is unreachable at ${pythonApiUrl}, and the local Python fallback also failed.`
                    : apiError.message
            };
        }
    }
}
