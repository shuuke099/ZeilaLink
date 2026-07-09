import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createPresignedPutUrl, getDirectUploadUrl, getPublicUrlForKey, s3Enabled } from '../config/aws';

export const uploadResume = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const key =
      (req as any).__uploadKey ||
      (req.file as any).key ||
      (req.file as any).filename;
    const publicUrl = (req.file as any).location || (key ? getPublicUrlForKey(key) : '');

    const resume = await prisma.resume.create({
      data: {
        userId: req.user!.id,
        s3Url: publicUrl,
        parsedText: null, // TODO: Implement PDF parsing
        skillsExtracted: [],
      },
    });

    res.status(201).json(resume);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserResumes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id || req.user!.id;

    if (userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const resumes = await prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(resumes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteResume = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (resume.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.resume.delete({ where: { id } });

    res.json({ message: 'Resume deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPresignedUrl = async (req: AuthRequest, res: Response) => {
  try {
    const { filename, contentType } = req.body as { filename: string; contentType: string };
    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType are required' });
    }

    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const key = `resumes/${req.user!.id}/${unique}-${filename}`;
    if (!s3Enabled) {
      return res.json({
        directUpload: true,
        key,
        uploadUrl: getDirectUploadUrl(),
        publicUrl: getPublicUrlForKey(key),
      });
    }

    const url = await createPresignedPutUrl(key, contentType, 20 * 60); // 20 minutes

    res.json({ url, key, publicUrl: getPublicUrlForKey(key) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
