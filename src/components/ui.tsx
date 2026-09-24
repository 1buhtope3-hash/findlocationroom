/* Базовые UI-примитивы: бейдж статуса, флаг, подсветка совпадений, прогресс, тултип, скелетон */
import { useId, useState, type ReactNode } from "react";
import { STATUS, type StatusKey } from "../lib/data";
import { flagEmoji } from "../lib/flags";
import { IconCheck, IconQuestion, IconSwap, IconX } from "./Icons";

export const STATUS_ICON: Record<StatusKey, (p: { size?: number }) => ReactNode> = {
  allowed: IconCheck,
  blocked: IconX,
  alt: IconSwap,
  unknown: IconQuestion,
};

/** Pill-бейдж статуса: цвет + иконка + текст — различим без цвета */
export function StatusBadge({ status, label, title }: { status: StatusKey; label?: string; title?: string }) {
  const Icon = STATUS_ICON[status];
  return (
    <span className={`badge badge--${status}`} title={title ?? STATUS[status].hint}>
      <Icon size={12} />
      <span className="badge__text">{label ?? STATUS[status].label}</span>
    </span>
  );
}

export function Flag({ country }: { country: string }) {
  const f = flagEmoji(country);
  return f ? (
    <span className="flag" aria-hidden="true">{f}</span>
  ) : (
    <span className="flag flag--none" aria-hidden="true">
      {country.slice(0, 2).toUpperCase()}
    </span>
  );
}

/** Подсветка совпадения в подсказках */
export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="hl">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

/** Сегментированная полоса-прогресс по статусам */
export function SegmentBar({ parts, total, label }: { parts: { key: StatusKey; value: number }[]; total: number; label: string }) {
  return (
    <div className="segbar" role="img" aria-label={label}>
      {parts.map((p) =>
        p.value > 0 ? (
          <span
            key={p.key}
            className={`segbar__seg segbar__seg--${p.key}`}
            style={{ flexGrow: p.value, flexBasis: 0 }}
            title={`${STATUS[p.key].label}: ${p.value}`}
          />
        ) : null,
      )}
      {total === 0 && <span className="segbar__seg segbar__seg--unknown" style={{ flexGrow: 1 }} />}
    </div>
  );
}

/** Тултип: работает на hover и focus (доступен с клавиатуры) */
export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span
      className="tip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <span tabIndex={0} aria-describedby={id} className="tip__trigger">
        {children}
      </span>
      <span role="tooltip" id={id} className={`tip__bubble${open ? " is-open" : ""}`}>
        {content}
      </span>
    </span>
  );
}

export function Skeleton({ w = "100%", h = 14, r }: { w?: number | string; h?: number; r?: number }) {
  return <span className="skeleton" style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />;
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon && <div className="empty__icon">{icon}</div>}
      <p className="empty__title">{title}</p>
      {text && <p className="empty__text">{text}</p>}
      {action}
    </div>
  );
}
