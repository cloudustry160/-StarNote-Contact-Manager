import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Star,
  Trash2,
} from 'lucide-react';
import type { MethodKind } from '../../types';
import { METHOD_KIND_LABEL } from '../../types';
import { useContacts } from '../../hooks/useContacts';
import { useToast } from '../../components/toast';
import { btnDanger, btnPrimary, btnSecondary, cardBase } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatTime } from './model';

const KIND_ICON: Record<MethodKind, typeof Phone> = {
  phone: Phone,
  email: Mail,
  social: MessageCircle,
  address: MapPin,
  other: MoreHorizontal,
};

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { contacts, toggleFavorite, removeContact } = useContacts();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const contact = contacts.find((c) => c.id === id);

  if (!contact) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm text-slate-700">联系人不存在或已被删除</p>
        <Link to="/" className={`${btnSecondary} mt-4`}>
          返回列表
        </Link>
      </div>
    );
  }

  function handleDelete() {
    if (!contact) return;
    removeContact(contact.id);
    toast('已删除联系人');
    navigate('/');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="size-4" aria-hidden />
          返回列表
        </Link>
        <div className="flex gap-2">
          <Link to={`/contacts/${contact.id}/edit`} className={btnSecondary}>
            <Pencil className="size-4" aria-hidden />
            编辑
          </Link>
          <button type="button" onClick={() => setConfirmOpen(true)} className={btnDanger}>
            <Trash2 className="size-4" aria-hidden />
            删除
          </button>
        </div>
      </div>

      <section className={`${cardBase} p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{contact.name}</h1>
            {contact.company && (
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <Building2 className="size-4" aria-hidden />
                {contact.company}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              创建于 {formatTime(contact.createdAt)} · 最近修改 {formatTime(contact.updatedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleFavorite(contact.id)}
            aria-pressed={contact.favorite}
            className={`${contact.favorite ? btnPrimary : btnSecondary} shrink-0`}
          >
            <Star
              className={`size-4 ${contact.favorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`}
              aria-hidden
            />
            {contact.favorite ? '已收藏' : '收藏'}
          </button>
        </div>

        {contact.note && (
          <p className="mt-4 whitespace-pre-wrap rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {contact.note}
          </p>
        )}
      </section>

      <section className={`${cardBase} p-5`}>
        <h2 className="text-sm font-semibold text-slate-800">联系方式（{contact.methods.length}）</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {contact.methods.map((method) => {
            const Icon = KIND_ICON[method.kind];
            return (
              <li key={method.id} className="flex items-center gap-3 py-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100">
                  <Icon className="size-4 text-slate-500" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400">
                    {method.label || METHOD_KIND_LABEL[method.kind]}
                    {method.primary && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-700">
                        主要
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-slate-900">{method.value}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={`删除「${contact.name}」？`}
        description="删除后无法恢复，建议先导出备份。"
        confirmText="删除"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
