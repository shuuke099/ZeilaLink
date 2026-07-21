const INVALID_URL_CHARACTERS = /[\u0000-\u001f\u007f\\]/;
const CERTIFICATE_URL_MAX_LENGTH = 4096;
const RELATIVE_CERTIFICATE_ORIGIN = 'https://relative.zeilalink.invalid';

/**
 * Certificate links are stored data and can later become href values. Accept
 * only same-origin root-relative paths or credential-free HTTPS URLs.
 */
export const normalizeCertificateUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const candidate = value.trim();
  if (
    !candidate ||
    candidate.length > CERTIFICATE_URL_MAX_LENGTH ||
    INVALID_URL_CHARACTERS.test(candidate)
  ) {
    return null;
  }

  if (candidate.startsWith('/') && !candidate.startsWith('//')) {
    try {
      const parsed = new URL(candidate, RELATIVE_CERTIFICATE_ORIGIN);
      if (parsed.origin !== RELATIVE_CERTIFICATE_ORIGIN) return null;
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return null;
    }
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

/**
 * UserCertification is also the current enrollment table. Never expose its
 * legacy `issuedAt` name as proof of issuance: it is populated when the learner
 * enrolls. A valid, normalized certificate URL is the current schema's issued
 * marker.
 */
export const presentEnrollment = <
  T extends { issuedAt: Date; certificateUrl: string | null },
>(enrollment: T) => {
  const { issuedAt, certificateUrl, ...record } = enrollment;
  const normalizedCertificateUrl = normalizeCertificateUrl(certificateUrl);
  const certificateIssued = normalizedCertificateUrl !== null;

  return {
    ...record,
    enrolledAt: issuedAt,
    status: certificateIssued ? 'certificate_issued' : 'enrolled',
    certificateIssued,
    certificateUrl: normalizedCertificateUrl,
  };
};
