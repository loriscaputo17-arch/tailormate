"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/* =====================================================
   TYPES
===================================================== */

interface Guest {
  name: string;
  email: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  duration_minutes: number | null;
  appointment_type: string | null;
  location_name: string | null;
  location_address: string | null;
  location_maps_url: string | null;
  client_name: string | null;
  fitting_type: string | null;
  garment: string | null;
  fabric_notes: string | null;
  measurements_notes: string | null;
  notes: string | null;
  guests: Guest[];
}

/* =====================================================
   CONSTANTS
===================================================== */

const APPOINTMENT_TYPES = [
  "First Fitting","Second Fitting","Final Fitting","Delivery",
  "Consultation","Measurements","Alteration","Other",
];

const FITTING_TYPES = [
  "Wedding Dress","Evening Gown","Tuxedo / Tailcoat","Bespoke Suit",
  "Bespoke Shirt","Full Outfit","Overcoat","Garment Alteration","Other",
];

// Subtle color per type shown on calendar pills
const TYPE_COLORS: Record<string, string> = {
  "First Fitting":  "bg-amber-500/20 text-amber-300",
  "Second Fitting": "bg-amber-500/20 text-amber-300",
  "Final Fitting":  "bg-amber-500/20 text-amber-300",
  "Delivery":       "bg-emerald-500/20 text-emerald-300",
  "Consultation":   "bg-blue-500/20 text-blue-300",
  "Measurements":   "bg-purple-500/20 text-purple-300",
  "Alteration":     "bg-rose-500/20 text-rose-300",
  "Other":          "bg-white/10 text-white/50",
};

const YEARS  = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function formatDateKey(d: Date) { return d.toISOString().slice(0, 10); }
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/* =====================================================
   MAIN PAGE
===================================================== */

