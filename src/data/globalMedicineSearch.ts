export type GlobalMedicineResult = {
  rxcui: string;
  name: string;
  arabicName?: string;
  arabicUses?: string[];
  synonym: string;
  type: string;
  source: string;
  fetchedAt: string;
};

type RxNormConcept = {
  rxcui?: string;
  name?: string;
  synonym?: string;
  tty?: string;
};

type RxNormResponse = {
  drugGroup?: {
    conceptGroup?: Array<{
      tty?: string;
      conceptProperties?: RxNormConcept[];
    }>;
  };
};

const API_URL = "https://rxnav.nlm.nih.gov/REST/drugs.json";
const CACHE_KEY = "world-drug-encyclopedia-global-search";

type CachedSearch = {
  query: string;
  results: GlobalMedicineResult[];
  savedAt: string;
};

// الأسماء العربية للمواد الدوائية الشائعة
const arabicMedicineNames: Record<string, string> = {
  paracetamol: "باراسيتامول",
  acetaminophen: "باراسيتامول",
  ibuprofen: "إيبوبروفين",
  amoxicillin: "أموكسيسيلين",
  azithromycin: "أزيثروميسين",
  metronidazole: "ميترونيدازول",
  cetirizine: "سيتريزين",
  loratadine: "لوراتادين",
  omeprazole: "أوميبرازول",
  metformin: "ميتفورمين",
  amlodipine: "أملوديبين",
  atorvastatin: "أتورفاستاتين",
  aspirin: "أسبرين",
  diclofenac: "ديكلوفيناك",
  salbutamol: "سالبوتامول",
  albuterol: "سالبوتامول",
  prednisolone: "بريدنيزولون",
  prednisone: "بريدنيزون",
  domperidone: "دومبيريدون",
  metoclopramide: "ميتوكلوبراميد",
  ciprofloxacin: "سيبروفلوكساسين",
  cefixime: "سيفيكسيم",
  ceftriaxone: "سيفترياكسون",
  doxycycline: "دوكسيسيكلين",
  fluconazole: "فلوكونازول",
  furosemide: "فوروسيميد",
  losartan: "لوسارتان",
  valsartan: "فالسارتان",
  bisoprolol: "بيسوبرولول",
  pantoprazole: "بانتوبرازول",
  esomeprazole: "إيزوميبرازول",
  levothyroxine: "ليفوثيروكسين",
  warfarin: "وارفارين",
  clopidogrel: "كلوبيدوغريل",
  insulin: "إنسولين",
  montelukast: "مونتيلوكاست",
  gabapentin: "جابابنتين",
  pregabalin: "بريجابالين",
  tramadol: "ترامادول",
  ondansetron: "أوندانسيترون",
  iron: "الحديد",
  ferrous: "الحديد",
  folic: "حمض الفوليك",
  cholecalciferol: "فيتامين د",
  vitamin: "فيتامين",
};

// استخدامات طبية عامة لبعض المواد الفعالة المعروفة
// هذه المعلومات تثقيفية وليست توصية علاجية
const arabicMedicineUses: Record<string, string[]> = {
  paracetamol: [
    "تخفيف الألم الخفيف إلى المتوسط",
    "خفض ارتفاع درجة الحرارة",
  ],
  acetaminophen: [
    "تخفيف الألم الخفيف إلى المتوسط",
    "خفض ارتفاع درجة الحرارة",
  ],
  ibuprofen: [
    "تخفيف الألم",
    "تقليل الالتهاب والتورم",
    "خفض ارتفاع درجة الحرارة",
  ],
  amoxicillin: [
    "علاج بعض الالتهابات البكتيرية الحساسة للمضاد الحيوي",
  ],
  azithromycin: [
    "علاج بعض الالتهابات البكتيرية الحساسة للمضاد الحيوي",
  ],
  metronidazole: [
    "علاج بعض الالتهابات الناتجة عن البكتيريا اللاهوائية",
    "علاج بعض العدوى الطفيلية",
  ],
  cetirizine: [
    "تخفيف أعراض الحساسية",
    "تخفيف العطاس وسيلان الأنف والحكة",
  ],
  loratadine: [
    "تخفيف أعراض الحساسية",
    "تخفيف العطاس وسيلان الأنف وحكة العين",
  ],
  omeprazole: [
    "تقليل إفراز حمض المعدة",
    "علاج بعض حالات الارتجاع المعدي المريئي",
    "المساعدة في علاج بعض حالات قرحة المعدة",
  ],
  metformin: [
    "المساعدة في ضبط مستوى سكر الدم لدى المصابين بالسكري من النوع الثاني",
  ],
  amlodipine: [
    "علاج ارتفاع ضغط الدم",
    "علاج بعض حالات الذبحة الصدرية",
  ],
  atorvastatin: [
    "خفض مستويات الكوليسترول والدهون في الدم",
    "تقليل خطر بعض أمراض القلب والأوعية الدموية",
  ],
  aspirin: [
    "تخفيف الألم وخفض الحرارة في بعض الاستخدامات",
    "يُستخدم بجرعات محددة لمنع تجمع الصفائح الدموية لدى بعض المرضى",
  ],
  diclofenac: [
    "تخفيف الألم والالتهاب",
    "تخفيف بعض آلام المفاصل والعضلات",
  ],
  salbutamol: [
    "توسيع الشعب الهوائية",
    "تخفيف الأزيز وضيق التنفس الناتج عن تضيق الشعب الهوائية",
  ],
  albuterol: [
    "توسيع الشعب الهوائية",
    "تخفيف الأزيز وضيق التنفس الناتج عن تضيق الشعب الهوائية",
  ],
  prednisolone: [
    "تقليل الالتهاب",
    "علاج بعض الحالات المرتبطة بزيادة نشاط الجهاز المناعي",
  ],
  prednisone: [
    "تقليل الالتهاب",
    "علاج بعض الحالات المرتبطة بزيادة نشاط الجهاز المناعي",
  ],
  domperidone: [
    "تخفيف الغثيان والقيء في بعض الحالات",
  ],
  metoclopramide: [
    "تخفيف الغثيان والقيء",
    "المساعدة في بعض حالات بطء إفراغ المعدة",
  ],
};

