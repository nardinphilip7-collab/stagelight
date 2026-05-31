"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, Home, Users, Briefcase, MessageSquare, Bell, UserCircle, Menu, LogOut, Clapperboard, Settings, FileText, X, Film, PlusSquare, Radio, ChevronDown, Calendar } from "lucide-react";
import { getUser, logout } from "@/lib/auth";
import { apiClient } from "@/lib/api";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [myTalentId, setMyTalentId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);

    if (!currentUser) return;

    apiClient.get<{ id: number }[]>("/notifications/?unread=true")
      .then(data => setUnreadCount(data.length))
      .catch(() => { });
      
    apiClient.get<{id: string}[]>("/talents/?mine=true")
      .then(data => {
        if (data.length > 0) setMyTalentId(data[0].id);
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render navbar on auth pages
  if (pathname === '/login' || pathname === '/register') return null;

  const isHirerOrAgency = user?.role === 'HIRER' || user?.role === 'AGENCY';

  const navLinks = [
    { name: "Home", href: "/explore", icon: Home, badge: 0 },
    { name: "Reels", href: "/reels", icon: Film, badge: 0 },
    { name: "Lives", href: "/lives", icon: Radio, badge: 0 },
    { name: "Network", href: "/network", icon: Users, badge: 0 },
    ...(isHirerOrAgency
      ? [{ name: "My Jobs", href: "/manage-gigs", icon: Briefcase, badge: 0 }]
      : [{ name: "Jobs", href: "/opportunities", icon: Briefcase, badge: 0 }]),
    { name: "Messages", href: "/messages", icon: MessageSquare, badge: 0 },
    { name: "Notifications", href: "/notifications", icon: Bell, badge: unreadCount },
  ];

  const profileHref = isHirerOrAgency
    ? '/profile/hirer'
    : (myTalentId ? `/profile/${myTalentId}` : (user ? '/profile/edit?setup=1' : '/login'));

  const roleLinks = [
    ...(user?.role === 'HIRER' || user?.role === 'AGENCY'
      ? [
          { name: "My Jobs", href: "/manage-gigs", icon: Clapperboard },
          { name: "Bookings", href: "/bookings", icon: Calendar },
        ]
      : []),
    ...(user?.role === 'AGENCY'
      ? [{ name: "Roster", href: "/roster", icon: Users }]
      : []),
    ...(user?.role === 'ARTIST'
      ? [
          { name: "Create", href: "/create", icon: PlusSquare },
          { name: "My Work", href: "/submissions", icon: FileText },
          { name: "Bookings", href: "/bookings", icon: Calendar },
        ]
      : []),
  ];

  const userInitial = user?.email ? user.email[0].toUpperCase() : '?';

  // Dark theme tokens (matching StageLight reference)
  const T = {
    gold:    "#ffd700",
    goldDim: "#e9c400",
    text:    "#e5e2e3",
    muted:   "#999077",
    surface: "#1c1b1c",
    border:  "rgba(255,255,255,0.08)",
    hover:   "rgba(255,255,255,0.06)",
  };

  return (
    <>
      <nav
        className="fixed top-0 w-full z-50 h-16"
        style={{
          background: "rgba(13,13,14,0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: `1px solid ${T.border}`,
          boxShadow: "0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between lg:justify-start gap-8">

          {/* Logo */}
          <div className="flex items-center gap-3 flex-1 lg:flex-none">
            <Link href="/explore" className="shrink-0 group flex items-center">
              <span
                className="font-bold tracking-tighter text-2xl"
                style={{ color: T.gold, fontFamily: "var(--font-syne, sans-serif)" }}
              >
                StageLight
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="relative hidden md:block group w-64 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: T.muted }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                placeholder="Search talent and gigs..."
                className="w-full text-sm rounded-full h-9 pl-9 pr-4 outline-none transition-all"
                style={{
                  background: "rgba(14,14,15,0.8)",
                  border: `1px solid rgba(255,255,255,0.12)`,
                  color: T.text,
                }}
                onFocus={e => (e.currentTarget.style.borderColor = T.gold)}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
              />
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-end">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="relative flex flex-col items-center justify-center min-w-[70px] h-16 px-2 transition-colors border-b-2"
                  style={{
                    color: isActive ? T.gold : T.muted,
                    borderBottomColor: isActive ? T.gold : "transparent",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = T.text; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = T.muted; }}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {link.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-full flex items-center justify-center leading-none"
                        style={{ background: T.gold, color: "#221b00" }}>
                        {link.badge > 9 ? "9+" : link.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium mt-1 tracking-wide">{link.name}</span>
                </Link>
              );
            })}

            {/* Divider */}
            <div className="h-8 w-px mx-2" style={{ background: T.border }} />

            {/* Avatar dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="flex items-center gap-1.5 h-9 pl-1 pr-2 rounded-full transition-colors"
                style={{ color: T.muted }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.hover; (e.currentTarget as HTMLElement).style.color = T.text; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = T.muted; }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: T.gold, color: "#221b00" }}>
                  {userInitial}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-2xl overflow-hidden z-50"
                  style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  {/* User info */}
                  <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <p className="text-xs font-semibold" style={{ color: T.text }}>{user?.email}</p>
                    <p className="text-[11px] mt-0.5 capitalize" style={{ color: T.muted }}>{user?.role?.toLowerCase()}</p>
                  </div>

                  <div className="py-1">
                    {[
                      { href: profileHref, icon: UserCircle, label: "My Profile" },
                      ...roleLinks.map(l => ({ href: l.href, icon: l.icon, label: l.name })),
                    ].map(item => (
                      <Link key={item.label} href={item.href} onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                        style={{ color: T.muted }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.hover; (e.currentTarget as HTMLElement).style.color = T.text; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = T.muted; }}>
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    ))}

                    <div className="h-px my-1" style={{ background: T.border }} />

                    <Link href="/settings" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                      style={{ color: T.muted }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.hover; (e.currentTarget as HTMLElement).style.color = T.text; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = T.muted; }}>
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>

                    <button onClick={() => { setDropdownOpen(false); logout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left"
                      style={{ color: "#f87171" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <Link href="/messages" style={{ color: T.muted }}>
              <MessageSquare className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: T.muted }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 pt-14 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative rounded-b-2xl shadow-2xl mx-3 mt-1 overflow-hidden" style={{ backgroundColor: "#1C1C1E" }}>
            <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      setMobileMenuOpen(false);
                    }
                  }}
                  placeholder="Search opportunities..."
                  className="w-full text-sm rounded-full h-9 pl-9 pr-4 outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                />
              </div>
            </div>

            <div className="py-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                    style={{ color: isActive ? T.gold : "rgba(255,255,255,0.75)" }}
                  >
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {link.badge > 0 && (
                        <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-full flex items-center justify-center" style={{ background: T.gold, color: "#221b00" }}>
                          {link.badge > 9 ? "9+" : link.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium">{link.name}</span>
                  </Link>
                );
              })}

              <div className="h-px my-2" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />

              <Link href={profileHref} onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                style={{ color: "rgba(255,255,255,0.75)" }}>
                <UserCircle className="w-5 h-5" />
                <span className="text-sm font-medium">My Profile</span>
              </Link>

              {roleLinks.map(link => (
                <Link key={link.name} href={link.href} onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                  style={{ color: "rgba(255,255,255,0.75)" }}>
                  <link.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{link.name}</span>
                </Link>
              ))}

              <Link href="/settings" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                style={{ color: "rgba(255,255,255,0.75)" }}>
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
              </Link>

              {user && (
                <button onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors"
                  style={{ color: "#f87171" }}>
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}