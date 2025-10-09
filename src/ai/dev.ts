'use server';
/**
 * @fileoverview This file is the development entry point for Genkit.
 *
 * It is used to configure the Genkit development environment, including
 * the developer UI, and to register all the flows and plugins.
 *
 * It should not be included in the production build.
 *
 * To run, `genkit start`
 */

import { genkit }d from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { NextjsPlugin } from '@genkit-ai/next';
import { defineFlow, runFlow } from 'genkit/flow';
import { z } from 'zod';

import * as ipAddressValidator from './flows/ip-address-validator';

export default genkit({
  plugins: [
    googleAI(),
    NextjsPlugin({
      // The Next.js plugin is required for API route support.
    }),
  ],
  flows: [ipAddressValidator.validateIpAddress],
  // The Genkit developer UI is served from the `/genkit` path.
  devUi: {
    // Force the developer UI to be served from a specific port.
    // port: 4001,
  },
  // Force the API to be served from a specific port.
  // api: {
  //   port: 3101,
  // },
});
