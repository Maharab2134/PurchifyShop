const EXACT_COLOR_MAP: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#10b981",
  yellow: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  orange: "#f97316",
  brown: "#8b5a2b",
  black: "#111827",
  white: "#ffffff",
  gray: "#6b7280",
  grey: "#6b7280",
  navy: "#1e3a8a",
  maroon: "#7f1d1d",
  teal: "#0d9488",
  lime: "#84cc16",
  indigo: "#6366f1",
  cyan: "#06b6d4",
  amber: "#f59e0b",
  emerald: "#10b981",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  sky: "#0ea5e9",
  slate: "#64748b",
  zinc: "#71717a",
  neutral: "#737373",
  stone: "#78716c",
  gold: "#fbbf24",
  silver: "#c0c0c0",
  beige: "#f5f5dc",
  khaki: "#c3b091",
  olive: "#808000",
  coral: "#ff7f50",
  salmon: "#fa8072",
  turquoise: "#40e0d0",
  lavender: "#e6e6fa",
  mint: "#98ff98",
  peach: "#ffdab9",
  cream: "#fffdd0",
  ivory: "#fffff0",
  mustard: "#d4a017",
  camel: "#c19a6b",
  tan: "#d2b48c",
  charcoal: "#36454f",
  magenta: "#d946ef",
  chocolate: "#7b3f00",
  coffee: "#6f4e37",
};

const EXACT_MULTI_WORD_MAP: Record<string, string> = {
  "golden yellow": "#facc15",
  "mustard yellow": "#d4a017",
  "off white": "#f8f8f2",
  "ash gray": "#b2beb5",
  "jet black": "#0a0a0a",
  "coffee brown": "#6f4e37",
  "chocolate brown": "#7b3f00",
  "royal purple": "#6b21a8",
  "rose pink": "#f472b6",
  "blush pink": "#f9a8d4",
  "deep magenta": "#a21caf",
  "soft sky blue": "#7dd3fc",
  "turquoise blue": "#22d3ee",
  "burnt orange": "#cc5500",
  "soft lemon": "#fef08a",
  "emerald green": "#10b981",
};

const extractHexColor = (input: string): string | null => {
  const match = input.match(/#([a-f0-9]{3}|[a-f0-9]{6})\b/i);
  return match ? `#${match[1]}` : null;
};

export const getColorDisplayName = (input: string): string => {
  const value = input.trim();
  if (!value) return value;

  if (value.includes("|")) {
    const [name] = value.split("|");
    return name.trim();
  }

  const removedParenHex = value.replace(
    /\s*\(#([a-f0-9]{3}|[a-f0-9]{6})\)\s*$/i,
    "",
  );
  if (removedParenHex !== value) {
    return removedParenHex.trim();
  }

  return value;
};

const cssColorCache = new Map<string, string | null>();

const resolveCssColor = (input: string): string | null => {
  const value = input.trim();
  if (!value) return null;

  const cached = cssColorCache.get(value);
  if (cached !== undefined) return cached;

  if (typeof document === "undefined") {
    cssColorCache.set(value, null);
    return null;
  }

  const probe = document.createElement("span");
  probe.style.color = "";
  probe.style.color = value;
  const resolved = probe.style.color || null;
  cssColorCache.set(value, resolved);
  return resolved;
};

const hashStringToColor = (input: string): string => {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = input.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 55%)`;
};

export const getColorSwatchValue = (input: string): string => {
  const value = input.trim();
  const normalized = value.toLowerCase();

  const embeddedHex = extractHexColor(value);
  if (embeddedHex) {
    return embeddedHex;
  }

  if (/^#([a-f0-9]{3}|[a-f0-9]{6})$/i.test(value)) {
    return value;
  }

  if (/^rgba?\(/i.test(value) || /^hsla?\(/i.test(value)) {
    return value;
  }

  const browserResolved = resolveCssColor(value);
  if (browserResolved) {
    return browserResolved;
  }

  if (EXACT_MULTI_WORD_MAP[normalized]) {
    return EXACT_MULTI_WORD_MAP[normalized];
  }

  if (EXACT_COLOR_MAP[normalized]) {
    return EXACT_COLOR_MAP[normalized];
  }

  const tokens = normalized.split(/[\s\-_\/]+/).filter(Boolean);
  for (const token of tokens) {
    if (EXACT_COLOR_MAP[token]) {
      return EXACT_COLOR_MAP[token];
    }
  }

  if (tokens.includes("off") && tokens.includes("white")) return "#f8f8f2";
  if (tokens.includes("white")) return "#ffffff";
  if (tokens.includes("black")) return "#111827";
  if (
    tokens.some((token) =>
      ["gray", "grey", "ash", "charcoal", "slate"].includes(token),
    )
  )
    return "#6b7280";
  if (
    tokens.some((token) =>
      ["yellow", "gold", "golden", "mustard", "lemon", "amber"].includes(token),
    )
  )
    return "#facc15";
  if (
    tokens.some((token) =>
      ["blue", "sky", "navy", "cyan", "turquoise"].includes(token),
    )
  )
    return "#38bdf8";
  if (
    tokens.some((token) =>
      ["green", "emerald", "mint", "lime", "olive"].includes(token),
    )
  )
    return "#34d399";
  if (
    tokens.some((token) =>
      ["pink", "rose", "magenta", "blush", "violet", "purple"].includes(token),
    )
  )
    return "#d946ef";
  if (
    tokens.some((token) =>
      ["brown", "chocolate", "coffee", "camel", "tan", "beige"].includes(token),
    )
  )
    return "#a16207";
  if (
    tokens.some((token) =>
      ["orange", "peach", "coral", "salmon"].includes(token),
    )
  )
    return "#fb923c";

  return hashStringToColor(normalized);
};
