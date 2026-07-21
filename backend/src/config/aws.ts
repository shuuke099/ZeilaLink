import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import type { Request } from "express";
import multer from "multer";
import "./env";

type UploadPurpose = "public-image" | "resume" | "private-document";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_USER_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_USER_PUBLIC_BYTES = 25 * 1024 * 1024;
const MAX_USER_PRIVATE_BYTES = 75 * 1024 * 1024;
const MAX_USER_PUBLIC_FILES = 25;
const MAX_USER_PRIVATE_FILES = 50;
const MAX_ACCOUNTED_FILES_PER_BUCKET = 256;
const QUOTA_RESERVATION_TTL_MS = 15 * 60 * 1000;

const configuredUploadsRoot = process.env.UPLOADS_ROOT?.trim();
if (
  process.env.NODE_ENV === "production" &&
  (!configuredUploadsRoot || !path.isAbsolute(configuredUploadsRoot))
) {
  throw new Error("UPLOADS_ROOT must be an absolute persistent path in production");
}

const uploadsRoot = configuredUploadsRoot
  ? path.resolve(configuredUploadsRoot)
  : path.resolve(process.cwd(), "uploads");
const privateUploadsRoot = path.join(uploadsRoot, "private");
const publicUploadsRoot = path.join(uploadsRoot, "public");

fs.mkdirSync(privateUploadsRoot, { recursive: true, mode: 0o700 });
fs.mkdirSync(publicUploadsRoot, { recursive: true, mode: 0o755 });
fs.chmodSync(privateUploadsRoot, 0o700);

const publicImageTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const httpError = (message: string, status: number) => {
  const error: NodeJS.ErrnoException & { status?: number } = new Error(message);
  error.status = status;
  return error;
};

const quotaError = () => httpError("Upload storage quota exceeded", 413);

const assertSafeUserId = (userId: string): string => {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(userId)) {
    throw httpError("Invalid upload owner", 400);
  }
  return userId;
};

const userIdForUpload = (req: Request): string => {
  const userId = (req as Request & { user?: { id?: string } }).user?.id;
  if (!userId) throw httpError("Authentication required", 401);
  return assertSafeUserId(userId);
};

const safeStoredPath = (key: string): string => {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some((part) => !part || part === "." || part === "..")) {
    throw httpError("Invalid upload key", 400);
  }

  const resolved = path.resolve(uploadsRoot, ...normalized.split("/"));
  const relative = path.relative(uploadsRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw httpError("Invalid upload key", 400);
  }
  return resolved;
};

type StorageUsage = {
  publicBytes: number;
  privateBytes: number;
  publicFiles: number;
  privateFiles: number;
};

type QuotaReservation = {
  key: string;
  userId: string;
  visibility: "public" | "private";
  bytes: number;
  expiresAt: number;
};

const quotaReservations = new Map<string, QuotaReservation>();
const quotaLocks = new Map<string, Promise<void>>();

const withUserQuotaLock = async <T>(
  userId: string,
  operation: () => Promise<T>,
): Promise<T> => {
  const previous = quotaLocks.get(userId) || Promise.resolve();
  let unlock: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    unlock = resolve;
  });
  const current = previous.then(() => gate);
  quotaLocks.set(userId, current);
  await previous;

  try {
    return await operation();
  } finally {
    unlock();
    if (quotaLocks.get(userId) === current) quotaLocks.delete(userId);
  }
};

const bucketUsage = async (directory: string): Promise<{ bytes: number; files: number }> => {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(directory, { withFileTypes: true });
  } catch (error: any) {
    if (error?.code === "ENOENT") return { bytes: 0, files: 0 };
    throw error;
  }

  // Never let quota accounting turn into an unbounded filesystem traversal.
  // Too many or unexpected entries fail closed until an operator cleans them up.
  if (entries.length > MAX_ACCOUNTED_FILES_PER_BUCKET) throw quotaError();

  let bytes = 0;
  let files = 0;
  for (const entry of entries) {
    if (!entry.isFile()) throw quotaError();
    const entryPath = path.join(directory, entry.name);
    const stat = await fs.promises.lstat(entryPath);
    if (!stat.isFile()) throw quotaError();
    bytes += stat.size;
    files += 1;
    if (!Number.isSafeInteger(bytes) || bytes > MAX_USER_TOTAL_BYTES) {
      throw quotaError();
    }
  }
  return { bytes, files };
};

