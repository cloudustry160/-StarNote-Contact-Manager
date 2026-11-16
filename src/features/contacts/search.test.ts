import { describe, expect, it } from 'vitest';
import type { Contact } from '../../types';
import { filterContacts, matchesQuery } from './search';
import { validateDraft, checkMethodValue, primaryMethod } from './model';
import { emptyDraft } from '../../types';

function contact(overrides: Partial<Contact> & Pick<Contact, 'id' | 'name'>): Contact {
  return {
    company: '',
    note: '',
    favorite: false,
    methods: [{ id: `${overrides.id}-m`, kind: 'phone', label: '手机', value: '13800000000' }],
    createdAt: '2026-11-15T00:00:00.000Z',
    updatedAt: '2026-11-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('搜索与筛选', () => {
  const list = [
    contact({ id: '1', name: '张明远', company: '福州大学', favorite: true }),
    contact({ id: '2', name: '李思嘉', favorite: false, updatedAt: '2026-11-16T00:00:00.000Z' }),
    contact({
      id: '3',
      name: '王浩然',
      methods: [{ id: 'm3', kind: 'social', label: '微信', value: 'haoran_wx' }],
    }),
  ];

  it('搜索命中姓名与联系方式', () => {
    expect(matchesQuery(list[0], '张')).toBe(true);
    expect(matchesQuery(list[2], 'haoran')).toBe(true);
    expect(matchesQuery(list[1], '福州')).toBe(false);
  });

  it('收藏优先且按修改时间排序', () => {
    const result = filterContacts(list, { query: '', onlyFavorites: false });
    expect(result.map((c) => c.id)).toEqual(['1', '2', '3']);
  });

  it('只看收藏', () => {
    const result = filterContacts(list, { query: '', onlyFavorites: true });
    expect(result.map((c) => c.id)).toEqual(['1']);
  });

  it('搜索无结果返回空数组', () => {
    expect(filterContacts(list, { query: '不存在', onlyFavorites: false })).toHaveLength(0);
  });
});

describe('表单校验', () => {
  it('空姓名与空联系方式都报错', () => {
    const draft = emptyDraft();
    draft.methods = [];
    expect(validateDraft(draft)).toEqual(['请填写姓名', '至少填写一条联系方式']);
  });

  it('填好之后通过', () => {
    const draft = emptyDraft();
    draft.name = '测试';
    draft.methods[0].value = '13800000000';
    expect(validateDraft(draft)).toEqual([]);
  });

  it('手机号软校验只给提示不拦截', () => {
    expect(checkMethodValue({ id: 'x', kind: 'phone', label: '手机', value: 'abc' })).toContain('格式');
    expect(checkMethodValue({ id: 'x', kind: 'phone', label: '手机', value: '0591-22860001' })).toBeNull();
    expect(checkMethodValue({ id: 'x', kind: 'email', label: '邮箱', value: 'a@b.co' })).toBeNull();
  });

  it('主要联系方式回退到第一条', () => {
    const c = contact({ id: '9', name: '测试' });
    expect(primaryMethod(c)?.value).toBe('13800000000');
  });
});
