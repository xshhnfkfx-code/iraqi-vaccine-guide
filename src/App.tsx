import { useEffect, useState } from "react";
import {
  Activity, AlertCircle, Baby, Bell, CheckCircle2, ChevronLeft,
  Cloud, CloudOff, Menu, ShieldCheck, Syringe, Users, X
} from "lucide-react";
import { navigation } from "./data/navigation";
import type { SectionId } from "./types";
import { getAllLocalRecords } from "./lib/db";

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
  vaccines: "قاعدة معلومات اللقاحات المعتمدة، مع البحث بالاسم العربي أو الإنجليزي أو الاختصار.",
  administration: "دليل إرشادي لطرق إعطاء اللقاحات ومواضع الحقن والأدوات والاحتياطات.",
  "cold-chain": "إدارة الثلاجات وسجل درجات الحرارة والتنبيهات الخاصة بسلسلة التبريد.",
  vitamins: "معلومات فيتامين A وفيتامين K وفق البروتوكولات الوطنية المعتمدة.",
  microplan: "تخطيط الأنشطة التلقيحية ومقارنة المخطط بالمنفذ حسب المنطقة والمركز.",
  monitor: "متابعة التغطية التلقيحية حسب المنطقة والجرعة والفترة الزمنية.",
  defaulters: "تسجيل الأطفال المتسربين ومتابعة الحالات حتى العودة إلى التلقيح.",
  "defaulters-chart": "تحليل حالات التسرب والمتابعة والعودة إلى التلقيح حسب المنطقة وعضو الارتباط.",
  centers: "إدارة المراكز الصحية والمستخدمين وأدوار الوصول والصلاحيات.",
  reports: "إعداد تقارير البرنامج وتصديرها وطباعتها.",
  settings: "إعدادات التطبيق والمزامنة والنسخ الاحتياطي."
};

function App() {
  const [active, setActive] = useState<SectionId>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    getAllLocalRecords().then((records) => setRecordCount(records.length)).catch(() => setRecordCount(0));
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const current = navigation.find((item) => item.id === active) ?? navigation[0];
  function chooseSection(id: SectionId) {
    setActive(id);
    setMobileMenuOpen(false);
  }

  return (
    <div className="app-shell">
      {mobileMenuOpen && <button className="mobile-backdrop" aria-label="إغلاق القائمة" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Activity size={25} /></div>
          <div>
            <strong>دليل اللقاحات العراقي</strong>
            <span>Iraqi Vaccine Guide</span>
          </div>
          <button className="icon-button close-menu" onClick={() => setMobileMenuOpen(false)} aria-label="إغلاق"><X size={19} /></button>
        </div>

        <div className="nav-caption">القائمة الرئيسية</div>
        <nav className="nav-list">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`} onClick={() => chooseSection(item.id)}>
                <Icon size={19} />
                <span>{item.title}</span>
                {active === item.id && <ChevronLeft className="nav-arrow" size={16} />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="secure-note"><ShieldCheck size={17} /><span>نظام مخصص للعاملين الصحيين</span></div>
          <small>الإصدار التأسيسي 0.1.0</small>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-start">
            <button className="icon-button menu-toggle" onClick={() => setMobileMenuOpen(true)} aria-label="فتح القائمة"><Menu size={21} /></button>
            <div className="breadcrumb">الرئيسية <ChevronLeft size={14} /> <strong>{current.title}</strong></div>
          </div>
          <div className="topbar-actions">
            <div className={`connection-pill ${online ? "is-online" : "is-offline"}`}>
              {online ? <Cloud size={15} /> : <CloudOff size={15} />}
              {online ? "متصل" : "دون إنترنت"}
            </div>
            <button className="icon-button notification-button" aria-label="التنبيهات"><Bell size={19} /><i /></button>
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
            <div className="date-chip">{new Intl.DateTimeFormat("ar-IQ", { dateStyle: "full" }).format(new Date())}</div>
          </section>

          {active === "dashboard" ? (
            <>
              <section className="metrics-grid">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <article className="metric-card" key={metric.label}>
                      <div className="metric-top"><span>{metric.label}</span><div className="metric-icon"><Icon size={19} /></div></div>
                      <strong className="metric-value">{metric.value}</strong>
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
                  <div className="panel-heading"><div><h2>حالة النظام</h2><p>التخزين المحلي والاتصال</p></div></div>
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
                    <span className="status-symbol"><DatabaseIcon /></span>
                    <div><strong>السجلات المحلية</strong><small>عدد السجلات المحفوظة على هذا الجهاز</small></div>
                    <b className="record-count">{recordCount}</b>
                  </div>
                  <div className="notice-box"><AlertCircle size={17} /><span>هذه نسخة تأسيسية. لم يتم ربطها بعد بخادم مركزي أو اعتماد بيانات طبية.</span></div>
                </article>
              </section>

              <section className="panel quick-panel">
                <div className="panel-heading"><div><h2>الوصول السريع</h2><p>انتقل إلى القسم المطلوب</p></div></div>
                <div className="quick-grid">
                  {navigation.filter((item) => ["vaccines", "defaulters", "cold-chain", "microplan"].includes(item.id)).map((item) => {
                    const Icon = item.icon;
                    return <button className="quick-link" key={item.id} onClick={() => chooseSection(item.id)}><span><Icon size={20} /></span><b>{item.title}</b><ChevronLeft size={16} /></button>;
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
              <div className="module-state"><AlertCircle size={18} /><div><strong>القسم ضمن الهيكل الأساسي</strong><span>سيتم بناء وظائف هذا القسم وربطها بقاعدة البيانات في مراحل التنفيذ التالية.</span></div></div>
              <button className="primary-button" onClick={() => chooseSection("dashboard")}>العودة إلى لوحة التحكم</button>
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

function DatabaseIcon() {
  return <Users size={18} />;
}

export default App;
