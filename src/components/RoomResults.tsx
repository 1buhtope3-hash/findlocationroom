/* Результаты сценария «Мои румы → страна»: быстрый ответ, прогресс, 3 группы стран */
import { useMemo, useState, type ReactNode } from "react";
import { computeCountries, ru, type CountryResult, type Dataset, type StatusKey } from "../lib/data";
import { copyText } from "../lib/state";
import { useToast } from "./Toast";
import { EmptyState, Flag, SegmentBar, STATUS_ICON } from "./ui";
import { IconArrowRight, IconCards, IconChevron, IconStar } from "./Icons";

type Sort = "best" | "az";

interface Props {
  data: Dataset;
  selected: string[];
  onOpenCountry: (c: string) => void;
  onQuickPick: (rooms: string[]) => void;
}

const QUICK = ["ПокерОК / GGpoker", "PokerStars", "Покердом", "888poker", "WPT Global", "CoinPoker"];

export function RoomResults({ data, selected, onOpenCountry, onQuickPick }: Props) {
  const [sort, setSort] = useState<Sort>("best");
  const [region, setRegion] = useState("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ blocked: true });
  const toast = useToast();

  const res = useMemo(() => computeCountries(data, selected), [data, selected]);

  const view = useMemo(() => {
    const f = (list: CountryResult[]) => (region === "all" ? list : list.filter((x) => x.region === region));
    const az = (a: CountryResult, b: CountryResult) => ru(a.country, b.country);
    const s = <T extends CountryResult>(list: T[], best: (a: T, b: T) => number) => [...list].sort(sort === "az" ? az : (a, b) => best(a, b) || az(a, b));
    return {
      allowed: s(f(res.allowed), (a, b) => b.universal - a.universal),
      alternative: s(f(res.alternative), (a, b) => a.altCount - b.altCount || b.universal - a.universal),
      blocked: s(f(res.blocked), (a, b) => b.working - a.working || b.universal - a.universal),
    };
  }, [res, sort, region]);

  if (!selected.length) {
    const quick = QUICK.filter((q) => data.rooms.some((r) => r.name === q));
    return (
      <EmptyState
        icon={<IconCards size={22} />}
        title="Отметьте румы, в которых играете"
        text="Покажем страны, где работают все они сразу — это и есть локация для VPN."
        action={
          <div className="quick">
            {quick.map((q) => (
              <button key={q} type="button" className="quick__btn" onClick={() => onQuickPick([q])}>
                + {q}
              </button>
            ))}
            <button type="button" className="quick__btn quick__btn--accent" onClick={() => onQuickPick(quick.slice(0, 3))}>
              Популярный сет
            </button>
          </div>
        }
      />
    );
  }

  const total = data.countries.length;
  const top = [...res.allowed].sort((a, b) => b.universal - a.universal || ru(a.country, b.country)).slice(0, 3);

  const copy = async (c: string) => {
    if (await copyText(c)) toast(`Скопировано: ${c}`);
    else toast("Не удалось скопировать", "error");
  };

  return (
    <div className="results">
      {/* Быстрый ответ — ради него и пришли */}
      <div className="answer">
        <div className="answer__text">
          <p className="answer__kicker">Ответ для {selected.length} {plural(selected.length, "рума", "румов", "румов")}</p>
          <p className="answer__title">
            {res.allowed.length > 0 ? (
              <>
                <span className="tnum answer__num">{res.allowed.length}</span> {plural(res.allowed.length, "страна подходит", "страны подходят", "стран подходят")} для всех
              </>
            ) : res.alternative.length > 0 ? (
              <>Полностью — нигде, но <span className="tnum">{res.alternative.length}</span> с альт. доменом</>
            ) : (
              <>Нет страны, где работают все выбранные румы</>
            )}
          </p>
          {top.length > 0 && (
            <div className="answer__top">
              <span className="answer__top-label"><IconStar size={12} /> Лучше всего:</span>
              {top.map((t) => (
                <button key={t.country} type="button" className="top-pick" onClick={() => copy(t.country)} title="Скопировать название">
                  <Flag country={t.country} />
                  {t.country}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="answer__meter">
          <SegmentBar
            label={`Из ${total} стран: подходят ${res.allowed.length}, с альт. доменом ${res.alternative.length}, недоступны ${res.blocked.length}`}
            total={total}
            parts={[
              { key: "allowed", value: res.allowed.length },
              { key: "alt", value: res.alternative.length },
              { key: "blocked", value: res.blocked.length },
            ]}
          />
          <div className="meter-legend tnum">
            <span className="meter-legend__item meter-legend__item--allowed">{res.allowed.length} ✓</span>
            <span className="meter-legend__item meter-legend__item--alt">{res.alternative.length} ⇄</span>
            <span className="meter-legend__item meter-legend__item--blocked">{res.blocked.length} ✕</span>
            <span className="meter-legend__total">из {total}</span>
          </div>
        </div>
      </div>

      {/* Панель сортировки и фильтра по региону */}
      <div className="toolbar">
        <div className="segmented" role="radiogroup" aria-label="Сортировка стран">
          {([
            ["best", "Удобство для VPN"],
            ["az", "А–Я"],
          ] as const).map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={sort === k} className={`segmented__btn${sort === k ? " is-active" : ""}`} onClick={() => setSort(k)}>
              {l}
            </button>
          ))}
        </div>
        <div className="select-wrap">
          <select className="select" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Регион">
            <option value="all">Все регионы</option>
            {data.groups.map((g) => (
              <option key={g.name} value={g.name}>{g.name}</option>
            ))}
          </select>
          <IconChevron size={14} className="select-wrap__icon" />
        </div>
      </div>

      <Group
        status="allowed"
        title="Работают все выбранные"
        hint="Цифра — сколько из всех румов разрешено в стране: запас, если добавите новый."
        items={view.allowed}
        collapsed={!!collapsed.allowed}
        onToggle={() => setCollapsed((c) => ({ ...c, allowed: !c.allowed }))}
        emptyText="Ни одной страны без ограничений. Посмотрите вариант с альт. доменом или уберите один рум."
        badge={(x) => ({ text: `${x.universal}/${data.rooms.length}`, title: `В стране разрешено ${x.universal} из ${data.rooms.length} румов` })}
        onCopy={copy}
        onOpen={onOpenCountry}
      />
      <Group
        status="alt"
        title="Только через альтернативный домен"
        hint="Часть румов работает только через локальную версию (.de, .eu, .es…) — нужен отдельный аккаунт."
        items={view.alternative}
        collapsed={!!collapsed.alt}
        onToggle={() => setCollapsed((c) => ({ ...c, alt: !c.alt }))}
        emptyText="Таких стран нет."
        badge={(x) => ({ text: `⇄ ${x.altCount}`, title: x.altDetails.join("\n") })}
        onCopy={copy}
        onOpen={onOpenCountry}
      />
      <Group
        status="blocked"
        title="Недоступны"
        hint="Хотя бы один рум запрещён или по нему нет данных. Цифра — сколько выбранных работает."
        items={view.blocked}
        collapsed={!!collapsed.blocked}
        onToggle={() => setCollapsed((c) => ({ ...c, blocked: !c.blocked }))}
        emptyText="Все страны подходят — редкий случай!"
        badge={(x) => ({ text: `${x.working}/${selected.length}`, title: `Работают ${x.working} из ${selected.length} выбранных румов` })}
        onCopy={copy}
        onOpen={onOpenCountry}
      />
    </div>
  );
}

function Group({
  status,
  title,
  hint,
  items,
  collapsed,
  onToggle,
  emptyText,
  badge,
  onCopy,
  onOpen,
}: {
  status: StatusKey;
  title: string;
  hint: string;
  items: CountryResult[];
  collapsed: boolean;
  onToggle: () => void;
  emptyText: string;
  badge: (x: CountryResult) => { text: string; title: string };
  onCopy: (c: string) => void;
  onOpen: (c: string) => void;
}) {
  const Icon = STATUS_ICON[status];
  const bodyId = `group-${status}`;
  return (
    <section className={`rgroup rgroup--${status}`}>
      <h3 className="rgroup__heading">
        <button type="button" className="rgroup__head" aria-expanded={!collapsed} aria-controls={bodyId} onClick={onToggle}>
          <span className="rgroup__icon"><Icon size={14} /></span>
          <span className="rgroup__title">{title}</span>
          <span className="rgroup__count tnum">{items.length}</span>
          <IconChevron size={16} className="rgroup__chevron" />
        </button>
      </h3>
      {!collapsed && (
        <div id={bodyId} className="rgroup__body">
          <p className="rgroup__hint">{hint}</p>
          {items.length === 0 ? (
            <p className="rgroup__empty">{emptyText}</p>
          ) : (
            <ul className="cgrid">
              {items.map((x, i) => {
                const b = badge(x);
                return (
                  <CountryItem key={x.country} i={i} country={x.country} badge={b.text} badgeTitle={b.title} onCopy={onCopy} onOpen={onOpen} />
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function CountryItem({ i, country, badge, badgeTitle, onCopy, onOpen }: { i: number; country: string; badge: ReactNode; badgeTitle: string; onCopy: (c: string) => void; onOpen: (c: string) => void }) {
  return (
    <li className="citem" style={{ animationDelay: `${Math.min(i, 24) * 22}ms` }}>
      <button type="button" className="citem__main" onClick={() => onCopy(country)} title={`${badgeTitle}\nНажмите, чтобы скопировать`}>
        <Flag country={country} />
        <span className="citem__name">{country}</span>
        <span className="citem__badge tnum">{badge}</span>
      </button>
      <button type="button" className="citem__go" onClick={() => onOpen(country)} aria-label={`Все румы в стране ${country}`} title="Все румы в этой стране">
        <IconArrowRight size={14} />
      </button>
    </li>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10,
    m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
