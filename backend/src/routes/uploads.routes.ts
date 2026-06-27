import crypto from 'node:crypto';
import { Router } from 'express';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadsRouter = Router();
uploadsRouter.use(requireAuth);

/** POST /uploads/signature — returns a short-lived signature so the browser can
 *  upload an image directly to Cloudinary (the API secret never leaves the
 *  server). All uploads land in the configured folder ("agrajatra"). */
uploadsRouter.post(
  '/signature',
  asyncHandler(async (_req, res) => {
    const { cloudName, apiKey, apiSecret, folder } = env.cloudinary;
    if (!cloudName || !apiKey || !apiSecret) throw new ApiError(500, 'Cloudinary is not configured');

    const timestamp = Math.floor(Date.now() / 1000);
    // Sign every param sent to Cloudinary (except file, api_key, resource_type),
    // sorted alphabetically: folder, timestamp.
    const toSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');

    res.json({ cloudName, apiKey, timestamp, signature, folder });
  }),
);
