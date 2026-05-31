"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Bell, CheckCheck, MessageCircle, Briefcase, UserCheck, Info } from "lucide-react";

interface Notification {
  id: number;
  type: string;
  body: string;
  read: boolean;
  created_at: string;
}

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  stage_change:         { label: "Pipeline Update",     icon: Briefcase,     color: "text-[#ffd700]", bg: "bg-[rgba(255,215,0,0.1)]" },
  connection_request:   { label: "Connection Request",  icon: UserCheck,     color: "text-[#60a5fa]", bg: "bg-[rgba(96,165,250,0.1)]" },
  connection_accepted:  { label: "Connection Accepted", icon: UserCheck,     color: "text-[#4ade80]", bg: "bg-[rgba(74,222,128,0.1)]" },
  message:              { label: "New Message",         icon: MessageCircle, color: "text-[#c084fc]", bg: "bg-[rgba(192,132,252,0.1)]" },
  system:               { label: "System",              icon: Info,          color: "text-[#d0c6ab]", bg: "bg-[rgba(208,198,171,0.1)]" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getUser()) { router.replace("/login"); return; }
    apiClient.get<Notification[]>("/notifications/")
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markRead(id: number) {
    await apiClient.patch(`/notifications/${id}/`, { read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => apiClient.patch(`/notifications/${n.id}/`, { read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  function getConfig(type: string) {
    return TYPE_CONFIG[type] ?? TYPE_CONFIG.system;
  }

  return (
    <div className="min-h-screen bg-[var(--as-bg)] font-outfit text-[var(--as-text)]">
      <style>{`
        .glass-panel {
            background: rgba(22, 22, 24, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(77, 71, 50, 0.3);
        }
        .spotlight-hover:hover {
            box-shadow: 0 0 15px rgba(233, 196, 0, 0.2);
            border-color: #e9c400;
        }
      `}</style>
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(255,215,0,0.1)] flex items-center justify-center border border-[rgba(255,215,0,0.2)]">
              <Bell className="w-7 h-7 text-[#ffd700]" />
            </div>
            <div>
              <h1 className="font-syne text-3xl font-bold text-[#fff6df] tracking-tight m-0">
                Notifications
              </h1>
              <p className="text-[#d0c6ab] text-sm mt-1 font-medium">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up!"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#d0c6ab]/30 bg-[var(--as-surface)] hover:bg-[#353436] hover:border-[#ffd700]/50 text-[var(--as-text)] text-sm font-semibold transition-all cursor-pointer spotlight-hover"
            >
              <CheckCheck className="w-4 h-4 text-[#ffd700]" />
              Mark all as read
            </button>
          )}
        </div>

        {/* List */}
        <div className="glass-panel rounded-[24px] overflow-hidden shadow-2xl">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd700] to-[#544600] mx-auto mb-4 animate-pulse opacity-50" />
              <p className="text-[#d0c6ab] text-sm font-medium">Loading your notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-24 px-8">
              <Bell className="w-12 h-12 text-[#d0c6ab] mx-auto mb-4 opacity-20" />
              <p className="text-[#d0c6ab] text-base font-medium">No notifications yet.</p>
            </div>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col">
              {notifications.map((notif, i) => {
                const cfg = getConfig(notif.type);
                const Icon = cfg.icon;
                const isUnread = !notif.read;
                
                return (
                  <li
                    key={notif.id}
                    onClick={() => isUnread && markRead(notif.id)}
                    className={`flex items-start gap-4 p-6 transition-all border-b border-[#353436]/50 last:border-b-0
                      ${isUnread ? 'bg-[rgba(255,215,0,0.03)] cursor-pointer hover:bg-[rgba(255,215,0,0.06)] border-l-2 border-l-[#ffd700]' : 'bg-transparent border-l-2 border-l-transparent'}
                    `}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border border-white/5`}>
                      <Icon className={`w-6 h-6 ${cfg.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-[#d0c6ab] font-medium opacity-70">
                          • {relativeTime(notif.created_at)}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#ffd700] ml-auto shadow-[0_0_8px_rgba(255,215,0,0.5)] animate-pulse" />
                        )}
                      </div>
                      <p className={`text-[15px] m-0 leading-relaxed ${isUnread ? 'text-[#fff6df] font-semibold' : 'text-[#d0c6ab] font-medium'}`}>
                        {notif.body}
                      </p>
                      {notif.type === 'connection_request' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push('/network'); }} 
                          className="mt-3 px-4 py-1.5 bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/20 rounded-lg text-sm font-semibold hover:bg-[#ffd700]/20 transition-colors"
                        >
                          View in Network
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
