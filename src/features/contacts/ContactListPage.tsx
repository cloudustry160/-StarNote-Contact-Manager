import { lazy, Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Search, Star, Upload, Users } from 'lucide-react';
import { useContacts } from '../../hooks/useContacts';
import { useToast } from '../../components/toast';
import { btnSecondary, inputBase } from '../../components/ui';
import { filterContacts } from './search';
import ContactCard from './ContactCard';

// xlsx 体积较大，导入弹窗与导出逻辑按需加载，首屏不背这个包
const ImportDialog = lazy(() => import('../excel/ImportDialog'));

type Tab = 'all' | 'favorites';

export default function ContactListPage() {
  const { contacts, toggleFavorite } = useContacts();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [importOpen, setImportOpen] = useState(false);

  const query = params.get('q') ?? '';
  const tab: Tab = params.get('view') === 'favorites' ? 'favorites' : 'all';

  const visible = useMemo(
    () => filterContacts(contacts, { query, onlyFavorites: tab === 'favorites' }),
    [contacts, query, tab],
  );
  const favoriteCount = contacts.filter((c) => c.favorite).length;

  function update(next: { q?: string; view?: Tab }) {
    const merged = new URLSearchParams(params);
    if (next.q !== undefined) {
      if (next.q) merged.set('q', next.q);
      else merged.delete('q');
    }
    if (next.view !== undefined) {
      if (next.view === 'all') merged.delete('view');
      else merged.set('view', next.view);
    }
    setParams(merged, { replace: true });
  }

  async function handleExport() {
    if (visible.length === 0) {
      toast('没有可导出的联系人');
      return;
    }
    const { exportContacts } = await import('../excel/export');
    exportContacts(visible);
    toast(`已导出 ${visible.length} 位联系人`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={query}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="搜索姓名、公司、电话、邮箱、地址…"
            aria-label="搜索联系人"
            className={`${inputBase} pl-9`}
          />
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setImportOpen(true)} className={btnSecondary}>
            <Upload className="size-4" aria-hidden />
            导入
          </button>
          <button type="button" onClick={() => void handleExport()} className={btnSecondary}>
            <Download className="size-4" aria-hidden />
            导出
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div role="tablist" aria-label="联系人筛选" className="inline-flex rounded-lg bg-slate-100 p-1">
          <button
            role="tab"
            aria-selected={tab === 'all'}
            onClick={() => update({ view: 'all' })}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              tab === 'all' ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" aria-hidden />
              全部 {contacts.length}
            </span>
          </button>
          <button
            role="tab"
            aria-selected={tab === 'favorites'}
            onClick={() => update({ view: 'favorites' })}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              tab === 'favorites' ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-4" aria-hidden />
              收藏 {favoriteCount}
            </span>
          </button>
        </div>
        <p className="text-xs text-slate-400">
          {query ? `“${query}” 匹配 ${visible.length} 位` : `共 ${visible.length} 位`}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-medium text-slate-700">
            {contacts.length === 0
              ? '通讯录还是空的'
              : query
                ? '没有匹配的联系人'
                : '还没有收藏的联系人'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {contacts.length === 0
              ? '点击右上角「新增联系人」开始，或导入 Excel 文件。'
              : query
                ? '换个关键词试试，或者清空搜索框。'
                : '在联系人卡片右上角点星标即可收藏。'}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((contact) => (
            <li key={contact.id}>
              <ContactCard contact={contact} onToggleFavorite={toggleFavorite} />
            </li>
          ))}
        </ul>
      )}

      {importOpen && (
        <Suspense fallback={null}>
          <ImportDialog open onClose={() => setImportOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
