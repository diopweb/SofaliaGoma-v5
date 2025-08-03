// src/ai/flows/suggest-reorder-quantities.ts
'use server';

/**
 * @fileOverview An AI agent to suggest optimal reorder quantities for products.
 *
 * - suggestReorderQuantities - A function that suggests reorder quantities for products.
 * - SuggestReorderQuantitiesInput - The input type for the suggestReorderQuantities function.
 * - SuggestReorderQuantitiesOutput - The return type for the suggestReorderQuantities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestReorderQuantitiesInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productId: z.string().describe('The ID of the product.'),
  historicalSalesData: z.string().describe('Historical sales data for the product, as a JSON string.'),
  currentStockLevel: z.number().describe('The current stock level of the product.'),
  reorderThreshold: z.number().describe('The reorder threshold for the product.'),
});
export type SuggestReorderQuantitiesInput = z.infer<typeof SuggestReorderQuantitiesInputSchema>;

const SuggestReorderQuantitiesOutputSchema = z.object({
  suggestedReorderQuantity: z.number().describe('The suggested reorder quantity for the product.'),
  reasoning: z.string().describe('The reasoning behind the suggested reorder quantity.'),
});
export type SuggestReorderQuantitiesOutput = z.infer<typeof SuggestReorderQuantitiesOutputSchema>;

export async function suggestReorderQuantities(input: SuggestReorderQuantitiesInput): Promise<SuggestReorderQuantitiesOutput> {
  return suggestReorderQuantitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestReorderQuantitiesPrompt',
  input: {schema: SuggestReorderQuantitiesInputSchema},
  output: {schema: SuggestReorderQuantitiesOutputSchema},
  prompt: `You are an AI assistant helping store owners determine optimal reorder quantities for their products.

  Analyze the historical sales data and current inventory levels to suggest a reorder quantity that minimizes stockouts and avoids overstocking.

  Product Name: {{{productName}}}
  Product ID: {{{productId}}}
  Historical Sales Data: {{{historicalSalesData}}}
  Current Stock Level: {{{currentStockLevel}}}
  Reorder Threshold: {{{reorderThreshold}}}

  Consider the following factors:
  - Recent sales trends
  - Seasonality
  - Lead time for reordering
  - Storage capacity

  Provide a suggested reorder quantity and a brief explanation of your reasoning.

  Output in JSON format.
  `,
});

const suggestReorderQuantitiesFlow = ai.defineFlow(
  {
    name: 'suggestReorderQuantitiesFlow',
    inputSchema: SuggestReorderQuantitiesInputSchema,
    outputSchema: SuggestReorderQuantitiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
