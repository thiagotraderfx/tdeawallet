'use server';
/**
 * @fileoverview Este archivo es el punto de entrada principal para la configuración de Genkit en producción.
 *
 * Se utiliza para configurar e inicializar los plugins y modelos de Genkit.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// CORRECCIÓN: NextjsPlugin es una exportación por defecto
import NextjsPlugin from '@genkit-ai/next';

export const ai = genkit({
  plugins: [googleAI(), NextjsPlugin()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
