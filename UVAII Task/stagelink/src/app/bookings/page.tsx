"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Briefcase, Calendar, DollarSign, Check, X, Clock, User, MessageSquare, Building, ExternalLink } from "lucide-react";
import Link from "next/link";

interface BookingOffer {
  id: number;
  opportunity_title: string;
  opportunity?: {
    id: string;
    title: string;
  };
  from_user_email: string;
  from_user?: number;
  amount: string;
  currency: string;
  message: string;
  start_date: string | null;
  end_date: string | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  created_at: string;
  updated_at: string;
  talent_name: string;
  talent_avatar?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING: { label: "Pending", color: "text-[var(--as-accent)]", bg: "bg-[rgba(255,215,0,0.12)]", icon: Clock },
  ACCEPTED: { label: "Accepted", color: "text-[#4ade80]", bg: "bg-[rgba(74,222,128,0.08)]", icon: Check },
  DECLINED: { label: "Declined", color: "text-red-700", bg: "bg-[rgba(225,1,17,0.12)]", icon: X },
  WITHDRAWN: { label: "Withdrawn", color: "text-gray-500", bg: "bg-[rgba(255,255,255,0.04)]", icon: X },
};

export default function BookingsPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<BookingOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acceptToast, setAcceptToast] = useState<string | null>(null);
  const currentUser = getUser();
  const isHirerOrAgency = currentUser?.role === "HIRER" || currentUser?.role === "AGENCY";

  useEffect(() => {
    if (!getUser()) { router.replace("/login"); return; }
    fetchOffers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  async function fetchOffers() {
    try {
      const data = await apiClient.get<BookingOffer[]>(`/bookings/?_t=${Date.now()}`);
      setOffers(data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: number, action: "accept" | "decline" | "withdraw") {
    setActionLoading(id);
    setActionError(null);
    try {
      const updated = await apiClient.patch<BookingOffer>(`/bookings/${id}/${action}/`, {});
      setOffers((prev) => prev.map((o) => (o.id === id ? updated : o)));
      if (action === "accept" && (updated.start_date || updated.end_date)) {
        const dateStr = updated.start_date && updated.end_date
          ? `${updated.start_date} – ${updated.end_date}`
          : updated.start_date || updated.end_date || "";
        setAcceptToast(`Booking accepted. Your calendar has been updated to Booked for ${dateStr}.`);
        setTimeout(() => setAcceptToast(null), 5000);
      }
    } catch {
      setActionError(`Failed to ${action} offer. Please try again.`);
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setActionLoading(null);
    }
  }

  // Filter and separate offers by role
  const filteredOffers = offers.filter(o => 
    (o.opportunity_title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.talent_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.from_user_email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const receivedOffers = filteredOffers.filter(o => o.talent_name && !isHirerOrAgency);
  const sentOffers = filteredOffers.filter(o => isHirerOrAgency || !o.talent_name);

  const EmptyState = ({ type }: { type: "received" | "sent" }) => (
    <div className="relative overflow-hidden text-center py-20 px-6 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent shadow-2xl backdrop-blur-xl group">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,215,0,0.05),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.05)] group-hover:scale-110 group-hover:border-[#ffd700]/30 transition-all duration-500">
        <Briefcase className="w-8 h-8 text-white/40 group-hover:text-[#ffd700] transition-colors duration-500" />
      </div>
      <p className="text-white/60 text-sm font-medium max-w-sm mx-auto">
        {type === "received"
          ? "No booking offers yet. When hirers send you offers, they'll appear here."
          : "No booking offers sent yet. Go to opportunities to make an offer."}
      </p>
      {type === "sent" && (
        <Link href="/opportunities" className="mt-8 inline-flex items-center justify-center h-10 px-6 rounded-full bg-[#ffd700] hover:bg-[#e9c400] text-[#131314] font-bold text-sm transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
          Browse Opportunities
        </Link>
      )}
    </div>
  );

  return (
    <div className="artstage min-h-screen bg-[var(--as-bg)]">
      {acceptToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          {acceptToast}
        </div>
      )}
      {actionError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg">
          {actionError}
        </div>
      )}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-sm">
            <Briefcase className="w-4 h-4 text-[#ffd700]" />
            <span className="text-xs font-bold tracking-wider text-white/80 uppercase">Management</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 tracking-tight mb-4">
            Booking Offers
          </h1>
          <p className="text-lg text-white/50 max-w-2xl leading-relaxed">
            {isHirerOrAgency
              ? "Track and manage offers you've sent to talent. Keep your productions moving forward."
              : "Review and respond to booking offers from hirers and agencies. Secure your next big role."}
          </p>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search offers by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ffd700]/50 focus:ring-1 focus:ring-[#ffd700]/50 transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full as-skeleton mx-auto mb-3" />
              <p className="as-text-muted text-sm">Loading offers...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Received Offers (for Talent) */}
            {!isHirerOrAgency && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold as-text">Received Offers</h2>
                  <span className="as-pill text-xs">{receivedOffers.length}</span>
                </div>
                {receivedOffers.length === 0 ? (
                  <EmptyState type="received" />
                ) : (
                  <div className="space-y-4">
                    {receivedOffers.map((offer) => {
                      const status = STATUS_CONFIG[offer.status];
                      const StatusIcon = status.icon;
                      return (
                        <div key={offer.id} className="relative group rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden backdrop-blur-xl hover:bg-white/[0.04] hover:border-white/20 transition-all duration-500 shadow-lg hover:shadow-2xl">
                          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="p-6 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                              <div className="flex-1 space-y-5">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-3 flex-wrap mb-2">
                                      <h3 className="font-bold text-white text-xl md:text-2xl tracking-tight">
                                        {offer.opportunity_title || "Direct Booking"}
                                      </h3>
                                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status.bg} ${status.color}`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {status.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-white/50 font-medium">
                                      <User className="w-4 h-4" />
                                      <span>From: {offer.from_user_email}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.05] transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd700] to-[#d4af37] flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                                      <DollarSign className="w-5 h-5 text-[#131314]" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Amount</p>
                                      <p className="text-sm font-bold text-white">{offer.amount} {offer.currency}</p>
                                    </div>
                                  </div>
                                  {offer.start_date && (
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.05] transition-colors">
                                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd700]/20 to-[#d4af37]/10 flex items-center justify-center border border-[#ffd700]/20">
                                        <Calendar className="w-5 h-5 text-[#ffd700]" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Dates</p>
                                        <p className="text-sm font-bold text-white">
                                          {offer.start_date} → {offer.end_date || "TBD"}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.05] transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd700]/20 to-[#d4af37]/10 flex items-center justify-center border border-[#ffd700]/20">
                                      <Clock className="w-5 h-5 text-[#ffd700]" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Received</p>
                                      <p className="text-sm font-bold text-white">
                                        {new Date(offer.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Message */}
                                {offer.message && (
                                  <div className="bg-black/40 rounded-2xl p-4 mt-2 border border-white/5">
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                        <MessageSquare className="w-4 h-4 text-white/40" />
                                      </div>
                                      <p className="text-sm text-white/70 italic leading-relaxed pt-1.5">
                                        "{offer.message}"
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              {offer.status === "PENDING" && (
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    onClick={() => handleAction(offer.id, "accept")}
                                    disabled={actionLoading === offer.id}
                                    className="as-btn-primary !py-2 !px-4 text-sm flex items-center gap-1"
                                  >
                                    {actionLoading === offer.id ? (
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5" />
                                    )}
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleAction(offer.id, "decline")}
                                    disabled={actionLoading === offer.id}
                                    className="as-btn-outline !py-2 !px-4 text-sm flex items-center gap-1 hover:bg-[rgba(225,1,17,0.12)] hover:text-[#e10111] hover:border-[rgba(225,1,17,0.25)]"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Sent Offers (for Hirers/Agencies) */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold as-text">
                  {isHirerOrAgency ? "Sent Offers" : "Your Offers"}
                </h2>
                <span className="as-pill text-xs">{sentOffers.length}</span>
              </div>
              {sentOffers.length === 0 ? (
                <EmptyState type="sent" />
              ) : (
                <div className="space-y-4">
                  {sentOffers.map((offer) => {
                    const status = STATUS_CONFIG[offer.status];
                    const StatusIcon = status.icon;
                    return (
                      <div key={offer.id} className="relative group rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden backdrop-blur-xl hover:bg-white/[0.04] hover:border-white/20 transition-all duration-500 shadow-lg hover:shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="p-6 md:p-8">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="flex-1 space-y-5">
                              {/* Header */}
                              <div>
                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                  <h3 className="font-bold text-white text-xl md:text-2xl tracking-tight">
                                    {offer.opportunity_title || "Direct Booking"}
                                  </h3>
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status.bg} ${status.color}`}>
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {status.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-white/50 font-medium">
                                  <User className="w-4 h-4" />
                                  <span>To: {offer.talent_name}</span>
                                </div>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.05] transition-colors">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd700] to-[#d4af37] flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                                    <DollarSign className="w-5 h-5 text-[#131314]" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Amount</p>
                                    <p className="text-sm font-bold text-white">{offer.amount} {offer.currency}</p>
                                  </div>
                                </div>
                                {offer.start_date && (
                                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.05] transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd700]/20 to-[#d4af37]/10 flex items-center justify-center border border-[#ffd700]/20">
                                      <Calendar className="w-5 h-5 text-[#ffd700]" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Dates</p>
                                      <p className="text-sm font-bold text-white">
                                        {offer.start_date} → {offer.end_date || "TBD"}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.05] transition-colors">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd700]/20 to-[#d4af37]/10 flex items-center justify-center border border-[#ffd700]/20">
                                    <Clock className="w-5 h-5 text-[#ffd700]" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Sent</p>
                                    <p className="text-sm font-bold text-white">
                                      {new Date(offer.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Message */}
                              {offer.message && (
                                <div className="bg-black/40 rounded-2xl p-4 mt-2 border border-white/5">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                      <MessageSquare className="w-4 h-4 text-white/40" />
                                    </div>
                                    <p className="text-sm text-white/70 italic leading-relaxed pt-1.5">
                                      "{offer.message}"
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions for Hirers */}
                            {isHirerOrAgency && offer.status === "PENDING" && (
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => handleAction(offer.id, "withdraw")}
                                  disabled={actionLoading === offer.id}
                                  className="as-btn-outline !py-2 !px-4 text-sm flex items-center gap-1 hover:bg-[rgba(225,1,17,0.12)] hover:text-[#e10111] hover:border-[rgba(225,1,17,0.25)]"
                                >
                                  {actionLoading === offer.id ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <X className="w-3.5 h-3.5" />
                                  )}
                                  Withdraw
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}