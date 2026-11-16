import * as XLSX from 'xlsx';
import type { Contact, MethodKind } from '../../types';

export const COLUMNS = ['姓名', '公司', '手机', '邮箱', '社交账号', '地址', '收藏', '备注'] as const;

const DEFAULT_LABEL: Record<MethodKind, string> = {
  phone: '手机',
  email: '邮箱',
  social: '社交账号',
  address: '地址',
  other: '',
};

/** 同一类型多值用 "; " 分隔；自定义标签写成 "标签:值"。 */
export function cellFor(contact: Contact, kind: MethodKind): string {
  return contact.methods
    .filter((m) => m.kind === kind && m.value.trim())
    .map((m) => {
      const label = m.label.trim();
      const value = m.value.trim();
      return label && label !== DEFAULT_LABEL[kind] ? `${label}:${value}` : value;
    })
    .join('; ');
}

export function contactsToRows(contacts: Contact[]): string[][] {
  return contacts.map((c) => [
    c.name,
    c.company ?? '',
    cellFor(c, 'phone'),
    cellFor(c, 'email'),
    cellFor(c, 'social'),
    cellFor(c, 'address'),
    c.favorite ? '是' : '否',
    c.note ?? '',
  ]);
}

export function buildWorkbook(contacts: Contact[]): XLSX.WorkBook {
  const sheet = XLSX.utils.aoa_to_sheet([[...COLUMNS], ...contactsToRows(contacts)]);
  sheet['!cols'] = [
    { wch: 12 },
    { wch: 22 },
    { wch: 24 },
    { wch: 26 },
    { wch: 22 },
    { wch: 30 },
    { wch: 6 },
    { wch: 26 },
  ];
  sheet['!views'] = [{ state: 'frozen', ySplit: 1 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, '联系人');
  return workbook;
}

export function timestampSuffix(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

export function exportContacts(contacts: Contact[]): void {
  XLSX.writeFile(buildWorkbook(contacts), `通讯录-${timestampSuffix()}.xlsx`);
}

export function exportTemplate(): void {
  const sample: Contact = {
    id: 'sample',
    name: '示例：张三',
    company: '示例公司',
    note: '可删除本行后填写真实数据',
    favorite: true,
    methods: [
      { id: 'm1', kind: 'phone', label: '手机', value: '13800000000', primary: true },
      { id: 'm2', kind: 'phone', label: '办公室', value: '0591-22860001' },
      { id: 'm3', kind: 'email', label: '邮箱', value: 'zhangsan@example.com' },
      { id: 'm4', kind: 'social', label: '微信', value: 'zhangsan_wx' },
      { id: 'm5', kind: 'address', label: '地址', value: '福建省福州市鼓楼区工业路 12 号' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  XLSX.writeFile(buildWorkbook([sample]), '通讯录导入模板.xlsx');
}
