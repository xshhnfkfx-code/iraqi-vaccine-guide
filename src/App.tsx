import { useEffect, useState, type FormEvent } from "react";
import {
  Activity, AlertCircle, Baby, Bell, CheckCircle2, ChevronLeft,
  Cloud, CloudOff, Menu, ShieldCheck, Syringe, Users, X,
  CalendarDays, Plus, Save, Search
} from "lucide-react";
import { navigation } from "./data/navigation";
import type { SectionId, LocalRecord } from "./types";
import { getAllLocalRecords, saveLocalRecord } from "./lib/db";

interface ChildData {
  name: string;
  birthDate: string;
  gender: string;
  guardian: string;
  phone: string;
  center: string;
}

interface ChildEntry {
  recordId: string;
  data: ChildData;
}

const metrics = [
  { label: "اللقاحات في الدليل", value: "—", note: "بانتظار إدخال البيانات المعتمدة", icon: Syringe },
  { label: "الأطفال المسجلون", value: "0", note: "سجلات المتابعة", icon: Baby },
  { label: "الأطفال المتسربون", value: "0", note: "الحالات المفتوحة", icon: AlertCircle },
  { label: "الأطفال العائدون", value: "0", note: "عادوا إلى التلقيح", icon: CheckCircle2 },
  { label: "المناطق المشمولة", value: "0", note: "المناطق المسجلة", icon: Activity },
  { label: "المراكز الصحية", value: "0", note: "المراكز المسجلة", icon: Users }
];

const descriptions: Record<SectionId, string> = {
  dashboard: "نظرة عامة على مؤشرات برنامج التلقيح.",
  vaccines: "قاعدة معلومات اللقاحات المعتمدة.",
  children: "تسجيل الأطفال وحساب أعمارهم ومتابعة جرعاتهم.",
  administration: "دليل إرشادي لطرق إعطاء اللقاحات ومواضع الحقن.",
  "cold-chain": "إدارة الثلاجات وسجل درجات الحرارة.",
  vitamins: "معلومات فيتامين A وفيتامين K.",
  microplan: "تخطيط الأنشطة التلقيحية.",
  monitor: "متابعة التغطية التلقيحية.",
  defaulters: "متابعة الأطفال المتسربين.",
  "defaulters-chart": "تحليل حالات التسرب والعودة إلى التلقيح.",
  centers: "إدارة المراكز الصحية والمستخدمين.",
  reports: "إعداد التقارير وتصديرها وطباعتها.",
  settings: "إعدادات التطبيق والمزامنة والنسخ الاحتياطي."
};

function calculateAge(birthDate: string): string {
  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(birth.getTime()) || birth > today) {
    return "تاريخ ميلاد غير صحيح";
  }

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const previousMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    );
    days += previousMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years > 0) {
    return `${years} سنة و${months} شهر`;
  }

  if (months > 0) {
    return `${months} شهر و${days} يوم`;
  }

  return `${days} يوم`;
}

