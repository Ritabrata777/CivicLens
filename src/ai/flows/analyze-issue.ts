import { z } from 'zod';
import { ai } from '../genkit';

export const analyzeIssueFlow = ai.defineFlow(
    {
        name: 'analyzeIssue',
        inputSchema: z.object({
            title: z.string(),
            description: z.string(),
            imageUrl: z.string().optional(),
        }),
        outputSchema: z.object({
            category: z.string(),
            summary: z.string().describe("A concise 1-sentence summary of the issue"),
            isDuplicate: z.boolean().describe("Whether this seems like a duplicate of a common issue (pothole, garbage, etc.)"),
            priority: z.enum(['Low', 'Medium', 'High']).describe("Suggested priority based on description")
        }),
    },
    async (input) => {
        // We use a structured prompt to guide the output
        const result = await ai.generate({
            prompt: `
        Analyze this civic issue:
        Title: ${input.title}
        Description: ${input.description}
        
        Return JSON with:
        - category: one of [Pothole, Streetlight Failure, Drainage Issue, Garbage Dumping, Traffic Violation, Other]
        - summary: concise summary
        - isDuplicate: boolean
        - priority: one of [Low, Medium, High]
      `,
            output: {
                format: 'json',
                schema: z.object({
                    category: z.enum(["Pothole", "Streetlight Failure", "Drainage Issue", "Garbage Dumping", "Traffic Violation", "Other"]),
                    summary: z.string(),
                    isDuplicate: z.boolean(),
                    priority: z.enum(['Low', 'Medium', 'High'])
                })
            }
        });

        if (!result.output) {
            throw new Error("Failed to generate analysis");
        }

        return result.output;
    }
);
