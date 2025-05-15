'use server';

/**
 * @fileOverview Uses Gemini AI to pre-fill a food item form based on an image.
 * (Note: This flow seems redundant with image-to-food-form.ts and might be consolidated or removed in the future if functionality is identical)
 * - imageToFoodItem - A function that takes an image and returns a pre-filled food form.
 * - ImageToFoodItemInput - The input type for the imageToFoodItem function.
 * - ImageToFoodItemOutput - The return type for the imageToFoodItem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageToFoodItemInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageToFoodItemInput = z.infer<typeof ImageToFoodItemInputSchema>;

const ImageToFoodItemOutputSchema = z.object({
  description: z.string().describe('A description of the food item in the image.'),
  portionSize: z.number().optional().describe('The estimated number of palm-sized portions of the food item. One palm-sized portion is roughly the size of the user\'s palm.'),
});
export type ImageToFoodItemOutput = z.infer<typeof ImageToFoodItemOutputSchema>;

export async function imageToFoodItem(input: ImageToFoodItemInput): Promise<ImageToFoodItemOutput> {
  return imageToFoodItemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imageToFoodItemPrompt',
  input: {schema: ImageToFoodItemInputSchema},
  output: {schema: ImageToFoodItemOutputSchema},
  prompt: `You are an AI assistant helping users log their food intake.

You will receive a photo of a meal. Your tasks are:
1. Generate a concise description of the food item(s) in the image.
2. Estimate the portion size in terms of "palm-sized units". One palm-sized portion is roughly the size of an average adult's palm (excluding fingers). For example, a medium apple might be 1 palm-sized portion, a large chicken breast might be 1.5-2 palm-sized portions. Provide this as a number.

Photo: {{media url=photoDataUri}}

Respond with the description and the estimated number of palm-sized portions.`,
});

const imageToFoodItemFlow = ai.defineFlow(
  {
    name: 'imageToFoodItemFlow',
    inputSchema: ImageToFoodItemInputSchema,
    outputSchema: ImageToFoodItemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
