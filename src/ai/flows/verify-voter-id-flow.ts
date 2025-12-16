'use server';
/**
 * @fileOverview A flow to verify a user's voter ID.
 *
 * - verifyVoterId - A function that handles the verification.
 * - VerifyVoterIdInput - The input type for the function.
 * - VerifyVoterIdOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyVoterIdInputSchema = z.object({
  voterIdNumber: z.string().describe('The voter ID number from the card.'),
  photoDataUri: z
    .string()
    .describe(
      "A photo of the voter ID card (front), as a data URI that must include a MIME type and use Base64 encoding."
    ),
  photoBackDataUri: z
    .string()
    .describe(
      "A photo of the voter ID card (back), as a data URI that must include a MIME type and use Base64 encoding."
    ),
});
export type VerifyVoterIdInput = z.infer<typeof VerifyVoterIdInputSchema>;

const VerifyVoterIdOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the voter ID is considered valid based on the provided information.'),
  reason: z.string().describe('A brief explanation for the validation result.'),
  extractedNumber: z.string().optional().describe('The voter ID number extracted from the image.'),
});
export type VerifyVoterIdOutput = z.infer<typeof VerifyVoterIdOutputSchema>;


const verificationPrompt = ai.definePrompt({
  name: 'verifyVoterIdPrompt',
  input: { schema: VerifyVoterIdInputSchema },
  output: { schema: VerifyVoterIdOutputSchema },
  prompt: `You are an AI assistant responsible for verifying voter ID cards.
    Your task is to analyze the provided image of a voter ID card and the user-submitted voter ID number.

    User-submitted Voter ID Number: {{{voterIdNumber}}}
    Image of Voter ID card: {{media url=photoDataUri}}

    Instructions:
    1.  Examine the image to identify the voter ID number printed on it.
    2.  Compare the number you extract from the image with the user-submitted number.
    3.  Check if the image appears to be a legitimate voter ID card (e.g., look for expected format, logos, etc. of a common ID card).
    4.  Set 'isValid' to true if the numbers match and the card looks authentic. Otherwise, set it to false.
    5.  Provide a clear, concise 'reason' for your decision. For example, "Voter ID number matches the document." or "The number in the image does not match the number provided."
    6.  Set the 'extractedNumber' to the number you identified in the image.

    This is a simulation. For a valid Indian Voter ID card, the number format is typically 10 characters, starting with letters followed by numbers. Use this as a general guideline. Do not be overly strict as this is a demo.
    `,
});

const verifyVoterIdFlow = ai.defineFlow(
  {
    name: 'verifyVoterIdFlow',
    inputSchema: VerifyVoterIdInputSchema,
    outputSchema: VerifyVoterIdOutputSchema,
  },
  async (input) => {
    const llmResponse = await verificationPrompt(input);
    const output = llmResponse.output;
    if (!output) {
      return {
        isValid: false,
        reason: 'AI model could not process the request.'
      }
    }
    return output;
  }
);

export async function verifyVoterId(input: VerifyVoterIdInput): Promise<VerifyVoterIdOutput> {
  return await verifyVoterIdFlow(input);
}
