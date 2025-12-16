import { NextResponse } from 'next/server';
import os from 'os';
import path from 'path';
import { writeFile, unlink } from 'fs/promises';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const image = formData.get("image") as File;
        const voterId = formData.get("voterId") as string;
        // Handle optional back image if passed (though this old route might not support it yet, let's just make it compilable)
        const imageBack = formData.get("imageBack") as File | null;

        if (!image || !voterId) {
            return NextResponse.json(
                { error: "Missing image or voterId" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await image.arrayBuffer());
        // Create a temp file path
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `voter_${Date.now()}_${image.name}`);

        // Save the file temporarily
        await writeFile(tempFilePath, buffer);

        // Handle back image if it exists (simplistic support to match new logic partially)
        let backPathArg = "NONE";
        let tempFilePathBack = "";
        if (imageBack) {
            const bufferBack = Buffer.from(await imageBack.arrayBuffer());
            tempFilePathBack = path.join(tempDir, `voter_back_${Date.now()}_${imageBack.name}`);
            await writeFile(tempFilePathBack, bufferBack);
            backPathArg = `"${tempFilePathBack}"`;
        }

        // Call Python script
        // Adjust command to use the venv python executable we created
        const projectRoot = process.cwd();
        const pythonPath = path.join(projectRoot, "python", "venv", "Scripts", "python.exe");
        const scriptPath = path.join(projectRoot, "ml", "scripts", "verify_voter.py");

        console.log(`Executing: ${pythonPath} ${scriptPath} ${tempFilePath} "${voterId}"`);

        try {
            // Updated signature: script front back id
            const { stdout, stderr } = await execAsync(`"${pythonPath}" "${scriptPath}" "${tempFilePath}" ${backPathArg} "${voterId}"`);

            if (stderr) {
                console.warn("Python stderr:", stderr);
            }

            console.log("Python stdout:", stdout);

            // Parse the last line of stdout which should be the JSON
            const lines = stdout.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            const result = JSON.parse(lastLine);

            // cleanup
            await unlink(tempFilePath).catch(console.error);
            if (tempFilePathBack) await unlink(tempFilePathBack).catch(console.error);

            return NextResponse.json(result);

        } catch (execError: any) {
            console.error("Execution error:", execError);
            await unlink(tempFilePath).catch(() => { });
            if (tempFilePathBack) await unlink(tempFilePathBack).catch(console.error);
            return NextResponse.json(
                { error: "Verification failed internally", details: execError.message },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
