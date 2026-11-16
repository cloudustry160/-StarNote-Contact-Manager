import { Link, Outlet, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { btnPrimary } from './ui';

export default function Layout() {
  const location = useLocation();
  const onCreatePage = location.pathname.includes('/contacts/new');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight">通讯录</span>
            <span className="hidden text-xs text-slate-400 sm:inline">Address Book</span>
          </Link>
          {!onCreatePage && (
            <Link to="/contacts/new" className={btnPrimary}>
              <Plus className="size-4" aria-hidden />
              新增联系人
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-4xl px-4 pb-10 pt-4 text-xs text-slate-400">
        EE308FZ Software Engineering · 个人作业 · 数据保存在本机浏览器
      </footer>
    </div>
  );
}
