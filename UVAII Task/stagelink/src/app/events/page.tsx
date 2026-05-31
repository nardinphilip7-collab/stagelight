"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  Calendar, MapPin, Wifi, Users,
  Loader2, CheckCircle2, Clock, Plus, X, Globe, Ticket,
} from "lucide-react";

interface Event {
  id: string;
  owner: number;
  owner_email: string;
  title: string;
  description: string;
  venue: string;
  city: string;
  event_date: string;
  ticket_price: string;
  capacity: number;
  is_virtual: boolean;
  stream_url: string | null;
  cover_image: string | null;
  published: boolean;
  created_at: string;
  tickets_sold: number;
  has_booked: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function isPast(iso: string) {
  return new Date(iso) < new Date();
}

export default function EventsPage() {
  const router = useRouter();
  const currentUser = getUser();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "", description: "", city: "", venue: "", event_date: "",
    ticket_price: "0", capacity: "100", is_virtual: false, stream_url: "", cover_image: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!currentUser) { router.replace("/login"); return; }
    apiClient.get<Event[]>("/events/")
      .then(setEvents)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load events"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleBook(event: Event) {
    if (event.has_booked) {
      setBookingId(event.id);
      try {
        await apiClient.delete(`/events/${event.id}/unbook/`);
        setEvents(prev => prev.map(e => e.id === event.id ? { ...e, has_booked: false, tickets_sold: e.tickets_sold - 1 } : e));
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Failed to cancel booking");
      } finally {
        setBookingId(null);
      }
      return;
    }
    setBookingId(event.id);
    try {
      await apiClient.post(`/events/${event.id}/book/`, { quantity: 1 });
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, has_booked: true, tickets_sold: e.tickets_sold + 1 } : e));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to book event");
    } finally {
      setBookingId(null);
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.city.trim() || !createForm.event_date) {
      setCreateError("Title, city, and date are required."); return;
    }
    setCreating(true); setCreateError("");
    try {
      const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const created = await apiClient.post<Event>("/events/", {
        id,
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        city: createForm.city.trim(),
        venue: createForm.venue.trim(),
        event_date: createForm.event_date,
        ticket_price: parseFloat(createForm.ticket_price) || 0,
        capacity: parseInt(createForm.capacity) || 100,
        is_virtual: createForm.is_virtual,
        stream_url: createForm.stream_url.trim() || null,
        cover_image: createForm.cover_image.trim() || null,
      });
      setEvents(prev => [created, ...prev]);
      setShowCreate(false);
      setCreateForm({ title: "", description: "", city: "", venue: "", event_date: "", ticket_price: "0", capacity: "100", is_virtual: false, stream_url: "", cover_image: "" });
    } catch (err: unknown) {
      const msg = (err as { data?: { detail?: string } })?.data?.detail || (err as Error)?.message || "Failed to create event.";
      setCreateError(msg);
    } finally { setCreating(false); }
  }

  const upcoming = events.filter(e => !isPast(e.event_date));
  const past = events.filter(e => isPast(e.event_date));

  return (
    <div className="artstage min-h-screen" style={{ backgroundColor: "var(--as-bg)" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "36px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "8px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", backgroundColor: "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calendar style={{ width: "26px", height: "26px", color: "var(--as-accent)" }} />
              </div>
              <div>
                <h1 style={{ fontFamily: "var(--as-font-display)", fontSize: "28px", fontWeight: "700", color: "var(--as-text)", letterSpacing: "-0.02em", margin: 0 }}>
                  Events
                </h1>
                <p style={{ color: "var(--as-text-muted)", fontSize: "14px", marginTop: "2px" }}>
                  Live performances, showcases and industry events
                </p>
              </div>
            </div>
          </div>
          {currentUser && (
            <button
              onClick={() => setShowCreate(v => !v)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 20px", borderRadius: "10px",
                backgroundColor: showCreate ? "#f3f4f6" : "var(--as-accent)",
                color: showCreate ? "var(--as-text)" : "white",
                border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "600",
              }}
            >
              {showCreate ? <X style={{ width: "16px", height: "16px" }} /> : <Plus style={{ width: "16px", height: "16px" }} />}
              {showCreate ? "Cancel" : "Create Event"}
            </button>
          )}
        </div>

        {/* Create Event Form */}
        {showCreate && (
          <form onSubmit={handleCreateEvent} style={{
            backgroundColor: "var(--as-surface)", border: "1px solid var(--as-border)",
            borderRadius: "16px", padding: "24px", marginBottom: "32px",
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--as-text)", marginBottom: "20px", marginTop: 0 }}>New Event</h3>
            {createError && <p style={{ fontSize: "13px", color: "#dc2626", marginBottom: "12px" }}>{createError}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--as-text-muted)", display: "block", marginBottom: "4px" }}>Title *</label>
                <input value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} required
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: "1px solid var(--as-border)", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--as-text-muted)", display: "block", marginBottom: "4px" }}>Date & Time *</label>
                <input type="datetime-local" value={createForm.event_date} onChange={e => setCreateForm(p => ({ ...p, event_date: e.target.value }))} required
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: "1px solid var(--as-border)", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--as-text-muted)", display: "block", marginBottom: "4px" }}>City *</label>
                <input value={createForm.city} onChange={e => setCreateForm(p => ({ ...p, city: e.target.value }))} required
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: "1px solid var(--as-border)", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--as-text-muted)", display: "block", marginBottom: "4px" }}>Venue</label>
                <input value={createForm.venue} onChange={e => setCreateForm(p => ({ ...p, venue: e.target.value }))} placeholder="Theatre name, studio…"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: "1px solid var(--as-border)", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--as-text-muted)", display: "block", marginBottom: "4px" }}>Ticket Price (0 = Free)</label>
                <input type="number" min="0" step="0.01" value={createForm.ticket_price} onChange={e => setCreateForm(p => ({ ...p, ticket_price: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: "1px solid var(--as-border)", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--as-text-muted)", display: "block", marginBottom: "4px" }}>Capacity</label>
                <input type="number" min="1" value={createForm.capacity} onChange={e => setCreateForm(p => ({ ...p, capacity: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: "1px solid var(--as-border)", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--as-text-muted)", display: "block", marginBottom: "4px" }}>Description *</label>
                <textarea value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} rows={3} required
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: "1px solid var(--as-border)", fontSize: "14px", outline: "none", resize: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" id="is_virtual" checked={createForm.is_virtual} onChange={e => setCreateForm(p => ({ ...p, is_virtual: e.target.checked }))} style={{ width: "16px", height: "16px", accentColor: "var(--as-accent)" }} />
                <label htmlFor="is_virtual" style={{ fontSize: "14px", color: "var(--as-text)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Globe style={{ width: "14px", height: "14px", color: "var(--as-accent)" }} /> Virtual / Online event
                </label>
              </div>
              {createForm.is_virtual && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--as-text-muted)", display: "block", marginBottom: "4px" }}>Stream URL</label>
                  <input type="url" value={createForm.stream_url} onChange={e => setCreateForm(p => ({ ...p, stream_url: e.target.value }))} placeholder="https://…"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: "1px solid var(--as-border)", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                </div>
              )}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--as-text-muted)", display: "block", marginBottom: "4px" }}>Cover Image URL (optional)</label>
                <input type="url" value={createForm.cover_image} onChange={e => setCreateForm(p => ({ ...p, cover_image: e.target.value }))} placeholder="https://…"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: "1px solid var(--as-border)", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button type="submit" disabled={creating} style={{
                padding: "10px 24px", borderRadius: "9px", backgroundColor: "var(--as-accent)",
                color: "white", border: "none", fontSize: "14px", fontWeight: "600", cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                {creating && <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />}
                {creating ? "Creating…" : "Publish Event"}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} style={{
                padding: "10px 20px", borderRadius: "9px", backgroundColor: "transparent",
                color: "var(--as-text-muted)", border: "1px solid var(--as-border)", fontSize: "14px", cursor: "pointer",
              }}>Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Loader2 style={{ width: "36px", height: "36px", color: "var(--as-accent)", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "var(--as-text-muted)", fontSize: "14px" }}>Loading events…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--as-text-muted)", fontSize: "14px" }}>{error}</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 32px", backgroundColor: "var(--as-surface)", border: "1px solid var(--as-border)", borderRadius: "20px" }}>
            <Calendar style={{ width: "48px", height: "48px", color: "var(--as-text-muted)", margin: "0 auto 16px", opacity: 0.3 }} />
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--as-text)", marginBottom: "8px" }}>No events yet</h3>
            <p style={{ color: "var(--as-text-muted)", fontSize: "14px" }}>
              Check back soon for upcoming events.
            </p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--as-text)", marginBottom: "16px" }}>Upcoming</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px", marginBottom: "40px" }}>
                  {upcoming.map(event => (
                    <EventCard key={event.id} event={event} bookingId={bookingId} onBook={handleBook} currentUserId={currentUser?.user_id} />
                  ))}
                </div>
              </>
            )}
            {past.length > 0 && (
              <>
                <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--as-text-muted)", marginBottom: "16px" }}>Past Events</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px", opacity: 0.7 }}>
                  {past.map(event => (
                    <EventCard key={event.id} event={event} bookingId={bookingId} onBook={handleBook} currentUserId={currentUser?.user_id} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  bookingId,
  onBook,
  currentUserId,
}: {
  event: Event;
  bookingId: string | null;
  onBook: (e: Event) => void;
  currentUserId?: number;
}) {
  const past = isPast(event.event_date);
  const soldOut = event.tickets_sold >= event.capacity;
  const isOwner = event.owner === currentUserId;
  const loading = bookingId === event.id;

  return (
    <div style={{
      backgroundColor: "var(--as-surface)",
      border: "1px solid var(--as-border)",
      borderRadius: "16px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Cover image */}
      {event.cover_image ? (
        <img
          src={event.cover_image}
          alt={event.title}
          style={{ width: "100%", height: "160px", objectFit: "cover" }}
        />
      ) : (
        <div style={{
          height: "160px",
          background: "linear-gradient(135deg, var(--as-accent) 0%, #C8A882 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Calendar style={{ width: "40px", height: "40px", color: "white", opacity: 0.7 }} />
        </div>
      )}

      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* Badges */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {event.is_virtual && (
            <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "9999px", backgroundColor: "#EFF6FF", color: "#3B82F6", display: "flex", alignItems: "center", gap: "3px" }}>
              <Wifi style={{ width: "10px", height: "10px" }} />Virtual
            </span>
          )}
          {past && (
            <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "9999px", backgroundColor: "#F3F4F6", color: "#6B7280" }}>
              Past
            </span>
          )}
          {soldOut && !past && (
            <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "9999px", backgroundColor: "#FEF2F2", color: "#EF4444" }}>
              Sold Out
            </span>
          )}
          {event.has_booked && (
            <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "9999px", backgroundColor: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", gap: "3px" }}>
              <CheckCircle2 style={{ width: "10px", height: "10px" }} />Booked
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{ fontWeight: "700", fontSize: "15px", color: "var(--as-text)", margin: 0, lineHeight: 1.3 }}>
          {event.title}
        </h3>

        {/* Meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={{ fontSize: "12px", color: "var(--as-text-muted)", display: "flex", alignItems: "center", gap: "5px", margin: 0 }}>
            <Clock style={{ width: "11px", height: "11px", flexShrink: 0 }} />
            {formatDate(event.event_date)} · {formatTime(event.event_date)}
          </p>
          {(event.venue || event.city) && (
            <p style={{ fontSize: "12px", color: "var(--as-text-muted)", display: "flex", alignItems: "center", gap: "5px", margin: 0 }}>
              <MapPin style={{ width: "11px", height: "11px", flexShrink: 0 }} />
              {[event.venue, event.city].filter(Boolean).join(", ")}
            </p>
          )}
          <p style={{ fontSize: "12px", color: "var(--as-text-muted)", display: "flex", alignItems: "center", gap: "5px", margin: 0 }}>
            <Users style={{ width: "11px", height: "11px", flexShrink: 0 }} />
            {event.tickets_sold} / {event.capacity} attending
          </p>
        </div>

        {/* Price + action */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "10px", borderTop: "1px solid var(--as-border)" }}>
          <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--as-text)" }}>
            {parseFloat(event.ticket_price) === 0 ? "Free" : `$${parseFloat(event.ticket_price).toFixed(2)}`}
          </span>

          {!isOwner && !past && (
            <button
              onClick={() => onBook(event)}
              disabled={loading || (soldOut && !event.has_booked)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "7px 14px",
                borderRadius: "8px",
                backgroundColor: event.has_booked ? "#F3F4F6" : soldOut ? "#F3F4F6" : "var(--as-accent)",
                color: event.has_booked ? "#6B7280" : soldOut ? "#6B7280" : "white",
                border: "none",
                fontSize: "12px",
                fontWeight: "600",
                cursor: loading || (soldOut && !event.has_booked) ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <Loader2 style={{ width: "12px", height: "12px", animation: "spin 1s linear infinite" }} />
              ) : (
                <Ticket style={{ width: "12px", height: "12px" }} />
              )}
              {event.has_booked ? "Cancel" : soldOut ? "Sold Out" : "Book"}
            </button>
          )}

          {isOwner && (
            <span style={{ fontSize: "11px", color: "var(--as-text-muted)", fontStyle: "italic" }}>Your event</span>
          )}
        </div>
      </div>
    </div>
  );
}
