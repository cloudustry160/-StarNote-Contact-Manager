import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Push = (message: string) => void;

interface ToastItem {
  id: number;
  message: string;
}

const ToastContext = createContext<Push>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback<Push>((message) => {
    const id = Date.now() + Math.random();
    setItems((list) => [...list, { id, message }]);
    window.setTimeout(() => {
      setItems((list) => list.filter((item) => item.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg bg-slate-900/95 px-4 py-2 text-sm text-white shadow-lg"
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): Push {
  return useContext(ToastContext);
}
