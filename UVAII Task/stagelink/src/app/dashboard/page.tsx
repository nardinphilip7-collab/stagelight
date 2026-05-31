"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  TrendingUp, Users, Eye, ArrowUpRight,
  Briefcase, MessageCircle, UserCheck, Star, Bell,
  PlusSquare, FileText, Calendar,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  profile_views: number;
  submission_count: number;
  active_briefs: number;
  shortlisted_count: number;
  unread_messages: number;
  pending_connections: number;
  accepted_connections: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUser = getUser();

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    apiClient.get<DashboardData>('/analytics/dashboard/')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const val = (key: keyof DashboardData) =>
    loading ? "—" : (data?.[key] ?? 0).toLocaleString();

  const role = currentUser?.role ?? "ARTIST";
  const isHirer = role === "HIRER" || role === "AGENCY";

  const artistStats = [
    { label: "Profile Views",    value: val("profile_views"),      icon: Eye,           bg: "bg-primary/10",      iconColor: "text-primary",     href: null },
    { label: "Applications",     value: val("submission_count"),   icon: Briefcase,     bg: "bg-rose-500/10",     iconColor: "text-rose-500",    href: "/submissions" },
    { label: "Shortlisted",      value: val("shortlisted_count"),  icon: Star,          bg: "bg-amber-500/10",    iconColor: "text-amber-500",   href: "/submissions" },
    { label: "Connections",      value: val("accepted_connections"),icon: Users,         bg: "bg-emerald-500/10",  iconColor: "text-emerald-500", href: "/network" },
    { label: "Unread Messages",  value: val("unread_messages"),    icon: MessageCircle, bg: "bg-violet-500/10",   iconColor: "text-violet-500",  href: "/messages" },
    { label: "Pending Requests", value: val("pending_connections"),icon: UserCheck,     bg: "bg-orange-500/10",   iconColor: "text-orange-500",  href: "/network" },
  ];

  const hirerStats = [
    { label: "Active Gigs",      value: val("active_briefs"),      icon: TrendingUp,    bg: "bg-blue-500/10",     iconColor: "text-blue-500",    href: "/manage-gigs" },
    { label: "Profile Views",    value: val("profile_views"),      icon: Eye,           bg: "bg-primary/10",      iconColor: "text-primary",     href: null },
    { label: "Connections",      value: val("accepted_connections"),icon: Users,         bg: "bg-emerald-500/10",  iconColor: "text-emerald-500", href: "/network" },
    { label: "Unread Messages",  value: val("unread_messages"),    icon: MessageCircle, bg: "bg-violet-500/10",   iconColor: "text-violet-500",  href: "/messages" },
    { label: "Pending Requests", value: val("pending_connections"),icon: UserCheck,     bg: "bg-orange-500/10",   iconColor: "text-orange-500",  href: "/network" },
  ];

  const stats = isHirer ? hirerStats : artistStats;

  const artistLinks = [
    { label: "Browse Opportunities", href: "/opportunities",  icon: Briefcase  },
    { label: "View Submissions",     href: "/submissions",    icon: FileText   },
    { label: "Create Content",       href: "/create",         icon: PlusSquare },
    { label: "My Network",           href: "/network",        icon: Users      },
    { label: "Notifications",        href: "/notifications",  icon: Bell       },
  ];

  const hirerLinks = [
    { label: "Manage Gigs",      href: "/manage-gigs",     icon: TrendingUp  },
    { label: "Post Opportunity", href: "/manage-gigs/new", icon: PlusSquare  },
    { label: "Bookings",         href: "/bookings",        icon: Calendar    },
    { label: "My Network",       href: "/network",         icon: Users       },
    { label: "Notifications",    href: "/notifications",   icon: Bell        },
  ];

  const quickLinks = isHirer ? hirerLinks : artistLinks;

  const roleBadge = isHirer
    ? { label: role === "AGENCY" ? "Agency" : "Hirer", color: "bg-blue-500/10 text-blue-600" }
    : { label: "Artist", color: "bg-rose-500/10 text-rose-600" };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-outfit font-bold">Dashboard</h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadge.color}`}>
              {roleBadge.label}
            </span>
          </div>
          <p className="text-muted-foreground">
            Welcome back{currentUser?.email ? `, ${currentUser.email.split("@")[0]}` : ""}. Here&apos;s your overview.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const card = (
            <Card key={stat.label} className="bg-card/50 border-border p-5 rounded-3xl relative overflow-hidden group hover:border-primary/30 transition-colors cursor-pointer">
              <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold">{stat.value}</h3>
              <div className="flex items-center gap-1 text-xs text-emerald-500 font-medium mt-2">
                <ArrowUpRight className="w-3 h-3" />
                <span>Live</span>
              </div>
            </Card>
          );
          return stat.href ? <Link key={stat.label} href={stat.href}>{card}</Link> : card;
        })}
      </div>

      {/* Quick Access */}
      <Card className="bg-card/50 border-border rounded-3xl p-6">
        <h3 className="font-bold font-outfit text-xl mb-5">Quick Access</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-secondary/60 transition-colors cursor-pointer group text-center">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium group-hover:text-primary transition-colors leading-tight">{link.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
