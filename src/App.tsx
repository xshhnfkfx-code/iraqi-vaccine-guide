import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Pill, Wifi, WifiOff, AlertTriangle, HeartPulse,
  X, ChevronLeft, Activity, Stethoscope, RotateCcw,
  Database, Camera, ImagePlus, ScanSearch, Loader2,
  FlaskConical, Package, Info, PlusCircle, Save, Globe,
  BookOpen
} from "lucide-react";

import { medicines } from "./data/medicineDatabase";
import type { Medicine } from "./data/medicineDatabase";
import {
  loadCustomMedicines,
  saveCustomMedicines
} from "./data/customMedicines";
import {
  searchGlobalMedicines,
  getCachedGlobalMedicineSearch
} from "./data/globalMedicineSearch";
import type {
  GlobalMedicineResult
} from "./data/globalMedicineSearch";
import { createWorker } from "tesseract.js";

const emptyForm = {
  name: "",
  english: "",
  category: "",
  activeIngredient: "",
  forms: "",
  strengths: "",
  uses: "",
  warnings: "",
  ageInfo: "",
  usageNotes: "",
  brandNames: "",
  sideEffects: "",
  contraindications: "",
  interactions: "",
  precautions: "",
  pregnancyInfo: "",
  breastfeedingInfo: "",
  storageInfo: "",
  overdoseInfo: "",
  medicalReferences: ""
};

