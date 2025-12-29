'use server';

import { type VerifyVoterIdInput } from "./flows/verify-voter-id-flow";
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import os from 'os';

const execAsync = util.promisify(exec);
// Default exec options: 30s timeout, larger stdout/stderr buffer to accommodate verbose Python libraries
const EXEC_TIMEOUT_MS = 120_000;
const DEFAULT_EXEC_OPTIONS = { timeout: EXEC_TIMEOUT_MS, maxBuffer: 20 * 1024 * 1024 };

export async function verifyVoterIdAction(input: VerifyVoterIdInput) {
    const { voterIdNumber, photoDataUri, photoBackDataUri } = input;
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    const imagePathFront = path.join(tempDir, `voter_id_front_${timestamp}.jpg`);
    const imagePathBack = path.join(tempDir, `voter_id_back_${timestamp}.jpg`);

    try {
        // 1. Decode Data URIs and save to temp files
        const base64DataFront = photoDataUri.replace(/^data:image\/\w+;base64,/, "");
        await fs.promises.writeFile(imagePathFront, Buffer.from(base64DataFront, 'base64'));

        const base64DataBack = photoBackDataUri.replace(/^data:image\/\w+;base64,/, "");
        await fs.promises.writeFile(imagePathBack, Buffer.from(base64DataBack, 'base64'));
        const backPathArg = `"${imagePathBack}"`;

        // 2. Define paths
        // 2. Define paths
        const pythonScript = path.join(process.cwd(), 'ml', 'scripts', 'verify_voter.py');

        const venvOne = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
        const venvTwo = path.join(process.cwd(), '.venv', 'bin', 'python'); // Linux/Mac

        let pythonExecutable = "python";
        if (fs.existsSync(venvOne)) {
            pythonExecutable = `"${venvOne}"`;
        } else if (fs.existsSync(venvTwo)) {
            pythonExecutable = `"${venvTwo}"`;
        } else {
            console.warn(`[AI] Virtual Environment Python not found at ${venvOne} or ${venvTwo}. Falling back to system 'python'. CWD: ${process.cwd()}`);
        }

        // 3. Execute Python script
        // New signature: verify_voter.py <front_path> <back_path> <voter_id>
        // If back path is missing, passing "NONE" string to python to handle it.
        const command = `${pythonExecutable} "${pythonScript}" "${imagePathFront}" ${backPathArg} "${voterIdNumber}"`;
        console.log(`Executing: ${command}`);

        let stdout: string, stderr: string;
        try {
            const res = await execAsync(command, DEFAULT_EXEC_OPTIONS);
            stdout = res.stdout;
            stderr = res.stderr;
        } catch (e: any) {
            // Detect timeout or kill and provide clearer message
            if (e.killed || e.signal === 'SIGTERM' || e.code === 'ETIMEDOUT') {
                throw new Error(`Python verification timed out after ${EXEC_TIMEOUT_MS}ms`);
            }
            throw e;
        }

        if (stderr) {
            console.warn("Python stderr:", stderr);
        }

        // 4. Parse Output
        console.log("Python Output:", stdout);

        // Robust JSON parsing: find the last valid JSON object line
        const lines = stdout.trim().split('\n');
        let result = null;
        for (let i = lines.length - 1; i >= 0; i--) {
            try {
                result = JSON.parse(lines[i]);
                if (result.match !== undefined) break; // Found our result object
            } catch (e) { continue; }
        }

        if (!result) throw new Error("Could not check verification result from Python output.");

        // 5. Cleanup
        try {
            await fs.promises.unlink(imagePathFront);
            await fs.promises.unlink(imagePathBack);
        } catch (e) {
            console.error("Failed to delete temp files:", e);
        }

        // 6. Return formatted result
        if (result.error) {
            throw new Error(result.error);
        }

        return {
            isValid: result.match,
            reason: result.match
                ? "Voter ID verified successfully."
                : `Verification Failed: ${result.reason || "ID Mismatch"}`,
            extractedNumber: result.extracted_text ? result.extracted_text.join(", ") : undefined
        };

    } catch (error: any) {
        console.error("Error verifying voter ID with Python:", error);
        // Clean up on error too
        try { if (fs.existsSync(imagePathFront)) await fs.promises.unlink(imagePathFront) } catch { }
        try { if (fs.existsSync(imagePathBack)) await fs.promises.unlink(imagePathBack) } catch { }

        return {
            isValid: false,
            reason: error.message || "An unexpected error occurred during verification."
        }
    }
}

export async function detectDuplicatesAction(issueId: string) {
    try {
        const pythonScript = path.join(process.cwd(), 'ml', 'scripts', 'detect_duplicates.py');

        const venvOne = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
        const venvTwo = path.join(process.cwd(), '.venv', 'bin', 'python'); // Linux/Mac

        let pythonExecutable = "python";
        if (fs.existsSync(venvOne)) {
            pythonExecutable = `"${venvOne}"`;
        } else if (fs.existsSync(venvTwo)) {
            pythonExecutable = `"${venvTwo}"`;
        }

        const projectRoot = process.cwd();
        // Quote project root too just in case
        const mongoUri = process.env.MONGODB_URI || "";
        const dbName = process.env.MONGODB_DB_NAME || "";
        const command = `${pythonExecutable} "${pythonScript}" "${issueId}" "${projectRoot}" "${mongoUri}" "${dbName}"`;

        let stdout: string, stderr: string;
        try {
            const res = await execAsync(command, DEFAULT_EXEC_OPTIONS);
            stdout = res.stdout;
            stderr = res.stderr;
        } catch (e: any) {
            if (e.killed || e.signal === 'SIGTERM' || e.code === 'ETIMEDOUT') {
                console.error(`Duplicate detection timed out after ${EXEC_TIMEOUT_MS}ms`);
                return { matches: [], error: `Duplicate detection timed out after ${EXEC_TIMEOUT_MS}ms` };
            }
            throw e;
        }

        if (stderr) {
            // print stderr but don't fail immediately as some libs print warnings to stderr
            console.warn("Duplicate Detection Stderr:", stderr);
        }

        const lines = stdout.trim().split('\n');
        let result = null;
        for (let i = lines.length - 1; i >= 0; i--) {
            try {
                result = JSON.parse(lines[i]);
                if (result.matches !== undefined || result.error) break;
            } catch (e) { continue; }
        }

        if (!result) throw new Error("Could not parse duplicate detection output.");
        if (result.error) throw new Error(result.error);

        return { matches: result.matches || [] };

    } catch (error: any) {
        console.error("Error in duplicate detection:", error);
        return { matches: [], error: error.message };
    }
}
