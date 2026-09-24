import { useCallback, useEffect, useRef, useState } from "react";
import { formatUpdated, loadDataset, relativeUpdated, SOURCE_URL, STATUS, type Dataset, type StatusKey } from "./lib/data";
import { copyText, loadPresets, persistState, readInitialState, savePresets, type Preset, type Tab } from "./lib/state";
import { RoomSelect } from "./components/RoomSelect";
import { RoomResults } from "./components/RoomResults";
import { CountryPanel } from "./components/CountryPanel";
import { ToastProvider, useToast } from "./components/Toast";
import { EmptyState, Skeleton, STATUS_ICON, Tooltip } from "./components/ui";
import { IconAlert, IconCards, IconGlobe, IconLink, IconMoon, IconRefresh, IconShield, IconSun, IconTable } from "./components/Icons";

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}

type Load = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; data: Dataset };

function Shell() {
  const init = useRef(readInitialState());
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [rooms, setRooms] = useState<string[]>(init.current.rooms);
  const [country, setCountry] = useState<string>(init.current.country);
  const [tab, setTab] = useState<Tab>(init.current.tab ?? "rooms");
  const [presets, setPresets] = useState<Preset[]>(loadPresets);
  const asideRef = useRef<HTMLElement>(null);
  const toast = useToast();

  const fetchData = useCallback(() => {
    setLoad({ state: "loading" });
    loadDataset()
      .then((data) => {
        // отбрасываем румы/страну, которых больше нет в таблице
        const names = new Set(data.rooms.map((r) => r.name));
        setRooms((r) => r.filter((n) => names.has(n)));
        setCountry((c) => (data.countries.includes(c) ? c : ""));
        setLoad({ state: "ready", data });
      })
      .catch((e: Error) => setLoad({ state: "error", message: e.message }));
  }, []);

  useEffect(fetchData, [fetchData]);

  // URL + localStorage синхронизируются при каждом изменении выбора
  useEffect(() => {
    if (load.state === "ready") persistState(rooms, country, tab);
  }, [rooms, country, tab, load.state]);

  const openCountry = (c: string) => {
    setCountry(c);
    setTab("country");
    // на десктопе обе колонки видны — просто подводим к панели
    if (window.matchMedia("(min-width: 1024px)").matches) {
      asideRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const share = async () => {
    const ok = await copyText(location.href);
    toast(ok ? "Ссылка на ваш выбор скопирована" : "Не удалось скопировать ссылку", ok ? "success" : "error");
  };

  const savePreset = (name: string) => {
    const next = [...presets, { id: String(Date.now()), name, rooms: [...rooms] }];
    setPresets(next);
    savePresets(next);
    toast(`Набор «${name}» сохранён`);
  };
  const deletePreset = (id: string) => {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    savePresets(next);
  };

  const data = load.state === "ready" ? load.data : null;

  return (
    <div className="app">
      <Header data={data} onShare={share} />

      <main className="container main" id="main">
        <section className="hero">
          <h1 className="hero__title">
            Какую страну ставить <span className="hero__accent">в VPN?</span>
          </h1>
          <p className="hero__sub">Отметьте свои покер-румы — покажем страны, где работают все сразу. Или проверьте конкретную страну.</p>
          <Legend />
        </section>

        {/* Переключатель сценариев — только на планшете/телефоне */}
        <div className="tabs-bar">
          <div className="tabs" role="tablist" aria-label="Сценарий">
            <button type="button" role="tab" id="tab-rooms" aria-controls="panel-rooms" aria-selected={tab === "rooms"} className={`tabs__btn${tab === "rooms" ? " is-active" : ""}`} onClick={() => setTab("rooms")}>
              <IconCards size={15} /> Румы → страна
              {rooms.length > 0 && <span className="tabs__count tnum">{rooms.length}</span>}
            </button>
            <button type="button" role="tab" id="tab-country" aria-controls="panel-country" aria-selected={tab === "country"} className={`tabs__btn${tab === "country" ? " is-active" : ""}`} onClick={() => setTab("country")}>
              <IconGlobe size={15} /> Страна → румы
            </button>
          </div>
        </div>

        <div className="layout">
          <section id="panel-rooms" role="tabpanel" aria-labelledby="tab-rooms" className={`panel panel--primary${tab === "rooms" ? " is-current" : ""}`}>
            <header className="panel__head">
              <span className="panel__step">1</span>
              <div>
                <h2 className="panel__title">Мои румы → страна</h2>
                <p className="panel__desc">Где работают все выбранные румы одновременно</p>
              </div>
            </header>
            {load.state === "loading" && <PrimarySkeleton />}
            {load.state === "error" && <ErrorState message={load.message} onRetry={fetchData} />}
            {data && (
              <>
                <div className="sticky-field">
                  <RoomSelect
                    rooms={data.rooms.map((r) => r.name)}
                    selected={rooms}
                    onChange={setRooms}
                    presets={presets}
                    onSavePreset={savePreset}
                    onDeletePreset={deletePreset}
                  />
                </div>
                <RoomResults data={data} selected={rooms} onOpenCountry={openCountry} onQuickPick={(r) => setRooms((prev) => [...new Set([...prev, ...r])])} />
              </>
            )}
          </section>

          <aside ref={asideRef} id="panel-country" role="tabpanel" aria-labelledby="tab-country" className={`panel panel--secondary${tab === "country" ? " is-current" : ""}`}>
            <header className="panel__head">
              <span className="panel__step">2</span>
              <div>
                <h2 className="panel__title">Страна → румы</h2>
                <p className="panel__desc">Статус каждого рума в выбранной стране</p>
              </div>
            </header>
            {load.state === "loading" && <SecondarySkeleton />}
            {load.state === "error" && <ErrorState message={load.message} onRetry={fetchData} compact />}
            {data && <CountryPanel data={data} country={country} onCountry={setCountry} myRooms={rooms} />}
          </aside>
        </div>
      </main>

      <Footer data={data} />
    </div>
  );
}

/* ---------- Header ---------- */
function Header({ data, onShare }: { data: Dataset | null; onShare: () => void }) {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute("data-theme") || "dark");
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? "#0C0E12" : "#F4F5F8");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* noop */
    }
    setTheme(next);
  };

  return (
    <header className="header">
      <div className="container header__inner">
        <a href="./" className="brand" aria-label="VPN Finder — на главную">
          <span className="brand__mark"><IconShield size={18} /></span>
          <span className="brand__text">
            <span className="brand__name">VPN Finder</span>
            <span className="brand__sub">для покер-румов</span>
          </span>
        </a>

        <div className="header__meta">
          {data ? (
            <span className="updated" title={`Данные обновлены: ${formatUpdated(data.updatedAt)}`}>
              <span className="updated__dot" aria-hidden="true" />
              <span className="updated__long">Обновлено {formatUpdated(data.updatedAt)}</span>
              <span className="updated__short">{relativeUpdated(data.updatedAt) || "Обновлено"}</span>
            </span>
          ) : (
            <Skeleton w={150} h={12} />
          )}
        </div>

        <nav className="header__actions" aria-label="Действия">
          <a className="icon-btn" href={data?.source.url || SOURCE_URL} target="_blank" rel="noopener" title="Исходная таблица GipsyTeam" aria-label="Открыть исходную таблицу">
            <IconTable size={17} />
          </a>
          <button type="button" className="icon-btn" onClick={onShare} disabled={!data} title="Скопировать ссылку на ваш выбор" aria-label="Поделиться выбором">
            <IconLink size={17} />
          </button>
          <button type="button" className="icon-btn" onClick={toggle} aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"} title="Сменить тему">
            {theme === "dark" ? <IconSun size={17} /> : <IconMoon size={17} />}
          </button>
        </nav>
      </div>
    </header>
  );
}

