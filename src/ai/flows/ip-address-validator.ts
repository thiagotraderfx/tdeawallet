'use server';

import { ai } from '../genkit';
import { z } from 'zod';
import { defineFlow } from 'genkit/flow';

export const IpValidationRequestSchema = z.object({
  ipAddress: z.string(),
});

export const IpValidationResponseSchema = z.object({
  isSafe: z.boolean(),
  reason: z.string().optional(),
});

export const validateIpAddress = defineFlow(
  {
    name: 'validateIpAddress',
    inputSchema: IpValidationRequestSchema,
    outputSchema: IpValidationResponseSchema,
  },
  async ({ ipAddress }) => {
    const prompt = `Evaluate the IP address "${ipAddress}". Based on common security heuristics (e.g., known malicious IP, proxy/VPN usage, etc.), determine if it is safe. Your response must be in JSON format. The 'isSafe' field should be a boolean. If not safe, provide a brief 'reason' field.`;
    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-1.5-flash-latest',
      config: {
        response: {
          format: 'json',
          schema: IpValidationResponseSchema,
        },
      },
    });

    const validationResult = llmResponse.output();
    if (!validationResult) {
      return {
        isSafe: true,
        reason: 'Could not validate IP address. Defaulting to safe.',
      };
    }
    return validationResult;
  }
);
