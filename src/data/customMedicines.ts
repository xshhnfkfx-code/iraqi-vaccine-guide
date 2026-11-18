import type { Medicine } from "./medicineDatabase";

const STORAGE_KEY = "medicine-guide-custom-medicines";

export function loadCustomMedicines(): Medicine[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is Medicine => {
      return (
        typeof item.id === "number" &&
        typeof item.name === "string" &&
        typeof item.english === "string" &&
        typeof item.category === "string" &&
        typeof item.activeIngredient === "string" &&
        Array.isArray(item.forms) &&
        Array.isArray(item.strengths) &&
        Array.isArray(item.uses) &&
        Array.isArray(item.warnings) &&
        typeof item.ageInfo === "string" &&
        typeof item.usageNotes === "string"
      );
    });
  } catch {
    return [];
  }
}

export function saveCustomMedicines(items: Medicine[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("تعذر حفظ الأدوية:", error);
    throw error;
  }
}
