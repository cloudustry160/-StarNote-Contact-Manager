import { ContactsProvider, useContacts } from './hooks/useContacts';
import { METHOD_KIND_LABEL } from './types';

function ContactSummary() {
  const { contacts } = useContacts();
  const favorites = contacts.filter((c) => c.favorite).length;
  const methods = contacts.reduce((sum, c) => sum + c.methods.length, 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">通讯录</h1>
        <p className="mt-1 text-sm text-slate-500">
          共 {contacts.length} 位联系人 · {favorites} 位收藏 · {methods} 条联系方式
        </p>
      </header>

      <ul className="mt-6 space-y-3">
        {contacts.map((contact) => (
          <li key={contact.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              {contact.favorite && <span className="text-amber-500">★</span>}
              <span className="font-medium text-slate-900">{contact.name}</span>
              {contact.company && <span className="text-sm text-slate-400">{contact.company}</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {contact.methods.map((m) => (
                <span
                  key={m.id}
                  className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                >
                  {METHOD_KIND_LABEL[m.kind]}：{m.value}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function App() {
  return (
    <ContactsProvider>
      <ContactSummary />
    </ContactsProvider>
  );
}
