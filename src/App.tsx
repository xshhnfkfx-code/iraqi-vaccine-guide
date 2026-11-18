import { useEffect, useMemo, useState } from "react";
import {
  Search, Pill, Wifi, WifiOff, AlertTriangle,
  ShieldCheck, HeartPulse, Info, X, ChevronLeft,
  Activity, Stethoscope, BookOpen, RotateCcw
} from "lucide-react";

type Medicine = {
  id: number;
  name: string;
  english: string;
  category: string;
  uses: string[];
  warnings: string[];
  ageInfo: string;
};

const medicines: Medicine[] = [
  {
    id: 1,
    name: "باراسيتامول",
    english: "Paracetamol",
    category: "مسكن وخافض حرارة",
    uses: [
      "تخفيف الألم الخفيف والمتوسط",
      "خفض درجة حرارة الجسم",
      "تخفيف الصداع وآلام الأسنان"
    ],
    warnings: [
      "الحذر عند وجود أمراض الكبد",
      "تجنب الجمع بين عدة أدوية تحتوي على باراسيتامول",
      "الجرعة الزائدة قد تسبب تلفاً خطيراً للكبد"
    ],
    ageInfo: "يستخدم للأطفال والبالغين وفق الجرعة المناسبة للعمر والوزن والتركيز."
  },
  {
    id: 2,
    name: "إيبوبروفين",
    english: "Ibuprofen",
    category: "مسكن ومضاد التهاب",
    uses: [
      "تخفيف الألم",
      "خفض الحرارة",
      "تخفيف الالتهابات وآلام المفاصل"
    ],
    warnings: [
      "قد يسبب تهيج المعدة أو النزيف المعدي",
      "يحتاج إلى الحذر عند مرضى الكلى",
      "غير مناسب لبعض حالات القرحة والجفاف",
      "يُتجنب خلال الحمل في مراحل معينة ويحتاج إلى استشارة طبية"
    ],
    ageInfo: "تختلف إمكانية استخدامه للأطفال حسب العمر والتركيبة الدوائية."
  },
  {
    id: 3,
    name: "أموكسيسيلين",
    english: "Amoxicillin",
    category: "مضاد حيوي",
    uses: [
      "علاج بعض الالتهابات البكتيرية",
      "بعض التهابات الأذن",
      "بعض التهابات الجهاز التنفسي",
      "بعض التهابات المسالك البولية"
    ],
    warnings: [
      "لا يعالج الالتهابات الفيروسية",
      "يُمنع عند وجود حساسية من البنسلين",
      "يجب استخدامه بوصفة طبية",
      "لا يجوز استخدامه دون تحديد نوع العدوى"
    ],
    ageInfo: "يمكن استخدام بعض أشكاله للأطفال، وتحدد الجرعة حسب الوزن ونوع العدوى."
  },
  {
    id: 4,
    name: "سيتريزين",
    english: "Cetirizine",
    category: "مضاد للحساسية",
    uses: [
      "تخفيف أعراض حساسية الأنف",
      "العطاس وسيلان الأنف",
      "الحكة الجلدية",
      "الشرى والحساسية الجلدية"
    ],
    warnings: [
      "قد يسبب النعاس لدى بعض الأشخاص",
      "الحذر عند وجود أمراض الكلى",
      "يجب الانتباه إلى العمر والتركيز الدوائي"
    ],
    ageInfo: "توجد مستحضرات مناسبة لبعض أعمار الأطفال، ويجب التأكد من العمر والتركيز."
  },
  {
    id: 5,
    name: "أوميبرازول",
    english: "Omeprazole",
    category: "أدوية المعدة",
    uses: [
      "علاج ارتجاع المريء",
      "علاج قرحة المعدة والاثني عشر",
      "تقليل إفراز حمض المعدة",
      "بعض حالات التهاب المريء"
    ],
    warnings: [
      "يجب تقييم الأعراض المستمرة أو الشديدة طبياً",
      "قد تحدث تداخلات مع بعض الأدوية",
      "لا يُستخدم لفترات طويلة دون مراجعة طبية"
    ],
    ageInfo: "يعتمد استخدامه للأطفال على التشخيص والعمر والتركيبة."
  },
  {
    id: 6,
    name: "سالبوتامول",
    english: "Salbutamol",
    category: "أدوية الجهاز التنفسي",
    uses: [
      "تخفيف تشنج القصبات الهوائية",
      "تخفيف الأزيز وضيق التنفس في حالات معينة",
      "علاج أعراض الربو وفق الخطة العلاجية"
    ],
    warnings: [
      "زيادة الحاجة إليه قد تدل على عدم السيطرة على الربو",
      "قد يسبب خفقان القلب ورعشة",
      "ضيق التنفس الشديد يحتاج إلى تقييم طبي عاجل"
    ],
    ageInfo: "توجد أشكال مختلفة للأطفال والبالغين، ويحدد الطبيب طريقة الاستخدام."
  }
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F]/g, "")
    .trim();
}

