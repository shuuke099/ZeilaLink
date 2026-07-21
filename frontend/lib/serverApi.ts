import "server-only";

export class ServerApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ServerApiError";
    this.status = status;
  }
}

const getInternalApiOrigin = (): string => {
  const configuredOrigin = process.env.INTERNAL_API_ORIGIN?.trim();
  const rawOrigin =
    configuredOrigin ||
    (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:7000");

  if (!rawOrigin) {
    throw new ServerApiError("INTERNAL_API_ORIGIN is not configured");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawOrigin);
  } catch {
    throw new ServerApiError("INTERNAL_API_ORIGIN is invalid");
  }

  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (parsed.pathname !== "/" && parsed.pathname !== "")
  ) {
    throw new ServerApiError("INTERNAL_API_ORIGIN must be an HTTP(S) origin");
  }

  return parsed.origin;
};

export const serverApiGet = async <T>(path: string): Promise<T> => {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new ServerApiError("Server API path must be root-relative");
  }

  const url = new URL(`/api${path}`, getInternalApiOrigin());
  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new ServerApiError("The internal API is unavailable");
  }

  if (!response.ok) {
    throw new ServerApiError("The internal API request failed", response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ServerApiError("The internal API returned invalid JSON", response.status);
  }
};
