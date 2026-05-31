"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  Users, MapPin, CheckCircle2, MessageCircle, CalendarCheck,
  Search, Loader2, UserPlus, Settings,
} from "lucide-react";

interface TalentProfile {
  id: string;
  name: string;
  category: string;
  avatar: string;
  location: string;
  verified: boolean;
  rating: number;
  availability_status: string;
  agency: string;
}

export default function RosterPage() {
  const router = useRouter();
  const currentUser = getUser();

  const [roster, setRoster] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [localQuery, setLocalQuery] = useState("");

  useEffect(() => {
    if (!currentUser) { router.replace("/login"); return; }
    if (currentUser.role !== "AGENCY") { router.replace("/explore"); return; }

    apiClient.get<TalentProfile[]>("/roster/")
      .then(setRoster)
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Failed to load roster";
        setError(msg);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = localQuery.trim()
    ? roster.filter(t =>
        t.name.toLowerCase().includes(localQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(localQuery.toLowerCase()) ||
        t.location?.toLowerCase().includes(localQuery.toLowerCase()),
      )
    : roster;

  const available = roster.filter(t => t.availability_status === "Available").length;

  return (
    <div className="artstage min-h-screen" style={{ backgroundColor: "var(--as-bg)" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "36px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "8px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", backgroundColor: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users style={{ width: "26px", height: "26px", color: "var(--as-accent)" }} />
              </div>
              <div>
                <h1 style={{ fontFamily: "var(--as-font-display)", fontSize: "28px", fontWeight: "700", color: "var(--as-text)", letterSpacing: "-0.02em", margin: 0 }}>
                  My Roster
                </h1>
                <p style={{ color: "var(--as-text-muted)", fontSize: "14px", marginTop: "2px" }}>
                  Artists represented by your agency
                </p>
              </div>
            </div>
          </div>
          <Link href="/search">
            <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "9999px", backgroundColor: "var(--as-accent)", color: "white", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
              <UserPlus style={{ width: "14px", height: "14px" }} />
              Find Artists
            </button>
          </Link>
        </div>

        {/* Stats bar */}
        {!loading && !error && roster.length > 0 && (
          <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
            {[
              { label: "Total clients", value: roster.length, color: "var(--as-accent)" },
              { label: "Available now", value: available, color: "#16a34a" },
              { label: "In active booking", value: roster.filter(t => t.availability_status === "Booked").length, color: "#7c3aed" },
            ].map(stat => (
              <div key={stat.label} style={{ flex: "1 1 140px", backgroundColor: "var(--as-surface)", border: "1px solid var(--as-border)", borderRadius: "14px", padding: "16px 20px" }}>
                <p style={{ fontSize: "24px", fontWeight: "700", color: stat.color, margin: "0 0 2px" }}>{stat.value}</p>
                <p style={{ fontSize: "12px", color: "var(--as-text-muted)", margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search within roster */}
        {!loading && !error && roster.length > 0 && (
          <div style={{ position: "relative", marginBottom: "24px" }}>
            <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--as-text-muted)" }} />
            <input
              type="text"
              value={localQuery}
              onChange={e => setLocalQuery(e.target.value)}
              placeholder="Search within your roster…"
              style={{ width: "100%", paddingLeft: "42px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "10px", border: "1px solid var(--as-border)", backgroundColor: "var(--as-surface)", color: "var(--as-text)", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Loader2 style={{ width: "36px", height: "36px", color: "var(--as-accent)", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "var(--as-text-muted)", fontSize: "14px" }}>Loading your roster…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error === "Set your agency name in settings first." ? (
          <div style={{ textAlign: "center", padding: "64px 32px", backgroundColor: "var(--as-surface)", border: "1px solid var(--as-border)", borderRadius: "20px" }}>
            <Settings style={{ width: "48px", height: "48px", color: "var(--as-text-muted)", margin: "0 auto 16px", opacity: 0.4 }} />
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--as-text)", marginBottom: "8px" }}>Set your agency name first</h3>
            <p style={{ color: "var(--as-text-muted)", fontSize: "14px", marginBottom: "24px" }}>
              Your roster is matched by agency name. Go to Settings and add your first and last name as your agency name.
            </p>
            <Link href="/settings">
              <button style={{ padding: "10px 28px", borderRadius: "9999px", backgroundColor: "var(--as-accent)", color: "white", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                Go to Settings
              </button>
            </Link>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--as-text-muted)", fontSize: "14px" }}>
            {error}
          </div>
        ) : filtered.length === 0 && localQuery ? (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--as-text-muted)", fontSize: "14px" }}>
            No artists match "{localQuery}".
          </div>
        ) : roster.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 32px", backgroundColor: "var(--as-surface)", border: "1px solid var(--as-border)", borderRadius: "20px" }}>
            <Users style={{ width: "48px", height: "48px", color: "var(--as-text-muted)", margin: "0 auto 16px", opacity: 0.3 }} />
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--as-text)", marginBottom: "8px" }}>Your roster is empty</h3>
            <p style={{ color: "var(--as-text-muted)", fontSize: "14px", marginBottom: "8px" }}>
              Artists appear here when their talent profile has your agency name set.
            </p>
            <p style={{ color: "var(--as-text-muted)", fontSize: "13px", marginBottom: "24px" }}>
              Ask artists you represent to set <strong>"{currentUser?.email}"</strong> (your agency name) in their profile settings.
            </p>
            <Link href="/search">
              <button style={{ padding: "10px 28px", borderRadius: "9999px", backgroundColor: "var(--as-accent)", color: "white", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                Browse Artists
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {filtered.map(talent => (
              <div
                key={talent.id}
                style={{ backgroundColor: "var(--as-surface)", border: "1px solid var(--as-border)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}
              >
                {/* Artist info */}
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "linear-gradient(135deg, var(--as-accent) 0%, #C8A882 100%)", flexShrink: 0, overflow: "hidden" }}>
                    {talent.avatar ? (
                      <img src={talent.avatar} alt={talent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "20px" }}>
                        {talent.name?.charAt(0) ?? "?"}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <h3 style={{ fontWeight: "700", fontSize: "15px", color: "var(--as-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {talent.name}
                      </h3>
                      {talent.verified && <CheckCircle2 style={{ width: "14px", height: "14px", color: "var(--as-accent)", flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--as-text-muted)", margin: "2px 0" }}>{talent.category}</p>
                    {talent.location && (
                      <p style={{ fontSize: "11px", color: "var(--as-text-muted)", display: "flex", alignItems: "center", gap: "3px", margin: 0 }}>
                        <MapPin style={{ width: "10px", height: "10px" }} />{talent.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Availability badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "9999px",
                    backgroundColor: talent.availability_status === "Available" ? "#dcfce7" : talent.availability_status === "Booked" ? "#ede9fe" : "#f3f4f6",
                    color: talent.availability_status === "Available" ? "#16a34a" : talent.availability_status === "Booked" ? "#7c3aed" : "#6b7280",
                  }}>
                    {talent.availability_status || "Unknown"}
                  </span>
                </div>

                {/* Quick actions */}
                <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--as-border)", paddingTop: "14px" }}>
                  <Link href={`/profile/${talent.id}`} style={{ flex: 1 }}>
                    <button style={{ width: "100%", padding: "7px", borderRadius: "8px", backgroundColor: "var(--as-bg)", border: "1px solid var(--as-border)", fontSize: "12px", fontWeight: "600", color: "var(--as-text)", cursor: "pointer" }}>
                      Profile
                    </button>
                  </Link>
                  <Link href={`/network`} style={{ flex: 1 }}>
                    <button style={{ width: "100%", padding: "7px", borderRadius: "8px", backgroundColor: "var(--as-bg)", border: "1px solid var(--as-border)", fontSize: "12px", fontWeight: "600", color: "var(--as-text)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <MessageCircle style={{ width: "12px", height: "12px" }} />Message
                    </button>
                  </Link>
                  <Link href={`/bookings`} style={{ flex: 1 }}>
                    <button style={{ width: "100%", padding: "7px", borderRadius: "8px", backgroundColor: "var(--as-accent)", border: "none", fontSize: "12px", fontWeight: "600", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <CalendarCheck style={{ width: "12px", height: "12px" }} />Book
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
