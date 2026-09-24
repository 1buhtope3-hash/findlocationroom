/* Мультиселект румов: chips, поиск, «Все»/«Очистить», пресеты, полная клавиатурная навигация
   ↑/↓ — перемещение, Enter — выбрать/снять, Esc — закрыть, Backspace в пустом поле — убрать последний */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Preset } from "../lib/state";
import { Highlight } from "./ui";
import { IconBookmark, IconCheck, IconChevron, IconPlus, IconSearch, IconX } from "./Icons";

interface Props {
  rooms: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  presets: Preset[];
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
}

export function RoomSelect({ rooms, selected, onChange, presets, onSavePreset, onDeletePreset }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [naming, setNaming] = useState(false);
  const [presetName, setPresetName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const labelId = useId();

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rooms.filter((r) => !q || r.toLowerCase().includes(q));
  }, [rooms, query]);

  useEffect(() => setActive(0), [query]);

  // закрытие по клику вне
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // держим активный пункт в видимой области
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const toggle = (name: string) => {
    onChange(selectedSet.has(name) ? selected.filter((s) => s !== name) : [...selected, name]);
    setQuery("");
    inputRef.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Home" && open) {
      setActive(0);
    } else if (e.key === "End" && open) {
      setActive(options.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && options[active]) toggle(options[active]);
      else setOpen(true);
    } else if (e.key === "Escape") {
      if (open) {
        e.stopPropagation();
        setOpen(false);
      } else setQuery("");
    } else if (e.key === "Backspace" && !query && selected.length) {
      onChange(selected.slice(0, -1));
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const allSelected = selected.length === rooms.length && rooms.length > 0;

  const submitPreset = () => {
    const name = presetName.trim() || `Мой сет ${presets.length + 1}`;
    onSavePreset(name);
    setPresetName("");
    setNaming(false);
  };

  const presetActive = (p: Preset) => p.rooms.length === selected.length && p.rooms.every((r) => selectedSet.has(r));

  return (
    <div className="rs" ref={rootRef}>
      <div className="field-head">
        <label id={labelId} htmlFor={`${listId}-input`} className="field-label">
          Мои румы
          <span className="counter tnum" aria-label={`Выбрано ${selected.length} из ${rooms.length}`}>
            {selected.length}<span className="counter__of">/{rooms.length}</span>
          </span>
        </label>
        <div className="field-actions">
          <button type="button" className="btn btn--ghost btn--xs" onClick={() => onChange([...rooms])} disabled={allSelected}>
            Выбрать все
          </button>
          <button type="button" className="btn btn--ghost btn--xs" onClick={() => onChange([])} disabled={!selected.length}>
            Очистить
          </button>
        </div>
      </div>

      <div
        className={`combo combo--multi${open ? " is-open" : ""}`}
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
      >
        <IconSearch size={16} className="combo__icon" />
        <ul className="chips" aria-label="Выбранные румы">
          {selected.map((name) => (
            <li key={name} className="chip">
              <span className="chip__label">{name}</span>
              <button
                type="button"
                className="chip__remove"
                aria-label={`Убрать ${name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(name);
                }}
              >
                <IconX size={12} />
              </button>
            </li>
          ))}
          <li className="chips__input-wrap">
            <input
              ref={inputRef}
              id={`${listId}-input`}
              className="combo__input"
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
              placeholder={selected.length ? "Добавить ещё…" : "Найти рум: ПокерОК, Stars…"}
              value={query}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKey}
            />
          </li>
        </ul>
        <IconChevron size={16} className="combo__chevron" />

        {open && (
          <ul ref={listRef} id={listId} role="listbox" aria-multiselectable="true" aria-labelledby={labelId} className="listbox" onMouseDown={(e) => e.preventDefault()}>
            {options.length === 0 && <li className="listbox__empty">Рум «{query}» не найден. Проверьте написание.</li>}
            {options.map((name, i) => {
              const sel = selectedSet.has(name);
              return (
                <li
                  key={name}
                  id={`${listId}-${i}`}
                  data-idx={i}
                  role="option"
                  aria-selected={sel}
                  className={`option${i === active ? " is-active" : ""}${sel ? " is-selected" : ""}`}
                  onMouseMove={() => setActive(i)}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(name);
                  }}
                >
                  <span className="option__check">{sel && <IconCheck size={12} />}</span>
                  <span className="option__label">
                    <Highlight text={name} query={query} />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Пресеты — быстрые наборы румов */}
      <div className="presets" aria-label="Сохранённые наборы">
        {presets.map((p) => (
          <span key={p.id} className={`preset${presetActive(p) ? " is-active" : ""}`}>
            <button type="button" className="preset__main" onClick={() => onChange(p.rooms.filter((r) => rooms.includes(r)))} title={p.rooms.join(", ")}>
              <IconBookmark size={12} />
              {p.name}
              <span className="preset__count tnum">{p.rooms.length}</span>
            </button>
            <button type="button" className="preset__del" aria-label={`Удалить набор ${p.name}`} onClick={() => onDeletePreset(p.id)}>
              <IconX size={11} />
            </button>
          </span>
        ))}
        {naming ? (
          <form
            className="preset-form"
            onSubmit={(e) => {
              e.preventDefault();
              submitPreset();
            }}
          >
            <input
              autoFocus
              className="preset-form__input"
              placeholder="Название набора"
              value={presetName}
              maxLength={24}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setNaming(false)}
              aria-label="Название набора"
            />
            <button type="submit" className="btn btn--accent btn--xs">Сохранить</button>
            <button type="button" className="btn btn--ghost btn--xs" onClick={() => setNaming(false)}>Отмена</button>
          </form>
        ) : (
          <button type="button" className="preset preset--add" disabled={!selected.length} onClick={() => setNaming(true)}>
            <IconPlus size={12} /> Сохранить набор
          </button>
        )}
      </div>
    </div>
  );
}
