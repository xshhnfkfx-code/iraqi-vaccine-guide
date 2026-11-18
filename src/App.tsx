import { Fragment, useEffect, useState } from "react";
import {
  Activity, AlertCircle, Baby, Bell, CheckCircle2, ChevronLeft,
  Cloud, CloudOff, Menu, ShieldCheck, Syringe, Users, X,
  CalendarDays, RotateCcw, Info, Search
} from "lucide-react";

import { navigation } from "./data/navigation";
import type { SectionId } from "./types";
import { getAllLocalRecords } from "./lib/db";
import { vaccineSchedule } from "./data/vaccineSchedule";
import { vaccineDetails } from "./data/vaccineDetails";
import ColdChain from "./ColdChain";

const metrics = [
  { label: "اللقاحات في الدليل", value: "—", note: "جدول التلقيح الوطني", icon: Syringe },
  { label: "الأطفال المسجلون", value: "0", note: "سجلات المتابعة", icon: Baby },
  { label: "الأطفال المتسربون", value: "0", note: "الحالات المفتوحة", icon: AlertCircle },
  { label: "الأطفال العائدون", value: "0", note: "عادوا إلى التلقيح", icon: CheckCircle2 },
  { label: "المناطق المشمولة", value: "0", note: "المناطق المسجلة", icon: Activity },
  { label: "المراكز الصحية", value: "0", note: "المراكز المسجلة", icon: Users }
];

