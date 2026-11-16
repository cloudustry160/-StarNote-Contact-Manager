import { Plus, Star, Trash2 } from 'lucide-react';
import {
  METHOD_KINDS,
  METHOD_KIND_HINT,
  METHOD_KIND_LABEL,
  newId,
  type ContactMethod,
  type MethodKind,
} from '../../types';
import { btnSecondary, inputBase } from '../../components/ui';

interface Props {
  methods: ContactMethod[];
  onChange: (next: ContactMethod[]) => void;
}

export default function MethodEditor({ methods, onChange }: Props) {
  function update(id: string, patch: Partial<ContactMethod>) {
    onChange(methods.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function changeKind(id: string, kind: MethodKind) {
    const target = methods.find((m) => m.id === id);
    if (!target) return;
    const wasDefault = !target.label || target.label === METHOD_KIND_LABEL[target.kind];
    update(id, { kind, label: wasDefault ? METHOD_KIND_LABEL[kind] : target.label });
  }

  function setPrimary(id: string) {
    onChange(methods.map((m) => ({ ...m, primary: m.id === id })));
  }

  function add() {
    onChange([
      ...methods,
      { id: newId(), kind: 'phone', label: METHOD_KIND_LABEL.phone, value: '' },
    ]);
  }

  function remove(id: string) {
    const next = methods.filter((m) => m.id !== id);
    if (!next.some((m) => m.primary) && next.length > 0) next[0] = { ...next[0], primary: true };
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {methods.map((method, index) => (
        <div
          key={method.id}
          className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2 sm:grid-cols-[7.5rem_7rem_1fr_auto] sm:items-center"
        >
          <label className="sr-only" htmlFor={`kind-${method.id}`}>
            第 {index + 1} 条联系方式类型
          </label>
          <select
            id={`kind-${method.id}`}
            value={method.kind}
            onChange={(e) => changeKind(method.id, e.target.value as MethodKind)}
            className={inputBase}
          >
            {METHOD_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {METHOD_KIND_LABEL[kind]}
              </option>
            ))}
          </select>

          <input
            value={method.label}
            onChange={(e) => update(method.id, { label: e.target.value })}
            aria-label={`第 ${index + 1} 条联系方式的标签`}
            placeholder="标签"
            className={inputBase}
          />

          <input
            value={method.value}
            onChange={(e) => update(method.id, { value: e.target.value })}
            aria-label={`第 ${index + 1} 条联系方式的值`}
            placeholder={METHOD_KIND_HINT[method.kind]}
            className={inputBase}
          />

          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setPrimary(method.id)}
              aria-pressed={Boolean(method.primary)}
              title="设为主要联系方式"
              className={`rounded-md p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                method.primary ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
              }`}
            >
              <Star className={`size-4 ${method.primary ? 'fill-amber-400' : ''}`} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => remove(method.id)}
              aria-label={`删除第 ${index + 1} 条联系方式`}
              className="rounded-md p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <button type="button" onClick={add} className={btnSecondary}>
          <Plus className="size-4" aria-hidden />
          添加联系方式
        </button>
      </div>
      <p className="text-xs text-slate-400">星标表示主要联系方式，列表中优先展示；至少保留一条。</p>
    </div>
  );
}
