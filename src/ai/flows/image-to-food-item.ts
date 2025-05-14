'use server';

/**
 * @fileOverview Uses Gemini AI to pre-fill a food item form based on an image.
 *
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
  portionSize: z.string().optional().describe('The estimated portion size of the food item.'),
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

You will receive a photo of a meal and generate a description of the food item and estimate the portion size.

Photo: {{media url=photoDataUri}}

Description:`,
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
