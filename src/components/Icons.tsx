/* Лёгкий набор inline-SVG иконок в стиле Lucide (stroke 2, 24×24) — без зависимостей */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 16, props: P) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
  ...props,
});

export const IconCheck = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IconX = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const IconSwap = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" /></svg>
);
export const IconQuestion = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" /></svg>
);
export const IconSearch = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const IconChevron = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const IconSun = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const IconMoon = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" /></svg>
);
export const IconShield = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const IconLink = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
);
export const IconTable = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></svg>
);
export const IconCopy = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></svg>
);
export const IconArrowRight = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconStar = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z" /></svg>
);
export const IconBookmark = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" /></svg>
);
export const IconRefresh = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" /><path d="M21 3v5h-5" /></svg>
);
export const IconGlobe = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
);
export const IconCards = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><rect x="2" y="6" width="12" height="16" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" /></svg>
);
export const IconInfo = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
);
export const IconAlert = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>
);
export const IconTrash = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
);
export const IconPlus = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 5v14M5 12h14" /></svg>
);
