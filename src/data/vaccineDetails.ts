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
  },

  "hep-b-0": {
    description:
      "لقاح التهاب الكبد الفيروسي B يحمي من الإصابة بفيروس التهاب الكبد B.",
    protectsAgainst: [
      "التهاب الكبد الفيروسي B",
      "العدوى المزمنة بفيروس التهاب الكبد B",
      "مضاعفات العدوى المزمنة مثل تليف الكبد وسرطان الكبد"
    ],
    importance:
      "تُعطى جرعة الولادة بأسرع وقت ممكن، ويفضل خلال أول 24 ساعة، للمساعدة في منع انتقال العدوى من الأم إلى الطفل.",
    source: "منظمة الصحة العالمية WHO"
  }
};
