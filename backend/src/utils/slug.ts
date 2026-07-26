const MAX_READABLE_PREFIX_LENGTH = 80;

export const slugify = (value: unknown, fallback = 'item'): string => {
  const normalized = typeof value === 'string'
    ? value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, MAX_READABLE_PREFIX_LENGTH)
        .replace(/-+$/g, '')
    : '';

  return normalized || fallback;
};

/**
 * Creates a collision-resistant public slug whose suffix is the entity's
 * complete immutable database id. Callers must only persist this when the
 * current slug is null so renames never change an established public URL.
 */
export const createStableSlug = (
  label: unknown,
  id: string,
  fallback = 'item',
): string => `${slugify(label, fallback)}-${id}`;

export const slugWhenMissing = (
  currentSlug: string | null | undefined,
  label: unknown,
  id: string,
  fallback = 'item',
): string | undefined =>
  currentSlug ? undefined : createStableSlug(label, id, fallback);
