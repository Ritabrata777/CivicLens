'use server';

import { type VerifyVoterIdInput } from "./flows/verify-voter-id-flow";
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import os from 'os';

const execAsync = util.promisify(exec);

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
        const pythonScript = path.join(process.cwd(), 'python', 'verify_voter.py');
        const venvPython = path.join(process.cwd(), 'python', 'venv', 'Scripts', 'python.exe');
        const pythonStr = fs.existsSync(venvPython) ? `"${venvPython}"` : "python";

        // 3. Execute Python script
        // New signature: verify_voter.py <front_path> <back_path> <voter_id>
        // If back path is missing, passing "NONE" string to python to handle it.
        const command = `${pythonStr} "${pythonScript}" "${imagePathFront}" ${backPathArg} "${voterIdNumber}"`;
        console.log(`Executing: ${command}`);

        const { stdout, stderr } = await execAsync(command);

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
                ? "Voter ID verified successfully (Matches text extracted from image)."
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
