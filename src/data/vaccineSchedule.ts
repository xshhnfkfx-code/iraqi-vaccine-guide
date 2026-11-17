export interface VaccineScheduleItem {
  id: string;
  name: string;
  dose: string;
  ageLabel: string;
  ageMonths?: number;
  ageDays?: number;
  minAgeYears?: number;
  maxAgeYears?: number;
  notes?: string;
}

export const vaccineSchedule: VaccineScheduleItem[] = [
  {
    id: "hep-b-0",
    name: "التهاب الكبد الفيروسي B",
    dose: "صفر",
    ageLabel: "خلال أول 24 ساعة",
    ageDays: 0,
    notes: "خلال أول 24 ساعة من الولادة"
  },
  {
    id: "opv-0",
    name: "شلل الأطفال الفموي",
    dose: "صفر",
    ageLabel: "خلال الأسبوع الأول",
    ageDays: 0,
    notes: "خلال الأسبوع الأول من الولادة"
  },
  {
    id: "bcg",
    name: "بي سي جي BCG",
    dose: "جرعة الولادة",
    ageLabel: "خلال الأسبوع الأول",
    ageDays: 0
  },

  {
    id: "opv-1",
    name: "شلل الأطفال الفموي",
    dose: "1",
    ageLabel: "شهران",
    ageMonths: 2
  },
  {
    id: "penta-1",
    name: "الخماسي",
    dose: "1",
    ageLabel: "شهران",
    ageMonths: 2
  },
  {
    id: "pcv-1",
    name: "المكورات الرئوية المقترن",
    dose: "1",
    ageLabel: "شهران",
    ageMonths: 2
  },
  {
    id: "rota-1",
    name: "الفايروس الدوار",
    dose: "1",
    ageLabel: "شهران",
    ageMonths: 2
  },

  {
    id: "opv-2",
    name: "شلل الأطفال الفموي",
    dose: "2",
    ageLabel: "4 أشهر",
    ageMonths: 4
  },
  {
    id: "penta-2",
    name: "الخماسي",
    dose: "2",
    ageLabel: "4 أشهر",
    ageMonths: 4
  },
  {
    id: "ipv-1",
    name: "شلل الأطفال الزرقي",
    dose: "1",
    ageLabel: "4 أشهر",
    ageMonths: 4
  },
  {
    id: "pcv-2",
    name: "المكورات الرئوية المقترن",
    dose: "2",
    ageLabel: "4 أشهر",
    ageMonths: 4
  },
  {
    id: "rota-2",
    name: "الفايروس الدوار",
    dose: "2",
    ageLabel: "4 أشهر",
    ageMonths: 4
  },

  {
    id: "opv-3",
    name: "شلل الأطفال الفموي",
    dose: "3",
    ageLabel: "6 أشهر",
    ageMonths: 6
  },
  {
    id: "penta-3",
    name: "الخماسي",
    dose: "3",
    ageLabel: "6 أشهر",
    ageMonths: 6
  },
  {
    id: "ipv-2",
    name: "شلل الأطفال الزرقي",
    dose: "2",
    ageLabel: "6 أشهر",
    ageMonths: 6
  },
  {
    id: "pcv-3",
    name: "المكورات الرئوية المقترن",
    dose: "3",
    ageLabel: "6 أشهر",
    ageMonths: 6
  },
  {
    id: "rota-3",
    name: "الفايروس الدوار",
    dose: "3",
    ageLabel: "6 أشهر",
    ageMonths: 6
  },

  {
    id: "measles-single",
    name: "الحصبة المنفردة",
    dose: "جرعة",
    ageLabel: "9 أشهر",
    ageMonths: 9
  },
  {
    id: "vit-a-100000",
    name: "فيتامين A",
    dose: "100000 وحدة دولية",
    ageLabel: "9 أشهر",
    ageMonths: 9
  },

  {
    id: "mmr-1",
    name: "الحصبة المختلطة",
    dose: "1",
    ageLabel: "12 شهراً",
    ageMonths: 12
  },

  {
    id: "opv-booster-1",
    name: "شلل الأطفال الفموي",
    dose: "منشطة 1",
    ageLabel: "18 شهراً",
    ageMonths: 18
  },
  {
    id: "dpt-booster-1",
    name: "اللقاح الثلاثي",
    dose: "منشطة 1",
    ageLabel: "18 شهراً",
    ageMonths: 18
  },
  {
    id: "mmr-2",
    name: "الحصبة المختلطة",
    dose: "2",
    ageLabel: "18 شهراً",
    ageMonths: 18
  },
  {
    id: "vit-a-200000-18",
    name: "فيتامين A",
    dose: "200000 وحدة دولية",
    ageLabel: "18 شهراً",
    ageMonths: 18
  },

  {
    id: "opv-booster-2",
    name: "شلل الأطفال الفموي",
    dose: "منشطة 2",
    ageLabel: "من 4 إلى 6 سنوات",
    minAgeYears: 4,
    maxAgeYears: 6
  },
  {
    id: "dpt-booster-2",
    name: "اللقاح الثلاثي",
    dose: "منشطة 2",
    ageLabel: "من 4 إلى 6 سنوات",
    minAgeYears: 4,
    maxAgeYears: 6
  },
  {
    id: "vit-a-200000-4-6",
    name: "فيتامين A",
    dose: "200000 وحدة دولية",
    ageLabel: "من 4 إلى 6 سنوات",
    minAgeYears: 4,
    maxAgeYears: 6
  }
];
