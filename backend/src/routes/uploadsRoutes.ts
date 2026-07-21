import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import {
  deletePrivateDocument,
  directUploadResponse,
  downloadPrivateDocument,
  getPublicPresignedUrl,
  privateUploadResponse,
} from "../controllers/uploadController";
import { privateDocumentUpload, publicImageUpload } from "../config/aws";
import { authenticate } from "../middleware/auth";

const router = Router();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as any).user?.id || "anonymous",
  message: { error: "Too many upload attempts. Please try again later." },
});

const handleUpload = (
  upload: ReturnType<typeof publicImageUpload.single>,
  handler: (req: any, res: Response) => Promise<unknown>,
) =>
  (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (error: any) => {
      if (error) {
        const status = error.status || (error instanceof multer.MulterError ? 400 : 500);
        const message =
          status === 413 && !(error instanceof multer.MulterError)
            ? "Upload storage quota exceeded. Delete unused files before uploading again."
            : error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
            ? "File is too large. Maximum size is 5MB."
            : status >= 500
              ? "Upload failed"
              : "Only approved image or PDF files are allowed";
        return res.status(status).json({ error: message });
      }
      Promise.resolve(handler(req, res)).catch(next);
    });
  };

router.post("/presign", authenticate, uploadLimiter, getPublicPresignedUrl);
router.post(
  "/direct",
  authenticate,
  uploadLimiter,
  handleUpload(publicImageUpload.single("file"), directUploadResponse),
);
router.post(
  "/private",
  authenticate,
  uploadLimiter,
  handleUpload(privateDocumentUpload.single("file"), privateUploadResponse),
);
router.get(
  "/private/:userId/:fileId",
  authenticate,
  downloadPrivateDocument,
);
router.delete(
  "/private/:userId/:fileId",
  authenticate,
  deletePrivateDocument,
);
router.post(
  "/",
  authenticate,
  uploadLimiter,
  handleUpload(publicImageUpload.single("file"), directUploadResponse),
);

export default router;
