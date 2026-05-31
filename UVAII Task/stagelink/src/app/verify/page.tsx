"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock, CheckCircle2, XCircle } from "lucide-react";

const DOC_TYPES = [
  { value: "national_id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "union_card", label: "Actor's Union Card" },
  { value: "press_card", label: "Press Card" },
];

interface VerificationStatus {
  id?: number;
  document_type?: string;
  status?: string | null;
  submitted_at?: string;
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    PENDING: { label: "Pending Review", className: "bg-amber-500/20 text-amber-600 border-amber-500/30", icon: <Clock className="w-3 h-3" /> },
    APPROVED: { label: "Verified", className: "bg-emerald-500/20 text-emerald-600 border-[rgba(74,222,128,0.2)]/30", icon: <CheckCircle2 className="w-3 h-3" /> },
    REJECTED: { label: "Rejected", className: "bg-red-500/20 text-[#e10111] border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
  };
  const cfg = map[status];
  if (!cfg) return null;
  return (
    <Badge variant="outline" className={`inline-flex items-center gap-1.5 ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

export default function VerifyPage() {
  const router = useRouter();
  const [current, setCurrent] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState("national_id");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!getUser()) { router.replace("/login"); return; }
    apiClient.get<VerificationStatus>("/verification/")
      .then(setCurrent)
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await apiClient.post<VerificationStatus>("/verification/", { document_type: docType });
      setCurrent(result);
      setSuccess(true);
    } catch (err: unknown) {
      const detail = (err as { data?: { detail?: string } })?.data?.detail;
      setError(detail || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasPending = current?.status === "PENDING";
  const isApproved = current?.status === "APPROVED";

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-outfit font-bold mb-2">Identity Verification</h1>
        <p className="text-muted-foreground">
          Get a verified badge on your profile to build trust with hirers and agencies.
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Loading...</p>
      ) : isApproved ? (
        <Card className="bg-card/50 border-border rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold font-outfit mb-2">You&apos;re Verified!</h2>
          <p className="text-muted-foreground text-sm">
            Your identity has been approved. The verified badge is now shown on your profile.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {current?.status && (
            <Card className="bg-card/50 border-border rounded-2xl p-5 flex items-center gap-4">
              <ShieldCheck className="w-8 h-8 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="font-medium text-sm mb-1">Current status</p>
                <StatusBadge status={current.status} />
                {current.submitted_at && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Submitted {new Date(current.submitted_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Card>
          )}

          {!hasPending && (
            <Card className="bg-card/50 border-border rounded-3xl p-6">
              <h3 className="font-bold font-outfit text-xl mb-1">
                {current?.status === "REJECTED" ? "Re-submit Verification" : "Submit Verification Request"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Select the document type you&apos;ll provide. Our team reviews requests within 2–3 business days.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Document Type</label>
                  <div className="space-y-2">
                    {DOC_TYPES.map(dt => (
                      <label
                        key={dt.value}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                          docType === dt.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-border/80"
                        }`}
                      >
                        <input
                          type="radio"
                          name="doc_type"
                          value={dt.value}
                          checked={docType === dt.value}
                          onChange={() => setDocType(dt.value)}
                          className="accent-primary"
                        />
                        <span className="text-sm font-medium">{dt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-secondary/50 rounded-xl border border-border text-sm text-muted-foreground">
                  After submitting, our team will contact you at your registered email to collect the document securely.
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-sm text-emerald-600 bg-emerald-500/10 border border-[rgba(74,222,128,0.2)]/20 rounded-lg px-4 py-2">
                    Request submitted! We&apos;ll be in touch within 2–3 business days.
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground"
                  disabled={submitting || success}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </Card>
          )}

          {hasPending && (
            <Card className="bg-card/50 border-border rounded-3xl p-6 text-center">
              <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3 opacity-80" />
              <h3 className="font-bold font-outfit text-lg mb-2">Under Review</h3>
              <p className="text-sm text-muted-foreground">
                Your request is being reviewed. We&apos;ll notify you once it&apos;s processed.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
