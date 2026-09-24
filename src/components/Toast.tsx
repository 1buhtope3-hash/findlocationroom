/* Тосты: короткие уведомления («Скопировано»), озвучиваются скринридером через aria-live */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { IconAlert, IconCheck, IconInfo } from "./Icons";

type Kind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  text: string;
  kind: Kind;
}

const Ctx = createContext<(text: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const push = useCallback((text: string, kind: Kind = "success") => {
    const id = ++seq.current;
    // не копим больше трёх тостов
    setItems((prev) => [...prev.slice(-2), { id, text, kind }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2600);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`}>
            <span className="toast__icon">
              {t.kind === "success" ? <IconCheck size={14} /> : t.kind === "error" ? <IconAlert size={14} /> : <IconInfo size={14} />}
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
