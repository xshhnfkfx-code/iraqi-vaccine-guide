import {
  vaccineSchedule,
  type VaccineScheduleItem
} from "../data/vaccineSchedule";

export interface NextVaccineAppointment {
  date: string;
  endDate: string;
  ageLabel: string;
  vaccines: {
    id: string;
    name: string;
    dose: string;
  }[];
  isWindow: boolean;
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
): { start: Date; end: Date; isWindow: boolean } {
  if (item.minAgeYears !== undefined) {
    return {
      start: addMonths(birthDate, item.minAgeYears * 12),
      end: addMonths(
        birthDate,
        (item.maxAgeYears ?? item.minAgeYears) * 12
      ),
      isWindow: true
    };
  }

  if (item.ageMonths !== undefined) {
    const date = addMonths(birthDate, item.ageMonths);
    return { start: date, end: date, isWindow: false };
  }

  const start = new Date(birthDate);
  const isHepatitisB = item.id === "hep-b-0";

  return {
    start,
    end: addDays(start, isHepatitisB ? 1 : 7),
    isWindow: true
  };
}

export function getNextVaccineAppointment(
  birthDateValue: string,
  todayValue: Date = new Date()
): NextVaccineAppointment | null {
  if (!birthDateValue) return null;

  const birthDate = parseLocalDate(birthDateValue);

  const today = new Date(
    todayValue.getFullYear(),
    todayValue.getMonth(),
    todayValue.getDate()
  );

  if (
    Number.isNaN(birthDate.getTime()) ||
    birthDate > today
  ) {
    return null;
  }

  const appointments = vaccineSchedule
    .map((item) => {
      const dates = getDoseDates(birthDate, item);

      return {
        item,
        ...dates
      };
    })
    .filter(({ end }) => end >= today)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (appointments.length === 0) return null;

  const first = appointments[0];

  const sameAppointment = appointments.filter(
    ({ start, end, item }) =>
      start.getTime() === first.start.getTime() &&
      end.getTime() === first.end.getTime() &&
      item.ageLabel === first.item.ageLabel
  );

  return {
    date: formatDate(first.start),
    endDate: formatDate(first.end),
    ageLabel: first.item.ageLabel,
    isWindow: first.isWindow,
    vaccines: sameAppointment.map(({ item }) => ({
      id: item.id,
      name: item.name,
      dose: item.dose
    }))
  };
}
