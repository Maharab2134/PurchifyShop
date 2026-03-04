import he from "he";

export const sanitizePlainText = (value?: string | null): string => {
  if (!value) return "";

  const decoded = he.decode(String(value));

  const cleanup = (input: string) =>
    input
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/<[^>\n]*$/g, " ")
      .replace(/\bdata-[\w-]+=("[^"]*"|'[^']*')/gi, " ")
      .replace(/[<>]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  if (typeof document !== "undefined") {
    const temp = document.createElement("div");
    temp.innerHTML = decoded;
    const plainFromDom = (temp.textContent || temp.innerText || "").trim();
    return cleanup(plainFromDom || decoded);
  }

  return cleanup(decoded);
};
