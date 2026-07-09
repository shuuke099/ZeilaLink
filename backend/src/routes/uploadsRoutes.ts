import { Router, Request, Response, NextFunction } from 'express';
import { getPublicPresignedUrl, directUploadResponse } from '../controllers/uploadController';
import { uploadMiddleware } from '../config/aws';
import multer from 'multer';

const router = Router();

const singleUpload = uploadMiddleware.single('file');

const handleUpload =
  (handler: (req: Request, res: Response) => void) =>
  (req: Request, res: Response, next: NextFunction) => {
    singleUpload(req, res, (err: any) => {
      if (err) {
        console.error('[Upload] Multer error:', {
          message: err.message,
          code: err.code,
          field: err.field,
          name: err.name,
          stack: err.stack,
        });
        
        let status = err.status || (err instanceof multer.MulterError ? 400 : 500);
        let message = err.message || 'Upload failed';
        
        // Handle specific S3/client errors
        if (err.message?.includes('this.client.send') || err.message?.includes('client.send')) {
          console.error('[Upload] S3 client error detected, this usually means S3 is misconfigured');
          message = 'Upload service configuration error. Please contact support or try again later.';
          status = 500;
        }
        
        // Provide more specific error messages
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File size too large. Maximum size is 10MB.';
          } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Unexpected file field. Please use "file" as the field name.';
          } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'Too many files. Only one file is allowed.';
          }
        }
        
        return res.status(status).json({ 
          error: message,
          code: err.code,
          details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        });
      }
      try {
        handler(req, res);
      } catch (error: any) {
        console.error('[Upload] Handler error:', error);
        // If it's an S3 client error, provide a clearer message
        if (error.message?.includes('this.client.send') || error.message?.includes('client.send')) {
          return res.status(500).json({ 
            error: 'Upload service configuration error. Please contact support.',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          });
        }
        next(error);
      }
    });
  };

// Public presign endpoint for avatar/logo uploads
router.post('/presign', getPublicPresignedUrl);
router.post('/direct', handleUpload(directUploadResponse));
router.post('/', handleUpload(directUploadResponse));

export default router;
