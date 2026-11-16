import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { useContacts } from '../../hooks/useContacts';
import { useToast } from '../../components/toast';
import { btnPrimary, btnSecondary, cardBase, inputBase } from '../../components/ui';
import { newId } from '../../types';
import { checkMethodValue, draftFromContact, validateDraft } from './model';
import MethodEditor from './MethodEditor';
import { emptyDraft } from '../../types';

interface Props {
  mode: 'create' | 'edit';
}

export default function ContactFormPage({ mode }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { contacts, addContact, updateContact } = useContacts();

  const existing = useMemo(() => contacts.find((c) => c.id === id), [contacts, id]);
  const [draft, setDraft] = useState(() => (existing ? draftFromContact(existing) : emptyDraft()));
  const [submitted, setSubmitted] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && !existing) setNotFound(true);
  }, [mode, existing]);

  const errors = submitted ? validateDraft(draft) : [];
  const methodWarnings = draft.methods
    .map((m) => checkMethodValue(m))
    .filter((w): w is string => Boolean(w));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (validateDraft(draft).length > 0) return;

    const cleaned = {
      ...draft,
      name: draft.name.trim(),
      company: draft.company.trim(),
      note: draft.note.trim(),
      methods: draft.methods
        .filter((m) => m.value.trim())
        .map((m) => ({ ...m, value: m.value.trim(), label: m.label.trim() })),
    };

    if (mode === 'edit' && existing) {
      updateContact(existing.id, cleaned);
      toast('已保存修改');
      navigate(`/contacts/${existing.id}`);
    } else {
      const created = addContact({ ...cleaned, methods: cleaned.methods.map((m) => ({ ...m, id: m.id || newId() })) });
      toast('已添加联系人');
      navigate(`/contacts/${created.id}`);
    }
  }

  if (notFound) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm text-slate-700">联系人不存在</p>
        <Link to="/" className={`${btnSecondary} mt-4`}>
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to={mode === 'edit' && existing ? `/contacts/${existing.id}` : '/'} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="size-4" aria-hidden />
          返回
        </Link>
        <h1 className="text-lg font-semibold">{mode === 'edit' ? '编辑联系人' : '新增联系人'}</h1>
      </div>

      <section className={`${cardBase} space-y-4 p-4`}>
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
            姓名 <span className="text-rose-500">*</span>
          </label>
          <input
            id="name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="例如：张明远"
            className={inputBase}
            autoFocus
          />
          {errors.includes('请填写姓名') && (
            <p className="mt-1 text-xs text-rose-600">请填写姓名</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="company" className="mb-1 block text-sm font-medium text-slate-700">
              公司 / 组织
            </label>
            <input
              id="company"
              value={draft.company}
              onChange={(e) => setDraft({ ...draft, company: e.target.value })}
              placeholder="选填"
              className={inputBase}
            />
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">收藏</span>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, favorite: !draft.favorite })}
              aria-pressed={draft.favorite}
              className={`${btnSecondary} w-full justify-start`}
            >
              <Star
                className={`size-4 ${draft.favorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                aria-hidden
              />
              {draft.favorite ? '已收藏，点此取消' : '未收藏，点此加星'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="note" className="mb-1 block text-sm font-medium text-slate-700">
            备注
          </label>
          <textarea
            id="note"
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            rows={2}
            placeholder="选填"
            className={inputBase}
          />
        </div>
      </section>

      <section className={`${cardBase} space-y-3 p-4`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">联系方式</h2>
          <span className="text-xs text-slate-400">{draft.methods.length} 条</span>
        </div>
        <MethodEditor
          methods={draft.methods}
          onChange={(methods) => setDraft({ ...draft, methods })}
        />
        {errors.includes('至少填写一条联系方式') && (
          <p className="text-xs text-rose-600">至少填写一条联系方式</p>
        )}
        {methodWarnings.length > 0 && (
          <p className="text-xs text-amber-600">提示：{methodWarnings[0]}，仍可保存。</p>
        )}
      </section>

      <div className="flex justify-end gap-2">
        <Link to={mode === 'edit' && existing ? `/contacts/${existing.id}` : '/'} className={btnSecondary}>
          取消
        </Link>
        <button type="submit" className={btnPrimary}>
          保存
        </button>
      </div>
    </form>
  );
}
