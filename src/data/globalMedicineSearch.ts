export type GlobalMedicineResult = {
  rxcui: string;
  name: string;
  arabicName?: string;
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

// أسماء عربية معروفة لبعض المواد الدوائية الشائعة
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

function getArabicMedicineName(name: string): string | undefined {
  const normalized = name.toLowerCase();

  for (const [english, arabic] of Object.entries(arabicMedicineNames)) {
    const pattern = new RegExp(`\\b${english}\\b`, "i");

    if (pattern.test(normalized)) {
      return arabic;
    }
  }

  return undefined;
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

  return (cached?.results ?? []).map((medicine) => ({
    ...medicine,
    arabicName:
      medicine.arabicName || getArabicMedicineName(medicine.name),
  }));
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

        results.push({
          rxcui: concept.rxcui,
          name: concept.name,
          arabicName: getArabicMedicineName(concept.name),
          synonym: concept.synonym ?? "",
          type: concept.tty ?? group.tty ?? "",
          source: "RxNorm - U.S. National Library of Medicine",
          fetchedAt,
        });
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