export default function CalendarPage() {
  const [current, setCurrent]             = useState(() => new Date());
  const [events, setEvents]               = useState<CalendarEvent[]>([]);
  const [loading, setLoading]             = useState(false);
  const [selectedDate, setSelectedDate]   = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailStatus, setEmailStatus]     = useState<string | null>(null);
  const [tableSearch, setTableSearch]     = useState("");
  const [typeFilter, setTypeFilter]       = useState("all");

  const emptyForm = {
    title: "", time: "", duration_minutes: "60", appointment_type: "",
    location_name: "", location_address: "", client_name: "",
    fitting_type: "", garment: "", fabric_notes: "", measurements_notes: "", notes: "",
    guests: [{ name:"",email:"" },{ name:"",email:"" },{ name:"",email:"" },{ name:"",email:"" }] as Guest[],
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadMonth(); }, [current]);

  async function loadMonth() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("calendar_events").select("*").eq("tailor_id", user.id)
        .gte("event_date", formatDateKey(startOfMonth(current)))
        .lte("event_date", formatDateKey(endOfMonth(current)));
      if (error) throw error;
      setEvents(data || []);
    } catch (e) { console.error("calendar load error", e); }
    finally { setLoading(false); }
  }

  function buildMapsUrl(address: string) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  async function sendEmailNotifications(event: any) {
    const validGuests = event.guests.filter((g: Guest) => g.email.trim());
    if (!validGuests.length) return;
    setSendingEmails(true); setEmailStatus(null);
    try {
      for (const guest of validGuests) {
        const emailBody = `Appointment details:\n- Title: ${event.title}\n- Date: ${event.event_date}\n- Time: ${event.time}\n- Duration: ${event.duration_minutes} minutes\n- Type: ${event.appointment_type}\n- Client: ${event.client_name}\n- Garment: ${event.garment}\n- Venue: ${event.location_name}\n- Address: ${event.location_address}\n- Notes: ${event.notes}`;
        const { error: notifError } = await supabase.from("email_notifications").insert({ recipient_email: guest.email, recipient_name: guest.name, subject: `Appointment: ${event.title} – ${event.event_date}`, body: emailBody, sent_at: new Date().toISOString() });
        if (notifError) console.warn("email_notifications insert error", notifError);
        try {
          const res = await fetch("/api/send-apt", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ to: guest.email, subject: `Appointment: ${event.title} – ${event.event_date}`, text: emailBody, guestName: guest.name }) });
          if (!res.ok) console.warn("SMTP send failed for", guest.email);
        } catch (err) { console.error("SMTP call error", err); }
      }
      setEmailStatus(`✓ Notifications sent to ${validGuests.length} guest(s)`);
    } catch (e) { console.error("email send error", e); setEmailStatus("⚠ Error sending notifications"); }
    finally { setSendingEmails(false); }
  }

  async function saveEvent() {
    if (!selectedDate || !form.title.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const mapsUrl = form.location_address ? buildMapsUrl(form.location_address) : null;
      const validGuests = form.guests.filter(g => g.name.trim() || g.email.trim());
      const { error } = await supabase.from("calendar_events").insert({ tailor_id: user.id, title: form.title, event_date: selectedDate, event_time: form.time || null, duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null, appointment_type: form.appointment_type || null, location_name: form.location_name || null, location_address: form.location_address || null, location_maps_url: mapsUrl, client_name: form.client_name || null, fitting_type: form.fitting_type || null, garment: form.garment || null, fabric_notes: form.fabric_notes || null, measurements_notes: form.measurements_notes || null, notes: form.notes || null, guests: validGuests });
      if (error) throw error;
      await sendEmailNotifications({ ...form, event_date: selectedDate });
      setForm(emptyForm); setSelectedDate(null); loadMonth();
    } catch (e) { console.error("save event error", e); }
  }

  const days = useMemo(() => {
    const arr: Date[] = [];
    const start = startOfMonth(current); const end = endOfMonth(current);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) arr.push(new Date(d));
    return arr;
  }, [current]);

  function eventsFor(key: string) { return events.filter(e => e.event_date === key); }

  const filteredTableEvents = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    return events.filter(e => {
      const matchesSearch = !q || e.title?.toLowerCase().includes(q) || e.client_name?.toLowerCase().includes(q) || e.location_name?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (typeFilter !== "all" && e.appointment_type !== typeFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
  }, [events, tableSearch, typeFilter]);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        .fade-up{animation:fadeUp 0.5s ease forwards;opacity:0}
        .slide-in{animation:slideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards}
        .d1{animation-delay:0.04s}.d2{animation-delay:0.10s}.d3{animation-delay:0.16s}.d4{animation-delay:0.22s}
        .gold{color:#c9a96e}
        .gold-line{background:linear-gradient(90deg,#c9a96e,transparent)}
        .day-cell:hover{background:rgba(201,169,110,0.04);border-color:rgba(201,169,110,0.25)}
        .table-row:hover td{background:rgba(201,169,110,0.03)}
        .table-row:hover .row-title{color:#c9a96e}
      `}</style>

      <div className="space-y-10 pb-20">

        {/* ── HEADER ── */}
        <div className="fade-up d1 flex items-end justify-between border-b border-white/8 pb-8">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase mb-3">Schedule</p>
            <h1 className="text-4xl font-light tracking-tight text-white leading-none">
              {MONTHS[current.getMonth()]} <span className="text-white/30">{current.getFullYear()}</span>
            </h1>
            <p className="text-sm text-white/35 mt-3">
              {loading ? "—" : `${events.length} appointment${events.length !== 1 ? "s" : ""} this month`}
            </p>
          </div>

          {/* Nav */}
          <div className="flex items-center gap-2 pb-1">
            <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              className="w-9 h-9 rounded-full bg-white/6 border border-white/10 hover:border-[#c9a96e]/30 hover:text-[#c9a96e] flex items-center justify-center text-white/60 transition-colors">
              ←
            </button>
            <select value={current.getMonth()} onChange={e => setCurrent(new Date(current.getFullYear(), Number(e.target.value), 1))}
              className="bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a96e]/40 transition-colors">
              {MONTHS.map((m, i) => <option key={m} value={i} className="bg-[#0d0d0d]">{m}</option>)}
            </select>
            <select value={current.getFullYear()} onChange={e => setCurrent(new Date(Number(e.target.value), current.getMonth(), 1))}
              className="bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a96e]/40 transition-colors">
              {YEARS.map(y => <option key={y} value={y} className="bg-[#0d0d0d]">{y}</option>)}
            </select>
            <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              className="w-9 h-9 rounded-full bg-white/6 border border-white/10 hover:border-[#c9a96e]/30 hover:text-[#c9a96e] flex items-center justify-center text-white/60 transition-colors">
              →
            </button>
          </div>
        </div>

        {/* ── CALENDAR GRID ── */}
        <div className="fade-up d2">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
              <div key={d} className="text-[10px] uppercase tracking-[0.2em] text-white/30 text-center py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => <div key={`pad-${i}`} />)}

            {days.map(d => {
              const key = formatDateKey(d);
              const dayEvents = eventsFor(key);
              const isToday = key === formatDateKey(new Date());

              return (
                <div key={key} onClick={() => { setSelectedEvent(null); setSelectedDate(key); }}
                  className={`day-cell min-h-[100px] rounded-xl border p-2 cursor-pointer transition-all duration-200 ${
                    isToday ? "border-[#c9a96e]/40 bg-[#c9a96e]/[0.04]" : "border-white/8 bg-white/[0.015]"
                  }`}>
                  <div className={`text-xs mb-1.5 font-medium ${isToday ? "gold" : "text-white/35"}`}>
                    {d.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(ev => (
                      <div key={ev.id} onClick={e => { e.stopPropagation(); setSelectedDate(null); setSelectedEvent(ev); }}
                        className={`text-[9px] px-1.5 py-1 rounded-md truncate cursor-pointer leading-tight ${TYPE_COLORS[ev.appointment_type || ""] || "bg-white/8 text-white/50"}`}>
                        {ev.event_time ? `${ev.event_time} ` : ""}{ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-white/25 pl-1">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── APPOINTMENTS TABLE ── */}
        <div className="fade-up d3 space-y-4">
          <div className="flex items-center gap-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">All Appointments</div>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-sm">⌕</span>
              <input value={tableSearch} onChange={e => setTableSearch(e.target.value)}
                placeholder="Search by title, client or venue…"
                className="w-full text-sm rounded-xl bg-white/[0.03] border border-white/10 pl-10 pr-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9a96e]/40 transition-colors" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="text-sm rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-white/60 focus:outline-none focus:border-[#c9a96e]/40 transition-colors">
              <option value="all" className="bg-[#0d0d0d]">All types</option>
              {APPOINTMENT_TYPES.map(t => <option key={t} value={t} className="bg-[#0d0d0d]">{t}</option>)}
            </select>
          </div>

          <div className="rounded-2xl border border-white/8 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {["Date","Time","Appointment","Client","Type","Venue"].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-white/30 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTableEvents.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-16 text-center text-xs text-white/25 tracking-widest uppercase">No appointments found</td></tr>
                )}
                {filteredTableEvents.map(ev => (
                  <tr key={ev.id} onClick={() => { setSelectedDate(null); setSelectedEvent(ev); }}
                    className="table-row border-b border-white/5 cursor-pointer transition-colors duration-150 last:border-0">
                    <td className="px-5 py-3.5 text-sm text-white/50">{fmtDate(ev.event_date)}</td>
                    <td className="px-5 py-3.5 text-sm text-white/35">{ev.event_time || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className="row-title text-sm font-light text-white transition-colors duration-150">{ev.title}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-white/50">{ev.client_name || "—"}</td>
                    <td className="px-5 py-3.5">
                      {ev.appointment_type
                        ? <span className={`text-[10px] px-2.5 py-1 rounded-full ${TYPE_COLORS[ev.appointment_type] || "bg-white/8 text-white/40"}`}>{ev.appointment_type}</span>
                        : <span className="text-white/25 text-sm">—</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 text-sm text-white/35">{ev.location_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── SIDEBAR: EVENT DETAIL ── */}
      {selectedEvent && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={() => setSelectedEvent(null)} />
          <div className="slide-in fixed inset-y-0 right-0 w-[500px] max-w-[95vw] bg-[#0e0e0e] border-l border-white/10 z-50 overflow-y-auto">

            <div className="sticky top-0 bg-[#0e0e0e] border-b border-white/10 px-8 py-6 flex items-start justify-between">
              <div>
                {selectedEvent.appointment_type && (
                  <span className={`inline-block text-[10px] px-2.5 py-1 rounded-full mb-3 ${TYPE_COLORS[selectedEvent.appointment_type] || "bg-white/8 text-white/40"}`}>
                    {selectedEvent.appointment_type}
                  </span>
                )}
                <h2 className="text-2xl font-light text-white leading-tight">{selectedEvent.title}</h2>
              </div>
              <button onClick={() => setSelectedEvent(null)}
                className="mt-1 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-colors text-sm flex-shrink-0">
                ✕
              </button>
            </div>
            <div className="gold-line h-px opacity-50" />

            <div className="px-8 py-6 space-y-8">
              <Section title="When">
                <DetailRow icon="📅" label="Date" value={fmtDate(selectedEvent.event_date)} />
                <DetailRow icon="🕐" label="Time" value={selectedEvent.event_time} />
                <DetailRow icon="⏱" label="Duration" value={selectedEvent.duration_minutes ? `${selectedEvent.duration_minutes} min` : null} />
              </Section>

              {(selectedEvent.location_name || selectedEvent.location_address) && (
                <Section title="Where">
                  <DetailRow icon="🏛" label="Venue" value={selectedEvent.location_name} />
                  <DetailRow icon="📍" label="Address" value={selectedEvent.location_address} />
                  {selectedEvent.location_maps_url && (
                    <a href={selectedEvent.location_maps_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-400/25 text-blue-300 hover:bg-blue-500/20 transition-colors text-sm">
                      🗺 Open in Google Maps
                    </a>
                  )}
                </Section>
              )}

              <Section title="Client & Garment">
                <DetailRow icon="👤" label="Client" value={selectedEvent.client_name} />
                <DetailRow icon="✂️" label="Garment Type" value={selectedEvent.fitting_type} />
                <DetailRow icon="👔" label="Garment" value={selectedEvent.garment} />
              </Section>

              {(selectedEvent.fabric_notes || selectedEvent.measurements_notes || selectedEvent.notes) && (
                <Section title="Tailoring Notes">
                  <DetailRow icon="🧵" label="Fabric" value={selectedEvent.fabric_notes} />
                  <DetailRow icon="📐" label="Measurements" value={selectedEvent.measurements_notes} />
                  <DetailRow icon="📝" label="Notes" value={selectedEvent.notes} />
                </Section>
              )}

              {selectedEvent.guests?.length > 0 && (
                <Section title="Guests">
                  {selectedEvent.guests.map((g, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/6 last:border-0">
                      <div className="w-9 h-9 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center text-sm gold flex-shrink-0">
                        {(g.name || g.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        {g.name && <div className="text-sm text-white font-light">{g.name}</div>}
                        <div className="text-xs text-white/40">{g.email}</div>
                      </div>
                    </div>
                  ))}
                </Section>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── SIDEBAR: CREATE EVENT ── */}
      {selectedDate && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" onClick={() => setSelectedDate(null)} />
          <div className="slide-in fixed inset-y-0 right-0 w-[540px] max-w-[95vw] bg-[#0e0e0e] border-l border-white/10 z-50 overflow-y-auto">

            <div className="sticky top-0 bg-[#0e0e0e] border-b border-white/10 px-8 py-6 flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">New Appointment</p>
                <h2 className="text-2xl font-light text-white">{selectedDate}</h2>
              </div>
              <button onClick={() => setSelectedDate(null)}
                className="mt-1 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-colors text-sm flex-shrink-0">
                ✕
              </button>
            </div>
            <div className="gold-line h-px opacity-50" />

            <div className="px-8 py-6 space-y-8">
              <FormSection title="General Details">
                <FInput label="Title *" value={form.title} onChange={v => setForm({...form, title: v})} />
                <div className="grid grid-cols-2 gap-3">
                  <FInput label="Time" type="time" value={form.time} onChange={v => setForm({...form, time: v})} />
                  <FInput label="Duration (min)" type="number" value={form.duration_minutes} onChange={v => setForm({...form, duration_minutes: v})} />
                </div>
                <FSelect label="Appointment Type" value={form.appointment_type} onChange={v => setForm({...form, appointment_type: v})} options={APPOINTMENT_TYPES} />
              </FormSection>

              <FormSection title="📍 Location">
                <FInput label="Venue Name" value={form.location_name} onChange={v => setForm({...form, location_name: v})} placeholder="e.g. Atelier Rossi" />
                <FInput label="Full Address" value={form.location_address} onChange={v => setForm({...form, location_address: v})} placeholder="e.g. Via Roma 12, Milan" />
                {form.location_address && (
                  <a href={buildMapsUrl(form.location_address)} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-400/25 text-blue-300 hover:bg-blue-500/20 transition-colors text-sm">
                    🗺 Preview on Google Maps
                  </a>
                )}
              </FormSection>

              <FormSection title="✂️ Client & Garment">
                <FInput label="Client Name" value={form.client_name} onChange={v => setForm({...form, client_name: v})} />
                <FSelect label="Garment Type" value={form.fitting_type} onChange={v => setForm({...form, fitting_type: v})} options={FITTING_TYPES} />
                <FInput label="Garment Description" value={form.garment} onChange={v => setForm({...form, garment: v})} placeholder="e.g. Wedding dress with long train" />
              </FormSection>

              <FormSection title="📋 Tailoring Notes">
                <FTextarea label="Fabric Notes" value={form.fabric_notes} onChange={v => setForm({...form, fabric_notes: v})} placeholder="White silk, satin lining…" />
                <FTextarea label="Measurements Notes" value={form.measurements_notes} onChange={v => setForm({...form, measurements_notes: v})} placeholder="Shoulders 42, waist 64…" />
                <FTextarea label="General Notes" value={form.notes} onChange={v => setForm({...form, notes: v})} />
              </FormSection>

              <FormSection title="👥 Guests (max 4)">
                <p className="text-xs text-white/35 -mt-1">Each guest will receive an email recap.</p>
                {form.guests.map((guest, i) => (
                  <div key={i} className="grid grid-cols-2 gap-3">
                    <FInput label={`Guest ${i + 1} — Name`} value={guest.name}
                      onChange={v => { const g = [...form.guests]; g[i] = {...g[i], name: v}; setForm({...form, guests: g}); }} />
                    <FInput label={`Guest ${i + 1} — Email`} type="email" value={guest.email}
                      onChange={v => { const g = [...form.guests]; g[i] = {...g[i], email: v}; setForm({...form, guests: g}); }} />
                  </div>
                ))}
              </FormSection>

              {emailStatus && (
                <div className={`text-sm px-4 py-3 rounded-xl font-medium ${emailStatus.startsWith("✓") ? "bg-green-900/20 text-green-300 border border-green-700/30" : "bg-red-900/20 text-red-300 border border-red-700/30"}`}>
                  {emailStatus}
                </div>
              )}

              <button onClick={saveEvent} disabled={sendingEmails}
                className="w-full px-6 py-4 rounded-full bg-white text-black text-sm font-semibold disabled:opacity-40 hover:bg-white/90 transition-opacity">
                {sendingEmails ? "Sending notifications…" : "Save Appointment"}
              </button>
            </div>
          </div>
        </>
      )}

      {loading && <div className="text-xs text-white/25 tracking-widest uppercase">Loading…</div>}
    </>
  );
}

/* =====================================================
   HELPERS
===================================================== */

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/35 border-b border-white/8 pb-2">{title}</div>
      {children}
    </div>
  );
}

function FInput({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/35 mb-2">{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/[0.03] border border-white/12 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a96e]/40 transition-colors" />
    </div>
  );
}

function FSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/35 mb-2">{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-white/[0.03] border border-white/12 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c9a96e]/40 transition-colors">
        <option value="" className="bg-[#0e0e0e]">— select —</option>
        {options.map(o => <option key={o} value={o} className="bg-[#0e0e0e]">{o}</option>)}
      </select>
    </div>
  );
}

function FTextarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/35 mb-2">{label}</div>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder}
        className="w-full bg-white/[0.03] border border-white/12 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a96e]/40 transition-colors resize-none" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">{title}</div>
        <div className="flex-1 h-px bg-white/8" />
      </div>
      {children}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-lg flex-shrink-0 mt-0.5 opacity-70">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-white/35 mb-0.5">{label}</div>
        <div className="text-sm text-white leading-snug">{value}</div>
      </div>
    </div>
  );
}