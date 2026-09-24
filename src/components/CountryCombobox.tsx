/* Комбобокс страны: автодополнение, группы по регионам, флаги, подсветка совпадения */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Dataset } from "../lib/data";
import { isoFor } from "../lib/flags";
import { Flag, Highlight } from "./ui";
import { IconChevron, IconSearch, IconX } from "./Icons";

interface Props {
  data: Dataset;
  value: string;
  onChange: (country: string) => void;
}

export function CountryCombobox({ data, value, onChange }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();

  // синхронизация с внешним выбором (например, клик «→» в результатах)
  useEffect(() => setQuery(value), [value]);

  // если текст совпадает с выбранной страной — показываем весь список
  const q = query.trim().toLowerCase() === value.toLowerCase() ? "" : query.trim().toLowerCase();

  const groups = useMemo(
    () =>
      data.groups
        .map((g) => ({
          name: g.name,
          items: g.countries.filter((c) => !q || c.toLowerCase().includes(q) || (isoFor(c) || "").toLowerCase() === q),
        }))
        .filter((g) => g.items.length),
    [data, q],
  );
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [value]);

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const pick = (c: string) => {
    onChange(c);
    setQuery(c);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && flat[active]) pick(flat[active]);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setOpen(false);
      setQuery(value);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  let idx = -1;
  return (
    <div className="cc" ref={rootRef}>
      <label className="field-label" htmlFor={`${id}-input`}>Страна VPN</label>
      <div className={`combo${open ? " is-open" : ""}`}>
        {value && query === value ? <Flag country={value} /> : <IconSearch size={16} className="combo__icon" />}
        <input
          ref={inputRef}
          id={`${id}-input`}
          className="combo__input"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && flat[active] ? `${id}-${active}` : undefined}
          placeholder="Например: Казахстан"
          value={query}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={(e) => {
            setOpen(true);
            e.target.select();
          }}
          onClick={() => setOpen(true)}
          onKeyDown={onKey}
        />
        {value ? (
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            aria-label="Сбросить страну"
            onClick={() => {
              onChange("");
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <IconX size={14} />
          </button>
        ) : (
          <IconChevron size={16} className="combo__chevron" />
        )}

        {open && (
          <div ref={listRef} id={`${id}-list`} role="listbox" aria-label="Страны" className="listbox" onMouseDown={(e) => e.preventDefault()}>
            {flat.length === 0 && (
              <div className="listbox__empty">
                Страна «{query}» не найдена. Попробуйте иначе: например, «США» или «ОАЭ».
              </div>
            )}
            {groups.map((g) => (
              <div key={g.name} role="group" aria-label={g.name}>
                <div className="listbox__group" aria-hidden="true">{g.name}</div>
                {g.items.map((c) => {
                  idx++;
                  const i = idx;
                  return (
                    <div
                      key={c}
                      id={`${id}-${i}`}
                      data-idx={i}
                      role="option"
                      aria-selected={c === value}
                      className={`option${i === active ? " is-active" : ""}${c === value ? " is-selected" : ""}`}
                      onMouseMove={() => setActive(i)}
                      onClick={() => pick(c)}
                    >
                      <Flag country={c} />
                      <span className="option__label">
                        <Highlight text={c} query={q} />
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
