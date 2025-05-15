'use server';

/**
 * @fileOverview Uses Gemini AI to pre-fill a food item form based on an image.
 *
 * - imageToFoodForm - A function that takes an image and returns a pre-filled food form.
 * - ImageToFoodFormInput - The input type for the imageToFoodForm function.
 * - ImageToFoodFormOutput - The return type for the imageToFoodForm function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageToFoodFormInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageToFoodFormInput = z.infer<typeof ImageToFoodFormInputSchema>;

const ImageToFoodFormOutputSchema = z.object({
  description: z.string().describe('A description of the food item in the image.'),
  portionSize: z.number().optional().describe('The estimated number of palm-sized portions of the food item. One palm-sized portion is roughly the size of the user\'s palm.'),
});
export type ImageToFoodFormOutput = z.infer<typeof ImageToFoodFormOutputSchema>;

export async function imageToFoodForm(input: ImageToFoodFormInput): Promise<ImageToFoodFormOutput> {
  return imageToFoodFormFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imageToFoodFormPrompt',
  input: {schema: ImageToFoodFormInputSchema},
  output: {schema: ImageToFoodFormOutputSchema},
  prompt: `You are an AI assistant helping users log their food intake.

You will receive a photo of a meal. Your tasks are:
1. Generate a concise description of the food item(s) in the image.
2. Estimate the portion size in terms of "palm-sized units". One palm-sized portion is roughly the size of an average adult's palm (excluding fingers). For example, a medium apple might be 1 palm-sized portion, a large chicken breast might be 1.5-2 palm-sized portions. Provide this as a number.

Photo: {{media url=photoDataUri}}

Respond with the description and the estimated number of palm-sized portions.`,
});

const imageToFoodFormFlow = ai.defineFlow(
  {
    name: 'imageToFoodFormFlow',
    inputSchema: ImageToFoodFormInputSchema,
    outputSchema: ImageToFoodFormOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
