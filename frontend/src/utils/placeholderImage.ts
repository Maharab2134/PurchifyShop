export type PlaceholderShape = "circle" | "rounded";

export const generatePlaceholderImage = (
  text: string,
  size: number = 200,
  shape: PlaceholderShape = "rounded",
): string => {
  const initials =
    (text || "A")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .filter(Boolean)
      .join("")
      .slice(0, 2) || "A";

  const colors = [
    "#6366f1",
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
  ];

  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const fontSize = Math.max(14, Math.round(size * 0.4));
  const rx =
    shape === "circle" ? size / 2 : Math.max(8, Math.round(size * 0.06));

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${randomColor}" rx="${rx}"/>
      <text x="50%" y="50%" font-family="system-ui, Arial, sans-serif" font-size="${fontSize}" 
            fill="white" text-anchor="middle" dy="0.35em" font-weight="bold">
        ${initials}
      </text>
    </svg>
  `;

  try {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  } catch {
    // Fallback to UTF-8 encoded SVG if btoa fails
    const encoded = encodeURIComponent(svg);
    return `data:image/svg+xml;utf8,${encoded}`;
  }
};

export const generateProductPlaceholder = (
  productName: string,
  displaySize?: number,
): string => {
  return generatePlaceholderImage(productName, displaySize ?? 400, "rounded");
};

export const generateUserAvatar = (
  userName: string,
  displaySize?: number,
): string => {
  return generatePlaceholderImage(userName, displaySize ?? 96, "circle");
};
