const PHONE_RE = /^\+?[\d(（][\d\s\-()（）]{5,22}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function isValidPhone(value: string): boolean {
  const v = normalize(value);
  if (!v) return false;
  const digits = v.replace(/\D/g, '');
  return PHONE_RE.test(v) && digits.length >= 6 && digits.length <= 20;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(normalize(value));
}

/** 收藏列的宽容解析：是/否/true/false/1/0/yes/no，空值按否。 */
export function parseFavorite(value: string): boolean {
  const v = value.trim().toLowerCase();
  return ['是', 'true', '1', 'yes', 'y', '收藏', '★'].includes(v);
}