export default function App() {
  const [search, setSearch] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");

  const [selected, setSelected] = useState<Medicine | null>(null);
  const [selectedGlobal, setSelectedGlobal] =
    useState<GlobalMedicineResult | null>(null);

  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : false
  );

  const [customMedicines, setCustomMedicines] = useState<Medicine[]>(
    () => loadCustomMedicines()
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [scanText, setScanText] = useState("");
  const [scanMatches, setScanMatches] = useState<Medicine[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  const [globalResults, setGlobalResults] =
    useState<GlobalMedicineResult[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [globalSearched, setGlobalSearched] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const allMedicines = useMemo(
    () => [...medicines, ...customMedicines],
    [customMedicines]
  );

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    try {
      saveCustomMedicines(customMedicines);
    } catch {
      setFormError(
        "تعذر حفظ الأدوية في الهاتف. قد تكون مساحة التخزين غير كافية."
      );
    }
  }, [customMedicines]);

  function normalize(value: string) {
    return value
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[^a-z0-9\u0600-\u06FF\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function splitItems(value: string): string[] {
    return value
      .split(/[\n،,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const results = useMemo(() => {
    const query = normalize(search);
    if (!query) return [];

    return allMedicines.filter((medicine) => {
      const searchableText = [
        medicine.name,
        medicine.english,
        medicine.category,
        medicine.activeIngredient,
        ...medicine.forms,
        ...medicine.strengths,
        ...medicine.uses,
        ...medicine.warnings,
        ...(medicine.brandNames || []),
        ...(medicine.sideEffects || []),
        ...(medicine.contraindications || []),
        ...(medicine.interactions || []),
        ...(medicine.precautions || []),
        ...(medicine.medicalReferences || []),
        medicine.pregnancyInfo || "",
        medicine.breastfeedingInfo || "",
        medicine.storageInfo || "",
        medicine.overdoseInfo || ""
      ].join(" ");

      return normalize(searchableText).includes(query);
    });
  }, [search, allMedicines]);

  async function runGlobalSearch() {
    const query = search.trim();

    if (!query) {
      setGlobalError("اكتب اسم الدواء أولاً لإجراء البحث العالمي.");
      setGlobalSearched(false);
      return;
    }

    setSelected(null);
    setSelectedGlobal(null);
    setGlobalLoading(true);
    setGlobalError("");
    setGlobalSearched(true);

    const cached = getCachedGlobalMedicineSearch(query);
    setGlobalResults(cached);

    try {
      if (!navigator.onLine) {
        setGlobalError(
          cached.length > 0
            ? "أنت غير متصل بالإنترنت. هذه النتائج مسترجعة من ذاكرة الهاتف وقد تكون قديمة."
            : "لا يوجد اتصال بالإنترنت ولا توجد نتائج محفوظة لهذا البحث."
        );
        return;
      }

      const data = await searchGlobalMedicines(query);
      setGlobalResults(data);

      if (data.length === 0) {
        setGlobalError(
          "لم يعثر المصدر العالمي على نتائج لهذا الاسم. جرّب الاسم العلمي باللغة الإنجليزية."
        );
      }
    } catch (error) {
      console.error("Global search error:", error);

      if (cached.length > 0) {
        setGlobalResults(cached);
        setGlobalError(
          "تعذر تحديث النتائج من الإنترنت. تظهر النتائج المحفوظة سابقاً."
        );
      } else {
        setGlobalError(
          "تعذر الاتصال بمصدر البحث العالمي. تحقق من الإنترنت وحاول مجدداً."
        );
      }
    } finally {
      setGlobalLoading(false);
    }
  }

  function reset() {
    setSearch("");
    setAge("");
    setWeight("");
    setSelected(null);
    setSelectedGlobal(null);
    setGlobalResults([]);
    setGlobalError("");
    setGlobalSearched(false);
    setImageFile(null);
    setImagePreview("");
    setScanText("");
    setScanMatches([]);
    setScanError("");

    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
  }

  function handleImage(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setScanError("الرجاء اختيار ملف صورة صالح.");
      return;
    }

    setImageFile(file);
    setScanText("");
    setScanMatches([]);
    setScanError("");
    setSelected(null);
    setSelectedGlobal(null);

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(String(reader.result || ""));
    };

    reader.onerror = () => {
      setScanError("تعذر فتح الصورة. حاول اختيار صورة أخرى.");
    };

    reader.readAsDataURL(file);
  }

  function findMedicines(text: string): Medicine[] {
    const normalizedText = normalize(text);

    if (!normalizedText) return [];

    return allMedicines.filter((medicine) => {
      const name = normalize(medicine.name);
      const english = normalize(medicine.english);
      const ingredient = normalize(medicine.activeIngredient);

      return (
        (name.length > 2 && normalizedText.includes(name)) ||
        (english.length > 2 && normalizedText.includes(english)) ||
        (ingredient.length > 2 && normalizedText.includes(ingredient))
      );
    });
  }

  async function recognizeMedicine() {
    if (!imageFile) {
      setScanError("التقط صورة أو اختر صورة من المعرض أولاً.");
      return;
    }

    setScanning(true);
    setScanError("");
    setScanText("");
    setScanMatches([]);

    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

    try {
      worker = await createWorker("eng+ara", 1, {
        cacheMethod: "write"
      });

      const result = await worker.recognize(imageFile);
      const extractedText = result.data.text.trim();

      setScanText(extractedText);

      if (!extractedText) {
        setScanError(
          "لم يتمكن التطبيق من قراءة النص. حاول تصوير العلبة بصورة أوضح."
        );
      } else {
        const matches = findMedicines(extractedText);
        setScanMatches(matches);

        if (matches.length === 0) {
          setScanError(
            "تمت قراءة النص، لكن لم نجد اسماً مطابقاً في قاعدة الأدوية المحلية. يمكنك البحث عالمياً بالاسم."
          );
        }
      }
    } catch (error) {
      console.error(error);

      setScanError(
        online
          ? "حدث خطأ أثناء قراءة الصورة. تحقق من الاتصال بالإنترنت وحاول مجدداً."
          : "تعذر تشغيل قراءة الصور دون إنترنت. يجب تحميل ملفات اللغة ومحرك القراءة أولاً أثناء الاتصال بالإنترنت."
      );
    } finally {
      if (worker) {
        await worker.terminate();
      }

      setScanning(false);
    }
  }

  function openMedicine(medicine: Medicine) {
    setSelected(medicine);
    setSelectedGlobal(null);
    setShowAddForm(false);
  }

  function openGlobalMedicine(medicine: GlobalMedicineResult) {
    setSelectedGlobal(medicine);
    setSelected(null);
    setShowAddForm(false);
  }

  function updateForm(field: keyof typeof emptyForm, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
    setFormError("");
    setFormSuccess("");
  }

  function addMedicine() {
    setFormError("");
    setFormSuccess("");

    if (
      !form.name.trim() ||
      !form.english.trim() ||
      !form.category.trim() ||
      !form.activeIngredient.trim()
    ) {
      setFormError(
        "يرجى إدخال الاسم العربي والإنجليزي والتصنيف والمادة الفعالة على الأقل."
      );
      return;
    }

    if (
      !form.forms.trim() ||
      !form.strengths.trim() ||
      !form.uses.trim() ||
      !form.warnings.trim() ||
      !form.ageInfo.trim() ||
      !form.usageNotes.trim()
    ) {
      setFormError("يرجى إكمال جميع المعلومات الأساسية قبل حفظ الدواء.");
      return;
    }

    const normalizedName = normalize(form.name);
    const normalizedEnglish = normalize(form.english);
    const normalizedIngredient = normalize(form.activeIngredient);

    const duplicate = allMedicines.some((medicine) => {
      return (
        normalize(medicine.name) === normalizedName ||
        normalize(medicine.english) === normalizedEnglish ||
        normalize(medicine.activeIngredient) === normalizedIngredient
      );
    });

    if (duplicate) {
      setFormError(
        "هذا الدواء أو مادته الفعالة مسجل مسبقاً في قاعدة البيانات."
      );
      return;
    }

    const nextId =
      allMedicines.length > 0
        ? Math.max(...allMedicines.map((item) => item.id)) + 1
        : 1;

    const newMedicine: Medicine = {
      id: nextId,
      name: form.name.trim(),
      english: form.english.trim(),
      category: form.category.trim(),
      activeIngredient: form.activeIngredient.trim(),
      forms: splitItems(form.forms),
      strengths: splitItems(form.strengths),
      uses: splitItems(form.uses),
      warnings: splitItems(form.warnings),
      ageInfo: form.ageInfo.trim(),
      usageNotes: form.usageNotes.trim(),

      brandNames: splitItems(form.brandNames),
      sideEffects: splitItems(form.sideEffects),
      contraindications: splitItems(form.contraindications),
      interactions: splitItems(form.interactions),
      precautions: splitItems(form.precautions),
      pregnancyInfo: form.pregnancyInfo.trim() || undefined,
      breastfeedingInfo: form.breastfeedingInfo.trim() || undefined,
      storageInfo: form.storageInfo.trim() || undefined,
      overdoseInfo: form.overdoseInfo.trim() || undefined,
      medicalReferences: splitItems(form.medicalReferences)
    };

    if (
      !newMedicine.forms.length ||
      !newMedicine.strengths.length ||
      !newMedicine.uses.length ||
      !newMedicine.warnings.length
    ) {
      setFormError(
        "يرجى إدخال عنصر واحد على الأقل في الأشكال والتركيزات والاستخدامات والتحذيرات."
      );
      return;
    }

    setCustomMedicines((previous) => [...previous, newMedicine]);
    setForm(emptyForm);
    setFormSuccess("تمت إضافة الدواء بنجاح.");
    setSearch("");
    setSelected(newMedicine);
    setSelectedGlobal(null);
    setShowAddForm(false);
  }

  function renderMedicineList(items: Medicine[]) {
    return items.map((medicine) => (
      <article className="med-result" key={medicine.id}>
        <div className="med-pill-icon">
          <Pill size={21} />
        </div>

        
<div className="med-detail-section">
  <h3><Info size={18} /> الاسم البديل</h3>
  <p className="med-detail-text">
    {selectedGlobal.synonym || "لا توجد معلومات عن اسم بديل في النتيجة."}
  </p>
</div>

{selectedGlobal.arabicUses &&
selectedGlobal.arabicUses.length > 0 ? (
  renderExtraList(
    "الاستخدامات الطبية بالعربية",
    selectedGlobal.arabicUses,
    <Stethoscope size={18} />
  )
) : (
  <div className="med-detail-section">
    <h3>
      <Stethoscope size={18} /> الاستخدامات الطبية بالعربية
    </h3>
    <p className="med-detail-text">
      لم تتوفر استخدامات عربية موثوقة لهذه النتيجة في قاعدة المعلومات الحالية.
    </p>
  </div>
)}


        <button
          className="med-open"
          onClick={() => openMedicine(medicine)}
        >
          <span>التفاصيل</span>
          <ChevronLeft size={16} />
        </button>
      </article>
    ));
  }

  function renderGlobalList(items: GlobalMedicineResult[]) {
    return items.map((medicine) => (
      <article className="med-result" key={medicine.rxcui}>
        <div className="med-pill-icon global-icon">
          <Globe size={21} />
        </div>

        <div className="med-result-info">
          <strong>{medicine.arabicName || medicine.name}</strong>

          {medicine.arabicName && (
            <small dir="ltr">{medicine.name}</small>
          )}

          <small>
            {medicine.synonym || "لا يوجد اسم بديل مسجل"}
          </small>

          <small className="source-global">
            نتيجة عالمية · {medicine.type || "RxNorm"}
          </small>
        </div>

        <button
          className="med-open"
          onClick={() => openGlobalMedicine(medicine)}
        >
          <span>التفاصيل</span>
          <ChevronLeft size={16} />
        </button>
      </article>
    ));
  }

  function renderExtraList(
    title: string,
    items: string[] | undefined,
    icon: React.ReactNode
  ) {
    if (!items || items.length === 0) return null;

    return (
      <div className="med-detail-section">
        <h3>{icon} {title}</h3>
        <ul>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  function renderExtraText(
    title: string,
    value: string | undefined,
    icon: React.ReactNode
  ) {
    if (!value || !value.trim()) return null;

    return (
      <div className="med-detail-section">
        <h3>{icon} {title}</h3>
        <p className="med-detail-text">{value}</p>
      </div>
    );
  }

  return (
    <div className="medicine-app" dir="rtl">
      <style>{`
        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: #f3f6fb;
          font-family: Arial, Tahoma, sans-serif;
        }

        button, input, textarea { font: inherit; }
        button { cursor: pointer; }

        .medicine-app {
          min-height: 100vh;
          color: #172b45;
          background: #f3f6fb;
          padding-bottom: 35px;
        }

        .med-header {
          background: linear-gradient(135deg,#075b9b,#087db4);
          color: white;
          padding: 25px 18px 35px;
          border-radius: 0 0 25px 25px;
        }

        .med-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .med-brand {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .med-logo {
          width: 48px;
          height: 48px;
          border-radius: 15px;
          background: rgba(255,255,255,.18);
          display: grid;
          place-items: center;
        }

        .med-brand strong {
          display: block;
          font-size: 19px;
        }

        .med-brand small {
          opacity: .8;
          display: block;
          margin-top: 5px;
        }

        .med-connection {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255,255,255,.16);
          padding: 8px 10px;
          border-radius: 20px;
          font-size: 12px;
          white-space: nowrap;
        }

        .med-intro { margin-top: 30px; }

        .med-intro h1 {
          font-size: 25px;
          margin: 0 0 9px;
        }

        .med-intro p {
          font-size: 14px;
          line-height: 1.8;
          opacity: .9;
          margin: 0;
        }

        .med-container {
          max-width: 850px;
          margin: -17px auto 0;
          padding: 0 14px;
        }

        .med-panel {
          background: white;
          border: 1px solid #e7edf4;
          border-radius: 17px;
          padding: 18px;
          margin-bottom: 16px;
          box-shadow: 0 4px 18px rgba(22,49,78,.045);
        }

        .med-panel h2 {
          font-size: 17px;
          margin: 0 0 7px;
        }

        .med-subtitle {
          color: #77869a;
          font-size: 13px;
          line-height: 1.7;
          margin: 0 0 17px;
        }

        .med-label {
          display: block;
          font-size: 14px;
          font-weight: bold;
          margin: 14px 0 8px;
        }

        .med-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #dce5ef;
          background: #fafcff;
          border-radius: 11px;
          padding: 0 12px;
          min-height: 49px;
        }

        .med-input-wrap:focus-within {
          border-color: #1684bd;
          box-shadow: 0 0 0 3px rgba(22,132,189,.09);
        }

        .med-input-wrap svg {
          color: #1684bd;
          flex-shrink: 0;
        }

        .med-input-wrap input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #172b45;
          min-width: 0;
          padding: 13px 0;
        }

        .med-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .med-search-button,
        .med-global-button,
        .med-scan-button,
        .med-add-button,
        .med-save-button {
          width: 100%;
          border-radius: 11px;
          padding: 14px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .med-search-button,
        .med-scan-button,
        .med-add-button,
        .med-save-button {
          border: 0;
          color: white;
          background: #0878b4;
        }

        .med-search-button { margin-top: 17px; }

        .med-global-button {
          border: 1px solid #0878b4;
          margin-top: 10px;
          color: #0878b4;
          background: #edf7fd;
        }

        .med-global-button:disabled,
        .med-scan-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .med-reset {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 0;
          background: transparent;
          color: #66788e;
          padding: 13px;
          margin: 0 auto;
        }

        .med-result-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 13px;
        }

        .med-result-title h2 {
          margin: 0;
          font-size: 17px;
        }

        .med-count {
          color: #0878b4;
          background: #eaf5fc;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
        }

        .med-result {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #edf1f5;
        }

        .med-result:last-child { border-bottom: 0; }

        .med-pill-icon {
          width: 43px;
          height: 43px;
          border-radius: 13px;
          background: #eaf5fc;
          color: #0878b4;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .global-icon {
          color: #0878b4;
          background: #e8f5ff;
        }

        .med-result-info {
          flex: 1;
          min-width: 0;
        }

        .med-result-info strong {
          display: block;
          font-size: 15px;
          overflow-wrap: anywhere;
        }

        .med-result-info small {
          color: #7b899b;
          display: block;
          margin-top: 5px;
          overflow-wrap: anywhere;
        }

        .source-local { color: #278052 !important; }
        .source-global { color: #0878b4 !important; }

        .med-open {
          background: #edf6fc;
          border: 0;
          color: #0878b4;
          border-radius: 9px;
          padding: 9px;
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 12px;
          flex-shrink: 0;
        }

        .med-detail-head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 17px;
        }

        .med-detail-head h2 { margin: 0; }

        .med-detail-head p {
          color: #77869a;
          font-size: 13px;
          margin: 6px 0 0;
          overflow-wrap: anywhere;
        }

        .med-close {
          border: 0;
          background: transparent;
          color: #718096;
        }

        .med-detail-section {
          border-top: 1px solid #edf1f5;
          padding: 15px 0;
        }

        .med-detail-section h3 {
          font-size: 15px;
          margin: 0 0 10px;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .med-detail-section ul {
          margin: 0;
          padding-right: 22px;
          color: #4f6177;
          line-height: 2;
          font-size: 14px;
        }

        .med-detail-text {
          margin: 0;
          color: #4f6177;
          line-height: 1.9;
          font-size: 14px;
          overflow-wrap: anywhere;
        }

        .med-info-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .med-info-chip {
          display: inline-block;
          background: #edf6fc;
          color: #285c7c;
          border: 1px solid #dcecf7;
          border-radius: 9px;
          padding: 8px 11px;
          font-size: 13px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .med-warning {
          background: #fff8e9;
          border: 1px solid #f3e4bd;
          border-radius: 12px;
          padding: 13px;
          color: #775a20;
          font-size: 13px;
          line-height: 1.9;
          display: flex;
          gap: 9px;
        }

        .med-empty {
          text-align: center;
          padding: 28px 12px;
          color: #8190a3;
          line-height: 1.8;
        }

        .med-empty svg {
          margin-bottom: 10px;
          color: #1684bd;
        }

        .med-footer {
          text-align: center;
          color: #8794a5;
          font-size: 12px;
          padding: 15px;
          line-height: 1.8;
        }

        .med-photo-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 15px;
        }

        .med-photo-button {
          border: 1px solid #dce8f1;
          border-radius: 12px;
          padding: 15px 8px;
          background: #f5faff;
          color: #0878b4;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: bold;
        }

        .med-preview {
          width: 100%;
          max-height: 280px;
          object-fit: contain;
          border-radius: 12px;
          background: #f1f4f8;
          margin-top: 15px;
        }

        .med-scan-button { margin-top: 13px; }

        .med-scan-error,
        .med-form-error {
          background: #fff5ed;
          color: #965327;
          border: 1px solid #f2ddcb;
          padding: 12px;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.8;
          margin-top: 12px;
        }

        .med-scan-text {
          background: #f6f8fb;
          padding: 12px;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.9;
          color: #52647a;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          margin-top: 12px;
        }

        .med-hidden-input { display: none; }

        .med-form-field { margin-bottom: 13px; }

        .med-form-field label {
          display: block;
          font-weight: bold;
          font-size: 13px;
          margin-bottom: 7px;
        }

        .med-form-field input,
        .med-form-field textarea {
          width: 100%;
          border: 1px solid #dce5ef;
          background: #fafcff;
          border-radius: 10px;
          padding: 12px;
          outline: none;
          color: #172b45;
          font-size: 14px;
        }

        .med-form-field textarea {
          min-height: 75px;
          resize: vertical;
          line-height: 1.8;
        }

        .med-form-hint {
          color: #7b899b;
          font-size: 12px;
          line-height: 1.7;
          margin-top: 5px;
        }

        .med-form-success {
          background: #eaf8ef;
          color: #236b3b;
          border: 1px solid #ccebd5;
          border-radius: 10px;
          padding: 12px;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .med-form-section-title {
          border-top: 1px solid #edf1f5;
          padding-top: 17px;
          margin: 22px 0 7px;
          font-size: 16px;
          color: #0878b4;
        }

        .med-save-button { margin-top: 8px; }

        .med-cancel-button {
          width: 100%;
          border: 1px solid #dce5ef;
          border-radius: 11px;
          padding: 13px;
          margin-top: 9px;
          color: #52647a;
          background: white;
        }

        .med-status {
          border-radius: 10px;
          padding: 12px;
          margin-top: 12px;
          font-size: 13px;
          line-height: 1.8;
          background: #f3f7fb;
          color: #52647a;
          overflow-wrap: anywhere;
        }

        .med-status.error {
          background: #fff5ed;
          color: #965327;
        }

        .med-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 9px;
          padding: 18px;
          color: #0878b4;
          font-size: 14px;
        }

        @media(max-width:520px) {
          .med-fields {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .med-brand strong { font-size: 16px; }
          .med-intro h1 { font-size: 22px; }
          .med-panel { padding: 15px; }
          .med-open span { display: none; }
        }
      `}</style>

      <header className="med-header">
        <div className="med-top">
          <div className="med-brand">
            <div className="med-logo">
              <Pill size={27} />
            </div>
            <div>
              <strong>الموسوعة الدوائية العالمية</strong>
              <small>World Drug Encyclopedia</small>
            </div>
          </div>

          <div className="med-connection">
            {online ? <Wifi size={15} /> : <WifiOff size={15} />}
            {online ? "متصل بالإنترنت" : "وضع عدم الاتصال"}
          </div>
        </div>

        <div className="med-intro">
          <h1>مرجعك الدوائي في مكان واحد</h1>
          <p>
            ابحث في قاعدة الأدوية المحلية أو استكشف الأدوية من المصدر العالمي.
          </p>
        </div>
      </header>

      <main className="med-container">
        <section className="med-panel">
          <h2>
            <ScanSearch size={20} style={{ verticalAlign: "middle", marginLeft: 7 }} />
            التعرف على الدواء بالتصوير
          </h2>

          <p className="med-subtitle">
            صوّر علبة الدواء أو اختر صورة محفوظة في هاتفك لقراءة الاسم
            ومطابقته مع قاعدة الأدوية.
          </p>

          <input
            ref={cameraRef}
            className="med-hidden-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleImage(e.target.files?.[0])}
          />

          <input
            ref={galleryRef}
            className="med-hidden-input"
            type="file"
            accept="image/*"
            onChange={(e) => handleImage(e.target.files?.[0])}
          />

          <div className="med-photo-buttons">
            <button
              className="med-photo-button"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera size={21} />
              تصوير الدواء
            </button>

            <button
              className="med-photo-button"
              onClick={() => galleryRef.current?.click()}
            >
              <ImagePlus size={21} />
              معرض الصور
            </button>
          </div>

          {imagePreview && (
            <>
              <img
                src={imagePreview}
                alt="صورة الدواء المختار"
                className="med-preview"
              />

              <button
                className="med-scan-button"
                onClick={recognizeMedicine}
                disabled={scanning}
              >
                {scanning ? (
                  <>
                    <Loader2 size={19} />
                    جارٍ قراءة الصورة...
                  </>
                ) : (
                  <>
                    <ScanSearch size={19} />
                    اقرأ اسم الدواء
                  </>
                )}
              </button>
            </>
          )}

          {scanError && (
            <div className="med-scan-error">
              <AlertTriangle size={17} style={{ verticalAlign: "middle", marginLeft: 5 }} />
              {scanError}
            </div>
          )}

          {scanText && (
            <div className="med-scan-text">
              <strong>النص الذي تمت قراءته:</strong>
              {"\n"}
              {scanText}

              <button
                className="med-scan-button"
                onClick={() => {
                  setSearch(scanText);
                  setSelected(null);
                  setSelectedGlobal(null);
                  setGlobalSearched(false);
                }}
              >
                <Search size={17} />
                البحث بالنص المقروء
              </button>
            </div>
          )}

          {scanMatches.length > 0 && (
            <div style={{ marginTop: 17 }}>
              <div className="med-result-title">
                <h2>الأدوية المطابقة محلياً</h2>
                <span className="med-count">{scanMatches.length} نتيجة</span>
              </div>
              {renderMedicineList(scanMatches)}
            </div>
          )}

          <p className="med-subtitle" style={{ marginTop: 14, marginBottom: 0 }}>
            قراءة الصور تعتمد على وضوح الصورة وملفات اللغة المتاحة.
            قد لا يتعرف التطبيق على بعض الأسماء أو التركيبات.
          </p>
        </section>

        <section className="med-panel">
          <h2>
            <Search size={20} style={{ verticalAlign: "middle", marginLeft: 7 }} />
            البحث عن دواء
          </h2>

          <p className="med-subtitle">
            ابحث محلياً أو عبر قاعدة RxNorm العالمية باستخدام الاسم التجاري
            أو العلمي أو المادة الفعالة.
          </p>

          <label className="med-label">اسم العلاج أو المادة الفعالة</label>

          <div className="med-input-wrap">
            <Search size={20} />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelected(null);
                setSelectedGlobal(null);
                setGlobalResults([]);
                setGlobalError("");
                setGlobalSearched(false);
              }}
              placeholder="مثال: Paracetamol أو باراسيتامول"
            />

            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelected(null);
                  setSelectedGlobal(null);
                  setGlobalResults([]);
                  setGlobalError("");
                  setGlobalSearched(false);
                }}
                className="med-close"
                aria-label="مسح البحث"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="med-fields">
            <div>
              <label className="med-label">عمر الشخص (بالسنوات)</label>
              <div className="med-input-wrap">
                <Activity size={18} />
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="مثال: 5"
                />
              </div>
            </div>

            <div>
              <label className="med-label">الوزن (كغم)</label>
              <div className="med-input-wrap">
                <HeartPulse size={18} />
                <input
                  type="number"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="مثال: 18"
                />
              </div>
            </div>
          </div>

          <button
            className="med-search-button"
            onClick={() => {
              setSelected(null);
              setSelectedGlobal(null);
            }}
          >
            <Search size={17} />
            عرض نتائج البحث المحلي
          </button>

          <button
            className="med-global-button"
            onClick={runGlobalSearch}
            disabled={globalLoading}
          >
            {globalLoading ? (
              <>
                <Loader2 size={18} />
                جارٍ البحث في قاعدة البيانات العالمية...
              </>
            ) : (
              <>
                <Globe size={18} />
                البحث في الموسوعة الدوائية العالمية
              </>
            )}
          </button>

          <button className="med-reset" onClick={reset}>
            <RotateCcw size={15} />
            مسح البيانات
          </button>
        </section>

        <section className="med-panel">
          <h2>
            <PlusCircle size={20} style={{ verticalAlign: "middle", marginLeft: 7 }} />
            إدارة قاعدة الأدوية
          </h2>

          <p className="med-subtitle">
            أضف دواءً جديداً إلى قاعدة البيانات المحلية المحفوظة على هذا الجهاز.
          </p>

          <button
            className="med-add-button"
            onClick={() => {
              setShowAddForm((previous) => !previous);
              setSelected(null);
              setSelectedGlobal(null);
              setFormError("");
              setFormSuccess("");
            }}
          >
            {showAddForm ? <X size={19} /> : <PlusCircle size={19} />}
            {showAddForm ? "إغلاق نموذج الإضافة" : "إضافة دواء جديد"}
          </button>

          {formSuccess && (
            <div className="med-form-success" style={{ marginTop: 12 }}>
              {formSuccess}
            </div>
          )}

          {showAddForm && (
            <div style={{ marginTop: 18 }}>
              <div className="med-form-field">
                <label>اسم الدواء بالعربية *</label>
                <input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="مثال: باراسيتامول"
                />
              </div>

              <div className="med-form-field">
                <label>اسم الدواء بالإنجليزية *</label>
                <input
                  value={form.english}
                  onChange={(e) => updateForm("english", e.target.value)}
                  placeholder="Example: Paracetamol"
                  dir="ltr"
                />
              </div>

              <div className="med-form-field">
                <label>التصنيف الدوائي *</label>
                <input
                  value={form.category}
                  onChange={(e) => updateForm("category", e.target.value)}
                  placeholder="مثال: مسكن وخافض حرارة"
                />
              </div>

              <div className="med-form-field">
                <label>المادة الفعالة *</label>
                <input
                  value={form.activeIngredient}
                  onChange={(e) => updateForm("activeIngredient", e.target.value)}
                  placeholder="مثال: Paracetamol"
                  dir="auto"
                />
              </div>

              <div className="med-form-field">
                <label>الأشكال الدوائية *</label>
                <textarea
                  value={form.forms}
                  onChange={(e) => updateForm("forms", e.target.value)}
                  placeholder={"أقراص\nشراب\nتحاميل"}
                />
                <p className="med-form-hint">
                  يمكنك إدخال أكثر من شكل، وافصل بينها بفاصلة أو سطر جديد.
                </p>
              </div>

              <div className="med-form-field">
                <label>التركيزات المتوفرة *</label>
                <textarea
                  value={form.strengths}
                  onChange={(e) => updateForm("strengths", e.target.value)}
                  placeholder={"500 mg\n250 mg\n120 mg/5 mL"}
                />
              </div>

              <div className="med-form-field">
                <label>الاستخدامات الطبية *</label>
                <textarea
                  value={form.uses}
                  onChange={(e) => updateForm("uses", e.target.value)}
                  placeholder="اكتب الاستخدامات الطبية المعروفة والموثوقة"
                />
              </div>

              <div className="med-form-field">
                <label>التحذيرات والاحتياطات *</label>
                <textarea
                  value={form.warnings}
                  onChange={(e) => updateForm("warnings", e.target.value)}
                  placeholder="اكتب التحذيرات والاحتياطات المهمة"
                />
              </div>

              <div className="med-form-field">
                <label>معلومات العمر *</label>
                <textarea
                  value={form.ageInfo}
                  onChange={(e) => updateForm("ageInfo", e.target.value)}
                  placeholder="معلومات متعلقة بالعمر والفئات التي تحتاج إلى احتياط"
                />
              </div>

              <div className="med-form-field">
                <label>ملاحظات الاستعمال *</label>
                <textarea
                  value={form.usageNotes}
                  onChange={(e) => updateForm("usageNotes", e.target.value)}
                  placeholder="ملاحظات مهمة حول طريقة الاستعمال"
                />
              </div>

              <h3 className="med-form-section-title">
                المعلومات الطبية الإضافية
              </h3>

              <p className="med-form-hint" style={{ marginBottom: 15 }}>
                جميع الحقول التالية اختيارية. أدخل المعلومات من نشرة الدواء
                الرسمية أو من مصدر طبي موثوق. يمكن ترك أي حقل فارغاً.
              </p>

              <div className="med-form-field">
                <label>الأسماء التجارية</label>
                <textarea
                  value={form.brandNames}
                  onChange={(e) => updateForm("brandNames", e.target.value)}
                  placeholder={"اسم تجاري أول\nاسم تجاري آخر"}
                />
                <p className="med-form-hint">
                  افصل الأسماء بفاصلة أو سطر جديد. قد تختلف الأسماء حسب البلد.
                </p>
              </div>

              <div className="med-form-field">
                <label>الآثار الجانبية</label>
                <textarea
                  value={form.sideEffects}
                  onChange={(e) => updateForm("sideEffects", e.target.value)}
                  placeholder="أدخل الآثار الجانبية المذكورة في النشرة الرسمية"
                />
              </div>

              <div className="med-form-field">
                <label>موانع الاستعمال</label>
                <textarea
                  value={form.contraindications}
                  onChange={(e) => updateForm("contraindications", e.target.value)}
                  placeholder="أدخل موانع الاستعمال الموثقة"
                />
              </div>

              <div className="med-form-field">
                <label>التداخلات الدوائية</label>
                <textarea
                  value={form.interactions}
                  onChange={(e) => updateForm("interactions", e.target.value)}
                  placeholder="أدخل التداخلات الدوائية المعروفة والموثقة"
                />
              </div>

              <div className="med-form-field">
                <label>الاحتياطات الإضافية</label>
                <textarea
                  value={form.precautions}
                  onChange={(e) => updateForm("precautions", e.target.value)}
                  placeholder="أدخل الاحتياطات الإضافية من مصدر موثوق"
                />
              </div>

              <div className="med-form-field">
                <label>معلومات الحمل</label>
                <textarea
                  value={form.pregnancyInfo}
                  onChange={(e) => updateForm("pregnancyInfo", e.target.value)}
                  placeholder="معلومات الحمل كما وردت في النشرة الرسمية"
                />
              </div>

              <div className="med-form-field">
                <label>معلومات الرضاعة الطبيعية</label>
                <textarea
                  value={form.breastfeedingInfo}
                  onChange={(e) => updateForm("breastfeedingInfo", e.target.value)}
                  placeholder="معلومات الرضاعة الطبيعية من مصدر موثوق"
                />
              </div>

              <div className="med-form-field">
                <label>ظروف التخزين</label>
                <textarea
                  value={form.storageInfo}
                  onChange={(e) => updateForm("storageInfo", e.target.value)}
                  placeholder="شروط الحفظ والتخزين حسب نشرة المنتج"
                />
              </div>

              <div className="med-form-field">
                <label>معلومات الجرعة الزائدة</label>
                <textarea
                  value={form.overdoseInfo}
                  onChange={(e) => updateForm("overdoseInfo", e.target.value)}
                  placeholder="علامات الجرعة الزائدة والتصرف الموصى به وفق النشرة الرسمية"
                />
              </div>

              <div className="med-form-field">
                <label>المراجع الطبية</label>
                <textarea
                  value={form.medicalReferences}
                  onChange={(e) => updateForm("medicalReferences", e.target.value)}
                  placeholder={"اسم المرجع أو النشرة الرسمية\nرابط المصدر إن وجد"}
                />
                <p className="med-form-hint">
                  يمكن إدخال أكثر من مرجع، كل مرجع في سطر مستقل.
                </p>
              </div>

              {formError && (
                <div className="med-form-error">
                  <AlertTriangle size={16} />
                  {formError}
                </div>
              )}

              <button className="med-save-button" onClick={addMedicine}>
                <Save size={19} />
                حفظ الدواء في قاعدة البيانات
              </button>

              <button
                className="med-cancel-button"
                onClick={() => {
                  setShowAddForm(false);
                  setForm(emptyForm);
                  setFormError("");
                }}
              >
                إلغاء
              </button>
            </div>
          )}
        </section>

        {selectedGlobal ? (
          <section className="med-panel">
            <div className="med-detail-head">
              <div className="med-pill-icon global-icon">
                <Globe size={24} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h2>
                  {selectedGlobal.arabicName || selectedGlobal.name}
                </h2>

                {selectedGlobal.arabicName && (
                  <p dir="ltr">{selectedGlobal.name}</p>
                )}

                <p>نتيجة من قاعدة RxNorm العالمية</p>
              </div>

              <button
                onClick={() => setSelectedGlobal(null)}
                className="med-close"
                aria-label="إغلاق التفاصيل"
              >
                <X size={21} />
              </button>
            </div>

            <div className="med-detail-section">
              <h3><Database size={18} /> رقم التعريف العالمي</h3>
              <p className="med-detail-text" dir="ltr">{selectedGlobal.rxcui}</p>
            </div>

            <div className="med-detail-section">
              <h3><Info size={18} /> الاسم الإنجليزي الأصلي</h3>
              <p className="med-detail-text" dir="ltr">
                {selectedGlobal.name}
              </p>
            </div>

            <div className="med-detail-section">
              <h3><Info size={18} /> الاسم البديل</h3>
              <p className="med-detail-text">
                {selectedGlobal.synonym || "لا توجد معلومات عن اسم بديل في النتيجة."}
              </p>
            </div>

            <div className="med-detail-section">
              <h3><Package size={18} /> نوع السجل</h3>
              <p className="med-detail-text" dir="ltr">
                {selectedGlobal.type || "غير محدد"}
              </p>
            </div>

            <div className="med-detail-section">
              <h3><Globe size={18} /> مصدر المعلومات</h3>
              <p className="med-detail-text">{selectedGlobal.source}</p>
            </div>

            <div className="med-detail-section">
              <h3><Activity size={18} /> تاريخ جلب البيانات</h3>
              <p className="med-detail-text" dir="ltr">
                {new Date(selectedGlobal.fetchedAt).toLocaleString()}
              </p>
            </div>

            <div className="med-warning">
              <AlertTriangle size={20} />
              <span>
                هذه النتيجة تعريفية من قاعدة RxNorm وليست نشرة دوائية كاملة.
                لا تتضمن هذه النتيجة وحدها جميع الاستعمالات أو التحذيرات
                أو الجرعات أو التداخلات. يجب الرجوع إلى النشرة الرسمية
                والجهات الصحية المختصة قبل اتخاذ أي قرار علاجي.
              </span>
            </div>
          </section>
        ) : selected ? (
          <section className="med-panel">
            <div className="med-detail-head">
              <div className="med-pill-icon">
                <Pill size={24} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h2>{selected.name}</h2>
                <p>{selected.english} · {selected.category}</p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="med-close"
                aria-label="إغلاق التفاصيل"
              >
                <X size={21} />
              </button>
            </div>

            <div className="med-detail-section">
              <h3><FlaskConical size={18} /> المادة الفعالة</h3>
              <p className="med-detail-text">{selected.activeIngredient}</p>
            </div>

            {selected.brandNames && selected.brandNames.length > 0 && (
              <div className="med-detail-section">
                <h3><Package size={18} /> الأسماء التجارية</h3>
                <div className="med-info-list">
                  {selected.brandNames.map((item, i) => (
                    <span className="med-info-chip" key={i}>{item}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="med-detail-section">
              <h3><Package size={18} /> الأشكال الدوائية</h3>
              <div className="med-info-list">
                {selected.forms.map((item, i) => (
                  <span className="med-info-chip" key={i}>{item}</span>
                ))}
              </div>
            </div>

            <div className="med-detail-section">
              <h3><Pill size={18} /> التركيزات الشائعة</h3>
              <div className="med-info-list">
                {selected.strengths.map((item, i) => (
                  <span className="med-info-chip" key={i}>{item}</span>
                ))}
              </div>
            </div>

            <div className="med-detail-section">
              <h3><Stethoscope size={18} /> الاستخدامات الطبية</h3>
              <ul>
                {selected.uses.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>

            <div className="med-detail-section">
              <h3><AlertTriangle size={18} /> التحذيرات والاحتياطات</h3>
              <ul>
                {selected.warnings.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>

            
{renderExtraList(
  "الآثار الجانبية",
  selected.sideEffects,
  <AlertTriangle size={18} />
)}

{renderExtraList(
  "موانع الاستعمال",
  selected.contraindications,
  <Info size={18} />
)}

{renderExtraList(
  "التداخلات الدوائية",
  selected.interactions,
  <FlaskConical size={18} />
)}

{renderExtraList(
  "الاحتياطات الإضافية",
  selected.precautions,
  <AlertTriangle size={18} />
)}

{renderExtraText(
  "معلومات العمر",
  selected.ageInfo,
  <Activity size={18} />
)}

{renderExtraText(
  "ملاحظات الاستعمال",
  selected.usageNotes,
  <BookOpen size={18} />
)}

{renderExtraText(
  "معلومات الحمل",
  selected.pregnancyInfo,
  <Info size={18} />
)}

{renderExtraText(
  "معلومات الرضاعة الطبيعية",
  selected.breastfeedingInfo,
  <Info size={18} />
)}

{renderExtraText(
  "ظروف التخزين",
  selected.storageInfo,
  <Package size={18} />
)}

{renderExtraText(
  "معلومات الجرعة الزائدة",
  selected.overdoseInfo,
  <AlertTriangle size={18} />
)}

{renderExtraList(
  "المراجع الطبية",
  selected.medicalReferences,
  <BookOpen size={18} />
)}

<div className="med-warning">
  <AlertTriangle size={20} />
  <span>
    المعلومات الواردة في هذا التطبيق للتثقيف والتعريف بالأدوية فقط،
    ولا تغني عن النشرة الرسمية أو استشارة الطبيب أو الصيدلي.
    لا تعتمد على التطبيق وحده لاتخاذ قرارات علاجية أو تحديد الجرعات.
  </span>
</div>
</section>
) : null}

{!selected && !selectedGlobal && search.trim() && (
  <section className="med-panel">
    <div className="med-result-title">
      <h2>نتائج البحث المحلي</h2>
      <span className="med-count">{results.length} نتيجة</span>
    </div>

    {results.length > 0 ? (
      renderMedicineList(results)
    ) : (
      <div className="med-empty">
        <Search size={30} />
        <p>لا توجد نتائج مطابقة في قاعدة الأدوية المحلية.</p>
        <p>يمكنك تجربة البحث العالمي.</p>
      </div>
    )}
  </section>
)}

{globalSearched && !selectedGlobal && (
  <section className="med-panel">
    <div className="med-result-title">
      <h2>نتائج البحث العالمي</h2>
      <span className="med-count">{globalResults.length} نتيجة</span>
    </div>

    {globalLoading ? (
      <div className="med-loading">
        <Loader2 size={20} />
        جارٍ تحميل النتائج...
      </div>
    ) : globalResults.length > 0 ? (
      renderGlobalList(globalResults)
    ) : (
      <div className="med-empty">
        <Globe size={30} />
        <p>لا توجد نتائج عالمية لعرضها.</p>
      </div>
    )}

    {globalError && (
      <div className="med-status error">
        <AlertTriangle size={17} />
        {" "}{globalError}
      </div>
    )}

    <p className="med-form-hint">
      مصدر البحث العالمي هو RxNorm التابع للمكتبة الوطنية الأمريكية للطب.
      قد تكون النتائج باللغة الإنجليزية، ولا تمثل نشرة دوائية كاملة.
    </p>
  </section>
)}

<footer className="med-footer">
  <p>
    الموسوعة الدوائية العالمية – World Drug Encyclopedia
  </p>
  <p>
    المعلومات للتثقيف الدوائي فقط، ويجب مراجعة المصادر الطبية الرسمية.
  </p>
</footer>
</main>
</div>
);
}

