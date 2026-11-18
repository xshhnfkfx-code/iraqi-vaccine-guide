export interface VaccineDetail {
  description: string;
  protectsAgainst: string[];
  importance: string;
  source: string;
}

export const vaccineDetails: Record<string, VaccineDetail> = {
  bcg: {
    description:
      "لقاح بي سي جي هو لقاح يُستخدم للوقاية من الأشكال الشديدة من مرض السل لدى الأطفال.",
    protectsAgainst: [
      "التهاب السحايا السلي",
      "السل المنتشر في الجسم لدى الأطفال"
    ],
    importance:
      "يساعد على حماية الأطفال من المضاعفات الخطيرة لمرض السل، خصوصاً في مراحل العمر المبكرة.",
    source: "منظمة الصحة العالمية WHO"
  }
};
