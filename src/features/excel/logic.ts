import * as XLSX from 'xlsx';
import { newId, type Contact, type ContactMethod, type MethodKind } from '../../types';
import { isValidEmail, isValidPhone, parseFavorite } from '../contacts/validation';

export interface ParsedRow {
  row: number;
  name: string;
  contact: Contact | null;
  errors: string[];
}

export interface ParseResult {
  rows: ParsedRow[];
  headerErrors: string[];
  sheetName: string;
}

type Field = 'name' | 'company' | 'phone' | 'email' | 'social' | 'address' | 'favorite' | 'note';

const HEADER_ALIASES: Record<string, Field> = {
  姓名: 'name',
  名字: 'name',
  联系人: 'name',
  名称: 'name',
  name: 'name',
  公司: 'company',
  单位: 'company',
  组织: 'company',
  company: 'company',
  手机: 'phone',
  电话: 'phone',
  手机号: 'phone',
  联系电话: 'phone',
  phone: 'phone',
  邮箱: 'email',
  邮件: 'email',
  电子邮箱: 'email',
  email: 'email',
  社交账号: 'social',
  社交: 'social',
  微信: 'social',
  qq: 'social',
  social: 'social',
  地址: 'address',
  住址: 'address',
  address: 'address',
  收藏: 'favorite',
  是否收藏: 'favorite',
  favorite: 'favorite',
  备注: 'note',
  说明: 'note',
  note: 'note',
};

const DEFAULT_LABEL: Record<MethodKind, string> = {
  phone: '手机',
  email: '邮箱',
  social: '社交账号',
  address: '地址',
  other: '',
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[\s*＊（）()【】[\]]/g, '')
    .replace(/必填/g, '');
}

function parseEntries(cell: string, kind: MethodKind): ContactMethod[] {
  return cell
    .split(/[;；]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const matched = part.match(/^([^:：]{1,10})[:：](.+)$/);
      const label = matched ? matched[1].trim() : DEFAULT_LABEL[kind];
      const value = matched ? matched[2].trim() : part;
      return { id: newId(), kind, label, value };
    });
}

export function duplicateKey(name: string, methods: ContactMethod[]): string {
  const first = methods.find((m) => m.kind === 'phone' && m.value.trim()) ??
    methods.find((m) => m.kind === 'email' && m.value.trim());
  const normalizedName = name.trim().toLowerCase().replace(/\s+/g, '');
  const normalizedValue = (first?.value ?? '').replace(/[\s\-()（）]/g, '').toLowerCase();
  return `${normalizedName}|${normalizedValue}`;
}

export function parseWorkbook(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], headerErrors: ['文件里没有工作表'], sheetName: '' };
  }
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  });

  if (matrix.length === 0) {
    return { rows: [], headerErrors: ['工作表是空的'], sheetName };
  }

  const header = matrix[0];
  const columns = new Map<Field, number>();
  header.forEach((cell, index) => {
    const field = HEADER_ALIASES[normalizeHeader(cell)];
    if (field && !columns.has(field)) columns.set(field, index);
  });

  if (!columns.has('name')) {
    return {
      rows: [],
      headerErrors: ['缺少「姓名」列，请使用导出文件作为模板'],
      sheetName,
    };
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < matrix.length; i += 1) {
    const line = matrix[i];
    const rowNumber = i + 1;
    const cell = (field: Field): string => {
      const index = columns.get(field);
      if (index === undefined) return '';
      return String(line[index] ?? '').trim();
    };

    const name = cell('name');
    const phoneCell = cell('phone');
    const emailCell = cell('email');
    const socialCell = cell('social');
    const addressCell = cell('address');
    const note = cell('note');
    const company = cell('company');
    const favoriteCell = cell('favorite');

    if (!name && !phoneCell && !emailCell && !socialCell && !addressCell && !note) continue;

    const errors: string[] = [];
    if (!name) errors.push('姓名为空');

    const methods: ContactMethod[] = [
      ...parseEntries(phoneCell, 'phone'),
      ...parseEntries(emailCell, 'email'),
      ...parseEntries(socialCell, 'social'),
      ...parseEntries(addressCell, 'address'),
    ];

    methods.forEach((m) => {
      if (m.kind === 'phone' && !isValidPhone(m.value)) errors.push(`手机号「${m.value}」格式无效`);
      if (m.kind === 'email' && !isValidEmail(m.value)) errors.push(`邮箱「${m.value}」格式无效`);
    });

    if (methods.length === 0) errors.push('没有联系方式');

    const now = new Date().toISOString();
    const contact: Contact | null =
      errors.length === 0
        ? {
            id: newId(),
            name,
            company,
            note,
            favorite: parseFavorite(favoriteCell),
            methods: methods.map((m, index) => ({ ...m, primary: index === 0 })),
            createdAt: now,
            updatedAt: now,
          }
        : null;

    rows.push({ row: rowNumber, name, contact, errors });
  }

  return { rows, headerErrors: [], sheetName };
}
