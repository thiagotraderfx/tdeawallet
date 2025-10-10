'use server';
/**
 * @fileoverview Este archivo es el punto de entrada para Genkit.
 *
 * Se utiliza para configurar e inicializar Genkit.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// CORRECCIÓN: Debe ser una importación por defecto
import NextjsPlugin from '@genkit-ai/next';

export const ai = genkit({
  plugins: [googleAI(), NextjsPlugin()], // Se llama sin el objeto de configuración
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
