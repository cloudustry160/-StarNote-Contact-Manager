import { Link } from 'react-router-dom';
import {
  Building2,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Star,
} from 'lucide-react';
import type { Contact, MethodKind } from '../../types';
import { METHOD_KIND_LABEL } from '../../types';
import { primaryMethod } from './model';
import { cardBase } from '../../components/ui';

const KIND_ICON: Record<MethodKind, typeof Phone> = {
  phone: Phone,
  email: Mail,
  social: MessageCircle,
  address: MapPin,
  other: MoreHorizontal,
};

interface Props {
  contact: Contact;
  onToggleFavorite: (id: string) => void;
}

export default function ContactCard({ contact, onToggleFavorite }: Props) {
  const primary = primaryMethod(contact);
  const rest = contact.methods.filter((m) => m.id !== primary?.id);
  const PrimaryIcon = primary ? KIND_ICON[primary.kind] : Phone;

  return (
    <article className={`${cardBase} group relative flex flex-col gap-3 p-4 transition hover:border-indigo-200 hover:shadow-md`}>
      <div className="flex items-start justify-between gap-2">
        <Link to={`/contacts/${contact.id}`} className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-slate-900 group-hover:text-indigo-700">
            {contact.name}
          </h2>
          {contact.company && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
              <Building2 className="size-3.5 shrink-0" aria-hidden />
              {contact.company}
            </p>
          )}
        </Link>

        <button
          type="button"
          onClick={() => onToggleFavorite(contact.id)}
          aria-pressed={contact.favorite}
          aria-label={contact.favorite ? `取消收藏 ${contact.name}` : `收藏 ${contact.name}`}
          className="rounded-md p-1 transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Star
            className={
              contact.favorite ? 'size-5 fill-amber-400 text-amber-400' : 'size-5 text-slate-300'
            }
            aria-hidden
          />
        </button>
      </div>

      {primary && (
        <Link
          to={`/contacts/${contact.id}`}
          className="flex items-center gap-2 text-sm text-slate-700"
        >
          <PrimaryIcon className="size-4 shrink-0 text-slate-400" aria-hidden />
          <span className="truncate">{primary.value}</span>
          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
            {primary.label || METHOD_KIND_LABEL[primary.kind]}
          </span>
        </Link>
      )}

      {rest.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {rest.slice(0, 3).map((m) => (
            <li
              key={m.id}
              className="max-w-full truncate rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600 ring-1 ring-inset ring-slate-200"
            >
              {m.label || METHOD_KIND_LABEL[m.kind]}：{m.value}
            </li>
          ))}
          {rest.length > 3 && (
            <li className="rounded-md px-2 py-1 text-xs text-slate-400">+{rest.length - 3}</li>
          )}
        </ul>
      )}
    </article>
  );
}
