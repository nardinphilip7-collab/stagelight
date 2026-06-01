"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  CheckCircle2, Loader2, KeyRound, Bell, User,
  Shield, AlertCircle,
  ChevronRight, CreditCard, LogOut, Eye, EyeOff,
  Activity, Heart, Bookmark
} from "lucide-react";
import Link from "next/link";
import { logout } from "@/lib/auth";

const glass: React.CSSProperties = {
  background: "rgba(22,22,24,0.7)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.1)",
};
const iconTile: React.CSSProperties = {
  backgroundColor: "rgba(255,215,0,0.1)",
  border: "1px solid rgba(255,215,0,0.2)",
};
const SYNE = "var(--font-syne, sans-serif)";

export default function SettingsPage() {
  const currentUser = getUser();
  const isHirerOrAgency = currentUser?.role === 'HIRER' || currentUser?.role === 'AGENCY';

  const router = useRouter();
  const [meData, setMeData] = useState<{ date_joined?: string } | null>(null);

  useEffect(() => {
    if (!currentUser) { router.replace("/login"); return; }
    apiClient.get<{ date_joined: string }>('/auth/me/').then(setMeData).catch(() => {});
    apiClient.get('/auth/notification-prefs/').then((prefs: unknown) => {
      if (prefs && typeof prefs === 'object') {
        setNotifPrefs(prev => ({ ...prev, ...(prefs as Record<string, boolean>) }));
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    application_updates: true,
    connection_requests: true,
    direct_messages: true,
    opportunity_alerts: false,
    marketing: false,
  });

  const NOTIF_LABELS: { key: string; label: string; description: string }[] = [
    { key: "application_updates", label: "Application Updates",    description: "Stage changes and application status" },
    { key: "connection_requests", label: "Connection Requests",    description: "New connection requests and acceptances" },
    { key: "direct_messages",     label: "Direct Messages",       description: "New message notifications" },
    { key: "opportunity_alerts",  label: "Opportunity Alerts",    description: "New opportunities matching your profile" },
    { key: "marketing",           label: "Marketing Communications", description: "News, tips, and special offers" },
  ];

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPw.length < 8) {
      setPwMessage({ ok: false, text: "Password must be at least 8 characters long." });
      return;
    }

    if (newPw !== confirmPw) {
      setPwMessage({ ok: false, text: "New passwords do not match." });
      return;
    }

    setPwSaving(true);
    setPwMessage(null);

    try {
      const res = await apiClient.post<{ detail: string }>("/auth/change-password/", {
        old_password: oldPw,
        new_password: newPw,
      });
      setPwMessage({ ok: true, text: res.detail });
      setOldPw("");
      setNewPw("");
      setConfirmPw("");

      // Clear success message after 5 seconds
      setTimeout(() => setPwMessage(null), 5000);
    } catch (e: unknown) {
      const msg = (e as { data?: { detail?: string } })?.data?.detail
        || "Failed to change password. Please verify your current password.";
      setPwMessage({ ok: false, text: msg });
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="artstage" style={{ minHeight: "100vh", backgroundColor: "var(--as-bg)" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", ...iconTile, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User style={{ width: "28px", height: "28px", color: "var(--as-accent)" }} />
            </div>
            <div>
              <h1 style={{ fontFamily: SYNE, fontSize: "36px", fontWeight: "700", color: "#ffd700", letterSpacing: "-0.02em", margin: 0 }}>
                Settings
              </h1>
              <p style={{ color: "var(--as-text-muted)", fontSize: "14px", marginTop: "4px" }}>
                Manage your account preferences and security settings
              </p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Account Information Section */}
          <div style={{ ...glass, borderRadius: "20px", overflow: "hidden" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid var(--as-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", ...iconTile, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User style={{ width: "20px", height: "20px", color: "var(--as-accent)" }} />
                </div>
                <div>
                  <h2 style={{ fontFamily: SYNE, fontSize: "18px", fontWeight: "700", color: "#fff", margin: 0 }}>Account Information</h2>
                  <p style={{ fontSize: "13px", color: "var(--as-text-muted)", marginTop: "2px" }}>Manage your personal details and account settings</p>
                </div>
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ paddingBottom: "12px", borderBottom: "1px solid var(--as-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: "13px", color: "var(--as-text-muted)", marginBottom: "2px" }}>Email Address</p>
                      <p style={{ fontSize: "15px", fontWeight: "500", color: "var(--as-text)", margin: 0 }}>{currentUser?.email ?? "—"}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--as-border)" }}>
                  <div>
                    <p style={{ fontSize: "13px", color: "var(--as-text-muted)", marginBottom: "2px" }}>Account Role</p>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: "600",
                      backgroundColor: "rgba(255,215,0,0.12)",
                      border: "1px solid rgba(255,215,0,0.25)",
                      color: "#ffd700"
                    }}>
                      {currentUser?.role ?? "—"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "13px", color: "var(--as-text-muted)", marginBottom: "2px" }}>Member Since</p>
                    <p style={{ fontSize: "15px", fontWeight: "500", color: "var(--as-text)", margin: 0 }}>
                      {meData?.date_joined
                        ? new Date(meData.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--as-border)", display: "flex", gap: "16px" }}>
                <Link href={isHirerOrAgency ? '/profile/hirer' : '/profile/edit'}>
                  <span style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "var(--as-accent)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}>
                    {isHirerOrAgency ? 'My Profile' : 'Edit Talent Profile'}
                    <ChevronRight style={{ width: "14px", height: "14px" }} />
                  </span>
                </Link>
                <Link href="/verify">
                  <span style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "var(--as-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}>
                    Verification Status
                    <ChevronRight style={{ width: "14px", height: "14px" }} />
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Security Section - Change Password */}
          <div style={{ ...glass, borderRadius: "20px", overflow: "hidden" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid var(--as-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", ...iconTile, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield style={{ width: "20px", height: "20px", color: "var(--as-accent)" }} />
                </div>
                <div>
                  <h2 style={{ fontFamily: SYNE, fontSize: "18px", fontWeight: "700", color: "#fff", margin: 0 }}>Security</h2>
                  <p style={{ fontSize: "13px", color: "var(--as-text-muted)", marginTop: "2px" }}>Protect your account with strong security settings</p>
                </div>
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              <form onSubmit={handleChangePassword}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "500", color: "var(--as-text)", display: "block", marginBottom: "8px" }}>
                    Current Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showOldPassword ? "text" : "password"}
                      value={oldPw}
                      onChange={e => setOldPw(e.target.value)}
                      placeholder="Enter your current password"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        paddingRight: "44px",
                        borderRadius: "12px",
                        border: "1px solid var(--as-border)",
                        backgroundColor: "#1c1b1c",
                        fontSize: "14px",
                        color: "var(--as-text)",
                        outline: "none",
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--as-accent)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--as-border)"}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--as-text-muted)",
                      }}
                    >
                      {showOldPassword ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "500", color: "var(--as-text)", display: "block", marginBottom: "8px" }}>
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      placeholder="At least 8 characters"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        paddingRight: "44px",
                        borderRadius: "12px",
                        border: "1px solid var(--as-border)",
                        backgroundColor: "#1c1b1c",
                        fontSize: "14px",
                        color: "var(--as-text)",
                        outline: "none",
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--as-accent)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--as-border)"}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--as-text-muted)",
                      }}
                    >
                      {showNewPassword ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "500", color: "var(--as-text)", display: "block", marginBottom: "8px" }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      placeholder="Confirm your new password"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        paddingRight: "44px",
                        borderRadius: "12px",
                        border: "1px solid var(--as-border)",
                        backgroundColor: "#1c1b1c",
                        fontSize: "14px",
                        color: "var(--as-text)",
                        outline: "none",
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--as-accent)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--as-border)"}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--as-text-muted)",
                      }}
                    >
                      {showConfirmPassword ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
                    </button>
                  </div>
                </div>

                {pwMessage && (
                  <div style={{
                    marginBottom: "20px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    backgroundColor: pwMessage.ok ? "rgba(0,219,232,0.1)" : "rgba(225,1,17,0.12)",
                    border: pwMessage.ok ? "1px solid rgba(0,219,232,0.3)" : "1px solid rgba(225,1,17,0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}>
                    {pwMessage.ok && <CheckCircle2 style={{ width: "16px", height: "16px", color: "#00dbe8" }} />}
                    {!pwMessage.ok && <AlertCircle style={{ width: "16px", height: "16px", color: "#ffb4ab" }} />}
                    <p style={{ fontSize: "13px", color: pwMessage.ok ? "#00dbe8" : "#ffb4ab", margin: 0 }}>
                      {pwMessage.text}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pwSaving}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "9999px",
                    backgroundColor: "#ffd700",
                    color: "#221b00",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "14px",
                    transition: "box-shadow 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: pwSaving ? 0.7 : 1,
                  }}
                  onMouseEnter={e => !pwSaving && (e.currentTarget.style.boxShadow = "0 0 20px rgba(255,215,0,0.35)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                >
                  {pwSaving ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <KeyRound style={{ width: "16px", height: "16px" }} />}
                  {pwSaving ? "Updating Password..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>

          {/* Notification Preferences Section */}
          <div style={{ ...glass, borderRadius: "20px", overflow: "hidden" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid var(--as-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", ...iconTile, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bell style={{ width: "20px", height: "20px", color: "var(--as-accent)" }} />
                </div>
                <div>
                  <h2 style={{ fontFamily: SYNE, fontSize: "18px", fontWeight: "700", color: "#fff", margin: 0 }}>Notification Preferences</h2>
                  <p style={{ fontSize: "13px", color: "var(--as-text-muted)", marginTop: "2px" }}>Control how and when you receive notifications</p>
                </div>
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {NOTIF_LABELS.map((item, idx) => (
                  <div key={item.key} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: idx < NOTIF_LABELS.length - 1 ? "16px" : 0,
                    borderBottom: idx < NOTIF_LABELS.length - 1 ? "1px solid var(--as-border)" : "none",
                  }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: "500", color: "var(--as-text)", marginBottom: "2px" }}>{item.label}</p>
                      <p style={{ fontSize: "12px", color: "var(--as-text-muted)", margin: 0 }}>{item.description}</p>
                    </div>
                    <div
                      onClick={() => {
                        const newValue = !notifPrefs[item.key];
                        setNotifPrefs(prev => ({ ...prev, [item.key]: newValue }));
                        apiClient.patch('/auth/notification-prefs/', { [item.key]: newValue }).catch(() => {});
                      }}
                      style={{
                        width: "44px",
                        height: "24px",
                        borderRadius: "9999px",
                        backgroundColor: notifPrefs[item.key] ? "var(--as-accent)" : "var(--as-border)",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                        position: "relative",
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: "#1c1b1c",
                        position: "absolute",
                        top: "2px",
                        left: notifPrefs[item.key] ? "22px" : "2px",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }} />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Activity Section */}
          <div style={{ ...glass, borderRadius: "20px", overflow: "hidden" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid var(--as-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", ...iconTile, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity style={{ width: "20px", height: "20px", color: "var(--as-accent)" }} />
                </div>
                <div>
                  <h2 style={{ fontFamily: SYNE, fontSize: "18px", fontWeight: "700", color: "#fff", margin: 0 }}>Activity</h2>
                  <p style={{ fontSize: "13px", color: "var(--as-text-muted)", marginTop: "2px" }}>Browse your saved and liked content</p>
                </div>
              </div>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <Link href="/saved" style={{ display: "block", textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px", borderRadius: "12px", border: "1px solid var(--as-border)",
                  backgroundColor: "#131314", transition: "all 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--as-accent)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--as-border)"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#1c1b1c", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <Bookmark style={{ width: "18px", height: "18px", color: "var(--as-accent)" }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: "500", color: "var(--as-text)", margin: 0 }}>Saved Posts & Reels</h3>
                      <p style={{ fontSize: "12px", color: "var(--as-text-muted)", margin: 0, marginTop: "2px" }}>View content you've bookmarked for later</p>
                    </div>
                  </div>
                  <ChevronRight style={{ width: "16px", height: "16px", color: "var(--as-text-muted)" }} />
                </div>
              </Link>

              <Link href="/liked" style={{ display: "block", textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px", borderRadius: "12px", border: "1px solid var(--as-border)",
                  backgroundColor: "#131314", transition: "all 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--as-accent)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--as-border)"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#1c1b1c", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <Heart style={{ width: "18px", height: "18px", color: "#C8312A" }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: "500", color: "var(--as-text)", margin: 0 }}>Liked Content</h3>
                      <p style={{ fontSize: "12px", color: "var(--as-text-muted)", margin: 0, marginTop: "2px" }}>Browse posts and reels you've liked</p>
                    </div>
                  </div>
                  <ChevronRight style={{ width: "16px", height: "16px", color: "var(--as-text-muted)" }} />
                </div>
              </Link>
            </div>
          </div>

          {/* Billing Section Placeholder */}
          <div style={{ ...glass, borderRadius: "20px", overflow: "hidden", opacity: 0.6 }}>
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "#131314", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CreditCard style={{ width: "20px", height: "20px", color: "var(--as-text-muted)" }} />
                </div>
                <div>
                  <h2 style={{ fontFamily: SYNE, fontSize: "18px", fontWeight: "700", color: "#fff", margin: 0 }}>Billing & Payments</h2>
                  <p style={{ fontSize: "13px", color: "var(--as-text-muted)", marginTop: "2px" }}>Manage your payment methods and subscription</p>
                </div>
              </div>
              <div style={{ marginTop: "16px", padding: "20px", backgroundColor: "#131314", borderRadius: "12px", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "var(--as-text-muted)", margin: 0 }}>Payment features will be available soon</p>
              </div>
            </div>
          </div>

          {/* Logout Button - FIXED SYNTAX */}
          <div style={{ marginTop: "8px", textAlign: "center" }}>
            <button
              onClick={() => logout()}
              style={{
                padding: "10px 24px",
                borderRadius: "9999px",
                backgroundColor: "transparent",
                color: "var(--as-text-muted)",
                border: "1px solid var(--as-border)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                transition: "all 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#C8312A";
                e.currentTarget.style.color = "#C8312A";
                e.currentTarget.style.backgroundColor = "rgba(200, 49, 42, 0.05)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--as-border)";
                e.currentTarget.style.color = "var(--as-text-muted)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <LogOut style={{ width: "14px", height: "14px" }} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}