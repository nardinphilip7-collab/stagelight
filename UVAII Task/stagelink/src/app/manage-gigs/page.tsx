"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { Users, Clock, ArrowRight, Briefcase, Plus } from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  company_logo: string;
  urgent: boolean;
  deadline: string;
  applicants: number;
}

const GLASS: React.CSSProperties = {
  background: "rgba(22,22,24,0.75)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,225,109,0.1)",
  borderLeft: "4px solid rgba(255,215,0,0.4)",
};

export default function ManageGigsPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/login"); return; }
    if (user.role !== "HIRER" && user.role !== "AGENCY") { router.replace("/explore"); return; }
    apiClient.get<Opportunity[]>('/opportunities/?owner=me')
      .then(setOpportunities)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 overflow-auto bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1
              className="text-3xl md:text-4xl font-bold text-primary"
              style={{ fontFamily: "var(--font-syne, sans-serif)" }}
            >
              Manage Your Gigs
            </h1>
            <p className="text-muted-foreground mt-2">Track applicants and manage your hiring pipeline.</p>
          </div>
          <Link href="/manage-gigs/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Post New Gig
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading your gigs...</div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No gigs posted yet</h3>
            <p className="text-muted-foreground mb-6">Post your first casting brief to start receiving applications.</p>
            <Link href="/manage-gigs/new">
              <Button className="bg-primary text-primary-foreground">Post Your First Gig</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((gig) => (
              <Card
                key={gig.id}
                className="rounded-2xl p-6 flex flex-col justify-between transition-all duration-200"
                style={GLASS}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 24px rgba(255,215,0,0.14)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.15)" }}
                    >
                      <DynamicIcon name={gig.company_logo} className="w-6 h-6 text-primary/80" />
                    </div>
                    {gig.urgent && <Badge variant="destructive" className="rounded-md">Urgent</Badge>}
                  </div>
                  <h3 className="font-bold text-xl mb-2 line-clamp-2">{gig.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {gig.deadline}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-bold text-foreground">{gig.applicants}</span> applied
                    </span>
                  </div>
                </div>

                <Link href={`/manage-gigs/${gig.id}`} className="block w-full">
                  <Button
                    variant="outline"
                    className="w-full justify-between transition-all bg-transparent"
                    style={{ border: "1px solid rgba(255,215,0,0.25)", color: "#ffd700" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    View Pipeline
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