export default function App() {
  const [search, setSearch] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [selected, setSelected] = useState<Medicine | null>(null);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : false
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

  const results = useMemo(() => {
    const query = normalize(search);
    if (!query) return [];

    return medicines.filter((medicine) =>
      normalize(
        medicine.name + " " +
        medicine.english + " " +
        medicine.category
      ).includes(query)
    );
  }, [search]);

  function reset() {
    setSearch("");
    setAge("");
    setWeight("");
    setSelected(null);
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
        .med-brand strong { display:block; font-size:19px; }
        .med-brand small { opacity:.8; display:block; margin-top:5px; }
        .med-connection {
          display:flex;
          align-items:center;
          gap:5px;
          background:rgba(255,255,255,.16);
          padding:8px 10px;
          border-radius:20px;
          font-size:12px;
          white-space:nowrap;
        }
        .med-intro { margin-top:30px; }
        .med-intro h1 { font-size:25px; margin:0 0 9px; }
        .med-intro p { font-size:14px; line-height:1.8; opacity:.9; margin:0; }
        .med-container {
          max-width:850px;
          margin:-17px auto 0;
          padding:0 14px;
        }
        .med-panel {
          background:white;
          border:1px solid #e7edf4;
          border-radius:17px;
          padding:18px;
          margin-bottom:16px;
          box-shadow:0 4px 18px rgba(22,49,78,.045);
        }
        .med-panel h2 { font-size:17px; margin:0 0 7px; }
        .med-subtitle { color:#77869a; font-size:13px; line-height:1.7; margin:0 0 17px; }
        .med-label {
          display:block;
          font-size:14px;
          font-weight:bold;
          margin:14px 0 8px;
        }
        .med-input-wrap {
          display:flex;
          align-items:center;
          gap:10px;
          border:1px solid #dce5ef;
          background:#fafcff;
          border-radius:11px;
          padding:0 12px;
          min-height:49px;
        }
        .med-input-wrap:focus-within {
          border-color:#1684bd;
          box-shadow:0 0 0 3px rgba(22,132,189,.09);
        }
        .med-input-wrap svg { color:#1684bd; flex-shrink:0; }
        .med-input-wrap input {
          width:100%;
          border:0;
          outline:0;
          background:transparent;
          color:#172b45;
          min-width:0;
          padding:13px 0;
        }
        .med-fields {
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:12px;
        }
        .med-search-button {
          width:100%;
          border:0;
          border-radius:11px;
          padding:14px;
          margin-top:17px;
          color:white;
          background:#0878b4;
          font-weight:bold;
          cursor:pointer;
        }
        .med-reset {
          display:flex;
          align-items:center;
          justify-content:center;
          gap:7px;
          border:0;
          background:transparent;
          color:#66788e;
          padding:13px;
          margin:0 auto;
          cursor:pointer;
        }
        .med-result-title {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
          margin-bottom:13px;
        }
        .med-result-title h2 { margin:0; font-size:17px; }
        .med-count {
          color:#0878b4;
          background:#eaf5fc;
          padding:5px 10px;
          border-radius:20px;
          font-size:12px;
        }
        .med-result {
          display:flex;
          align-items:center;
          gap:12px;
          padding:14px 0;
          border-bottom:1px solid #edf1f5;
        }
        .med-result:last-child { border-bottom:0; }
        .med-pill-icon {
          width:43px;
          height:43px;
          border-radius:13px;
          background:#eaf5fc;
          color:#0878b4;
          display:grid;
          place-items:center;
          flex-shrink:0;
        }
        .med-result-info { flex:1; min-width:0; }
        .med-result-info strong { display:block; font-size:15px; }
        .med-result-info small { color:#7b899b; display:block; margin-top:5px; }
        .med-open {
          background:#edf6fc;
          border:0;
          color:#0878b4;
          border-radius:9px;
          padding:9px;
          display:flex;
          align-items:center;
          gap:3px;
          cursor:pointer;
          font-size:12px;
        }
        .med-detail-head {
          display:flex;
          align-items:center;
          gap:12px;
          margin-bottom:17px;
        }
        .med-detail-head h2 { margin:0; }
        .med-detail-head p { color:#77869a; font-size:13px; margin:6px 0 0; }
        .med-detail-section {
          border-top:1px solid #edf1f5;
          padding:15px 0;
        }
        .med-detail-section h3 {
          font-size:15px;
          margin:0 0 10px;
          display:flex;
          align-items:center;
          gap:7px;
        }
        .med-detail-section ul {
          margin:0;
          padding-right:22px;
          color:#4f6177;
          line-height:2;
          font-size:14px;
        }
        .med-warning {
          background:#fff8e9;
          border:1px solid #f3e4bd;
          border-radius:12px;
          padding:13px;
          color:#775a20;
          font-size:13px;
          line-height:1.9;
          display:flex;
          gap:9px;
        }
        .med-note {
          background:#eaf5fc;
          border-radius:12px;
          padding:13px;
          color:#285c7c;
          font-size:13px;
          line-height:1.9;
        }
        .med-empty {
          text-align:center;
          padding:28px 12px;
          color:#8190a3;
        }
        .med-empty svg { margin-bottom:10px; color:#1684bd; }
        .med-footer {
          text-align:center;
          color:#8794a5;
          font-size:12px;
          padding:15px;
          line-height:1.8;
        }
        @media(max-width:520px) {
          .med-fields { grid-template-columns:1fr; gap:0; }
          .med-brand strong { font-size:16px; }
          .med-intro h1 { font-size:22px; }
          .med-panel { padding:15px; }
          .med-open span { display:none; }
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
            ابحث عن العلاج واعرف استخداماته ومعلوماته
            والتحذيرات المتعلقة به.
          </p>
        </div>
      </header>

      <main className="med-container">
        <section className="med-panel">
          <h2>البحث عن دواء</h2>
          <p className="med-subtitle">
            اكتب الاسم التجاري أو العلمي بالعربية أو الإنجليزية.
          </p>

          <label className="med-label">اسم العلاج</label>
          <div className="med-input-wrap">
            <Search size={20} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="مثال: Paracetamol أو باراسيتامول"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelected(null);
                }}
                style={{border:0,background:"transparent",color:"#718096"}}
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
            <Search size={17} style={{verticalAlign:"middle",marginLeft:7}} />
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
              <div style={{flex:1}}>
                <h2>{selected.name}</h2>
                <p>{selected.english} · {selected.category}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{border:0,background:"transparent",color:"#718096"}}
                aria-label="إغلاق التفاصيل"
              >
                <X size={21} />
              </button>
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

            <div className="med-detail-section">
              <h3><Activity size={18} /> معلومات العمر</h3>
              <p style={{fontSize:14,lineHeight:1.9,color:"#52647a"}}>
                {selected.ageInfo}
              </p>
              {age !== "" && (
                <p style={{fontSize:13,color:"#52647a"}}>
                  العمر المدخل: {age} سنة
                  {weight ? ` · الوزن: ${weight} كغم` : ""}
                </p>
              )}
            </div>

            <div className="med-warning">
              <AlertTriangle size={20} />
              <span>
                لا يمكن تحديد جرعة آمنة من الاسم والعمر وحدهما.
                يجب مراعاة الوزن والتركيز والشكل الدوائي والتشخيص
                والحالة الصحية. لا تستخدم هذه المعلومات بديلاً عن
                وصف الطبيب أو الصيدلي.
              </span>
            </div>
          </section>
        ) : search.trim() ? (
          <section className="med-panel">
            <div className="med-result-title">
              <h2>نتائج البحث</h2>
              <span className="med-count">{results.length} نتيجة</span>
            </div>

            {results.length > 0 ? (
              results.map((medicine) => (
                <article className="med-result" key={medicine.id}>
                  <div className="med-pill-icon">
                    <Pill size={21} />
                  </div>
                  <div className="med-result-info">
                    <strong>{medicine.name}</strong>
                    <small>{medicine.english} · {medicine.category}</small>
                  </div>
                  <button
                    className="med-open"
                    onClick={() => setSelected(medicine)}
                  >
                    <span>التفاصيل</span>
                    <ChevronLeft size={16} />
                  </button>
                </article>
              ))
            ) : (
              <div className="med-empty">
                <Search size={30} />
                <p>لم نعثر على الدواء في قاعدة البيانات المحلية.</p>
                <small>
                  {online
                    ? "يمكن إضافة البحث الدوائي عبر الإنترنت في مرحلة ربط المصادر."
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
              <p>اكتب اسم الدواء في مربع البحث لعرض المعلومات المتاحة.</p>
            </div>
          </section>
        )}

        <section className="med-note" style={{marginBottom:15}}>
          <ShieldCheck size={19} style={{verticalAlign:"middle",marginLeft:7}} />
          المعلومات المعروضة إرشادية. هذه النسخة تحتوي على بيانات
          أولية محدودة، وستتم إضافة قاعدة أدوية موسعة ومراجعة
          وربط مصادر الإنترنت في المراحل التالية.
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
