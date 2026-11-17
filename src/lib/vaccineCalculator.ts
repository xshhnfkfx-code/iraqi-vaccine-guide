import {
  vaccineSchedule,
  type VaccineScheduleItem
} from "../data/vaccineSchedule";

export type VaccineStatus =
  | "completed"
  | "upcoming"
  | "due"
  | "overdue";

export interface ChildVaccineDose {
  id: string;
  name: string;
  dose: string;
  ageLabel: string;
  dueDate: string;
  endDate: string;
  status: VaccineStatus;
  statusLabel: string;
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();

  result.setDate(Math.min(originalDay, lastDay));

  return result;
}

function getDoseDates(
  birthDate: Date,
  item: VaccineScheduleItem
): { start: Date; end: Date } {
  if (item.minAgeYears !== undefined) {
    const start = addMonths(birthDate, item.minAgeYears * 12);
    const end = addMonths(birthDate, (item.maxAgeYears ?? item.minAgeYears) * 12);

    return { start, end };
  }

  if (item.ageMonths !== undefined) {
    const start = addMonths(birthDate, item.ageMonths);
    return { start, end: start };
  }

  const start = new Date(birthDate);

  // جرعة التهاب الكبد خلال أول 24 ساعة
  if (item.id === "hep-b-0") {
    return { start, end: addDays(start, 1) };
  }

  // جرعات الأسبوع الأول
  return { start, end: addDays(start, 7) };
}

function getStatus(
  today: Date,
  start: Date,
  end: Date,
  completed: boolean
): VaccineStatus {
  if (completed) return "completed";

  if (today < start) return "upcoming";

  if (today <= end) return "due";

  return "overdue";
}

function getStatusLabel(status: VaccineStatus): string {
  switch (status) {
    case "completed":
      return "تم إعطاء الجرعة";

    case "upcoming":
      return "قادمة";

    case "due":
      return "مستحقة";

    case "overdue":
      return "متأخرة";
  }
}

export function calculateChildVaccines(
  birthDateValue: string,
  administeredDoseIds: string[] = [],
  todayValue: Date = new Date()
): ChildVaccineDose[] {
  if (!birthDateValue) return [];

  const birthDate = parseLocalDate(birthDateValue);

  const today = new Date(
    todayValue.getFullYear(),
    todayValue.getMonth(),
    todayValue.getDate()
  );

  if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
    return [];
  }

  return vaccineSchedule.map((item) => {
    const { start, end } = getDoseDates(birthDate, item);

    const completed = administeredDoseIds.includes(item.id);

    const status = getStatus(
      today,
      start,
      end,
      completed
    );

    return {
      id: item.id,
      name: item.name,
      dose: item.dose,
      ageLabel: item.ageLabel,
      dueDate: formatDate(start),
      endDate: formatDate(end),
      status,
      statusLabel: getStatusLabel(status)
    };
  });
}

export function getVaccineSummary(doses: ChildVaccineDose[]) {
  return {
    total: doses.length,
    completed: doses.filter(dose => dose.status === "completed").length,
    upcoming: doses.filter(dose => dose.status === "upcoming").length,
    due: doses.filter(dose => dose.status === "due").length,
    overdue: doses.filter(dose => dose.status === "overdue").length
  };
}
