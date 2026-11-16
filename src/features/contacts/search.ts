import type { Contact } from '../../types';

export interface FilterOptions {
  query: string;
  onlyFavorites: boolean;
}

function haystack(contact: Contact): string {
  return [
    contact.name,
    contact.company ?? '',
    contact.note ?? '',
    ...contact.methods.flatMap((m) => [m.label, m.value]),
  ]
    .join(' ')
    .toLowerCase();
}

export function matchesQuery(contact: Contact, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack(contact).includes(q);
}

/** 收藏优先，其次按最近修改排序；保证“常用的人在前面”。 */
export function filterContacts(contacts: Contact[], { query, onlyFavorites }: FilterOptions): Contact[] {
  return contacts
    .filter((c) => (onlyFavorites ? c.favorite : true))
    .filter((c) => matchesQuery(c, query))
    .sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}
