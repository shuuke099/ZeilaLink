import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import * as resumeController from "../controllers/resumeController";
import { authenticate } from "../middleware/auth";
import { resumeUpload } from "../config/aws";

const router = Router();
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as any).user?.id || "anonymous",
  message: { error: "Too many resume uploads. Please try again later." },
});

const handleResumeUpload = (req: Request, res: Response, next: NextFunction) => {
  resumeUpload.single("resume")(req, res, (error: any) => {
    if (error) {
      const status = error.status || (error instanceof multer.MulterError ? 400 : 500);
      const message =
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "Resume is too large. Maximum size is 5MB."
          : status >= 500
            ? "Resume upload failed"
            : "Only valid PDF resumes are allowed";
      return res.status(status).json({ error: message });
    }
    Promise.resolve(resumeController.uploadResume(req, res)).catch(next);
  });
};

router.post("/upload", authenticate, uploadLimiter, handleResumeUpload);
router.post("/presign", authenticate, uploadLimiter, resumeController.getPresignedUrl);
router.get("/users/:id", authenticate, resumeController.getUserResumes);
router.get("/:id/download", authenticate, resumeController.downloadResume);
router.delete("/:id", authenticate, resumeController.deleteResume);

export default router;
