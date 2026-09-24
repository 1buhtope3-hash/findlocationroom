/* ==========================================================================
   Слой данных. Контракт сохранён 1:1 с оригинальным app.js:
   data/data.json = { updatedAt, source, groups[{name,countries}], countries[],
                      rooms[{ name, c: {страна: 'y'|'a'|'n'|''}, notes: {страна: текст} }] }
   ========================================================================== */

export type StatusCode = "y" | "a" | "n" | "";
export type StatusKey = "allowed" | "alt" | "blocked" | "unknown";

export interface Room {
  name: string;
  c: Record<string, StatusCode>;
  notes: Record<string, string>;
}

export interface Dataset {
  updatedAt: string;
  source: { name: string; title: string; url: string };
  groups: { name: string; countries: string[] }[];
  countries: string[];
  rooms: Room[];
  hash?: string;
}

export const SOURCE_URL =
  "https://docs.google.com/spreadsheets/d/1T99WJ_UVMVZ6kF0NgQvroq40Pk-erXqC9cwkE0pbFVA/edit?gid=159803688#gid=159803688";

/* Источники по порядку: живой JSON с оригинального сайта (обновляется по
   расписанию из Google Sheets) → локальный снимок рядом со страницей. */
const DATA_URLS = [
  "https://1buhtope3-hash.github.io/poker-vpn-finder/data/data.json",
  "data/data.json",
];

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, cache: "no-cache" });
  } finally {
    clearTimeout(t);
  }
}

export async function loadDataset(): Promise<Dataset> {
  let lastErr: unknown = null;
  for (const url of DATA_URLS) {
    try {
      const res = await fetchWithTimeout(url, 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Dataset;
      if (!Array.isArray(json.rooms) || !Array.isArray(json.countries)) throw new Error("Неверный формат данных");
      return json;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Не удалось загрузить данные");
}

export const STATUS: Record<StatusKey, { label: string; short: string; hint: string }> = {
  allowed: { label: "Разрешён", short: "Можно", hint: "Рум официально работает в этой стране." },
  alt: {
    label: "Альт. домен",
    short: "Альт.",
    hint: "Работает только через локальную версию рума (например, .de или .eu) — отдельный клиент и аккаунт.",
  },
  blocked: { label: "Запрещён", short: "Нельзя", hint: "Рум блокирует игроков из этой страны." },
  unknown: { label: "Нет данных", short: "?", hint: "В исходной таблице нет информации. Считаем недоступным — рисковать не стоит." },
};

export const codeToKey = (s: StatusCode | undefined): StatusKey =>
  s === "y" ? "allowed" : s === "a" ? "alt" : s === "n" ? "blocked" : "unknown";

export const ru = (a: string, b: string) => a.localeCompare(b, "ru");

export interface CountryResult {
  country: string;
  region: string;
  /** сколько выбранных румов работают (y или a) */
  working: number;
  /** сколько выбранных румов требуют альт. домен */
  altCount: number;
  altDetails: string[];
  /** сколько из ВСЕХ румов разрешено — «универсальность» страны для VPN */
  universal: number;
}

/* Пересечение по выбранным румам — та же логика, что в оригинале:
   разрешено для всех → все 'y'; только альт. → все 'y'/'a', хотя бы один 'a';
   недоступно → хотя бы один 'n' или нет данных */
export function computeCountries(data: Dataset, selected: string[]) {
  const byName = new Map(data.rooms.map((r) => [r.name, r]));
  const regionOf = new Map<string, string>();
  data.groups.forEach((g) => g.countries.forEach((c) => regionOf.set(c, g.name)));

  const allowed: CountryResult[] = [];
  const alternative: CountryResult[] = [];
  const blocked: CountryResult[] = [];

  for (const country of data.countries) {
    let worst: "y" | "a" | "x" = "y";
    let working = 0;
    const altDetails: string[] = [];
    for (const name of selected) {
      const room = byName.get(name);
      const s = room ? room.c[country] || "" : "";
      if (s === "n" || s === "") {
        worst = "x";
      } else {
        working++;
        if (s === "a") {
          if (worst !== "x") worst = "a";
          altDetails.push(room?.notes?.[country] ? `${name}: ${room.notes[country]}` : `${name}: см. примечание в таблице`);
        }
      }
    }
    const universal = data.rooms.filter((r) => r.c[country] === "y").length;
    const item: CountryResult = {
      country,
      region: regionOf.get(country) || "Другое",
      working,
      altCount: altDetails.length,
      altDetails,
      universal,
    };
    if (worst === "y") allowed.push(item);
    else if (worst === "a") alternative.push(item);
    else blocked.push(item);
  }
  return { allowed, alternative, blocked };
}

export function formatUpdated(iso: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(new Date(iso)) + " UTC";
  } catch {
    return iso;
  }
}

export function relativeUpdated(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "";
  const h = Math.round(diff / 36e5);
  if (h < 1) return "только что";
  if (h < 24) return `${h} ч назад`;
  const d = Math.round(h / 24);
  return d < 0 ? "" : `${d} дн назад`;
}
