'use server';
/**
 * @fileoverview Este archivo es el punto de entrada de desarrollo para Genkit.
 *
 * Se utiliza para configurar el entorno de desarrollo de Genkit, incluyendo
 * la interfaz de usuario para desarrolladores (UI dev), y para registrar
 * todos los flujos y plugins.
 *
 * No debe incluirse en la construcción de producción (production build).
 *
 * Para ejecutar, usar: `genkit start`
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { NextjsPlugin } from '@genkit-ai/next';
import { defineFlow, runFlow } from 'genkit/flow';
import { z } from 'zod';

import * as ipAddressValidator from './flows/ip-address-validator';

export default genkit({
  plugins: [
    googleAI(),
    NextjsPlugin({
      // El plugin de Next.js es requerido para el soporte de rutas API.
    }),
  ],
  flows: [ipAddressValidator.validateIpAddress],
  // La UI de desarrollador de Genkit se sirve desde la ruta `/genkit`.
  devUi: {
    // Forzar que la UI de desarrollador se sirva desde un puerto específico.
    // port: 4001,
  },
  // Forzar que la API se sirva desde un puerto específico.
  // api: {
  //   port: 3101,
  // },
});
