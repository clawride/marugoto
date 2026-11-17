export const RECENT_LESSON_KEY = "teyvat_recent_lesson";
export const searchText = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();

// Only internal lesson routes may be restored from local storage.
export function readRecentLesson() {
  try {
    const item = JSON.parse(localStorage.getItem(RECENT_LESSON_KEY));
    if (item && /^\/(a1|a21|a22|ab1|b12|mn1|mn2)\/\d+$/.test(item.href) && typeof item.title === "string" && typeof item.course === "string") return item;
  } catch {}
  return null;
}
