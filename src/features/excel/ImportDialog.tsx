import { useMemo, useRef, useState } from 'react';
import { Download, FileSpreadsheet, TriangleAlert, Upload, X } from 'lucide-react';
import { useContacts } from '../../hooks/useContacts';
import { useToast } from '../../components/toast';
import { btnPrimary, btnSecondary } from '../../components/ui';
import type { Contact, ContactDraft } from '../../types';
import { duplicateKey, parseWorkbook, type ParseResult } from './logic';
import { exportTemplate } from './export';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Strategy = 'skip' | 'overwrite';

function toDraft(contact: Contact): ContactDraft {
  return {
    name: contact.name,
    company: contact.company ?? '',
    note: contact.note ?? '',
    favorite: contact.favorite,
    methods: contact.methods,
  };
}

export default function ImportDialog({ open, onClose }: Props) {
  const { contacts, importContacts, updateContact } = useContacts();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [strategy, setStrategy] = useState<Strategy>('skip');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const existingKeys = useMemo(() => {
    const map = new Map<string, string>();
    contacts.forEach((c) => map.set(duplicateKey(c.name, c.methods), c.id));
    return map;
  }, [contacts]);

  const stats = useMemo(() => {
    if (!result) return { ok: 0, failed: 0, duplicate: 0, preview: [] as ParseResult['rows'] };
    let ok = 0;
    let failed = 0;
    let duplicate = 0;
    result.rows.forEach((r) => {
      if (!r.contact) {
        failed += 1;
        return;
      }
      ok += 1;
      if (existingKeys.has(duplicateKey(r.contact.name, r.contact.methods))) duplicate += 1;
    });
    return { ok, failed, duplicate, preview: result.rows.slice(0, 8) };
  }, [result, existingKeys]);

  if (!open) return null;

  function reset() {
    setFileName('');
    setResult(null);
    setError('');
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function close() {
    reset();
    onClose();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseWorkbook(buffer);
      setResult(parsed);
      setFileName(file.name);
    } catch {
      setError('无法读取文件，请确认是 .xlsx 或 .xls 格式');
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  function handleImport() {
    if (!result || result.headerErrors.length > 0) return;
    const toAdd: Contact[] = [];
    let added = 0;
    let updated = 0;
    let skipped = 0;

    result.rows.forEach((row) => {
      if (!row.contact) return;
      const key = duplicateKey(row.contact.name, row.contact.methods);
      const existingId = existingKeys.get(key);
      if (existingId) {
        if (strategy === 'skip') {
          skipped += 1;
        } else {
          updateContact(existingId, toDraft(row.contact));
          updated += 1;
        }
        return;
      }
      toAdd.push(row.contact);
      added += 1;
    });

    importContacts(toAdd);
    toast(
      `导入完成：新增 ${added}，更新 ${updated}，跳过重复 ${skipped}，失败 ${stats.failed}`,
    );
    close();
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
      }}
    >
      <div className="my-6 w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="import-title" className="text-base font-semibold text-slate-900">
              从 Excel 导入联系人
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              一行一位联系人；同类多值用「; 」分隔；自定义标签写成「标签:值」。
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="关闭"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4 text-center">
          <FileSpreadsheet className="mx-auto size-6 text-slate-400" aria-hidden />
          <p className="mt-2 text-sm text-slate-600">
            {fileName || '选择 .xlsx 文件，或拖拽到这里'}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className={btnSecondary} disabled={busy}>
              <Upload className="size-4" aria-hidden />
              {busy ? '解析中…' : '选择文件'}
            </button>
            <button type="button" onClick={exportTemplate} className={btnSecondary}>
              <Download className="size-4" aria-hidden />
              下载模板
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <TriangleAlert className="size-4" aria-hidden />
            {error}
          </p>
        )}

        {result && result.headerErrors.length > 0 && (
          <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {result.headerErrors.join('；')}
          </p>
        )}

        {result && result.headerErrors.length === 0 && (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
                可导入 {stats.ok}
              </span>
              <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">
                重复 {stats.duplicate}
              </span>
              <span className="rounded-md bg-rose-50 px-2 py-1 text-rose-700">失败 {stats.failed}</span>
              <span className="text-xs text-slate-400">工作表：{result.sheetName}</span>
            </div>

            {stats.duplicate > 0 && (
              <fieldset className="mt-3 space-y-1 text-sm">
                <legend className="mb-1 text-xs font-medium text-slate-500">重复联系人（姓名 + 首个电话/邮箱相同）</legend>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === 'skip'}
                    onChange={() => setStrategy('skip')}
                  />
                  跳过（保留现有数据）
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === 'overwrite'}
                    onChange={() => setStrategy('overwrite')}
                  />
                  覆盖更新
                </label>
              </fieldset>
            )}

            {stats.preview.length > 0 && (
              <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-2 py-1.5 font-medium">行</th>
                      <th className="px-2 py-1.5 font-medium">姓名</th>
                      <th className="px-2 py-1.5 font-medium">状态</th>
                      <th className="px-2 py-1.5 font-medium">说明</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.preview.map((row) => (
                      <tr key={row.row}>
                        <td className="px-2 py-1.5 text-slate-400">{row.row}</td>
                        <td className="px-2 py-1.5">{row.name || '—'}</td>
                        <td className="px-2 py-1.5">
                          {row.contact ? (
                            <span className="text-emerald-600">可导入</span>
                          ) : (
                            <span className="text-rose-600">失败</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-slate-500">
                          {row.errors.length > 0 ? row.errors.join('；') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={close} className={btnSecondary}>
            取消
          </button>
          <button
            type="button"
            onClick={handleImport}
            className={btnPrimary}
            disabled={!result || result.headerErrors.length > 0 || stats.ok === 0}
          >
            导入 {stats.ok > 0 ? `${stats.ok} 条` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
