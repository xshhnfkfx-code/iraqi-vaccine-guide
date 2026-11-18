import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Pill, Wifi, WifiOff, AlertTriangle, ShieldCheck,
  HeartPulse, X, ChevronLeft, Activity, Stethoscope,
  BookOpen, RotateCcw, Database, Camera, ImagePlus,
  ScanSearch, Loader2, FlaskConical, Package, Info
} from "lucide-react";

import { medicines } from "./data/medicineDatabase";
import type { Medicine } from "./data/medicineDatabase";
import { createWorker } from "tesseract.js";

export default function App() {
  const [search, setSearch] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [selected, setSelected] = useState<Medicine | null>(null);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : false
  );

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [scanText, setScanText] = useState("");
  const [scanMatches, setScanMatches] = useState<Medicine[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

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

  const results = useMemo(() => {
    const query = normalize(search);
    if (!query) return [];

    return medicines.filter((medicine) => {
      const searchableText = [
        medicine.name,
        medicine.english,
        medicine.category,
        medicine.activeIngredient,
        ...medicine.forms,
        ...medicine.strengths,
        ...medicine.uses,
        ...medicine.warnings
      ].join(" ");

      return normalize(searchableText).includes(query);
    });
  }, [search]);

  function reset() {
    setSearch("");
    setAge("");
    setWeight("");
    setSelected(null);
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

    return medicines.filter((medicine) => {
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
            "تمت قراءة النص، لكن لم نجد اسماً مطابقاً في قاعدة الأدوية المحلية. يمكنك البحث يدوياً بالاسم."
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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

        button, input { font: inherit; }
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

        .med-search-button {
          width: 100%;
          border: 0;
          border-radius: 11px;
          padding: 14px;
          margin-top: 17px;
          color: white;
          background: #0878b4;
          font-weight: bold;
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

        .med-result-info {
          flex: 1;
          min-width: 0;
        }

        .med-result-info strong {
          display: block;
          font-size: 15px;
        }

        .med-result-info small {
          color: #7b899b;
          display: block;
          margin-top: 5px;
        }

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

        .med-note {
          background: #eaf5fc;
          border-radius: 12px;
          padding: 13px;
          color: #285c7c;
          font-size: 13px;
          line-height: 1.9;
        }

        .med-empty {
          text-align: center;
          padding: 28px 12px;
          color: #8190a3;
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

        .med-photo-button:active {
          background: #e5f2fb;
        }

        .med-preview {
          width: 100%;
          max-height: 280px;
          object-fit: contain;
          border-radius: 12px;
          background: #f1f4f8;
          margin-top: 15px;
        }

        .med-scan-button {
          width: 100%;
          border: 0;
          border-radius: 11px;
          padding: 14px;
          margin-top: 13px;
          color: white;
          background: #0878b4;
          font-weight: bold;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .med-scan-button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .med-scan-error {
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
              <strong>دليل الأدوية الشامل</strong>
              <small>Medicine Guide</small>
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
            ابحث عن العلاج أو التقط صورة لعلبته لمعرفة المعلومات المتاحة.
          </p>
        </div>
      </header>

      <main className="med-container">

        <section className="med-panel">
          <h2>
            <ScanSearch
              size={20}
              style={{ verticalAlign: "middle", marginLeft: 7 }}
            />
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
              <AlertTriangle
                size={17}
                style={{ verticalAlign: "middle", marginLeft: 5 }}
              />
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
                <h2>الأدوية المطابقة</h2>
                <span className="med-count">
                  {scanMatches.length} نتيجة
                </span>
              </div>

              {scanMatches.map((medicine) => (
                <article className="med-result" key={medicine.id}>
                  <div className="med-pill-icon">
                    <Pill size={21} />
                  </div>

                  <div className="med-result-info">
                    <strong>{medicine.name}</strong>
                    <small>
                      {medicine.english} · {medicine.category}
                    </small>
                  </div>

                  <button
                    className="med-open"
                    onClick={() => openMedicine(medicine)}
                  >
                    <span>التفاصيل</span>
                    <ChevronLeft size={16} />
                  </button>
                </article>
              ))}
            </div>
          )}

          <p className="med-subtitle" style={{ marginTop: 14, marginBottom: 0 }}>
            قراءة الصور تعتمد على وضوح الصورة وملفات اللغة المتاحة.
            قد لا يتعرف التطبيق على بعض الأسماء أو التركيبات.
          </p>
        </section>

        <section className="med-panel">
          <h2>البحث عن دواء</h2>

          <p className="med-subtitle">
            اكتب الاسم التجاري أو العلمي أو المادة الفعالة أو الشكل الدوائي.
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
              }}
              placeholder="مثال: Paracetamol أو باراسيتامول"
            />

            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelected(null);
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
            onClick={() => setSelected(null)}
          >
            <Search
              size={17}
              style={{ verticalAlign: "middle", marginLeft: 7 }}
            />
            عرض نتائج البحث
          </button>

          <button className="med-reset" onClick={reset}>
            <RotateCcw size={15} />
            مسح البيانات
          </button>
        </section>

        {selected ? (
          <section className="med-panel">
            <div className="med-detail-head">
              <div className="med-pill-icon">
                <Pill size={24} />
              </div>

              <div style={{ flex: 1 }}>
                <h2>{selected.name}</h2>
                <p>
                  {selected.english} · {selected.category}
                </p>
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
              <h3>
                <FlaskConical size={18} />
                المادة الفعالة
              </h3>
              <p className="med-detail-text">
                {selected.activeIngredient}
              </p>
            </div>

            <div className="med-detail-section">
              <h3>
                <Package size={18} />
                الأشكال الدوائية
              </h3>
              <div className="med-info-list">
                {selected.forms.map((item, i) => (
                  <span className="med-info-chip" key={i}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="med-detail-section">
              <h3>
                <Pill size={18} />
                التركيزات الشائعة
              </h3>
              <div className="med-info-list">
                {selected.strengths.map((item, i) => (
                  <span className="med-info-chip" key={i}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="med-detail-section">
              <h3>
                <Stethoscope size={18} />
                الاستخدامات الطبية
              </h3>
              <ul>
                {selected.uses.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="med-detail-section">
              <h3>
                <AlertTriangle size={18} />
                التحذيرات والاحتياطات
              </h3>
              <ul>
                {selected.warnings.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="med-detail-section">
              <h3>
                <Info size={18} />
                ملاحظات الاستعمال
              </h3>
              <p className="med-detail-text">
                {selected.usageNotes}
              </p>
            </div>

            <div className="med-detail-section">
              <h3>
                <Activity size={18} />
                معلومات العمر
              </h3>

              <p className="med-detail-text">
                {selected.ageInfo}
              </p>

              {age !== "" && (
                <p style={{
                  fontSize: 13,
                  color: "#52647a",
                  marginTop: 10
                }}>
                  العمر المدخل: {age} سنة
                  {weight ? ` · الوزن: ${weight} كغم` : ""}
                </p>
              )}
            </div>

            <div className="med-warning">
              <AlertTriangle size={20} />
              <span>
                التركيزات المعروضة أمثلة شائعة وليست قائمة كاملة.
                يجب التحقق من المادة الفعالة والتركيز والشكل الدوائي
                على العبوة والنشرة. لا يمكن تحديد جرعة آمنة من هذه
                المعلومات وحدها؛ ويجب مراعاة العمر والوزن والتشخيص
                والحالة الصحية وتوجيه الطبيب أو الصيدلي.
              </span>
            </div>
          </section>
        ) : search.trim() ? (
          <section className="med-panel">
            <div className="med-result-title">
              <h2>نتائج البحث</h2>
              <span className="med-count">
                {results.length} نتيجة
              </span>
            </div>

            {results.length > 0 ? (
              results.map((medicine) => (
                <article className="med-result" key={medicine.id}>
                  <div className="med-pill-icon">
                    <Pill size={21} />
                  </div>

                  <div className="med-result-info">
                    <strong>{medicine.name}</strong>
                    <small>
                      {medicine.english} · {medicine.category}
                    </small>
                  </div>

                  <button
                    className="med-open"
                    onClick={() => openMedicine(medicine)}
                  >
                    <span>التفاصيل</span>
                    <ChevronLeft size={16} />
                  </button>
                </article>
              ))
            ) : (
              <div className="med-empty">
                <Search size={30} />
                <p>
                  لم نعثر على الدواء في قاعدة البيانات المحلية.
                </p>
                <small>
                  {online
                    ? "يمكن إضافة مصادر دوائية عبر الإنترنت في مرحلة لاحقة."
                    : "اتصل بالإنترنت أو أضف الدواء إلى قاعدة البيانات المحلية عند توفر معلومات موثوقة."}
                </small>
              </div>
            )}
          </section>
        ) : (
          <section className="med-panel">
            <div className="med-empty">
              <BookOpen size={35} />
              <h2>ابدأ البحث عن علاج</h2>
              <p>
                اكتب اسم الدواء أو استخدم ميزة التصوير.
              </p>
            </div>
          </section>
        )}

        <section className="med-note" style={{ marginBottom: 15 }}>
          <ShieldCheck
            size={19}
            style={{ verticalAlign: "middle", marginLeft: 7 }}
          />
          المعلومات المعروضة إرشادية. هذه النسخة تحتوي على قاعدة
          أولية محدودة، ولا يجوز الاعتماد على التعرف بالصورة وحده
          لتحديد دواء أو جرعته.
        </section>

        <section className="med-panel">
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10
          }}>
            <Database size={20} color="#0878b4" />
            <div>
              <strong>قاعدة الأدوية المحلية</strong>
              <p style={{
                margin: "5px 0 0",
                color: "#77869a",
                fontSize: 13
              }}>
                عدد الأدوية المسجلة: {medicines.length}
              </p>
            </div>
          </div>
        </section>

        <footer className="med-footer">
          دليل الأدوية الشامل © {new Date().getFullYear()}
          <br />
          مرجع معلوماتي وليس بديلاً عن الاستشارة الطبية.
        </footer>
      </main>
    </div>
  );
}
