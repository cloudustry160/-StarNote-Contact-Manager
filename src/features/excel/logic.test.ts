import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import type { Contact } from '../../types';
import { duplicateKey, parseWorkbook } from './logic';
import { buildWorkbook, cellFor, contactsToRows } from './export';

function bufferFromRows(rows: unknown[][]): ArrayBuffer {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, '联系人');
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

const sampleContact: Contact = {
  id: 'c1',
  name: '张三',
  company: '示例公司',
  note: '备注',
  favorite: true,
  methods: [
    { id: 'm1', kind: 'phone', label: '手机', value: '13800000000', primary: true },
    { id: 'm2', kind: 'phone', label: '办公室', value: '0591-22860001' },
    { id: 'm3', kind: 'email', label: '邮箱', value: 'zhangsan@example.com' },
    { id: 'm4', kind: 'social', label: '微信', value: 'zhangsan_wx' },
  ],
  createdAt: '2026-11-16T00:00:00.000Z',
  updatedAt: '2026-11-16T00:00:00.000Z',
};

describe('parseWorkbook', () => {
  it('解析合法文件', () => {
    const result = parseWorkbook(
      bufferFromRows([
        ['姓名', '手机', '邮箱', '收藏'],
        ['李四', '13900000000; 0591-22860002', 'lisi@example.com', '是'],
      ]),
    );
    expect(result.headerErrors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    const row = result.rows[0];
    expect(row.errors).toEqual([]);
    expect(row.contact?.name).toBe('李四');
    expect(row.contact?.favorite).toBe(true);
    expect(row.contact?.methods).toHaveLength(3);
    expect(row.contact?.methods.filter((m) => m.kind === 'phone')).toHaveLength(2);
  });

  it('缺少姓名列时整体拒绝', () => {
    const result = parseWorkbook(bufferFromRows([['手机', '备注'], ['13800000000', 'x']]));
    expect(result.headerErrors).toHaveLength(1);
    expect(result.headerErrors[0]).toContain('姓名');
  });

  it('坏手机号定位到行', () => {
    const result = parseWorkbook(
      bufferFromRows([
        ['姓名', '手机'],
        ['王五', 'abc'],
      ]),
    );
    expect(result.rows[0].errors.join()).toContain('格式无效');
    expect(result.rows[0].contact).toBeNull();
  });

  it('支持 标签:值 与全角冒号', () => {
    const result = parseWorkbook(
      bufferFromRows([
        ['姓名', '社交账号'],
        ['赵六', '微信:wx_liu; QQ：100200300'],
      ]),
    );
    const methods = result.rows[0].contact?.methods ?? [];
    expect(methods.map((m) => m.label)).toEqual(['微信', 'QQ']);
    expect(methods.map((m) => m.value)).toEqual(['wx_liu', '100200300']);
  });

  it('表头别名容错', () => {
    const result = parseWorkbook(
      bufferFromRows([
        ['名字', '电话', '邮件'],
        ['孙七', '13700000000', 'sun@example.com'],
      ]),
    );
    expect(result.headerErrors).toEqual([]);
    expect(result.rows[0].contact?.name).toBe('孙七');
  });

  it('空行被跳过', () => {
    const result = parseWorkbook(
      bufferFromRows([
        ['姓名', '手机'],
        ['', ''],
        ['周八', '13600000000'],
      ]),
    );
    expect(result.rows).toHaveLength(1);
  });
});

describe('导出', () => {
  it('同类多值用分号拼接，自定义标签保留', () => {
    expect(cellFor(sampleContact, 'phone')).toBe('13800000000; 办公室:0591-22860001');
    expect(cellFor(sampleContact, 'social')).toBe('微信:zhangsan_wx');
  });

  it('行数据列顺序与模板一致', () => {
    const [row] = contactsToRows([sampleContact]);
    expect(row).toEqual([
      '张三',
      '示例公司',
      '13800000000; 办公室:0591-22860001',
      'zhangsan@example.com',
      '微信:zhangsan_wx',
      '',
      '是',
      '备注',
    ]);
  });

  it('导出再导入能还原', () => {
    const buffer = XLSX.write(buildWorkbook([sampleContact]), {
      type: 'array',
      bookType: 'xlsx',
    }) as ArrayBuffer;
    const parsed = parseWorkbook(buffer);
    expect(parsed.headerErrors).toEqual([]);
    const restored = parsed.rows[0].contact;
    expect(restored?.name).toBe('张三');
    expect(restored?.company).toBe('示例公司');
    expect(restored?.favorite).toBe(true);
    expect(restored?.methods.map((m) => m.value)).toEqual([
      '13800000000',
      '0591-22860001',
      'zhangsan@example.com',
      'zhangsan_wx',
    ]);
  });
});

describe('duplicateKey', () => {
  it('忽略姓名空格与电话分隔符', () => {
    const a = duplicateKey('张三', [{ id: '1', kind: 'phone', label: '手机', value: '138-0000 0000' }]);
    const b = duplicateKey(' 张三 ', [{ id: '2', kind: 'phone', label: '手机', value: '13800000000' }]);
    expect(a).toBe(b);
  });

  it('无联系方式时只按姓名判重', () => {
    expect(duplicateKey('李四', [])).toBe('李四|');
  });
});
