export type FieldErrors = Record<string, string>;

export const extractErrorMessage = (error: any, fallback: string): string => {
  const data = error?.response?.data;
  return data?.error || data?.message || error?.message || fallback;
};

export const extractFieldErrors = (error: any): FieldErrors => {
  const details = error?.response?.data?.details;
  if (!details || typeof details !== 'object') {
    return {};
  }

  return Object.entries(details).reduce<FieldErrors>((acc, [key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      acc[key] = value;
    }
    return acc;
  }, {});
};
