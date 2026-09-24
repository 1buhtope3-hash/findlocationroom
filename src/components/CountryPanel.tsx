/* Сценарий «Страна → румы»: сводка + сканируемая матрица со статусами */
import { useMemo, useState } from "react";
import { codeToKey, ru, STATUS, type Dataset, type StatusKey } from "../lib/data";
import { CountryCombobox } from "./CountryCombobox";
import { EmptyState, Flag, SegmentBar, StatusBadge } from "./ui";
import { IconGlobe } from "./Icons";

type Filter = "all" | "ok" | "mine";
type Sort = "status" | "az";

const ORDER: Record<StatusKey, number> = { allowed: 0, alt: 1, blocked: 2, unknown: 3 };

interface Props {
  data: Dataset;
  country: string;
  onCountry: (c: string) => void;
  myRooms: string[];
}

export function CountryPanel({ data, country, onCountry, myRooms }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("status");
  const mine = useMemo(() => new Set(myRooms), [myRooms]);
  const region = data.groups.find((g) => g.countries.includes(country))?.name;
  const valid = data.countries.includes(country);

  const rows = useMemo(() => {
    if (!valid) return [];
    return data.rooms.map((r) => {
      const status = codeToKey(r.c[country]);
      return { name: r.name, status, note: r.notes?.[country] || "", mine: mine.has(r.name) };
    });
  }, [data, country, valid, mine]);

  const counts = useMemo(() => {
    const c: Record<StatusKey, number> = { allowed: 0, alt: 0, blocked: 0, unknown: 0 };
    rows.forEach((r) => c[r.status]++);
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    let list = rows;
    if (filter === "ok") list = list.filter((r) => r.status === "allowed" || r.status === "alt");
    if (filter === "mine") list = list.filter((r) => r.mine);
    return [...list].sort((a, b) => (sort === "status" ? ORDER[a.status] - ORDER[b.status] : 0) || ru(a.name, b.name));
  }, [rows, filter, sort]);

  const ok = counts.allowed + counts.alt;
  const myOk = rows.filter((r) => r.mine && (r.status === "allowed" || r.status === "alt")).length;

  return (
    <div className="cpanel">
      <CountryCombobox data={data} value={country} onChange={onCountry} />

      {!valid ? (
        <EmptyState
          icon={<IconGlobe size={22} />}
          title="Выберите страну"
          text="Покажем статус каждого рума: где можно играть, где нужен альт. домен, а где закрыто."
          action={
            <div className="quick">
              {["Казахстан", "Армения", "Грузия", "Турция", "ОАЭ"].filter((c) => data.countries.includes(c)).map((c) => (
                <button key={c} type="button" className="quick__btn" onClick={() => onCountry(c)}>
                  <Flag country={c} /> {c}
                </button>
              ))}
            </div>
          }
        />
      ) : (
        <>
          <div className="csummary" key={country}>
            <div className="csummary__head">
              <span className="csummary__flag"><Flag country={country} /></span>
              <div>
                <p className="csummary__name">{country}</p>
                {region && <p className="csummary__region">{region}</p>}
              </div>
              <p className="csummary__stat tnum">
                <strong>{ok}</strong>
                <span> из {rows.length}</span>
                <small>румов доступно</small>
              </p>
            </div>
            <SegmentBar
              total={rows.length}
              label={`Разрешено ${counts.allowed}, альт. домен ${counts.alt}, запрещено ${counts.blocked}, нет данных ${counts.unknown}`}
              parts={(["allowed", "alt", "blocked", "unknown"] as StatusKey[]).map((k) => ({ key: k, value: counts[k] }))}
            />
            <ul className="csummary__legend tnum">
              {(["allowed", "alt", "blocked", "unknown"] as StatusKey[]).map((k) => (
                <li key={k} className={`dotlabel dotlabel--${k}`}>
                  <span className="dotlabel__dot" />
                  {STATUS[k].label} <b>{counts[k]}</b>
                </li>
              ))}
            </ul>
            {myRooms.length > 0 && (
              <p className={`csummary__mine ${myOk === myRooms.length ? "is-ok" : "is-bad"}`}>
                {myOk === myRooms.length
                  ? `Все ваши румы (${myRooms.length}) здесь работают`
                  : `Из ваших румов работают ${myOk} из ${myRooms.length}`}
              </p>
            )}
          </div>

          <div className="toolbar">
            <div className="segmented" role="radiogroup" aria-label="Фильтр румов">
              {([
                ["all", "Все"],
                ["ok", "Доступные"],
                ["mine", "Мои"],
              ] as const).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={filter === k}
                  disabled={k === "mine" && !myRooms.length}
                  className={`segmented__btn${filter === k ? " is-active" : ""}`}
                  onClick={() => setFilter(k)}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="segmented" role="radiogroup" aria-label="Сортировка румов">
              {([
                ["status", "По статусу"],
                ["az", "А–Я"],
              ] as const).map(([k, l]) => (
                <button key={k} type="button" role="radio" aria-checked={sort === k} className={`segmented__btn${sort === k ? " is-active" : ""}`} onClick={() => setSort(k)}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="rgroup__empty">Под этот фильтр ничего не подходит.</p>
          ) : (
            <ul className="matrix" aria-label={`Румы в стране ${country}`}>
              {visible.map((r, i) => {
                const shortNote = r.status === "alt" && r.note && r.note.length <= 14;
                return (
                  <li key={r.name} className={`mrow mrow--${r.status}${r.mine ? " is-mine" : ""}`} style={{ animationDelay: `${Math.min(i, 30) * 16}ms` }}>
                    <span className="mrow__name">
                      {r.mine && <span className="mrow__mine" title="В вашем наборе" aria-label="Ваш рум" />}
                      {r.name}
                      {r.note && !shortNote && <span className="mrow__note">{r.note}</span>}
                    </span>
                    <StatusBadge
                      status={r.status}
                      label={shortNote ? r.note : undefined}
                      title={r.status === "alt" ? (r.note ? `Альтернативный домен: ${r.note}` : "Есть нюансы — см. примечание в таблице") : STATUS[r.status].hint}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