const descriptions: Record<SectionId, string> = {
  dashboard: "نظرة عامة على مؤشرات برنامج التلقيح.",
  vaccines: "قاعدة معلومات اللقاحات المعتمدة.",
  children: "احسب العمر بين تاريخين بسهولة.",
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

function localToday(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string): string {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function parseDateInput(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    year < 1 ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function calculateAgeBetween(
  birthDate: string,
  comparisonDate: string
): string | null {
  if (!birthDate || !comparisonDate) return null;

  const birthValue = parseDateInput(birthDate);
  const comparisonValue = parseDateInput(comparisonDate);

  if (!birthValue || !comparisonValue) {
    return "اكتب التاريخ بصيغة يوم/شهر/سنة، مثال: 18/11/2020";
  }

  const [by, bm, bd] = birthValue.split("-").map(Number);
  const [ey, em, ed] = comparisonValue.split("-").map(Number);

  const birth = new Date(by, bm - 1, bd);
  const end = new Date(ey, em - 1, ed);

  if (end < birth) {
    return "التاريخ الثاني يسبق تاريخ الميلاد";
  }

  let years = ey - by;
  let months = em - bm;
  let days = ed - bd;

  if (days < 0) {
    months--;
    const daysInPreviousMonth = new Date(ey, em - 1, 0).getDate();
    days += daysInPreviousMonth;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} سنة و ${months} شهر و ${days} يوم`;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .trim();
}

function App() {
  const [active, setActive] = useState<SectionId>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [recordCount, setRecordCount] = useState(0);

  const [birthDate, setBirthDate] = useState("");
  const [comparisonDate, setComparisonDate] = useState(formatDate(localToday()));

  const [selectedVaccineId, setSelectedVaccineId] = useState<string | null>(null);
  const [vaccineSearch, setVaccineSearch] = useState("");

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    getAllLocalRecords()
      .then((records) => setRecordCount(records.length))
      .catch(() => setRecordCount(0));

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const current = navigation.find((item) => item.id === active) ?? navigation[0];

  const ageResult = calculateAgeBetween(birthDate, comparisonDate);

  const vaccineGroups = Array.from(
    new Set(vaccineSchedule.map((item) => item.ageLabel))
  ).map((ageLabel) => ({
    ageLabel,
    items: vaccineSchedule.filter((item) => item.ageLabel === ageLabel)
  }));

  const normalizedQuery = normalizeSearchText(vaccineSearch);

  const filteredVaccineGroups = vaccineGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!normalizedQuery) return true;

        const detail = vaccineDetails[item.id];

        const searchableText = [
          item.id,
          item.name,
          item.dose,
          item.ageLabel,
          item.notes ?? "",
          detail?.description ?? "",
          detail?.importance ?? "",
          ...(detail?.protectsAgainst ?? [])
        ].join(" ");

        return normalizeSearchText(searchableText).includes(normalizedQuery);
      })
    }))
    .filter((group) => group.items.length > 0);

  const searchResultCount = filteredVaccineGroups.reduce(
    (total, group) => total + group.items.length,
    0
  );

  function chooseSection(id: SectionId) {
    setActive(id);
    setMobileMenuOpen(false);
    setSelectedVaccineId(null);
    setVaccineSearch("");
  }

  function resetCalculator() {
    setBirthDate("");
    setComparisonDate(formatDate(localToday()));
  }

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
          <button
            className="icon-button close-menu"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="إغلاق"
          >
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
                {active === item.id && (
                  <ChevronLeft className="nav-arrow" size={16} />
                )}
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
            <button
              className="icon-button menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="فتح القائمة"
            >
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
              <h1>
                {active === "dashboard"
                  ? "مرحباً بك في دليل اللقاحات العراقي"
                  : current.title}
              </h1>
              <p>{descriptions[active]}</p>
            </div>

            <div className="date-chip">
              {new Intl.DateTimeFormat("ar-IQ", {
                dateStyle: "full"
              }).format(new Date())}
            </div>
          </section>

          {active === "vaccines" ? (
            <section className="vaccine-module">
              <div className="panel-heading vaccine-heading">
                <div>
                  <h2>جدول اللقاحات الوطني</h2>
                  <p>ابحث عن اسم اللقاح أو الجرعة للوصول إلى معلوماتها بسرعة</p>
                </div>
                <span className="muted-tag">{vaccineSchedule.length} جرعة / بند</span>
              </div>

              <div className="children-search vaccine-search">
                <Search size={19} />
                <input
                  type="search"
                  value={vaccineSearch}
                  onChange={(e) => {
                    setVaccineSearch(e.target.value);
                    setSelectedVaccineId(null);
                  }}
                  placeholder="ابحث عن لقاح... مثال: شلل الأطفال، OPV، الخماسي، MMR"
                  aria-label="البحث عن اللقاحات"
                />
                {vaccineSearch && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="مسح البحث"
                    onClick={() => {
                      setVaccineSearch("");
                      setSelectedVaccineId(null);
                    }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {vaccineSearch && (
                <p className="vaccine-search-count">
                  عدد النتائج: {searchResultCount}
                </p>
              )}

              {filteredVaccineGroups.length > 0 ? (
                filteredVaccineGroups.map((group) => (
                  <section className="panel vaccine-age-group" key={group.ageLabel}>
                    <div className="vaccine-age-title">
                      <CalendarDays size={19} />
                      <h3>{group.ageLabel}</h3>
                      <span>{group.items.length}</span>
                    </div>

                    <div className="vaccine-dose-list">
                      {group.items.map((item) => (
                        <Fragment key={item.id}>
                          <article className="vaccine-dose">
                            <div className="vaccine-dose-icon">
                              <Syringe size={18} />
                            </div>

                            <div className="vaccine-dose-info">
                              <strong>{item.name}</strong>
                              <span>الجرعة: {item.dose}</span>
                              {item.notes && <small>{item.notes}</small>}

                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                  setSelectedVaccineId(
                                    selectedVaccineId === item.id ? null : item.id
                                  )
                                }
                              >
                                <Info size={16} />
                                {selectedVaccineId === item.id
                                  ? "إخفاء التفاصيل"
                                  : "عرض التفاصيل"}
                              </button>
                            </div>
                          </article>

                          {selectedVaccineId === item.id && (
                            <section className="panel vaccine-detail-panel">
                              <div className="panel-heading">
                                <div>
                                  <h2>تفاصيل الجرعة</h2>
                                  <p>المعلومات المسجلة في دليل اللقاحات</p>
                                </div>

                                <button
                                  type="button"
                                  className="icon-button"
                                  aria-label="إغلاق التفاصيل"
                                  onClick={() => setSelectedVaccineId(null)}
                                >
                                  <X size={19} />
                                </button>
                              </div>

                              <div className="vaccine-detail-content">
                                <div className="vaccine-detail-icon">
                                  <Syringe size={25} />
                                </div>

                                <h3>{item.name}</h3>

                                <div className="vaccine-detail-row">
                                  <span>موعد الجرعة</span>
                                  <strong>{item.ageLabel}</strong>
                                </div>

                                <div className="vaccine-detail-row">
                                  <span>رقم الجرعة</span>
                                  <strong>{item.dose}</strong>
                                </div>

                                {item.notes && (
                                  <div className="vaccine-detail-row">
                                    <span>ملاحظات</span>
                                    <strong>{item.notes}</strong>
                                  </div>
                                )}

                                {vaccineDetails[item.id] ? (
                                  <>
                                    <div className="vaccine-detail-description">
                                      <h4>ما هو هذا اللقاح؟</h4>
                                      <p>{vaccineDetails[item.id].description}</p>
                                    </div>

                                    <div className="vaccine-detail-description">
                                      <h4>الأمراض التي يقي منها</h4>
                                      <ul>
                                        {vaccineDetails[item.id].protectsAgainst.map(
                                          (disease, index) => (
                                            <li key={index}>{disease}</li>
                                          )
                                        )}
                                      </ul>
                                    </div>

                                    <div className="vaccine-detail-description">
                                      <h4>أهمية اللقاح</h4>
                                      <p>{vaccineDetails[item.id].importance}</p>
                                    </div>

                                    <div className="vaccine-detail-row">
                                      <span>المصدر</span>
                                      <strong>{vaccineDetails[item.id].source}</strong>
                                    </div>
                                  </>
                                ) : (
                                  <div className="notice-box">
                                    <AlertCircle size={17} />
                                    <span>
                                      لم تتم إضافة المعلومات الطبية التفصيلية لهذا اللقاح
                                      بعد. ستتم إضافتها بعد مراجعة المراجع الرسمية.
                                    </span>
                                  </div>
                                )}
                              </div>
                            </section>
                          )}
                        </Fragment>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="panel children-empty">
                  <Search size={30} />
                  <strong>لا توجد نتائج مطابقة للبحث</strong>
                  <span>جرّب كتابة اسم اللقاح بطريقة أخرى أو استخدم اسمه الإنجليزي.</span>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setVaccineSearch("")}
                  >
                    عرض جميع اللقاحات
                  </button>
                </div>
              )}

              <div className="children-note">
                <AlertCircle size={17} />
                <span>
                  هذا عرض للبيانات المدرجة حالياً في ملف جدول اللقاحات داخل التطبيق.
                  يُرجى اعتماد بطاقة التلقيح الرسمية وتعليمات وزارة الصحة عند إعطاء اللقاحات.
                </span>
              </div>
            </section>
          ) : active === "children" ? (
            <section className="children-module">
              <div className="children-toolbar">
                <div>
                  <h2>حاسبة العمر</h2>
                  <p>احسب العمر بين تاريخين بالسنوات والأشهر والأيام</p>
                </div>
              </div>

              <div className="panel child-form">
                <h3>أدخل التاريخين</h3>

                <div className="child-fields">
                  <label>
                    تاريخ الميلاد الأول
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="يوم/شهر/سنة مثال: 18/11/2020"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </label>

                  <label>
                    التاريخ الثاني
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="يوم/شهر/سنة مثال: 18/11/2026"
                      value={comparisonDate}
                      onChange={(e) => setComparisonDate(e.target.value)}
                    />
                  </label>
                </div>

                {birthDate && comparisonDate && (
                  <div className="age-preview">
                    <CalendarDays size={21} />
                    <span>العمر بين التاريخين:</span>
                    <strong>{ageResult}</strong>
                  </div>
                )}

                <div className="form-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={resetCalculator}
                  >
                    <RotateCcw size={16} />
                    مسح وإعادة ضبط
                  </button>
                </div>
              </div>

              <div className="children-note">
                <AlertCircle size={17} />
                <span>
                  اكتب التاريخ بصيغة يوم/شهر/سنة، مثل 18/11/2020.
                  يبدأ التاريخ الثاني بتاريخ اليوم تلقائياً، ويمكنك تغييره.
                  تتحدث نتيجة العمر تلقائياً عند تعديل أي من التاريخين.
                </span>
              </div>
            </section>
          ) : active === "cold-chain" ? (
            <ColdChain />
          ) : active === "dashboard" ? (
            <>
              <section className="metrics-grid">
                {metrics.map((metric) => {
                  const Icon = metric.icon;

                  return (
                    <article className="metric-card" key={metric.label}>
                      <div className="metric-top">
                        <span>{metric.label}</span>
                        <div className="metric-icon">
                          <Icon size={19} />
                        </div>
                      </div>

                      <strong className="metric-value">
                        {metric.label === "الأطفال المسجلون"
                          ? "—"
                          : metric.value}
                      </strong>

                      <small>{metric.note}</small>
                    </article>
                  );
                })}
              </section>

              <section className="dashboard-grid">
                <article className="panel overview-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>ملخص البرنامج</h2>
                      <p>ستظهر المؤشرات بعد إدخال البيانات الفعلية</p>
                    </div>
                    <span className="muted-tag">نظرة عامة</span>
                  </div>

                  <div className="empty-chart">
                    <div className="chart-illustration">
                      <Activity size={34} />
                    </div>
                    <strong>لا توجد بيانات لعرض المخططات حالياً</strong>
                    <span>
                      ستُحدّث الرسوم تلقائياً عند إضافة سجلات التغطية والمتابعة.
                    </span>
                  </div>
                </article>

                <article className="panel status-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>حالة النظام</h2>
                      <p>التخزين المحلي والاتصال</p>
                    </div>
                  </div>

                  <div className="status-row">
                    <span className="status-symbol">
                      <CheckCircle2 size={18} />
                    </span>
                    <div>
                      <strong>التطبيق الأساسي</strong>
                      <small>تم تحميل الواجهة بنجاح</small>
                    </div>
                    <span className="status-ok">جاهز</span>
                  </div>

                  <div className="status-row">
                    <span className="status-symbol">
                      <Cloud size={18} />
                    </span>
                    <div>
                      <strong>الاتصال بالإنترنت</strong>
                      <small>
                        {online
                          ? "الاتصال متاح حالياً"
                          : "يعمل التطبيق في الوضع المحلي"}
                      </small>
                    </div>
                    <span className={online ? "status-ok" : "status-warn"}>
                      {online ? "متصل" : "غير متصل"}
                    </span>
                  </div>

                  <div className="status-row">
                    <span className="status-symbol">
                      <Users size={18} />
                    </span>
                    <div>
                      <strong>السجلات المحلية</strong>
                      <small>عدد السجلات المحفوظة على هذا الجهاز</small>
                    </div>
                    <b className="record-count">{recordCount}</b>
                  </div>

                  <div className="notice-box">
                    <AlertCircle size={17} />
                    <span>
                      هذه نسخة تأسيسية. لم يتم ربطها بعد بخادم مركزي أو اعتماد البيانات الطبية.
                    </span>
                  </div>
                </article>
              </section>

              <section className="panel quick-panel">
                <div className="panel-heading">
                  <div>
                    <h2>الوصول السريع</h2>
                    <p>انتقل إلى القسم المطلوب</p>
                  </div>
                </div>

                <div className="quick-grid">
                  {navigation
                    .filter((item) =>
                      ["vaccines", "children", "defaulters", "cold-chain", "microplan"].includes(item.id)
                    )
                    .map((item) => {
                      const Icon = item.icon;

                      return (
                        <button
                          className="quick-link"
                          key={item.id}
                          onClick={() => chooseSection(item.id)}
                        >
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
              <div className="module-icon">
                <current.icon size={28} />
              </div>

              <span className="module-kicker">قسم ضمن النظام</span>
              <h2>{current.title}</h2>
              <p>{descriptions[active]}</p>

              <div className="module-divider" />

              <div className="module-state">
                <AlertCircle size={18} />
                <div>
                  <strong>القسم ضمن الهيكل الأساسي</strong>
                  <span>
                    سيتم بناء وظائف هذا القسم وربطها بقاعدة البيانات في مراحل التنفيذ التالية.
                  </span>
                </div>
              </div>

              <button
                className="primary-button"
                onClick={() => chooseSection("dashboard")}
              >
                العودة إلى لوحة التحكم
              </button>
            </section>
          )}

          <footer className="page-footer">
            <span>
              دليل اللقاحات العراقي © {new Date().getFullYear()}
            </span>
            <span>نسخة تأسيسية قيد التطوير</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
