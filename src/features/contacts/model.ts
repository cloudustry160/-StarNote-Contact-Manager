import type { Contact, ContactDraft, ContactMethod } from '../../types';
import { isValidEmail, isValidPhone } from './validation';

export function primaryMethod(contact: Contact): ContactMethod | undefined {
  return contact.methods.find((m) => m.primary) ?? contact.methods[0];
}

export function filledMethods(contact: Contact | ContactDraft): ContactMethod[] {
  return contact.methods.filter((m) => m.value.trim().length > 0);
}

/** 返回错误信息数组，空数组表示通过。 */
export function validateDraft(draft: ContactDraft): string[] {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push('请填写姓名');
  if (filledMethods(draft).length === 0) errors.push('至少填写一条联系方式');
  return errors;
}

/** 联系方式的值与类型是否匹配（手机/邮箱软校验，社交与地址不校验）。 */
export function checkMethodValue(method: ContactMethod): string | null {
  const value = method.value.trim();
  if (!value) return null;
  if (method.kind === 'phone' && !isValidPhone(value)) return '手机号格式看起来不对';
  if (method.kind === 'email' && !isValidEmail(value)) return '邮箱格式看起来不对';
  return null;
}

export function draftFromContact(contact: Contact): ContactDraft {
  return {
    name: contact.name,
    company: contact.company ?? '',
    note: contact.note ?? '',
    favorite: contact.favorite,
    methods: contact.methods.map((m) => ({ ...m })),
  };
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(date);
}
