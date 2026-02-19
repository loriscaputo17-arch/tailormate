"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string; // YYYY-MM-DD
  event_time: string | null; // HH:mm
  location: string | null;
  people: string | null;
  notes: string | null;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function formatDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

const YEARS = Array.from({ length: 11 }, (_, i) => {
  const y = new Date().getFullYear();
  return y - 5 + i; // range: -5 +5 anni
});

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function CalendarPage() {
  const [current, setCurrent] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // form state
  const [form, setForm] = useState({
    title: "",
    time: "",
    location: "",
    people: "",
    notes: "",
  });

  /* =====================================================
     LOAD EVENTS (lazy per month)
  ===================================================== */

  useEffect(() => {
    loadMonth();
  }, [current]);

  async function loadMonth() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const from = formatDateKey(startOfMonth(current));
      const to = formatDateKey(endOfMonth(current));

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("tailor_id", user.id)
        .gte("event_date", from)
        .lte("event_date", to);

      if (error) throw error;

      setEvents(data || []);
    } catch (e) {
      console.error("calendar load error", e);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     SAVE EVENT
  ===================================================== */

  async function saveEvent() {
    if (!selectedDate || !form.title.trim()) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from("calendar_events").insert({
        tailor_id: user.id,
        title: form.title,
        event_date: selectedDate,
        event_time: form.time || null,
        location: form.location || null,
        people: form.people || null,
        notes: form.notes || null,
      });

      if (error) throw error;

      setForm({ title: "", time: "", location: "", people: "", notes: "" });
      setSelectedDate(null);
      loadMonth();
    } catch (e) {
      console.error("save event error", e);
    }
  }

  /* =====================================================
     CALENDAR GRID
  ===================================================== */

  const days = useMemo(() => {
    const start = startOfMonth(current);
    const end = endOfMonth(current);

    const arr: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      arr.push(new Date(d));
    }
    return arr;
  }, [current]);

  function eventsFor(dateKey: string) {
    return events.filter((e) => e.event_date === dateKey);
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight">
            {MONTHS[current.getMonth()]} {current.getFullYear()}
          </h1>
          <p className="text-white/50 mt-1">Your atelier schedule.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* prev */}
          <button
            onClick={() =>
              setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))
            }
            className="px-3 py-2 rounded-lg bg-white/10"
          >
            ←
          </button>

          {/* dropdown mese */}
          <select
            value={current.getMonth()}
            onChange={(e) =>
              setCurrent(
                new Date(current.getFullYear(), Number(e.target.value), 1)
              )
            }
            className="bg-white/10 border border-white/10 rounded-lg px-2 py-2 text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i} className="bg-black">
                {m}
              </option>
            ))}
          </select>

          {/* dropdown anno */}
          <select
            value={current.getFullYear()}
            onChange={(e) =>
              setCurrent(
                new Date(Number(e.target.value), current.getMonth(), 1)
              )
            }
            className="bg-white/10 border border-white/10 rounded-lg px-2 py-2 text-sm"
          >
            {YEARS.map((y) => (
              <option key={y} value={y} className="bg-black">
                {y}
              </option>
            ))}
          </select>


          {/* next */}
          <button
            onClick={() =>
              setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))
            }
            className="px-3 py-2 rounded-lg bg-white/10"
          >
            →
          </button>
        </div>
      </div>


      {/* GRID */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const key = formatDateKey(d);
          const dayEvents = eventsFor(key);

          return (
            <div
              key={key}
              onClick={() => {
                setSelectedEvent(null);
                setSelectedDate(key);
              }}
              className="min-h-[110px] rounded-xl border border-white/10 p-2 cursor-pointer hover:bg-white/[0.04]"
            >
              <div className="text-xs text-white/40 mb-1">{d.getDate()}</div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(null);
                      setSelectedEvent(ev);
                    }}
                    className="text-[10px] px-2 py-1 rounded bg-white/10 truncate cursor-pointer hover:bg-white/20"
                  >
                    {ev.event_time ? `${ev.event_time} · ` : ""}
                    {ev.title}
                  </div>
                ))}

                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-white/40">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SIDEBAR EVENT DETAIL */}
        {selectedEvent && (
          <div className="fixed inset-y-0 right-0 w-[420px] bg-black border-l border-white/10 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light">
                {selectedEvent.title}
              </h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <Detail label="Date" value={selectedEvent.event_date} />
              <Detail label="Time" value={selectedEvent.event_time} />
              <Detail label="Location" value={selectedEvent.location} />
              <Detail label="People" value={selectedEvent.people} />
              <Detail label="Notes" value={selectedEvent.notes} />
            </div>
          </div>
        )}


      {/* SIDEBAR CREATE */}
      {selectedDate && (
        <div className="fixed inset-y-0 right-0 w-[420px] bg-black border-l border-white/10 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-light">
              New appointment · {selectedDate}
            </h2>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-white/40 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />

            <Input label="Time" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />

            <Input label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />

            <Input label="People" value={form.people} onChange={(v) => setForm({ ...form, people: v })} />

            <Textarea label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />

            <button
              onClick={saveEvent}
              className="w-full mt-4 px-6 py-3 rounded-full bg-white text-black text-sm font-medium"
            >
              Save appointment
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-xs text-white/40">Loading events…</div>
      )}
    </div>
  );
}

/* =====================================================
   SMALL INPUTS
===================================================== */

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) return null;

  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
        {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
