import { useEffect, useState } from "react";
import {
  Snowflake, Plus, Thermometer, Trash2,
  AlertTriangle, CheckCircle2, Clock
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
          .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
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

    if (!selectedFridge || temperature.trim() === "" || !Number.isFinite(value) || value < -50 || value > 60) {
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
    const hasReadings = readings.some((item) => item.fridgeId === id);

    if (hasReadings) {
      setMessage("لا يمكن حذف ثلاجة لها قراءات محفوظة.");
      return;
    }

    if (!window.confirm("هل تريد حذف هذه الثلاجة؟")) return;

    try {
      await deleteLocalRecord(id);
      if (selectedFridge === id) setSelectedFridge("");
      setMessage("تم حذف الثلاجة.");
      await loadData();
    } catch {
      setMessage("تعذر حذف الثلاجة.");
    }
  }

  function fridgeName(id: string): string {
    return fridges.find((fridge) => fridge.id === id)?.name ?? "ثلاجة غير معروفة";
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
          <p>تسجيل الثلاجات ومتابعة درجات حرارة حفظ اللقاحات.</p>
        </div>
      </div>

      {message && (
        <div className="children-message">{message}</div>
      )}

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
              onChange={(event) => setPeriod(event.target.value as "صباحاً" | "مساءً")}
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
                    {readings.filter((item) => item.fridgeId === fridge.id).length} قراءة مسجلة
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
                <div className={`temperature-status ${isNormal(reading.temperature) ? "normal" : "warning"}`}>
                  {isNormal(reading.temperature)
                    ? <CheckCircle2 size={21} />
                    : <AlertTriangle size={21} />}
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
                      القراءة خارج النطاق المعتاد (+2 إلى +8 °C). اتبع إجراءات التعامل المعتمدة محلياً.
                    </small>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="children-note">
        <AlertTriangle size={17} />
        <span>
          النطاق المعروض (+2 إلى +8 درجات مئوية) هو النطاق المعتاد لحفظ معظم اللقاحات.
          عند تسجيل قراءة خارجه، اتبع فوراً إجراءات وزارة الصحة وتعليمات مسؤول سلسلة التبريد.
          لا تعتمد على هذا التطبيق وحده لاتخاذ قرار بشأن صلاحية اللقاحات.
        </span>
      </div>
    </section>
  );
}
