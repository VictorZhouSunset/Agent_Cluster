// input: optional ISO-like timestamps from dashboard API payloads
// output: consistent browser-local time formatting helpers for dashboard metadata surfaces
// pos: presentation-only formatting helpers shared across client screens
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
const shortDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

const longDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
});

const shortTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit"
});

function parseTimestamp(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatShortDateTime(value?: string) {
  const date = parseTimestamp(value);
  return date ? shortDateTimeFormatter.format(date) : "Unavailable";
}

export function formatLongDateTime(value?: string) {
  const date = parseTimestamp(value);
  return date ? longDateTimeFormatter.format(date) : "Unavailable";
}

export function formatShortTime(value?: string) {
  const date = parseTimestamp(value);
  return date ? shortTimeFormatter.format(date) : "Unavailable";
}