const storageUsageForUser = async (userId: string): Promise<StorageUsage> => {
  const safeUserId = assertSafeUserId(userId);
  const [publicUsage, resumeUsage, documentUsage] = await Promise.all([
    bucketUsage(safeStoredPath(`public/users/${safeUserId}`)),
    bucketUsage(safeStoredPath(`private/resumes/${safeUserId}`)),
    bucketUsage(safeStoredPath(`private/documents/${safeUserId}`)),
  ]);

  return {
    publicBytes: publicUsage.bytes,
    privateBytes: resumeUsage.bytes + documentUsage.bytes,
    publicFiles: publicUsage.files,
    privateFiles: resumeUsage.files + documentUsage.files,
  };
};

const activeReservationsForUser = (
  userId: string,
  excludedKey?: string,
): QuotaReservation[] => {
  const now = Date.now();
  const reservations: QuotaReservation[] = [];
  for (const [key, reservation] of quotaReservations) {
    if (reservation.expiresAt <= now) {
      quotaReservations.delete(key);
    } else if (reservation.userId === userId && key !== excludedKey) {
      reservations.push(reservation);
    }
  }
  return reservations;
};

const assertWithinQuota = (
  usage: StorageUsage,
  reservations: QuotaReservation[],
): void => {
  const reservedPublicBytes = reservations
    .filter((item) => item.visibility === "public")
    .reduce((total, item) => total + item.bytes, 0);
  const reservedPrivateBytes = reservations
    .filter((item) => item.visibility === "private")
    .reduce((total, item) => total + item.bytes, 0);
  const reservedPublicFiles = reservations.filter(
    (item) => item.visibility === "public",
  ).length;
  const reservedPrivateFiles = reservations.length - reservedPublicFiles;

  const publicBytes = usage.publicBytes + reservedPublicBytes;
  const privateBytes = usage.privateBytes + reservedPrivateBytes;
  if (
    publicBytes > MAX_USER_PUBLIC_BYTES ||
    privateBytes > MAX_USER_PRIVATE_BYTES ||
    publicBytes + privateBytes > MAX_USER_TOTAL_BYTES ||
    usage.publicFiles + reservedPublicFiles > MAX_USER_PUBLIC_FILES ||
    usage.privateFiles + reservedPrivateFiles > MAX_USER_PRIVATE_FILES
  ) {
    throw quotaError();
  }
};

const reserveUploadQuota = async (
  req: Request,
  key: string,
  purpose: UploadPurpose,
): Promise<void> => {
  const userId = userIdForUpload(req);
  const declaredRequestBytes = Number(req.get("content-length"));
  const reservedBytes =
    Number.isSafeInteger(declaredRequestBytes) && declaredRequestBytes > 0
      ? Math.min(declaredRequestBytes, MAX_UPLOAD_BYTES)
      : MAX_UPLOAD_BYTES;
  await withUserQuotaLock(userId, async () => {
    const usage = await storageUsageForUser(userId);
    const reservation: QuotaReservation = {
      key,
      userId,
      visibility: purpose === "public-image" ? "public" : "private",
      // Multipart Content-Length is an upper bound for its single file. If it
      // is unavailable, reserve the entire per-file limit and fail closed.
      bytes: reservedBytes,
      expiresAt: Date.now() + QUOTA_RESERVATION_TTL_MS,
    };
    assertWithinQuota(usage, [
      ...activeReservationsForUser(userId),
      reservation,
    ]);
    quotaReservations.set(key, reservation);
  });

  const response = req.res;
  if (response) {
    const release = () => {
      quotaReservations.delete(key);
    };
    response.once("finish", release);
    response.once("close", release);
  }
};

const releaseQuotaReservation = (key: string): void => {
  quotaReservations.delete(key);
};

const storedKeyForPath = (filePath: string): string => {
  const resolved = path.resolve(filePath);
  const relative = path.relative(uploadsRoot, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw httpError("Invalid upload path", 400);
  }
  const key = relative.split(path.sep).join("/");
  safeStoredPath(key);
  return key;
};

