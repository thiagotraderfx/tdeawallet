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
 * Para ejecutar en desarrollo, usar: `genkit start`
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// Importación por defecto correcta
import NextjsPlugin from '@genkit-ai/next';
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
    // Las opciones de puerto se comentan para usar los valores por defecto
    // port: 4001,
  },
  // api: {
  //   port: 3101,
  // },
});
