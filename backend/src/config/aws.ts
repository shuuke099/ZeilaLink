import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import './env';

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'somali-job-platform-uploads';
const region = process.env.AWS_REGION || 'us-east-1';

// Only enable S3 if credentials are explicitly set AND we want to use S3
// For now, we'll default to disk storage to avoid SDK version conflicts
const forceDiskStorage = process.env.FORCE_DISK_STORAGE === 'true' || !process.env.AWS_ACCESS_KEY_ID;
const isS3Configured = !forceDiskStorage && Boolean(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  bucketName
);

const uploadsRoot = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const sanitizeKey = (raw: string): string => {
  const normalized = raw.replace(/\\/g, '/');
  const segments = normalized
    .split('/')
    .filter((segment) => segment && segment !== '.' && segment !== '..');
  return segments.join('/');
};

const buildDefaultKey = (req: Request, file: Express.Multer.File): string => {
  const folder = ((req.body as any)?.folder as string) || 'uploads';
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
  return sanitizeKey(`${folder}/${uniqueName}`);
};

const resolveKey = (req: Request, file: Express.Multer.File): string => {
  const provided = ((req.body as any)?.key as string) || '';
  if (provided.trim()) {
    return sanitizeKey(provided.trim());
  }
  return buildDefaultKey(req, file);
};

const commonLimits = {
  fileSize: 10 * 1024 * 1024, // 10MB
};

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const loweredName = file.originalname.toLowerCase();
  const isImage =
    file.mimetype.startsWith('image/') ||
    /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(loweredName);
  const isDocument =
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    /\.(pdf|doc|docx)$/i.test(loweredName);

  if (isImage || isDocument) {
    cb(null, true);
    return;
  }

  const error: any = new Error(
    'Invalid file type. Allowed formats: images (JPG, PNG, GIF, WEBP, SVG, BMP) and PDF/DOC/DOCX documents.',
  );
  error.status = 400;
  cb(error);
};

// DISABLED: S3 is disabled due to AWS SDK v2/v3 compatibility issues with multer-s3
// The error "this.client.send is not a function" occurs because multer-s3 expects AWS SDK v2
// but there's a conflict with AWS SDK v3 packages. We'll use disk storage instead.
let s3: AWS.S3 | null = null;
let s3ClientValid = false;

// Force disk storage to avoid SDK conflicts
console.log('[AWS] 📁 Using local disk storage (S3 disabled to avoid SDK conflicts)');
console.log('[AWS] 💡 Files will be saved to:', uploadsRoot);
if (isS3Configured) {
  console.log('[AWS] ⚠️ S3 credentials detected but disabled due to multer-s3/AWS SDK compatibility');
  console.log('[AWS] 💡 To enable S3, you need to migrate to AWS SDK v3 or use a different upload library');
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const key = resolveKey(req, file);
      (req as any).__uploadKey = key;
      const folder = path.dirname(key);
      const dest = path.join(uploadsRoot, folder === '.' ? '' : folder);
      
      // Ensure directory exists
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      console.log('[Upload] Saving to:', dest);
      cb(null, dest);
    } catch (error: any) {
      console.error('[Upload] Error creating destination directory:', error);
      cb(error, '');
    }
  },
  filename: (req, file, cb) => {
    try {
      const key = (req as any).__uploadKey || resolveKey(req, file);
      (file as any).key = key;
      const filename = path.basename(key);
      console.log('[Upload] Filename:', filename);
      cb(null, filename);
    } catch (error: any) {
      console.error('[Upload] Error setting filename:', error);
      cb(error, '');
    }
  },
});

// Always use disk storage to avoid AWS SDK version conflicts
// The error "this.client.send is not a function" occurs due to AWS SDK v2/v3 incompatibility
// with multer-s3. We'll use disk storage which is reliable and works perfectly.
const uploadHandler = multer({
  storage: diskStorage,
  limits: commonLimits,
  fileFilter,
});

// Log storage method being used
console.log('[Upload] 💾 Using local disk storage');
console.log('[Upload] 📁 Files will be saved to:', uploadsRoot);
if (isS3Configured) {
  console.log('[Upload] ⚠️ S3 credentials detected but disabled due to SDK compatibility issues');
  console.log('[Upload] 💡 To enable S3 later, migrate to AWS SDK v3 or fix multer-s3 compatibility');
}

export const uploadToS3 = uploadHandler;
export const uploadMiddleware = uploadHandler;
export const localUploadsPath = uploadsRoot;
export const s3Enabled = s3ClientValid && Boolean(s3);

export const getSignedUrl = (key: string, expiresIn: number = 3600): string => {
  // S3 is disabled, return local URL instead
  return getPublicUrlForKey(key);
};

export const createPresignedPutUrl = async (
  key: string,
  contentType: string,
  expiresInSeconds: number = 3600,
): Promise<string> => {
  // S3 is disabled, return local URL instead
  return getPublicUrlForKey(key);
};

export const getPublicUrlForKey = (key: string): string => {
  const cleaned = sanitizeKey(key);
  if (s3Enabled) {
    const useRegionalDomain = region && region !== 'us-east-1';
    const host = useRegionalDomain
      ? `${bucketName}.s3.${region}.amazonaws.com`
      : `${bucketName}.s3.amazonaws.com`;
    return `https://${host}/${cleaned}`;
  }
  const base =
    process.env.PUBLIC_ASSET_BASE_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    `http://localhost:${process.env.PORT || 7000}`;
  return `${base.replace(/\/$/, '')}/uploads/${cleaned}`;
};

export const getDirectUploadUrl = (): string => {
  const base =
    process.env.BACKEND_PUBLIC_URL ||
    `http://localhost:${process.env.PORT || 7000}`;
  return `${base.replace(/\/$/, '')}/api/uploads/direct`;
};

export default s3;