const ownerForStoredKey = (
  key: string,
  purpose: UploadPurpose,
): { userId: string; visibility: "public" | "private" } => {
  const parts = key.split("/");
  const expectedFolder = purpose === "resume" ? "resumes" : "documents";
  const validLayout =
    purpose === "public-image"
      ? parts.length === 4 && parts[0] === "public" && parts[1] === "users"
      : parts.length === 4 && parts[0] === "private" && parts[1] === expectedFolder;
  if (!validLayout) throw httpError("Invalid upload path", 400);
  return {
    userId: assertSafeUserId(parts[2]),
    visibility: purpose === "public-image" ? "public" : "private",
  };
};

const assertStoredFileWithinQuota = async (
  filePath: string,
  purpose: UploadPurpose,
): Promise<void> => {
  const key = storedKeyForPath(filePath);
  const { userId } = ownerForStoredKey(key, purpose);
  await withUserQuotaLock(userId, async () => {
    try {
      const usage = await storageUsageForUser(userId);
      assertWithinQuota(usage, activeReservationsForUser(userId, key));
    } finally {
      releaseQuotaReservation(key);
    }
  });
};

const keyForUpload = (
  req: Request,
  file: Express.Multer.File,
  purpose: UploadPurpose,
): string => {
  const userId = userIdForUpload(req);
  const id = randomUUID();

  if (purpose === "public-image") {
    const extension = publicImageTypes[file.mimetype];
    if (!extension) throw httpError("Unsupported image type", 400);
    return `public/users/${userId}/${id}${extension}`;
  }

  const folder = purpose === "resume" ? "resumes" : "documents";
  return `private/${folder}/${userId}/${id}.pdf`;
};

const makeStorage = (purpose: UploadPurpose) =>
  multer.diskStorage({
    destination: (req, file, callback) => {
      let key: string;
      try {
        key = keyForUpload(req, file, purpose);
      } catch (error) {
        callback(error as Error, "");
        return;
      }
      void reserveUploadQuota(req, key, purpose)
        .then(() => {
          try {
            (req as Request & { __uploadKey?: string }).__uploadKey = key;
            const destination = path.dirname(safeStoredPath(key));
            const privateDirectory = purpose !== "public-image";
            fs.mkdirSync(destination, {
              recursive: true,
              mode: privateDirectory ? 0o700 : 0o755,
            });
            if (privateDirectory) fs.chmodSync(destination, 0o700);
            callback(null, destination);
          } catch (error) {
            releaseQuotaReservation(key);
            callback(error as Error, "");
          }
        })
        .catch((error) => callback(error as Error, ""));
    },
    filename: (req, file, callback) => {
      try {
        const key =
          (req as Request & { __uploadKey?: string }).__uploadKey ||
          keyForUpload(req, file, purpose);
        (file as Express.Multer.File & { key?: string }).key = key;
        callback(null, path.basename(key));
      } catch (error) {
        callback(error as Error, "");
      }
    },
  });

const publicImageFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const expectedExtension = publicImageTypes[file.mimetype];
  const validExtension =
    expectedExtension === ".jpg"
      ? extension === ".jpg" || extension === ".jpeg"
      : extension === expectedExtension;

  if (!expectedExtension || !validExtension) {
    callback(httpError("Only JPEG, PNG, and WEBP images are allowed", 400));
    return;
  }
  callback(null, true);
};

const pdfFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (
    file.mimetype !== "application/pdf" ||
    path.extname(file.originalname).toLowerCase() !== ".pdf"
  ) {
    callback(httpError("Only PDF documents are allowed", 400));
    return;
  }
  callback(null, true);
};

export const publicImageUpload = multer({
  storage: makeStorage("public-image"),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: publicImageFilter,
});

export const resumeUpload = multer({
  storage: makeStorage("resume"),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: pdfFilter,
});

export const privateDocumentUpload = multer({
  storage: makeStorage("private-document"),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: pdfFilter,
});

export const getUploadKey = (req: Request, file?: Express.Multer.File): string => {
  const key =
    (req as Request & { __uploadKey?: string }).__uploadKey ||
    (file as (Express.Multer.File & { key?: string }) | undefined)?.key;
  if (!key) throw httpError("Upload key is missing", 500);
  return key;
};

