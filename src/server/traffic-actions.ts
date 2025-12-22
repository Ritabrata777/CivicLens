'use server';

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';

// Define response schema
const TrafficViolationSchema = z.object({
    violation_detected: z.boolean(),
    violations: z.array(z.object({
        type: z.string(),
        confidence: z.number(),
        bbox: z.array(z.number())
    })),
    license_plate: z.string(),
    all_detections: z.array(z.any()),
    error: z.string().optional()
});

export type TrafficAnalysisResult = z.infer<typeof TrafficViolationSchema>;

export async function detectTrafficViolationAction(formData: FormData): Promise<{ success: boolean, data?: TrafficAnalysisResult, message?: string }> {
    const file = formData.get('image') as File;

    if (!file || file.size === 0) {
        return { success: false, message: 'No image uploaded.' };
    }

    try {
        // 1. Save file to temporary path
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempDir = path.join(process.cwd(), 'cache');
        // Ensure cache dir exists
        try { await fs.mkdir(tempDir, { recursive: true }); } catch (e) { }

        const tempFilePath = path.join(tempDir, `traffic_${Date.now()}_${file.name}`);
        await fs.writeFile(tempFilePath, buffer);

        // 2. Spawn Python Process
        // Assuming python venv is not strictly needed if global python has packages, 
        // OR we use the python verified earlier.
        // Command: python python/detect_traffic_violation.py <image_path>

        const pythonScript = path.join(process.cwd(), 'ml', 'scripts', 'detect_traffic_violation.py');

        // Use local virtual environment python
        const pythonExecutable = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');

        return new Promise((resolve) => {
            const pythonProcess = spawn(pythonExecutable, [pythonScript, tempFilePath]);

            let outputData = '';
            let errorData = '';

            pythonProcess.stdout.on('data', (data) => {
                outputData += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorData += data.toString();
            });

            pythonProcess.on('close', async (code) => {
                // Initial cleanup
                try { await fs.unlink(tempFilePath); } catch (e) {
                    console.error("Failed to delete temp file", e);
                }

                if (code !== 0) {
                    console.error('Python script error:', errorData);
                    resolve({ success: false, message: 'AI processing failed.' });
                    return;
                }

                try {
                    // Python script prints JSON to stdout
                    const jsonResult = JSON.parse(outputData);
                    const parsed = TrafficViolationSchema.parse(jsonResult);
                    resolve({ success: true, data: parsed });
                } catch (e) {
                    console.error('Failed to parse Python output:', outputData, e);
                    resolve({ success: false, message: 'Invalid response from AI model.' });
                }
            });
        });

    } catch (error) {
        console.error('Traffic detection action error:', error);
        return { success: false, message: 'Server error processing image.' };
    }
}