/* ---------- Легенда статусов с пояснениями ---------- */
function Legend() {
  const keys: StatusKey[] = ["allowed", "alt", "blocked", "unknown"];
  return (
    <ul className="legend" aria-label="Обозначения статусов">
      {keys.map((k) => {
        const Icon = STATUS_ICON[k];
        return (
          <li key={k}>
            <Tooltip content={STATUS[k].hint}>
              <span className={`badge badge--${k}`}>
                <Icon size={12} />
                {STATUS[k].label}
              </span>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Скелетоны: те же габариты, что и у контента — без layout shift ---------- */
function PrimarySkeleton() {
  return (
    <div className="skel" aria-busy="true" aria-label="Загружаем данные">
      <div className="skel__row"><Skeleton w={110} h={14} /><Skeleton w={140} h={14} /></div>
      <Skeleton h={46} r={10} />
      <div className="skel__row skel__row--start"><Skeleton w={130} h={28} r={999} /></div>
      <Skeleton h={112} r={14} />
      <div className="skel__grid">
        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} h={40} r={10} />)}
      </div>
    </div>
  );
}
function SecondarySkeleton() {
  return (
    <div className="skel" aria-busy="true">
      <Skeleton w={90} h={14} />
      <Skeleton h={46} r={10} />
      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} h={40} r={8} />)}
    </div>
  );
}

function ErrorState({ message, onRetry, compact }: { message: string; onRetry: () => void; compact?: boolean }) {
  return (
    <div className="error-box" role="alert">
      <EmptyState
        icon={<IconAlert size={22} />}
        title="Не получилось загрузить данные"
        text={compact ? "Проверьте соединение." : `Таблица временно недоступна или пропал интернет. (${message})`}
        action={
          <button type="button" className="btn btn--accent" onClick={onRetry}>
            <IconRefresh size={15} /> Повторить
          </button>
        }
      />
    </div>
  );
}

/* ---------- Footer ---------- */
function Footer({ data }: { data: Dataset | null }) {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p className="footer__disclaimer">
          Данные носят информационный характер и берутся из сторонней таблицы{" "}
          <a href={data?.source.url || SOURCE_URL} target="_blank" rel="noopener">GipsyTeam</a> — спасибо за их работу. Перед игрой сверяйтесь с правилами рума: решение и
          ответственность — на вас.
        </p>
        <p className="footer__meta tnum">
          © 2026 VPN Finder · {data ? `Данные от ${formatUpdated(data.updatedAt)}` : "Загрузка данных…"}
        </p>
      </div>
    </footer>
  );
}
