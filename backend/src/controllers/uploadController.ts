import { Request, Response } from 'express';
import { createPresignedPutUrl, getDirectUploadUrl, getPublicUrlForKey, s3Enabled } from '../config/aws';

export const getPublicPresignedUrl = async (req: Request, res: Response) => {
  try {
    const { filename, contentType } = req.body as { filename: string; contentType: string };
    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType are required' });
    }

    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const key = `public/${unique}-${filename}`;
    if (!s3Enabled) {
      const publicUrl = getPublicUrlForKey(key);
      return res.json({
        directUpload: true,
        key,
        uploadUrl: getDirectUploadUrl(),
        publicUrl,
        url: publicUrl,
      });
    }

    const url = await createPresignedPutUrl(key, contentType, 20 * 60);
    const publicUrl = getPublicUrlForKey(key);

    res.json({ url, key, publicUrl, uploadUrl: url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const directUploadResponse = (req: Request, res: Response) => {
  try {
    const file = req.file as any;
    if (!file) {
      console.error('[Upload] No file received in request');
      return res.status(400).json({ error: 'File is required' });
    }

    console.log('[Upload] File received:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      key: file.key,
      location: file.location,
    });

    if (s3Enabled) {
      const publicUrl = file.location || getPublicUrlForKey(file.key);
      console.log('[Upload] S3 upload successful:', { key: file.key, publicUrl });
      return res.json({
        key: file.key,
        publicUrl,
        url: publicUrl,
      });
    }

    const rawKey =
      (req as any).__uploadKey ||
      file.key ||
      file.filename;
    const key = typeof rawKey === 'string' ? rawKey.replace(/\\/g, '/') : String(rawKey);
    const publicUrl = getPublicUrlForKey(key);

    console.log('[Upload] Local upload successful:', { key, publicUrl });
    return res.json({
      key,
      publicUrl,
      url: publicUrl,
    });
  } catch (error: any) {
    console.error('[Upload] Error in directUploadResponse:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to process upload',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};


