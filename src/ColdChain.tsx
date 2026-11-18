import { useEffect, useState } from "react";
import {
  Snowflake,
  Plus,
  Thermometer,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  Refrigerator,
  Zap,
  FlaskConical,
  ChevronDown,
  ShieldCheck,
  ThermometerSun
} from "lucide-react";

import {
  getAllLocalRecords,
  saveLocalRecord,
  deleteLocalRecord
} from "./lib/db";

import type { LocalRecord } from "./types";

interface Fridge {
  id: string;
  name: string;
  location: string;
}

interface TemperatureReading {
  id: string;
  fridgeId: string;
  temperature: number;
  period: "صباحاً" | "مساءً";
  date: string;
  time: string;
}

const FRIDGE_TYPE = "cold-chain-fridge";
const READING_TYPE = "cold-chain-reading";

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function EducationalSection({
  icon,
  title,
  subtitle,
  children
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <details className="cold-guide-card">
      <summary className="cold-guide-summary">
        <div className="cold-guide-icon">{icon}</div>
        <div className="cold-guide-title">
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
        <ChevronDown className="cold-guide-chevron" size={20} />
      </summary>

      <div className="cold-guide-content">
        {children}
      </div>
    </details>
  );
}

export default function ColdChain() {
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [readings, setReadings] = useState<TemperatureReading[]>([]);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [selectedFridge, setSelectedFridge] = useState("");
  const [temperature, setTemperature] = useState("");
  const [period, setPeriod] = useState<"صباحاً" | "مساءً">("صباحاً");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const records = await getAllLocalRecords();

      setFridges(
        records
          .filter((record) => record.type === FRIDGE_TYPE)
          .map((record) => record.payload as Fridge)
      );

      setReadings(
        records
          .filter((record) => record.type === READING_TYPE)
          .map((record) => record.payload as TemperatureReading)
          .sort((a, b) =>
            `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)
          )
      );
    } catch {
      setMessage("تعذر تحميل البيانات المحلية.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function addFridge() {
    if (!name.trim() || !location.trim()) {
      setMessage("يرجى إدخال اسم الثلاجة وموقعها.");
      return;
    }

    const fridge: Fridge = {
      id: createId(),
      name: name.trim(),
      location: location.trim()
    };

    const record: LocalRecord = {
      id: fridge.id,
      type: FRIDGE_TYPE,
      payload: fridge,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: "pending"
    };

    try {
      await saveLocalRecord(record);
      setName("");
      setLocation("");
      setMessage("تم حفظ الثلاجة بنجاح.");
      await loadData();
    } catch {
      setMessage("لم يتم حفظ الثلاجة. حاول مرة أخرى.");
    }
  }

  async function addReading() {
    const value = Number(temperature);

    if (
      !selectedFridge ||
      temperature.trim() === "" ||
      !Number.isFinite(value) ||
      value < -50 ||
      value > 60
    ) {
      setMessage("اختر الثلاجة وأدخل درجة حرارة صحيحة.");
      return;
    }

    const now = new Date();

    const reading: TemperatureReading = {
      id: createId(),
      fridgeId: selectedFridge,
      temperature: value,
      period,
      date: today(),
      time: now.toLocaleTimeString("ar-IQ", {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    const record: LocalRecord = {
      id: reading.id,
      type: READING_TYPE,
      payload: reading,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      syncStatus: "pending"
    };

    try {
      await saveLocalRecord(record);
      setTemperature("");
      setMessage("تم حفظ قراءة درجة الحرارة.");
      await loadData();
    } catch {
      setMessage("تعذر حفظ القراءة.");
    }
  }

  async function removeFridge(id: string) {
    const hasReadings = readings.some(
      (item) => item.fridgeId === id
    );

    if (hasReadings) {
      setMessage("لا يمكن حذف ثلاجة لها قراءات محفوظة.");
      return;
    }

    if (!window.confirm("هل تريد حذف هذه الثلاجة؟")) return;

    try {
      await deleteLocalRecord(id);

      if (selectedFridge === id) {
        setSelectedFridge("");
      }

      setMessage("تم حذف الثلاجة.");
      await loadData();
    } catch {
      setMessage("تعذر حذف الثلاجة.");
    }
  }

  function fridgeName(id: string): string {
    return (
      fridges.find((fridge) => fridge.id === id)?.name ??
      "ثلاجة غير معروفة"
    );
  }

  function isNormal(value: number): boolean {
    return value >= 2 && value <= 8;
  }

  return (
    <section className="cold-chain-module">

      <div className="panel cold-chain-intro">
        <div className="cold-chain-icon">
          <Snowflake size={27} />
        </div>

        <div>
          <h2>إدارة سلسلة التبريد</h2>
          <p>
            تسجيل الثلاجات ومتابعة درجات الحرارة والدليل العملي للعاملين الصحيين.
          </p>
        </div>
      </div>

      {message && (
        <div className="children-message">
          {message}
        </div>
      )}

      {/* تسجيل الثلاجات */}

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>إضافة ثلاجة جديدة</h2>
            <p>سجل اسم الثلاجة وموقعها في المركز الصحي.</p>
          </div>
          <Snowflake size={22} />
        </div>

        <div className="cold-chain-fields">
          <label>
            اسم الثلاجة أو رقمها
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثال: ثلاجة اللقاحات 1"
            />
          </label>

          <label>
            الموقع أو اسم المركز
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="مثال: غرفة التلقيح"
            />
          </label>
        </div>

        <div className="form-actions">
          <button className="primary-button" onClick={addFridge}>
            <Plus size={16} />
            إضافة الثلاجة
          </button>
        </div>
      </div>

      {/* تسجيل درجات الحرارة */}

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>تسجيل درجة الحرارة</h2>
            <p>سجل القراءة الصباحية أو المسائية للثلاجة.</p>
          </div>
          <Thermometer size={22} />
        </div>

        <div className="cold-chain-fields">
          <label>
            اختر الثلاجة
            <select
              value={selectedFridge}
              onChange={(event) => setSelectedFridge(event.target.value)}
            >
              <option value="">اختر الثلاجة</option>

              {fridges.map((fridge) => (
                <option key={fridge.id} value={fridge.id}>
                  {fridge.name} - {fridge.location}
                </option>
              ))}
            </select>
          </label>

          <label>
            درجة الحرارة (°C)
            <input
              type="number"
              step="0.1"
              value={temperature}
              onChange={(event) => setTemperature(event.target.value)}
              placeholder="مثال: 5"
            />
          </label>

          <label>
            وقت القراءة
            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as "صباحاً" | "مساءً")
              }
            >
              <option value="صباحاً">صباحاً</option>
              <option value="مساءً">مساءً</option>
            </select>
          </label>
        </div>

        <div className="form-actions">
          <button
            className="primary-button"
            onClick={addReading}
            disabled={fridges.length === 0}
          >
            <Plus size={16} />
            حفظ القراءة
          </button>
        </div>

        {fridges.length === 0 && (
          <div className="notice-box">
            <AlertTriangle size={17} />
            أضف ثلاجة أولاً حتى تتمكن من تسجيل درجات الحرارة.
          </div>
        )}
      </div>

      {/* الثلاجات المسجلة */}

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>الثلاجات المسجلة</h2>
            <p>عدد الثلاجات: {fridges.length}</p>
          </div>
          <Snowflake size={22} />
        </div>

        {loading ? (
          <p>جارٍ تحميل البيانات...</p>
        ) : fridges.length === 0 ? (
          <div className="children-empty">
            <Snowflake size={30} />
            <strong>لا توجد ثلاجات مسجلة</strong>
            <span>ابدأ بإضافة أول ثلاجة.</span>
          </div>
        ) : (
          <div className="cold-chain-list">
            {fridges.map((fridge) => (
              <article className="cold-chain-card" key={fridge.id}>
                <div className="cold-chain-icon">
                  <Snowflake size={22} />
                </div>

                <div className="cold-chain-card-info">
                  <strong>{fridge.name}</strong>
                  <span>{fridge.location}</span>
                  <small>
                    {
                      readings.filter(
                        (item) => item.fridgeId === fridge.id
                      ).length
                    }{" "}
                    قراءة مسجلة
                  </small>
                </div>

                <button
                  className="icon-button"
                  onClick={() => removeFridge(fridge.id)}
                  aria-label="حذف الثلاجة"
                  title="حذف الثلاجة"
                >
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* سجل درجات الحرارة */}

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>سجل درجات الحرارة</h2>
            <p>آخر القراءات المسجلة على هذا الجهاز.</p>
          </div>
          <Clock size={22} />
        </div>

        {readings.length === 0 ? (
          <div className="children-empty">
            <Thermometer size={30} />
            <strong>لا توجد قراءات حتى الآن</strong>
            <span>ستظهر القراءات هنا بعد تسجيلها.</span>
          </div>
        ) : (
          <div className="cold-chain-list">
            {readings.map((reading) => (
              <article className="cold-chain-card" key={reading.id}>
                <div
                  className={`temperature-status ${
                    isNormal(reading.temperature)
                      ? "normal"
                      : "warning"
                  }`}
                >
                  {isNormal(reading.temperature) ? (
                    <CheckCircle2 size={21} />
                  ) : (
                    <AlertTriangle size={21} />
                  )}
                </div>

                <div className="cold-chain-card-info">
                  <strong>{fridgeName(reading.fridgeId)}</strong>

                  <span>
                    {reading.temperature} °C — {reading.period}
                  </span>

                  <small>
                    {reading.date} | {reading.time}
                  </small>

                  {!isNormal(reading.temperature) && (
                    <small className="temperature-warning-text">
                      القراءة خارج النطاق المعتاد (+2 إلى +8 °C).
                      اتبع إجراءات التعامل المعتمدة محلياً.
                    </small>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* الدليل العملي */}

      <div className="cold-guide-section">

        <div className="cold-guide-heading">
          <div className="cold-guide-main-icon">
            <BookOpen size={24} />
          </div>

          <div>
            <h2>الدليل العملي لسلسلة التبريد</h2>
            <p>
              معلومات وإرشادات للعاملين في وحدات التلقيح.
            </p>
          </div>
        </div>

        {/* الباب الأول */}

        <EducationalSection
          icon={<Refrigerator size={23} />}
          title="ترتيب اللقاحات داخل الثلاجة"
          subtitle="الثلاجات الأفقية والعمودية"
        >
          <h3>أولاً: الثلاجة الأفقية ذات الفتح العلوي</h3>

          <p>
            تُستخدم هذه الثلاجات في بعض مخازن اللقاحات ومراكز التلقيح،
            وتتميز باحتفاظها بالهواء البارد عند فتح الغطاء.
          </p>

          <ul>
            <li>
              استخدم السلال الأصلية المخصصة لحفظ اللقاحات داخل الثلاجة.
            </li>
            <li>
              ضع اللقاحات داخل السلال ولا تضعها مباشرة على أرضية الثلاجة
              أو ملاصقة للجدران الباردة.
            </li>
            <li>
              اترك فراغات مناسبة بين العبوات والسلال للسماح بحركة الهواء.
            </li>
            <li>
              لا تضع اللقاحات الحساسة للتجمّد في المناطق التي قد تتعرض
              لدرجات حرارة تحت الصفر.
            </li>
            <li>
              ضع جهاز قياس الحرارة في موضع مناسب قريب من اللقاحات
              وفق تعليمات الشركة المصنعة.
            </li>
            <li>
              اتبع خطوط التحميل والحدود الموضحة داخل الجهاز.
            </li>
          </ul>

          <div className="cold-guide-warning">
            <AlertTriangle size={19} />
            لا تفترض أن جميع الثلاجات الأفقية لها ترتيب داخلي واحد.
            يجب اتباع مخطط الشركة المصنعة ونوع الثلاجة.
          </div>

          <h3>ثانياً: الثلاجة العمودية ذات الباب الأمامي</h3>

          <p>
            يعتمد توزيع اللقاحات على تصميم الثلاجة ونظام التبريد
            وتعليمات الشركة المصنعة.
          </p>

          <ul>
            <li>
              لا تضع اللقاحات في رفوف الباب.
            </li>
            <li>
              أبعد اللقاحات الحساسة للتجمّد عن المبخر ومناطق التبريد المباشر.
            </li>
            <li>
              في النماذج التقليدية، توضع اللقاحات الحساسة للتجمّد
              في الرفوف المناسبة وفق مخطط التخزين المعتمد.
            </li>
            <li>
              توضع اللقاحات المجففة بالتجميد واللقاحات غير الحساسة
              للتجمّد في المواقع المحددة لها وفق دليل الجهاز.
            </li>
            <li>
              لا تضع اللقاحات أسفل الرف الأخير إذا كانت هذه المنطقة
              غير مخصصة للتخزين.
            </li>
            <li>
              اترك مسافات بين العبوات ولا تكدس اللقاحات بصورة تمنع
              دوران الهواء.
            </li>
          </ul>

          <h3>قواعد مهمة في جميع أنواع الثلاجات</h3>

          <ul>
            <li>حافظ على اللقاحات داخل عبواتها الأصلية لحمايتها من الضوء.</li>
            <li>رتب المخزون حسب مبدأ الأقرب انتهاءً يُستخدم أولاً.</li>
            <li>افصل اللقاحات المتشابهة في الاسم أو العبوة لتجنب الأخطاء.</li>
            <li>احفظ المذيبات مع اللقاحات المخصصة لها حسب تعليمات المنتج.</li>
            <li>لا تضع الطعام أو المشروبات داخل ثلاجة اللقاحات.</li>
            <li>لا تضبط منظم الحرارة عشوائياً.</li>
          </ul>

          <div className="cold-guide-note">
            يجب مراجعة مخطط التخزين الخاص بطراز الثلاجة؛ فبعض الثلاجات
            الحديثة لها تعليمات مختلفة عن الثلاجات التقليدية.
          </div>
        </EducationalSection>

        {/* الباب الثاني */}

        <EducationalSection
          icon={<Zap size={23} />}
          title="خطة الطوارئ عند انقطاع الكهرباء أو تعطل الثلاجة"
          subtitle="خطوات التعامل مع انقطاع التبريد"
        >
          <h3>عند انقطاع الكهرباء</h3>

          <ol>
            <li>
              لا تفتح باب الثلاجة أو غطاءها إلا عند الضرورة.
            </li>
            <li>
              سجل وقت انقطاع الكهرباء ودرجة الحرارة الحالية.
            </li>
            <li>
              راقب جهاز تسجيل الحرارة والحدين الأعلى والأدنى.
            </li>
            <li>
              أبلغ مسؤول سلسلة التبريد والمسؤول المباشر.
            </li>
            <li>
              شغّل مصدر الطاقة الاحتياطي إذا كان متوفراً وآمناً.
            </li>
            <li>
              جهّز صندوقاً ناقلاً للقاحات أو ثلاجة بديلة معتمدة
              إذا كان الانقطاع يهدد بقاء الحرارة ضمن الحدود المطلوبة.
            </li>
          </ol>

          <h3>عند تعطل الثلاجة</h3>

          <ol>
            <li>تحقق من مصدر الكهرباء والقابس دون العبث بالتوصيلات.</li>
            <li>تأكد من إغلاق الباب أو الغطاء بصورة صحيحة.</li>
            <li>لا تحاول إصلاح الأجزاء الكهربائية بنفسك.</li>
            <li>أبلغ فني الصيانة ومسؤول سلسلة التبريد.</li>
            <li>جهّز وسيلة نقل مناسبة إذا تعذر استمرار التخزين الآمن.</li>
          </ol>

          <h3>نقل اللقاحات إلى مكان بديل</h3>

          <ul>
            <li>
              استخدم صندوقاً ناقلاً أو حافظة لقاحات معتمدة ومجهزة
              بالطريقة الصحيحة.
            </li>
            <li>
              استخدم عبوات التبريد المهيأة وفق تعليمات النقل،
              واحمِ اللقاحات من ملامسة العبوات المجمدة مباشرة.
            </li>
            <li>
              راقب درجة الحرارة أثناء النقل.
            </li>
            <li>
              وثّق وقت النقل واسم الموقع البديل ودرجات الحرارة.
            </li>
          </ul>

          <h3>إذا تعرضت اللقاحات لدرجة حرارة خارج النطاق</h3>

          <ol>
            <li>
              لا تستخدم اللقاحات المتأثرة مؤقتاً.
            </li>
            <li>
              ضع علامة واضحة عليها: «لا تستخدم - بانتظار التقييم».
            </li>
            <li>
              افصلها عن المخزون الجاهز للاستخدام مع المحافظة
              على ظروف التخزين المناسبة.
            </li>
            <li>
              سجل نوع اللقاح ورقم التشغيلة والكمية ومدة التعرض
              والقراءات المسجلة.
            </li>
            <li>
              تواصل مع مسؤول البرنامج والجهة المختصة أو الشركة المصنعة
              لتحديد إمكانية الاستخدام.
            </li>
            <li>
              لا تتلف اللقاحات ولا تقرر صلاحيتها بنفسك قبل صدور
              التوجيه الرسمي.
            </li>
          </ol>

          <div className="cold-guide-warning">
            <AlertTriangle size={19} />
            لا توجد مدة واحدة آمنة لجميع الثلاجات عند انقطاع الكهرباء.
            تختلف مدة الاحتفاظ بالبرودة حسب نوع الجهاز ودرجة حرارة
            المحيط وحالة الثلاجة. اتبع بيانات الجهاز وخطة الطوارئ المحلية.
          </div>
        </EducationalSection>

        {/* الباب الثالث */}

        <EducationalSection
          icon={<FlaskConical size={23} />}
          title="اختبار الرج للقاحات (Shake Test)"
          subtitle="الكشف عن أضرار التجمّد في لقاحات محددة"
        >
          <h3>ما هو اختبار الرج؟</h3>

          <p>
            اختبار الرج هو اختبار مقارن يُستخدم للكشف عن الضرر الناتج
            عن التجمّد في بعض اللقاحات الممتزة على أملاح الألمنيوم.
            يؤدي التجمّد إلى تغير الترسب، وقد يصبح أسرع من ترسب
            اللقاح الذي لم يتعرض للتجمّد.
          </p>

          <h3>متى يُستخدم؟</h3>

          <ul>
            <li>عند وجود اشتباه بتعرض لقاح حساس للتجمّد لدرجة حرارة منخفضة.</li>
            <li>عند ظهور مؤشر التجمّد أو تفعّله وفق تعليمات الجهاز.</li>
            <li>عند وجود سجل حراري يشير إلى احتمال حدوث تجمّد.</li>
            <li>عند الاشتباه بتعرض القوارير للتجمّد أثناء التخزين أو النقل.</li>
          </ul>

          <h3>ما اللقاحات التي قد يشملها الاختبار؟</h3>

          <p>
            بعض اللقاحات الممتزة على الألمنيوم والحساسة للتجمّد،
            مثل بعض مستحضرات الخماسي والثلاثي والكزاز والتهاب الكبد B،
            بحسب تركيب المنتج وتعليمات البرنامج.
          </p>

          <div className="cold-guide-warning">
            <AlertTriangle size={19} />
            لا يُجرى اختبار الرج لجميع اللقاحات. ولا يُستخدم لتقييم
            أضرار الحرارة أو انتهاء الصلاحية أو سلامة أي لقاح بصورة عامة.
          </div>

          <h3>مبدأ الاختبار</h3>

          <p>
            تتم مقارنة قارورة مشتبه بتعرضها للتجمّد مع قارورة ضابطة
            مجمدة عمداً من اللقاح نفسه ومن الشركة المصنعة ورقم التشغيلة
            نفسه، وفق بروتوكول الاختبار المعتمد.
          </p>

          <h3>خطوات الاختبار وفق بروتوكول منظمة الصحة العالمية</h3>

          <ol>
            <li>
              تجهيز قارورة ضابطة من النوع والشركة ورقم التشغيلة نفسها.
            </li>
            <li>
              تجميد القارورة الضابطة حتى تصبح محتوياتها صلبة،
              وفق البروتوكول المعتمد.
            </li>
            <li>
              ترك القارورة لتذوب طبيعياً، وعدم تسخينها.
            </li>
            <li>
              اختيار قارورة الاختبار من اللقاح المشتبه بتعرضه للتجمّد.
            </li>
            <li>
              وضع علامة واضحة على القارورة الضابطة حتى لا تستخدم
              للتلقيح بالخطأ.
            </li>
            <li>
              رج القارورتين معاً بقوة لمدة 10 إلى 15 ثانية.
            </li>
            <li>
              وضع القارورتين بجانب بعضهما على سطح مستوٍ دون تحريكهما.
            </li>
            <li>
              مراقبة سرعة الترسب ومقارنة القارورتين مقابل مصدر ضوء مناسب.
            </li>
          </ol>

          <h3>كيفية قراءة نتيجة الاختبار</h3>

          <div className="cold-guide-result">
            <div className="cold-guide-result-icon success">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <strong>نتيجة اجتياز الاختبار</strong>
              <p>
                إذا كان ترسب قارورة الاختبار أبطأ بوضوح من القارورة
                الضابطة المجمدة، فهذا يشير إلى أنها على الأرجح
                لم تتضرر بالتجمّد.
              </p>
            </div>
          </div>

          <div className="cold-guide-result">
            <div className="cold-guide-result-icon warning">
              <AlertTriangle size={22} />
            </div>
            <div>
              <strong>نتيجة عدم اجتياز الاختبار</strong>
              <p>
                إذا كان الترسب متشابهاً أو أسرع في قارورة الاختبار
                مقارنة بالضابطة، فيُشتبه بحدوث ضرر بسبب التجمّد.
                يجب عزل اللقاح وإبلاغ المسؤول المختص.
              </p>
            </div>
          </div>

          <div className="cold-guide-warning">
            لا تُجرِ الاختبار دون تدريب وبروتوكول معتمد وإشراف مسؤول
            سلسلة التبريد. لا تستخدم القارورة الضابطة للتلقيح،
            ولا تتخذ قرار التخلص من المخزون دون موافقة الجهة المختصة.
          </div>
        </EducationalSection>

        {/* الباب الرابع */}

        <EducationalSection
          icon={<ThermometerSun size={23} />}
          title="كيفية قراءة المحرار ومتابعة درجة الحرارة"
          subtitle="المحرار الرقمي ومحرار الحدين الأعلى والأدنى"
        >
          <h3>أولاً: قراءة المحرار الرقمي</h3>

          <p>
            يعرض المحرار الرقمي درجة الحرارة بواسطة شاشة إلكترونية.
            وقد يعرض درجة الحرارة الحالية والحد الأعلى والحد الأدنى
            المسجلين منذ آخر إعادة ضبط.
          </p>

          <ul>
            <li>
              اقرأ الرقم المعروض بجانب مؤشر الحرارة الحالية (Current).
            </li>
            <li>
              اقرأ الحد الأعلى (MAX) لمعرفة أعلى درجة مسجلة.
            </li>
            <li>
              اقرأ الحد الأدنى (MIN) لمعرفة أقل درجة مسجلة.
            </li>
            <li>
              انتبه إلى علامة السالب (-) وعلامة الموجب (+).
            </li>
            <li>
              تأكد من أن الوحدة المعروضة هي الدرجة المئوية (°C).
            </li>
          </ul>

          <h3>ثانياً: قراءة محرار الحد الأعلى والأدنى</h3>

          <p>
            هذا النوع يحتفظ بأعلى وأدنى درجة حرارة وصل إليها
            منذ آخر عملية إعادة ضبط.
          </p>

          <ul>
            <li>سجل القراءة الحالية.</li>
            <li>سجل الحد الأعلى والحد الأدنى.</li>
            <li>دوّن التاريخ والوقت واسم الشخص الذي أخذ القراءة.</li>
            <li>
              أعد ضبط الذاكرة بعد تسجيل القراءات إذا كان الجهاز
              يتطلب ذلك، ووفق تعليمات الشركة المصنعة.
            </li>
          </ul>

          <h3>ثالثاً: كيفية قراءة علامة السالب والموجب</h3>

          <div className="cold-guide-example">
            <div>
              <strong>+5°C</strong>
              <span>خمس درجات فوق الصفر</span>
            </div>
            <div>
              <strong>-2°C</strong>
              <span>درجتان تحت الصفر</span>
            </div>
          </div>

          <h3>رابعاً: النطاق المعتاد لحفظ معظم اللقاحات المبردة</h3>

          <div className="cold-guide-temperature">
            <span>+2°C</span>
            <div className="cold-guide-temperature-line">
              <i />
            </div>
            <span>+8°C</span>
          </div>

          <p>
            النطاق المعتاد لمعظم اللقاحات المحفوظة في الثلاجة
            هو من +2 إلى +8 درجات مئوية، مع ضرورة مراجعة
            تعليمات المنتج والبرنامج الوطني.
          </p>

          <h3>خامساً: أين يوضع المحرار؟</h3>

          <ul>
            <li>
              يوضع جهاز قياس الحرارة في موضع مناسب يمثل درجة حرارة
              اللقاحات داخل حيز التخزين.
            </li>
            <li>
              يوضع المجس أو المسبار حسب تعليمات الجهاز والشركة المصنعة.
            </li>
            <li>
              تجنب وضعه في مكان يلامس الجدار البارد أو المبخر مباشرة
              ما لم ينص دليل الجهاز على ذلك.
            </li>
            <li>
              لا تنقل المحرار بين الثلاجات دون اتباع تعليمات المعايرة
              والتركيب.
            </li>
          </ul>

          <h3>سادساً: ماذا تسجل في سجل الحرارة؟</h3>

          <ul>
            <li>التاريخ.</li>
            <li>وقت القراءة: صباحاً أو مساءً.</li>
            <li>درجة الحرارة الحالية.</li>
            <li>الحد الأعلى والأدنى إذا كان الجهاز يعرضهما.</li>
            <li>اسم الشخص الذي أخذ القراءة.</li>
            <li>الإجراء المتخذ عند وجود قراءة خارج النطاق.</li>
          </ul>

          <div className="cold-guide-note">
            لا تعتمد على لون الشاشة أو شكل الأرقام وحده.
            اقرأ المؤشرات والرموز في دليل المحرار الخاص بجهازك،
            لأن طريقة عرض القراءات تختلف بين الأجهزة.
          </div>
        </EducationalSection>

      </div>

      {/* التنبيه الختامي */}

      <div className="children-note">
        <ShieldCheck size={18} />
        <span>
          هذا الدليل للتثقيف والتدريب. يجب اعتماد تعليمات وزارة الصحة
          العراقية وأدلة منظمة الصحة العالمية وتعليمات الشركات المصنعة.
          لا يُعد التطبيق بديلاً عن مسؤول سلسلة التبريد أو إجراءات
          تقييم اللقاحات المتأثرة.
        </span>
      </div>

    </section>
  );
}
