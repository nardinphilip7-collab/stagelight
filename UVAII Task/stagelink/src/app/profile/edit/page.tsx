"use client";

import { Suspense, useEffect, useState } from "react";
import { ProfileProvider, useProfile } from "@/components/profile/edit/ProfileContext";
import { SECTIONS, SectionId } from "@/components/profile/edit/types";
import { IdentitySection } from "@/components/profile/edit/sections/IdentitySection";
import { DisciplinesSection } from "@/components/profile/edit/sections/DisciplinesSection";
import { LocationSection } from "@/components/profile/edit/sections/LocationSection";
import { PhysicalSection } from "@/components/profile/edit/sections/PhysicalSection";
import { TrainingSection } from "@/components/profile/edit/sections/TrainingSection";
import { CreditsSection } from "@/components/profile/edit/sections/CreditsSection";
import { UnionsSection } from "@/components/profile/edit/sections/UnionsSection";
import { MediaSection } from "@/components/profile/edit/sections/MediaSection";
import { AwardsSection } from "@/components/profile/edit/sections/AwardsSection";
import { AvailabilitySection } from "@/components/profile/edit/sections/AvailabilitySection";
import { EquipmentSection } from "@/components/profile/edit/sections/EquipmentSection";
import { VisibilitySection } from "@/components/profile/edit/sections/VisibilitySection";
import { DisciplineDetailsSection } from "@/components/profile/edit/sections/DisciplineDetailsSection";
import { SetupWizard } from "@/components/profile/edit/SetupWizard";
import { Loader2, ArrowLeft, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function Sidebar() {
  const { activeSection, setActiveSection } = useProfile();

  const scrollTo = (id: string) => {
    setActiveSection(id as SectionId);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className="w-64 shrink-0 hidden lg:block sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar pb-10">
      <div className="flex items-center gap-2 mb-8 px-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
        <Link href="/profile" className="flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 px-3 mb-4">Profile Settings</h3>
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => scrollTo(sec.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-foreground/70 hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {sec.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function TopNav() {
  const { activeSection, setActiveSection } = useProfile();
  return (
    <div className="lg:hidden w-full overflow-x-auto no-scrollbar border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-16 z-40">
      <div className="flex px-4 py-2 gap-2 min-w-max">
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors",
              activeSection === sec.id ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground/70 hover:bg-secondary"
            )}
          >
            {sec.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SaveBar() {
  const { saving, error, success, saveAll } = useProfile();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="mx-auto max-w-4xl bg-background/90 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-4 flex items-center justify-between pointer-events-auto">
        <div className="flex-1">
          {error && <p className="text-sm text-destructive flex items-center gap-2 font-medium"><AlertCircle className="w-4 h-4"/> {error}</p>}
          {success && <p className="text-sm text-green-500 flex items-center gap-2 font-medium"><CheckCircle2 className="w-4 h-4"/> {success}</p>}
        </div>
        <button
          onClick={() => saveAll()}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90 hover:shadow transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function Content() {
  const { loading, activeSection, setActiveSection } = useProfile();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setActiveSection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-3xl pb-32">
      <div className="space-y-16">
        <div id="identity"><IdentitySection /></div>
        <div id="disciplines"><DisciplinesSection /></div>
        <div id="location"><LocationSection /></div>
        <div id="physical"><PhysicalSection /></div>
        <div id="training"><TrainingSection /></div>
        <div id="credits"><CreditsSection /></div>
        <div id="unions"><UnionsSection /></div>
        <div id="media"><MediaSection /></div>
        <div id="awards"><AwardsSection /></div>
        <div id="availability"><AvailabilitySection /></div>
        <div id="equipment"><EquipmentSection /></div>
        <div id="visibility"><VisibilitySection /></div>
        <div id="discipline_details"><DisciplineDetailsSection /></div>
      </div>
      <SaveBar />
    </div>
  );
}

function EditProfileShell() {
  const { isSetup, loading } = useProfile();

  // First-time onboarding: focused step wizard, no sidebar.
  if (isSetup) {
    if (loading) {
      return <div className="flex min-h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }
    return <SetupWizard />;
  }

  // Full editor.
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 flex gap-12 relative">
        <Sidebar />
        <Content />
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <ProfileProvider>
        <EditProfileShell />
      </ProfileProvider>
    </Suspense>
  );
}
