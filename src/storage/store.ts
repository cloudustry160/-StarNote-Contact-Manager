import { METHOD_KINDS, type Contact, type ContactMethod } from '../types';
import { seedContacts } from './seed';

export const STORAGE_KEY = 'addressbook:v1:contacts';
const VERSION = 1;

interface StoreShape {
  version: number;
  contacts: Contact[];
}

function isMethod(value: unknown): value is ContactMethod {
  if (typeof value !== 'object' || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === 'string' &&
    typeof m.value === 'string' &&
    typeof m.label === 'string' &&
    typeof m.kind === 'string' &&
    (METHOD_KINDS as readonly string[]).includes(m.kind)
  );
}

function isContact(value: unknown): value is Contact {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    c.name.trim().length > 0 &&
    typeof c.favorite === 'boolean' &&
    Array.isArray(c.methods) &&
    c.methods.every(isMethod) &&
    typeof c.createdAt === 'string' &&
    typeof c.updatedAt === 'string'
  );
}

/** 读取联系人；返回 null 表示第一次使用，需要写入示例数据。 */
export function loadContacts(): Contact[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    if (!parsed || parsed.version !== VERSION || !Array.isArray(parsed.contacts)) return null;
    const valid = parsed.contacts.filter(isContact);
    return valid;
  } catch {
    return null;
  }
}

export function saveContacts(contacts: Contact[]): void {
  try {
    const payload: StoreShape = { version: VERSION, contacts };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // 存储不可用（隐私模式 / 配额满）时静默失败，界面仍可用，导出可兜底。
  }
}

export function loadOrSeed(): Contact[] {
  const existing = loadContacts();
  if (existing) return existing;
  const seeded = seedContacts();
  saveContacts(seeded);
  return seeded;
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 同上
  }
}
