const MAX_URL_LENGTH = 4096;
const INVALID_URL_CHARACTERS = /[\u0000-\u001f\u007f\\]/;
const SAFE_RELATIVE_ORIGIN = "https://relative.zeilalink.invalid";

type SafeStoredUrlOptions = {
  allowedHosts?: readonly string[];
};

const normalizeAllowedHosts = (hosts?: readonly string[]) =>
  new Set((hosts || []).map((host) => host.trim().toLowerCase()).filter(Boolean));

/**
 * Accepts root-relative same-origin paths or absolute HTTPS URLs. Dangerous
 * schemes, protocol-relative paths, credentials, control characters, and
 * unexpected hosts are rejected rather than rendered or navigated to.
 */
export const getSafeStoredUrl = (
  value: unknown,
  options: SafeStoredUrlOptions = {},
): string | null => {
  if (typeof value !== "string") return null;

  const candidate = value.trim();
  if (
    !candidate ||
    candidate.length > MAX_URL_LENGTH ||
    INVALID_URL_CHARACTERS.test(candidate)
  ) {
    return null;
  }

  if (candidate.startsWith("/") && !candidate.startsWith("//")) {
    try {
      const parsed = new URL(candidate, SAFE_RELATIVE_ORIGIN);
      if (parsed.origin !== SAFE_RELATIVE_ORIGIN) return null;
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return null;
    }
  }

  try {
    const parsed = new URL(candidate);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password
    ) {
      return null;
    }

    const allowedHosts = normalizeAllowedHosts(options.allowedHosts);
    if (allowedHosts.size > 0 && !allowedHosts.has(parsed.hostname.toLowerCase())) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
};

export const getSafeStripeCheckoutUrl = (value: unknown): string | null => {
  const safeUrl = getSafeStoredUrl(value, {
    allowedHosts: ["checkout.stripe.com"],
  });
  if (!safeUrl || safeUrl.startsWith("/")) return null;

  const parsed = new URL(safeUrl);
  if (parsed.port && parsed.port !== "443") return null;
  return safeUrl;
};

export const getSafeMailtoUrl = (
  email: unknown,
  subject?: unknown,
): string | null => {
  if (typeof email !== "string") return null;
  const normalizedEmail = email.trim().toLowerCase();
  const separatorIndex = normalizedEmail.lastIndexOf("@");
  const localPart = normalizedEmail.slice(0, separatorIndex);
  const domainPart = normalizedEmail.slice(separatorIndex + 1);
  if (
    normalizedEmail.length > 254 ||
    INVALID_URL_CHARACTERS.test(normalizedEmail) ||
    separatorIndex <= 0 ||
    separatorIndex !== normalizedEmail.indexOf("@") ||
    localPart.length === 0 ||
    localPart.length > 64 ||
    !/^[a-z0-9_+-]+(?:\.[a-z0-9_+-]+)*$/.test(localPart) ||
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domainPart)
  ) {
    return null;
  }

  if (subject === undefined || subject === null || subject === "") {
    return `mailto:${normalizedEmail}`;
  }

  if (typeof subject !== "string") return null;
  const normalizedSubject = subject.trim();
  if (
    !normalizedSubject ||
    normalizedSubject.length > 200 ||
    INVALID_URL_CHARACTERS.test(normalizedSubject)
  ) {
    return null;
  }

  const params = new URLSearchParams({ subject: normalizedSubject });
  return `mailto:${normalizedEmail}?${params.toString()}`;
};

export const getSafeTelUrl = (phone: unknown): string | null => {
  if (typeof phone !== "string" || INVALID_URL_CHARACTERS.test(phone)) {
    return null;
  }

  const compact = phone.trim().replace(/[\s().-]/g, "");
  if (!/^\+?\d{7,15}$/.test(compact)) return null;
  return `tel:${compact}`;
};