// البحث عن اسم المادة الفعالة داخل اسم الدواء
function findMedicineKeys(name: string): string[] {
  const normalized = name.toLowerCase();
  const matches: string[] = [];

  for (const key of Object.keys(arabicMedicineNames)) {
    const pattern = new RegExp(`\\b${key}\\b`, "i");

    if (pattern.test(normalized)) {
      matches.push(key);
    }
  }

  return matches;
}

function getArabicMedicineName(name: string): string | undefined {
  const keys = findMedicineKeys(name);

  return keys.length > 0
    ? arabicMedicineNames[keys[0]]
    : undefined;
}

function getArabicMedicineUses(name: string): string[] | undefined {
  const keys = findMedicineKeys(name);
  const uses: string[] = [];

  for (const key of keys) {
    const medicineUses = arabicMedicineUses[key];

    if (medicineUses) {
      for (const use of medicineUses) {
        if (!uses.includes(use)) {
          uses.push(use);
        }
      }
    }
  }

  return uses.length > 0 ? uses : undefined;
}

function enrichMedicine(
  medicine: GlobalMedicineResult
): GlobalMedicineResult {
  return {
    ...medicine,
    arabicName:
      medicine.arabicName ||
      getArabicMedicineName(medicine.name),
    arabicUses:
      medicine.arabicUses ||
      getArabicMedicineUses(medicine.name),
  };
}

function loadCache(): CachedSearch[] {
  try {
    const saved = localStorage.getItem(CACHE_KEY);

    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCache(items: CachedSearch[]): void {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(items.slice(-50))
    );
  } catch (error) {
    console.error("تعذر حفظ نتائج البحث:", error);
  }
}

export function getCachedGlobalMedicineSearch(
  query: string
): GlobalMedicineResult[] {
  const normalized = query.trim().toLowerCase();

  const cached = loadCache().find(
    (item) => item.query === normalized
  );

  return (cached?.results ?? []).map(enrichMedicine);
}

export async function searchGlobalMedicines(
  query: string
): Promise<GlobalMedicineResult[]> {
  const normalized = query.trim().toLowerCase();

  if (!normalized) return [];

  try {
    const url =
      `${API_URL}?name=${encodeURIComponent(query.trim())}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`خطأ في الاتصال: ${response.status}`);
    }

    const data: RxNormResponse = await response.json();
    const groups = data.drugGroup?.conceptGroup ?? [];
    const fetchedAt = new Date().toISOString();

    const results: GlobalMedicineResult[] = [];
    const seen = new Set<string>();

    for (const group of groups) {
      for (const concept of group.conceptProperties ?? []) {
        if (!concept.rxcui || !concept.name) continue;
        if (seen.has(concept.rxcui)) continue;

        seen.add(concept.rxcui);

        results.push(
          enrichMedicine({
            rxcui: concept.rxcui,
            name: concept.name,
            synonym: concept.synonym ?? "",
            type: concept.tty ?? group.tty ?? "",
            source: "RxNorm - U.S. National Library of Medicine",
            fetchedAt,
          })
        );
      }
    }

    const cache = loadCache().filter(
      (item) => item.query !== normalized
    );

    cache.push({
      query: normalized,
      results,
      savedAt: fetchedAt,
    });

    saveCache(cache);

    return results;
  } catch (error) {
    console.error("فشل البحث العالمي:", error);

    return getCachedGlobalMedicineSearch(query);
  }
}
