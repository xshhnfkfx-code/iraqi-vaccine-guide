import { useEffect, useState } from "react";
import {
  Map, Plus, Trash2, Edit3, Save, X, MapPin,
  Users, CalendarDays, Syringe, ClipboardList,
  CheckCircle2, AlertCircle
} from "lucide-react";
import {
  getAllLocalRecords,
  saveLocalRecord,
  deleteLocalRecord
} from "./lib/db";
import type { LocalRecord } from "./types";

interface MicroplanArea {
  id: string;
  center: string;
  area: string;
  villages: string;
  targetChildren: number;
  sessionType: string;
  sessionDate: string;
  notes: string;
}

const RECORD_TYPE = "microplan-area";

const emptyForm = {
  center: "",
  area: "",
  villages: "",
  targetChildren: "",
  sessionType: "ثابتة",
  sessionDate: "",
  notes: ""
};

export default function Microplan() {
  const [areas, setAreas] = useState<MicroplanArea[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadAreas() {
    try {
      const records = await getAllLocalRecords();
      const saved = records
        .filter((record) => record.type === RECORD_TYPE)
        .map((record) => record.payload as MicroplanArea);

      setAreas(saved);
    } catch {
      setMessage("تعذر تحميل البيانات المحفوظة");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAreas();
  }, []);

  function updateField(
    field: keyof typeof emptyForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setShowForm(true);
  }

  function startEdit(item: MicroplanArea) {
    setEditingId(item.id);
    setForm({
      center: item.center,
      area: item.area,
      villages: item.villages,
      targetChildren: String(item.targetChildren),
      sessionType: item.sessionType,
      sessionDate: item.sessionDate,
      notes: item.notes
    });
    setMessage("");
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const target = Number(form.targetChildren);

    if (!form.center.trim() || !form.area.trim()) {
      setMessage("يرجى إدخال اسم المركز والمنطقة");
      return;
    }

    if (!Number.isInteger(target) || target < 0) {
      setMessage("يرجى إدخال عدد صحيح للأطفال المستهدفين");
      return;
    }

    const id = editingId ?? crypto.randomUUID();

    const item: MicroplanArea = {
      id,
      center: form.center.trim(),
      area: form.area.trim(),
      villages: form.villages.trim(),
      targetChildren: target,
      sessionType: form.sessionType,
      sessionDate: form.sessionDate,
      notes: form.notes.trim()
    };

    const record: LocalRecord = {
      id: `microplan-${id}`,
      type: RECORD_TYPE,
      payload: item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: "pending"
    };

    try {
      await saveLocalRecord(record);
      await loadAreas();
      cancelForm();
      setMessage(editingId ? "تم تحديث الخطة بنجاح" : "تم حفظ الخطة بنجاح");
    } catch {
      setMessage("حدث خطأ أثناء حفظ البيانات");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("هل تريد حذف هذه الخطة؟")) return;

    try {
      await deleteLocalRecord(`microplan-${id}`);
      await loadAreas();
      setMessage("تم حذف الخطة");
    } catch {
      setMessage("تعذر حذف الخطة");
    }
  }

  const totalChildren = areas.reduce(
    (sum, item) => sum + item.targetChildren,
    0
  );

  const totalCenters = new Set(
    areas.map((item) => item.center.trim().toLowerCase())
  ).size;

  return (
    <section className="microplan-module">
      <div className="microplan-toolbar">
        <div>
          <h2>إعداد الخطة المصغرة</h2>
          <p>تخطيط المناطق والقرى وجلسات التلقيح لكل مركز صحي</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={startNew}
        >
          <Plus size={18} />
          إضافة منطقة
        </button>
      </div>

      <div className="microplan-stats">
        <article className="panel microplan-stat">
          <MapPin size={21} />
          <span>المناطق المسجلة</span>
          <strong>{areas.length}</strong>
        </article>

        <article className="panel microplan-stat">
          <Users size={21} />
          <span>الأطفال المستهدفون</span>
          <strong>{totalChildren.toLocaleString("en-US")}</strong>
        </article>

        <article className="panel microplan-stat">
          <Map size={21} />
          <span>المراكز الصحية</span>
          <strong>{totalCenters}</strong>
        </article>
      </div>

      {message && (
        <div className="notice-box microplan-message">
          <CheckCircle2 size={18} />
          <span>{message}</span>
          <button
            type="button"
            className="icon-button"
            onClick={() => setMessage("")}
            aria-label="إغلاق الرسالة"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {showForm && (
        <form className="panel microplan-form" onSubmit={handleSave}>
          <div className="panel-heading">
            <div>
              <h2>{editingId ? "تعديل الخطة" : "إضافة منطقة جديدة"}</h2>
              <p>أدخل بيانات المنطقة التابعة للمركز الصحي</p>
            </div>

            <button
              type="button"
              className="icon-button"
              onClick={cancelForm}
              aria-label="إغلاق"
            >
              <X size={19} />
            </button>
          </div>

          <div className="microplan-fields">
            <label>
              اسم المركز الصحي *
              <input
                required
                value={form.center}
                onChange={(e) => updateField("center", e.target.value)}
                placeholder="مثال: مركز صحي المدينة"
              />
            </label>

            <label>
              اسم المنطقة أو الحي *
              <input
                required
                value={form.area}
                onChange={(e) => updateField("area", e.target.value)}
                placeholder="اسم المنطقة"
              />
            </label>

            <label>
              القرى أو الأحياء التابعة
              <textarea
                rows={3}
                value={form.villages}
                onChange={(e) => updateField("villages", e.target.value)}
                placeholder="اكتب أسماء القرى أو الأحياء"
              />
            </label>

            <label>
              عدد الأطفال المستهدفين *
              <input
                required
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.targetChildren}
                onChange={(e) => updateField("targetChildren", e.target.value)}
                placeholder="أدخل العدد"
              />
            </label>

            <label>
              نوع جلسة التلقيح
              <select
                value={form.sessionType}
                onChange={(e) => updateField("sessionType", e.target.value)}
              >
                <option value="ثابتة">جلسة ثابتة</option>
                <option value="خارجية">جلسة خارجية</option>
              </select>
            </label>

            <label>
              تاريخ الجلسة
              <input
                type="date"
                value={form.sessionDate}
                onChange={(e) => updateField("sessionDate", e.target.value)}
              />
            </label>

            <label className="microplan-full">
              ملاحظات
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="ملاحظات إضافية عن المنطقة أو الجلسة"
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              <Save size={17} />
              حفظ الخطة
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={cancelForm}
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      <div className="panel microplan-list">
        <div className="panel-heading">
          <div>
            <h2>المناطق والخطط المسجلة</h2>
            <p>بيانات الخطط المصغرة المحفوظة على هذا الجهاز</p>
          </div>
          <ClipboardList size={22} />
        </div>

        {loading ? (
          <p className="microplan-empty">جارٍ تحميل البيانات...</p>
        ) : areas.length === 0 ? (
          <div className="microplan-empty">
            <Map size={34} />
            <strong>لا توجد خطط مسجلة حتى الآن</strong>
            <span>ابدأ بإضافة أول منطقة تابعة للمركز الصحي.</span>
          </div>
        ) : (
          <div className="microplan-cards">
            {areas.map((item) => (
              <article className="microplan-card" key={item.id}>
                <div className="microplan-card-heading">
                  <div className="microplan-card-icon">
                    <MapPin size={20} />
                  </div>

                  <div>
                    <strong>{item.area}</strong>
                    <span>{item.center}</span>
                  </div>
                </div>

                <div className="microplan-card-details">
                  <div>
                    <Users size={16} />
                    <span>الأطفال المستهدفون</span>
                    <strong>{item.targetChildren.toLocaleString("en-US")}</strong>
                  </div>

                  <div>
                    <Syringe size={16} />
                    <span>نوع الجلسة</span>
                    <strong>{item.sessionType}</strong>
                  </div>

                  <div>
                    <CalendarDays size={16} />
                    <span>تاريخ الجلسة</span>
                    <strong>{item.sessionDate || "غير محدد"}</strong>
                  </div>
                </div>

                {item.villages && (
                  <div className="microplan-card-note">
                    <strong>القرى والأحياء:</strong>
                    <p>{item.villages}</p>
                  </div>
                )}

                {item.notes && (
                  <div className="microplan-card-note">
                    <strong>ملاحظات:</strong>
                    <p>{item.notes}</p>
                  </div>
                )}

                <div className="microplan-card-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => startEdit(item)}
                  >
                    <Edit3 size={16} />
                    تعديل
                  </button>

                  <button
                    type="button"
                    className="secondary-button microplan-delete"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={16} />
                    حذف
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="children-note">
        <AlertCircle size={17} />
        <span>
          هذه الخطة أداة تنظيمية محلية. أعداد الأطفال والاحتياجات التلقيحية
          يجب مراجعتها واعتمادها وفق بيانات المركز وتعليمات برنامج التلقيح.
        </span>
      </div>
    </section>
  );
}