export const localPathForUploadKey = (key: string): string => safeStoredPath(key);

export const validateStoredFile = async (
  filePath: string,
  purpose: UploadPurpose,
  declaredMimeType?: string,
): Promise<boolean> => {
  const storedKey = storedKeyForPath(filePath);
  const handle = await fs.promises.open(filePath, "r");
  let isValid = false;
  try {
    const header = Buffer.alloc(16);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    const bytes = header.subarray(0, bytesRead);

    if (purpose === "resume" || purpose === "private-document") {
      isValid = bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-";
    } else {
      const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const isPng =
        bytes.length >= 8 &&
        bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      const isWebp =
        bytes.length >= 12 &&
        bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
        bytes.subarray(8, 12).toString("ascii") === "WEBP";
      if (declaredMimeType === "image/jpeg") isValid = isJpeg;
      if (declaredMimeType === "image/png") isValid = isPng;
      if (declaredMimeType === "image/webp") isValid = isWebp;
    }
  } finally {
    await handle.close();
  }

  try {
    if (isValid) {
      await assertStoredFileWithinQuota(filePath, purpose);
      await fs.promises.chmod(filePath, purpose === "public-image" ? 0o644 : 0o600);
    }
  } finally {
    releaseQuotaReservation(storedKey);
  }
  return isValid;
};

export const removeStoredUpload = async (key: string): Promise<boolean> => {
  try {
    await fs.promises.unlink(safeStoredPath(key));
    releaseQuotaReservation(key);
    return true;
  } catch (error: any) {
    if (error?.code !== "ENOENT") throw error;
    releaseQuotaReservation(key);
    return false;
  }
};

export const ownedPublicUploadKeyFromUrl = (
  value: string | null | undefined,
  expectedUserId: string,
): string | null => {
  const candidate = value?.trim();
  if (!candidate) return null;

  let parsed: URL;
  let uploadPathPrefix: string;
  try {
    if (/^\/(?!\/)/.test(candidate)) {
      parsed = new URL(candidate, "http://local.invalid");
      uploadPathPrefix = "/uploads/";
    } else {
      const configuredBase = process.env.PUBLIC_ASSET_BASE_URL?.trim();
      if (!configuredBase) return null;
      parsed = new URL(candidate);
      const base = new URL(configuredBase);
      if (parsed.origin !== base.origin) return null;
      uploadPathPrefix = `${base.pathname.replace(/\/+$/, "")}/uploads/`;
    }
  } catch {
    return null;
  }

  if (!parsed.pathname.startsWith(uploadPathPrefix)) return null;

  let key: string;
  try {
    key = decodeURIComponent(parsed.pathname.slice(uploadPathPrefix.length));
  } catch {
    return null;
  }

  const safeUserId = assertSafeUserId(expectedUserId);
  const expectedPrefix = `public/users/${safeUserId}/`;
  if (
    !key.startsWith(expectedPrefix) ||
    !/^[0-9a-f-]{36}\.(?:jpg|png|webp)$/i.test(key.slice(expectedPrefix.length))
  ) {
    return null;
  }
  safeStoredPath(key);
  return key;
};

export const publicUrlForKey = (key: string): string => {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized.startsWith("public/")) {
    throw httpError("Private uploads do not have public URLs", 400);
  }
  safeStoredPath(normalized);

  const configuredBase = process.env.PUBLIC_ASSET_BASE_URL?.replace(/\/$/, "");
  return `${configuredBase || ""}/uploads/${normalized}`;
};

export const getDirectUploadUrl = (): string => "/api/uploads/direct";

// Compatibility exports while local disk storage is in use.
export const uploadMiddleware = publicImageUpload;
export const uploadToS3 = resumeUpload;
export const localUploadsPath = uploadsRoot;
export const s3Enabled = false;
export const getPublicUrlForKey = publicUrlForKey;
export const getSignedUrl = publicUrlForKey;
export const createPresignedPutUrl = async (): Promise<string> => {
  throw httpError("Direct object-storage uploads are not configured", 503);
};

export default null;
