export const METHOD_KINDS = ['phone', 'email', 'social', 'address', 'other'] as const;

export type MethodKind = (typeof METHOD_KINDS)[number];

export const METHOD_KIND_LABEL: Record<MethodKind, string> = {
  phone: '手机',
  email: '邮箱',
  social: '社交账号',
  address: '地址',
  other: '其他',
};

export const METHOD_KIND_HINT: Record<MethodKind, string> = {
  phone: '13800000000',
  email: 'name@example.com',
  social: '微信 / QQ / 微博',
  address: '省市区 + 街道门牌',
  other: '自定义说明',
};

export interface ContactMethod {
  id: string;
  kind: MethodKind;
  label: string;
  value: string;
  primary?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  company?: string;
  note?: string;
  favorite: boolean;
  methods: ContactMethod[];
  createdAt: string;
  updatedAt: string;
}

/** 表单/导入时使用的草稿形态，id 与时间戳由数据层补齐。 */
export interface ContactDraft {
  name: string;
  company: string;
  note: string;
  favorite: boolean;
  methods: ContactMethod[];
}

export function emptyDraft(): ContactDraft {
  return {
    name: '',
    company: '',
    note: '',
    favorite: false,
    methods: [{ id: newId(), kind: 'phone', label: METHOD_KIND_LABEL.phone, value: '' }],
  };
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
