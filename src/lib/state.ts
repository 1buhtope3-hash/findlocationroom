/* Состояние выбора: URL (для шеринга) приоритетнее localStorage. */

export type Tab = "rooms" | "country";

export interface Preset {
  id: string;
  name: string;
  rooms: string[];
}

const LS = {
  rooms: "vpnf:rooms",
  country: "vpnf:country",
  presets: "vpnf:presets",
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* приватный режим — молча игнорируем */
  }
}

export function readInitialState(): { rooms: string[]; country: string; tab: Tab | null } {
  const q = new URLSearchParams(location.search);
  const urlRooms = q.get("rooms");
  const urlCountry = q.get("country");
  const tab = q.get("tab");
  return {
    rooms: urlRooms !== null ? urlRooms.split("|").filter(Boolean) : readJSON<string[]>(LS.rooms, []),
    country: urlCountry ?? readJSON<string>(LS.country, ""),
    tab: tab === "rooms" || tab === "country" ? tab : null,
  };
}

export function persistState(rooms: string[], country: string, tab: Tab) {
  writeJSON(LS.rooms, rooms);
  writeJSON(LS.country, country);
  history.replaceState(null, "", buildUrl(rooms, country, tab));
}

export function buildUrl(rooms: string[], country: string, tab?: Tab) {
  const q = new URLSearchParams();
  if (rooms.length) q.set("rooms", rooms.join("|"));
  if (country) q.set("country", country);
  if (tab && tab !== "rooms") q.set("tab", tab);
  const s = q.toString();
  return location.pathname + (s ? "?" + s : "") + location.hash;
}

export const loadPresets = () => readJSON<Preset[]>(LS.presets, []);
export const savePresets = (p: Preset[]) => writeJSON(LS.presets, p);

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // фолбэк для старых браузеров / http
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}