function App() {
  const [active, setActive] = useState<SectionId>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [recordCount, setRecordCount] = useState(0);
  const [children, setChildren] = useState<ChildEntry[]>([]);
  const [showChildForm, setShowChildForm] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState<ChildData>({
    name: "",
    birthDate: "",
    gender: "ذكر",
    guardian: "",
    phone: "",
    center: ""
  });

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    getAllLocalRecords()
      .then((records) => {
        setRecordCount(records.length);

        const savedChildren = records
          .filter((record) => record.type === "child")
          .map((record) => ({
            recordId: record.id,
            data: record.payload as ChildData
          }));

        setChildren(savedChildren);
      })
      .catch(() => {
        setRecordCount(0);
      });

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const current = navigation.find((item) => item.id === active) ?? navigation[0];

  function chooseSection(id: SectionId) {
    setActive(id);
    setMobileMenuOpen(false);
    setMessage("");
  }

  async function handleSaveChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!form.name.trim() || !form.birthDate) {
      setMessage("يرجى إدخال اسم الطفل وتاريخ الميلاد.");
      return;
    }

    if (new Date(`${form.birthDate}T00:00:00`) > new Date()) {
      setMessage("تاريخ الميلاد لا يمكن أن يكون في المستقبل.");
      return;
    }

    setSaving(true);

    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const record: LocalRecord = {
        id,
        type: "child",
        payload: { ...form },
        createdAt: now,
        updatedAt: now,
        syncStatus: "pending"
      };

      await saveLocalRecord(record);

      setChildren((previous) => [
        { recordId: id, data: { ...form } },
        ...previous
      ]);

      setRecordCount((count) => count + 1);

      setForm({
        name: "",
        birthDate: "",
        gender: "ذكر",
        guardian: "",
        phone: "",
        center: ""
      });

      setShowChildForm(false);
      setMessage("تم حفظ بيانات الطفل بنجاح.");
    } catch {
      setMessage("تعذر حفظ البيانات. حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  const filteredChildren = children.filter((child) =>
    child.data.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <button
          className="mobile-backdrop"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Activity size={25} /></div>
          <div>
            <strong>دليل اللقاحات العراقي</strong>
            <span>Iraqi Vaccine Guide</span>
          </div>
          <button className="icon-button close-menu" onClick={() => setMobileMenuOpen(false)} aria-label="إغلاق">
            <X size={19} />
          </button>
        </div>

        <div className="nav-caption">القائمة الرئيسية</div>
        <nav className="nav-list">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${active === item.id ? "active" : ""}`}
                onClick={() => chooseSection(item.id)}
              >
                <Icon size={19} />
                <span>{item.title}</span>
                {active === item.id && <ChevronLeft className="nav-arrow" size={16} />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="secure-note">
            <ShieldCheck size={17} />
            <span>نظام مخصص للعاملين الصحيين</span>
          </div>
          <small>الإصدار التأسيسي 0.1.0</small>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-start">
            <button className="icon-button menu-toggle" onClick={() => setMobileMenuOpen(true)} aria-label="فتح القائمة">
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              الرئيسية <ChevronLeft size={14} /> <strong>{current.title}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <div className={`connection-pill ${online ? "is-online" : "is-offline"}`}>
              {online ? <Cloud size={15} /> : <CloudOff size={15} />}
              {online ? "متصل" : "دون إنترنت"}
            </div>
            <button className="icon-button notification-button" aria-label="التنبيهات">
              <Bell size={19} /><i />
            </button>
            <div className="user-avatar">م</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">Iraqi Vaccine Guide</div>
              <h1>{active === "dashboard" ? "مرحباً بك في دليل اللقاحات العراقي" : current.title}</h1>
              <p>{descriptions[active]}</p>
            </div>
            <div className="date-chip">
              {new Intl.DateTimeFormat("ar-IQ", { dateStyle: "full" }).format(new Date())}
            </div>
          </section>

          {active === "children" ? (
            <section className="children-module">
              <div className="children-toolbar">
                <div>
                  <h2>سجل الأطفال</h2>
                  <p>عدد الأطفال المسجلين: {children.length}</p>
                </div>
                <button className="primary-button" onClick={() => {
                  setShowChildForm(!showChildForm);
                  setMessage("");
                }}>
                  <Plus size={17} />
                  تسجيل طفل جديد
                </button>
              </div>

              {message && <div className="children-message">{message}</div>}

              {showChildForm && (
                <form className="child-form panel" onSubmit={handleSaveChild}>
                  <h3>بيانات الطفل</h3>

                  <div className="child-fields">
                    <label>
                      اسم الطفل *
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="أدخل اسم الطفل"
                        required
                      />
                    </label>

                    <label>
                      تاريخ الميلاد *
                      <input
                        type="date"
                        value={form.birthDate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                        required
                      />
                    </label>

                    <label>
                      الجنس
                      <select
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      >
                        <option value="ذكر">ذكر</option>
                        <option value="أنثى">أنثى</option>
                      </select>
                    </label>

                    <label>
                      اسم ولي الأمر
                      <input
                        value={form.guardian}
                        onChange={(e) => setForm({ ...form, guardian: e.target.value })}
                        placeholder="اسم الأب أو الأم"
                      />
                    </label>

                    <label>
                      رقم الهاتف
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="رقم الهاتف"
                      />
                    </label>

                    <label>
                      المركز الصحي
                      <input
                        value={form.center}
                        onChange={(e) => setForm({ ...form, center: e.target.value })}
                        placeholder="اسم المركز الصحي"
                      />
                    </label>
                  </div>

                  {form.birthDate && (
                    <div className="age-preview">
                      <CalendarDays size={19} />
                      <span>عمر الطفل حالياً:</span>
                      <strong>{calculateAge(form.birthDate)}</strong>
                    </div>
                  )}

                  <div className="form-actions">
                    <button className="primary-button" type="submit" disabled={saving}>
                      <Save size={16} />
                      {saving ? "جارٍ الحفظ..." : "حفظ بيانات الطفل"}
                    </button>
                    <button className="secondary-button" type="button" onClick={() => setShowChildForm(false)}>
                      إلغاء
                    </button>
                  </div>
                </form>
              )}

              <div className="children-search">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن طفل بالاسم..."
                />
              </div>

              {filteredChildren.length === 0 ? (
                <div className="panel children-empty">
                  <Baby size={36} />
                  <strong>{children.length === 0 ? "لا توجد أطفال مسجلون حالياً" : "لا توجد نتائج مطابقة"}</strong>
                  <span>يمكنك تسجيل طفل جديد من زر تسجيل طفل جديد.</span>
                </div>
              ) : (
                <div className="children-list">
                  {filteredChildren.map((child) => (
                    <article className="panel child-card" key={child.recordId}>
                      <div className="child-card-icon"><Baby size={23} /></div>
                      <div className="child-card-info">
                        <strong>{child.data.name}</strong>
                        <span>{child.data.gender} · {calculateAge(child.data.birthDate)}</span>
                        <small>تاريخ الميلاد: {child.data.birthDate}</small>
                        {child.data.guardian && <small>ولي الأمر: {child.data.guardian}</small>}
                        {child.data.center && <small>المركز الصحي: {child.data.center}</small>}
                      </div>
                      <div className="child-card-status">مسجل</div>
                    </article>
                  ))}
                </div>
              )}

              <div className="children-note">
                <AlertCircle size={17} />
                <span>
                  حساب العمر متاح حالياً. سيتم تفعيل حساب الجرعات القادمة بعد إدخال جدول التلقيح المعتمد وسجل الجرعات الفعلية لكل طفل.
                </span>
              </div>
            </section>
          ) : active === "dashboard" ? (
            <>
              <section className="metrics-grid">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <article className="metric-card" key={metric.label}>
                      <div className="metric-top">
                        <span>{metric.label}</span>
                        <div className="metric-icon"><Icon size={19} /></div>
                      </div>
                      <strong className="metric-value">
                        {metric.label === "الأطفال المسجلون" ? children.length : metric.value}
                      </strong>
                      <small>{metric.note}</small>
                    </article>
                  );
                })}
              </section>

              <section className="dashboard-grid">
                <article className="panel overview-panel">
                  <div className="panel-heading">
                    <div><h2>ملخص البرنامج</h2><p>ستظهر المؤشرات بعد إدخال البيانات الفعلية</p></div>
                    <span className="muted-tag">نظرة عامة</span>
                  </div>
                  <div className="empty-chart">
                    <div className="chart-illustration"><Activity size={34} /></div>
                    <strong>لا توجد بيانات لعرض المخططات حالياً</strong>
                    <span>ستُحدّث الرسوم تلقائياً عند إضافة سجلات التغطية والمتابعة.</span>
                  </div>
                </article>

                <article className="panel status-panel">
                  <div className="panel-heading">
                    <div><h2>حالة النظام</h2><p>التخزين المحلي والاتصال</p></div>
                  </div>
                  <div className="status-row">
                    <span className="status-symbol"><CheckCircle2 size={18} /></span>
                    <div><strong>التطبيق الأساسي</strong><small>تم تحميل الواجهة بنجاح</small></div>
                    <span className="status-ok">جاهز</span>
                  </div>
                  <div className="status-row">
                    <span className="status-symbol"><Cloud size={18} /></span>
                    <div><strong>الاتصال بالإنترنت</strong><small>{online ? "الاتصال متاح حالياً" : "يعمل التطبيق في الوضع المحلي"}</small></div>
                    <span className={online ? "status-ok" : "status-warn"}>{online ? "متصل" : "غير متصل"}</span>
                  </div>
                  <div className="status-row">
                    <span className="status-symbol"><Users size={18} /></span>
                    <div><strong>السجلات المحلية</strong><small>عدد السجلات المحفوظة على هذا الجهاز</small></div>
                    <b className="record-count">{recordCount}</b>
                  </div>
                  <div className="notice-box">
                    <AlertCircle size={17} />
                    <span>هذه نسخة تأسيسية. لم يتم ربطها بعد بخادم مركزي أو اعتماد البيانات الطبية.</span>
                  </div>
                </article>
              </section>

              <section className="panel quick-panel">
                <div className="panel-heading">
                  <div><h2>الوصول السريع</h2><p>انتقل إلى القسم المطلوب</p></div>
                </div>
                <div className="quick-grid">
                  {navigation.filter((item) =>
                    ["vaccines", "children", "defaulters", "cold-chain", "microplan"].includes(item.id)
                  ).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button className="quick-link" key={item.id} onClick={() => chooseSection(item.id)}>
                        <span><Icon size={20} /></span>
                        <b>{item.title}</b>
                        <ChevronLeft size={16} />
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          ) : (
            <section className="module-panel panel">
              <div className="module-icon"><current.icon size={28} /></div>
              <span className="module-kicker">قسم ضمن النظام</span>
              <h2>{current.title}</h2>
              <p>{descriptions[active]}</p>
              <div className="module-divider" />
              <div className="module-state">
                <AlertCircle size={18} />
                <div>
                  <strong>القسم ضمن الهيكل الأساسي</strong>
                  <span>سيتم بناء وظائف هذا القسم وربطها بقاعدة البيانات في مراحل التنفيذ التالية.</span>
                </div>
              </div>
              <button className="primary-button" onClick={() => chooseSection("dashboard")}>
                العودة إلى لوحة التحكم
              </button>
            </section>
          )}

          <footer className="page-footer">
            <span>دليل اللقاحات العراقي © {new Date().getFullYear()}</span>
            <span>نسخة تأسيسية قيد التطوير</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
