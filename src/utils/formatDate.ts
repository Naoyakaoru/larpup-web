const WEEKDAY_CHARS = ["日", "一", "二", "三", "四", "五", "六"];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const weekday = WEEKDAY_CHARS[d.getDay()];
  const str = d.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return str.replace(/^(\d{4}\/\d{2}\/\d{2})/, `$1(${weekday})`);
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const weekday = WEEKDAY_CHARS[d.getDay()];
  const str = d.toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return str.replace(/^(\d{2}\/\d{2})/, `$1(${weekday})`);
}

export type TimeSlot = "weekday_day" | "weekday_night" | "friday_night" | "weekend";

export function getTimeSlot(iso: string): TimeSlot {
  const d = new Date(iso);
  const day = d.getDay();
  if (day === 0 || day === 6) return "weekend";
  if (day === 5 && d.getHours() >= 18) return "friday_night";
  return d.getHours() < 18 ? "weekday_day" : "weekday_night";
}
