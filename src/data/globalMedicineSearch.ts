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

type ApproximateResponse = {
  approximateGroup?: {
    candidate?: Array<{
      rxcui?: string;
      name?: string;
      tty?: string;
      score?: number;
    }>;
  };
};

type PropertiesResponse = {
  properties?: RxNormConcept;
};

type CachedSearch = {
  query: string;
  results: GlobalMedicineResult[];
  savedAt: string;
};

const API_URL = "https://rxnav.nlm.nih.gov/REST";
const CACHE_KEY = "world-drug-encyclopedia-global-search";

// الأسماء العربية
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

// الاستخدامات العربية المعروفة
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

function normalizeText(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function findMedicineKeys(name: string): string[] {
  const normalized = normalizeText(name);
  const matches: string[] = [];

  for (const key of Object.keys(arabicMedicineNames)) {
    const pattern = new RegExp(`\\b${key}\\b`, "i");

    if (pattern.test(normalized)) {
      matches.push(key);
    }
  }

  return matches;
}

function normalizeMedicineKey(key: string): string {
  if (key === "paracetamol" || key === "acetaminophen") {
    return "paracetamol";
  }

  if (key === "salbutamol" || key === "albuterol") {
    return "salbutamol";
  }

  if (key === "prednisolone" || key === "prednisone") {
    return "corticosteroid";
  }

  return key;
}

function getArabicMedicineName(
  name: string
): string | undefined {
  const keys = findMedicineKeys(name);
  return keys.length > 0
    ? arabicMedicineNames[keys[0]]
    : undefined;
}

function getArabicMedicineUses(
  name: string
): string[] | undefined {
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

function getQueryMedicineKeys(query: string): string[] {
  return [
    ...new Set(
      findMedicineKeys(query).map(normalizeMedicineKey)
    ),
  ];
}

function isCombinationMedicine(name: string): boolean {
  const keys = findMedicineKeys(name).map(normalizeMedicineKey);

  if (new Set(keys).size > 1) return true;

  return /[+/]/.test(name);
}

function filterAndSortResults(
  results: GlobalMedicineResult[],
  query: string
): GlobalMedicineResult[] {
  const queryKeys = getQueryMedicineKeys(query);

  if (queryKeys.length === 0) {
    return results;
  }

  const matchingResults = results.filter((medicine) => {
    const medicineKeys = findMedicineKeys(medicine.name)
      .map(normalizeMedicineKey);

    return queryKeys.some((key) =>
      medicineKeys.includes(key)
    );
  });

  if (matchingResults.length === 0) {
    return results;
  }

  const singleIngredientResults = matchingResults.filter(
    (medicine) => !isCombinationMedicine(medicine.name)
  );

  const finalResults =
    singleIngredientResults.length > 0
      ? singleIngredientResults
      : matchingResults;

  const normalizedQuery = normalizeText(query);

  return [...finalResults].sort((a, b) => {
    const aName = normalizeText(a.name);
    const bName = normalizeText(b.name);

    const aExact = aName === normalizedQuery ? 1 : 0;
    const bExact = bName === normalizedQuery ? 1 : 0;

    if (aExact !== bExact) {
      return bExact - aExact;
    }

    const aStarts = aName.startsWith(normalizedQuery) ? 1 : 0;
    const bStarts = bName.startsWith(normalizedQuery) ? 1 : 0;

    return bStarts - aStarts;
  });
}

// جلب JSON مع مهلة زمنية ومعالجة الأخطاء
async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function loadCache(): CachedSearch[] {
  try {
    if (typeof localStorage === "undefined") return [];

    const saved = localStorage.getItem(CACHE_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("تعذر قراءة ذاكرة البحث:", error);
    return [];
  }
}

function saveCache(items: CachedSearch[]): void {
  try {
    if (typeof localStorage === "undefined") return;

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
  const normalized = normalizeText(query);

  const cached = loadCache().find(
    (item) => item.query === normalized
  );

  const results = (cached?.results ?? []).map(enrichMedicine);

  return filterAndSortResults(results, query);
}

// البحث الأساسي في RxNorm
async function searchByDrugName(
  query: string
): Promise<GlobalMedicineResult[]> {
  // تم حذف expand=0 من الرابط
  const url =
    `${API_URL}/drugs.json?name=${encodeURIComponent(query)}`;

  const data = await fetchJson<RxNormResponse>(url);
  const groups = data.drugGroup?.conceptGroup ?? [];

  const results: GlobalMedicineResult[] = [];
  const seen = new Set<string>();
  const fetchedAt = new Date().toISOString();

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

  return results;
}

// البحث الاحتياطي
async function searchByApproximateTerm(
  query: string
): Promise<GlobalMedicineResult[]> {
  const url =
    `${API_URL}/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=15`;

  const data = await fetchJson<ApproximateResponse>(url);

  const candidates =
    data.approximateGroup?.candidate ?? [];

  const selectedCandidates = candidates
    .filter((item) => item.rxcui)
    .slice(0, 10);

  const fetchedAt = new Date().toISOString();

  const results = await Promise.all(
    selectedCandidates.map(async (candidate) => {
      try {
        const propertiesUrl =
          `${API_URL}/rxcui/${candidate.rxcui}/properties.json`;

        const propertiesData =
          await fetchJson<PropertiesResponse>(propertiesUrl);

        const medicine = propertiesData.properties;

        if (!medicine?.rxcui || !medicine.name) {
          return null;
        }

        return enrichMedicine({
          rxcui: medicine.rxcui,
          name: medicine.name,
          synonym: medicine.synonym ?? "",
          type: medicine.tty ?? candidate.tty ?? "",
          source: "RxNorm - U.S. National Library of Medicine",
          fetchedAt,
        });
      } catch (error) {
        console.warn("تعذر جلب تفاصيل الدواء:", error);
        return null;
      }
    })
  );

  return results.filter(
    (item): item is GlobalMedicineResult => item !== null
  );
}

// الدالة الرئيسية التي يستدعيها التطبيق
export async function searchGlobalMedicines(
  query: string
): Promise<GlobalMedicineResult[]> {
  const cleanQuery = query.trim();
  const normalized = normalizeText(cleanQuery);

  if (!normalized) return [];

  let results: GlobalMedicineResult[] = [];

  // المحاولة الأولى
  try {
    results = await searchByDrugName(cleanQuery);
  } catch (error) {
    console.warn("تعذر البحث الأساسي:", error);
  }

  // المحاولة الاحتياطية عند عدم وجود نتائج
  if (results.length === 0) {
    try {
      results = await searchByApproximateTerm(cleanQuery);
    } catch (error) {
      console.warn("تعذر البحث الاحتياطي:", error);
    }
  }

  // إزالة التكرار
  const uniqueResults = Array.from(
    new Map(
      results.map((item) => [item.rxcui, item])
    ).values()
  );

  const enrichedResults = uniqueResults.map(enrichMedicine);

  const filteredResults = filterAndSortResults(
    enrichedResults,
    cleanQuery
  );

  // حفظ النتائج في الذاكرة
  if (filteredResults.length > 0) {
    const cache = loadCache().filter(
      (item) => item.query !== normalized
    );

    cache.push({
      query: normalized,
      results: filteredResults,
      savedAt: new Date().toISOString(),
    });

    saveCache(cache);
  }

  // إذا فشل الاتصال، نعيد النتائج المحفوظة سابقاً
  if (filteredResults.length === 0) {
    return getCachedGlobalMedicineSearch(cleanQuery);
  }

  return filteredResults;
}
