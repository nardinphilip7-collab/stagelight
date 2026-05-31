"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, X, Plus, Loader2, Upload, Camera, ChevronRight,
  User, Layers, MapPin, Ruler, GraduationCap, Star, Shield, Image,
  Trophy, Eye, Sliders, Briefcase, Lock, Calendar, Wrench, Volume2
} from "lucide-react";
import { DisciplineForm, DISCIPLINE_LABELS, DISCIPLINE_DEFAULTS } from "@/components/profile/DisciplineForm";
import { ReelRecorder } from "@/components/artstage/reels/ReelRecorder";

/* ─── Constants ──────────────────────────────────────────────── */

const DISCIPLINE_OPTIONS = [
  "actor", "singer", "dancer", "musician", "comedian", "presenter",
  "director", "writer", "cinematographer", "choreographer", "composer",
  "visual_artist", "model", "stage_technician",
];

const SKILL_CATEGORIES = [
  { key: "language", label: "Languages" },
  { key: "accent", label: "Accents & Dialects" },
  { key: "instrument", label: "Instruments" },
  { key: "dance_style", label: "Dance Styles" },
  { key: "vocal", label: "Vocal" },
  { key: "physical", label: "Physical Skills" },
  { key: "driving", label: "Driving Licenses" },
  { key: "specialty", label: "Specialties" },
] as const;

const SKILL_PROFICIENCY = ["beginner", "intermediate", "advanced", "fluent", "native"];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public", desc: "Anyone can view your profile" },
  { value: "platform_only", label: "Platform only", desc: "Only logged-in members can view" },
  { value: "industry_only", label: "Industry only", desc: "Only hirers and agencies can view" },
  { value: "stealth", label: "Stealth", desc: "Hidden from all searches and links" },
];

const SECTIONS = [
  { id: "identity", label: "Identity", icon: User },
  { id: "disciplines", label: "Disciplines & Skills", icon: Layers },
  { id: "location", label: "Location & Travel", icon: MapPin },
  { id: "physical", label: "Physical Attributes", icon: Ruler },
  { id: "training", label: "Training", icon: GraduationCap },
  { id: "credits", label: "Credits", icon: Star },
  { id: "unions", label: "Unions & Representation", icon: Shield },
  { id: "media", label: "Media", icon: Image },
  { id: "awards", label: "Awards & Press", icon: Trophy },
  { id: "availability", label: "Availability", icon: Calendar },
  { id: "equipment", label: "Equipment & Tech", icon: Wrench },
  { id: "visibility", label: "Visibility", icon: Eye },
  { id: "discipline_details", label: "Discipline Details", icon: Sliders },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

/* ─── Types ──────────────────────────────────────────────────── */

interface SkillEntry { id?: number; category: string; name: string; proficiency: string; }
interface TrainingEntry { school: string; program: string; start_year?: string; end_year?: string; degree?: string; type?: string; instructor?: string; }
interface AwardEntry { name: string; project?: string; year?: string; festival?: string; award_type?: string; url?: string; }
interface PressMention { publication: string; headline: string; date?: string; url?: string; }
interface CreditEntry { id?: number; title: string; role: string; production_type?: string; year?: number; billing?: string; director?: string; collaborators?: string[]; }
interface UnionEntry { id?: number; union: string; status?: string; joined_year?: number; }
interface ReelEntry { id?: number; title: string; type: string; video_url: string; thumbnail_url?: string; description?: string; visibility: string; }

/* ─── Helper components ──────────────────────────────────────── */

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-border">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {hint && <p className="text-sm text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function Label({ children, hint, lock }: { children: React.ReactNode; hint?: string; lock?: boolean }) {
  return (
    <div className="mb-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider inline-flex items-center gap-1">
        {children}
        {lock && <Lock className="w-2.5 h-2.5 opacity-50" />}
      </label>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function SaveBtn({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="mt-6 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2 transition-colors"
    >
      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      Save changes
    </button>
  );
}

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [inp, setInp] = useState("");
  const add = () => {
    const v = inp.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInp("");
  };
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <Input value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder ?? "Type and press Enter"}
          className="bg-secondary border-border text-sm flex-1" />
        <button type="button" onClick={add} className="px-3 rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <Badge key={i} variant="outline" className="bg-secondary border-border pr-1 flex items-center gap-1 text-xs">
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="ml-0.5 hover:text-destructive transition-colors">
              <X className="w-2.5 h-2.5" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

/* ─── Image gallery uploader (file → /upload/ → URL list) ────── */

function ImageUploader({ values, onChange, max = 8 }: { values: string[]; onChange: (v: string[]) => void; max?: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const room = max - values.length;
    if (room <= 0) { setErr(`You can add up to ${max} images.`); return; }
    setUploading(true); setErr("");
    try {
      const urls = await Promise.all(files.slice(0, room).map(f => uploadFile(f)));
      onChange([...values, ...urls]);
    } catch {
      setErr("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
        {values.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-secondary group">
            <img src={url} alt={`upload ${i + 1}`} className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {values.length < max && (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-border bg-secondary/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors disabled:opacity-50">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            <span className="text-[10px] font-medium">{uploading ? "Uploading…" : "Add photo"}</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */

import { Suspense } from "react";

function ProfileEditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get("setup") === "1";
  const sectionParam = searchParams.get("section") as SectionId | null;
  const currentUser = getUser();

  const [activeSection, setActiveSection] = useState<SectionId>(sectionParam ?? "identity");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Setup wizard state (only used when ?setup=1)
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardError, setWizardError] = useState("");
  const [finishing, setFinishing] = useState(false);

  // Talent fields
  const [talentName, setTalentName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [dob, setDob] = useState("");
  const [tagline, setTagline] = useState("");
  const [playableMin, setPlayableMin] = useState("");
  const [playableMax, setPlayableMax] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatar, setAvatar] = useState("");
  const [reelUrl, setReelUrl] = useState("");
  const [unionName, setUnionName] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [subDisciplines, setSubDisciplines] = useState<string[]>([]);
  const [physicalStats, setPhysicalStats] = useState<Record<string, string>>({});
  const [travelInfo, setTravelInfo] = useState<Record<string, any>>({});
  const [training, setTraining] = useState<TrainingEntry[]>([]);
  const [awards, setAwards] = useState<AwardEntry[]>([]);
  const [pressMentions, setPressMentions] = useState<PressMention[]>([]);
  const [externalLinks, setExternalLinks] = useState<Record<string, string>>({});
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [fieldVisibility, setFieldVisibility] = useState<Record<string, string>>({});
  const [disciplineData, setDisciplineData] = useState<Record<string, Record<string, unknown>>>({});
  const [availabilityStatus, setAvailabilityStatus] = useState("Available");
  const [availabilityUntil, setAvailabilityUntil] = useState("");
  const [availWindows, setAvailWindows] = useState<{ id: number; start_date: string; end_date: string; state: string; note: string; willing_to_travel: boolean }[]>([]);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [addingWindow, setAddingWindow] = useState(false);
  const [newWindow, setNewWindow] = useState({ start: "", end: "", state: "available", note: "", willing_to_travel: true });
  const [savingWindow, setSavingWindow] = useState(false);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [agency, setAgency] = useState("");
  const [nameAudioUrl, setNameAudioUrl] = useState("");

  // ArtistProfile fields
  const [artistUsername, setArtistUsername] = useState("");
  const [primaryDiscipline, setPrimaryDiscipline] = useState("");
  const [secondaryDisciplines, setSecondaryDisciplines] = useState<string[]>([]);
  const [completenessScore, setCompletenessScore] = useState(0);
  const [headshots, setHeadshots] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [representation, setRepresentation] = useState<Record<string, any>>({});
  const [submissionPrefs, setSubmissionPrefs] = useState<Record<string, any>>({});

  // Skills
  const [skillEntries, setSkillEntries] = useState<SkillEntry[]>([]);
  const [newSkill, setNewSkill] = useState<Record<string, { name: string; proficiency: string }>>({});

  // Credits
  const [credits, setCredits] = useState<CreditEntry[]>([]);
  const [newCredit, setNewCredit] = useState<CreditEntry>({ title: "", role: "", year: new Date().getFullYear(), collaborators: [] });

  // Training form (controlled)
  const [newTraining, setNewTraining] = useState<TrainingEntry>({ school: "", program: "", degree: "", start_year: "", end_year: "", instructor: "", type: "school" });

  // Awards form (controlled)
  const [newAward, setNewAward] = useState<AwardEntry>({ name: "", festival: "", project: "", year: "", url: "", award_type: "" });

  // Press mentions form (controlled)
  const [newPressMention, setNewPressMention] = useState<PressMention>({ headline: "", publication: "", date: "", url: "" });

  // Availability window error
  const [windowSaveError, setWindowSaveError] = useState("");

  // Unions
  const [unions, setUnions] = useState<UnionEntry[]>([]);
  const [newUnion, setNewUnion] = useState<UnionEntry>({ union: "", status: "", joined_year: undefined });

  // Reels
  const [reels, setReels] = useState<ReelEntry[]>([]);
  const [newReel, setNewReel] = useState<ReelEntry>({ title: "", type: "reel", video_url: "", visibility: "public" });
  const [reelsLoaded, setReelsLoaded] = useState(false);
  const [reelSaving, setReelSaving] = useState(false);
  const [reelUploading, setReelUploading] = useState(false);
  const reelFileRef = useRef<HTMLInputElement>(null);

  // Avatar
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<"starting" | "live" | "uploading" | "error">("starting");
  const [cameraErr, setCameraErr] = useState("");

  /* ─── Load data ──────────────────────────────────────────── */
  useEffect(() => {
    if (!currentUser) { router.push("/login"); return; }
    if (currentUser.role === "HIRER" || currentUser.role === "AGENCY") {
      router.replace("/profile/hirer"); return;
    }

    Promise.all([
      apiClient.get<any>("/profile/"),
      apiClient.get<any[]>("/skill-entries/"),
      apiClient.get<CreditEntry[]>("/credits/").catch(() => [] as CreditEntry[]),
      apiClient.get<UnionEntry[]>("/union-affiliations/").catch(() => [] as UnionEntry[]),
    ])
      .then(([talent, skills, creditList, unionList]) => {
        setTalentName(talent.name ?? "");
        setLegalName(talent.legal_name ?? "");
        setPronouns(talent.pronouns ?? "");
        setDob(talent.date_of_birth ?? "");
        setBio(talent.bio ?? "");
        setLocation(talent.location ?? "");
        setAvatar(talent.avatar ?? "");
        setReelUrl(talent.reel_url ?? "");
        setUnionName(talent.union_name ?? "");
        setSocialLinks(talent.social_links ?? {});
        setSubDisciplines(talent.sub_disciplines ?? []);
        setPhysicalStats(talent.physical_stats ?? {});
        setTravelInfo(talent.travel_info ?? {});
        setTraining(talent.training ?? []);
        setAwards(talent.awards ?? []);
        setPressMentions(talent.press_mentions ?? []);
        setExternalLinks(talent.external_links ?? {});
        setProfileVisibility(talent.profile_visibility ?? "public");
        setFieldVisibility(talent.field_visibility ?? {});
        setDisciplineData(talent.discipline_data ?? {});
        setAvailabilityStatus(talent.availability_status ?? "Available");
        setAvailabilityUntil(talent.availability_until ?? "");
        setEquipment(talent.equipment ?? []);
        setAgency(talent.agency ?? "");
        setNameAudioUrl(talent.name_audio_url ?? "");
        setArtistUsername(talent.artstage_username ?? "");
        if (talent.artstage_username) {
          apiClient.get<any>(`/artists/${talent.artstage_username}/`)
            .then(artist => {
              setPrimaryDiscipline(artist.primary_discipline ?? "");
              setSecondaryDisciplines(artist.secondary_disciplines ?? []);
              setCompletenessScore(artist.completeness_score ?? 0);
              setHeadshots(artist.headshots ?? []);
              setCoverImage(artist.cover_image ?? "");
              setRepresentation(artist.representation ?? {});
              setSubmissionPrefs(artist.submission_preferences ?? {});
              setTagline(artist.tagline ?? "");
              setPronouns(artist.pronouns ?? "");
              setPlayableMin(artist.playable_age_min ?? "");
              setPlayableMax(artist.playable_age_max ?? "");
              // credits and unions are loaded from dedicated endpoints below
            })
            .catch(() => {});
        }
        setSkillEntries(skills);
        setCredits(creditList);
        setUnions(unionList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (activeSection === "media") loadReels(); }, [activeSection]);
  useEffect(() => {
    if (activeSection === "availability") {
      apiClient.get<typeof availWindows>("/availability/").then(setAvailWindows).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  /* ─── Save helpers ───────────────────────────────────────── */

  async function saveTalentFields(extra: Record<string, unknown> = {}) {
    setSaving(true); setError(""); setSuccess("");
    try {
      const updated = await apiClient.put<any>("/profile/", {
        name: talentName || "My Profile",
        bio: bio || "",
        location: location || "",
        category: "artist",
        // URL fields: send null instead of empty string to avoid Django URLField validation errors
        avatar: avatar || null,
        reel_url: reelUrl || null,
        name_audio_url: nameAudioUrl || null,
        union_name: unionName || null,
        social_links: socialLinks,
        sub_disciplines: subDisciplines,
        physical_stats: physicalStats,
        travel_info: travelInfo,
        training,
        awards,
        press_mentions: pressMentions,
        external_links: externalLinks,
        profile_visibility: profileVisibility,
        field_visibility: fieldVisibility,
        legal_name: legalName,
        date_of_birth: dob || null,
        discipline_data: disciplineData,
        availability_status: availabilityStatus,
        availability_until: availabilityUntil,
        equipment,
        agency: agency || null,
        ...extra,
      });
      // If ArtistProfile was just auto-created, pick up the new username and immediately
      // save the ArtistProfile fields (pronouns, tagline, disciplines, etc.)
      const newUsername = updated?.artstage_username;
      if (!artistUsername && newUsername) {
        setArtistUsername(newUsername);
        await apiClient.patch(`/artists/${newUsername}/`, {
          primary_discipline: primaryDiscipline,
          secondary_disciplines: secondaryDisciplines,
          pronouns,
          tagline,
          playable_age_min: playableMin || null,
          playable_age_max: playableMax || null,
          headshots,
          cover_image: coverImage || null,
          representation,
          submission_preferences: submissionPrefs,
        });
      }
      setSuccess("Saved successfully!");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function saveArtistProfile(extra: Record<string, unknown> = {}) {
    // If no artist username yet, fall back to saveTalentFields which auto-creates
    // the ArtistProfile and then patches it immediately
    if (!artistUsername) {
      return saveTalentFields(extra);
    }
    setSaving(true); setError(""); setSuccess("");
    try {
      await apiClient.patch(`/artists/${artistUsername}/`, {
        primary_discipline: primaryDiscipline, secondary_disciplines: secondaryDisciplines,
        pronouns,
        tagline, playable_age_min: playableMin || null, playable_age_max: playableMax || null,
        headshots, cover_image: coverImage || null, representation, submission_preferences: submissionPrefs,
        ...extra,
      });
      setSuccess("Saved successfully!");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function addSkillEntry(category: string) {
    const s = newSkill[category];
    if (!s?.name?.trim()) return;
    try {
      const created = await apiClient.post<SkillEntry>("/skill-entries/", { category, name: s.name.trim(), proficiency: s.proficiency ?? "" });
      setSkillEntries(prev => [...prev, created]);
      setNewSkill(prev => ({ ...prev, [category]: { name: "", proficiency: "" } }));
    } catch (e: any) { setError(e?.message ?? "Failed to add skill."); }
  }

  async function removeSkillEntry(id: number) {
    try {
      await apiClient.delete(`/skill-entries/${id}/`);
      setSkillEntries(prev => prev.filter(s => s.id !== id));
    } catch (e: any) { setError(e?.message ?? "Failed to remove skill."); }
  }

  async function addCredit() {
    if (!newCredit.title?.trim() || !newCredit.role?.trim()) return;
    try {
      const created = await apiClient.post<CreditEntry>("/credits/", {
        title: newCredit.title.trim(), role: newCredit.role.trim(),
        production_type: newCredit.production_type, year: newCredit.year,
        billing: newCredit.billing, director: newCredit.director,
        collaborators: newCredit.collaborators ?? [],
      });
      setCredits(prev => [...prev, created]);
      setNewCredit({ title: "", role: "", year: new Date().getFullYear(), collaborators: [] });
    } catch (e: any) { setError(e?.message ?? "Failed to add credit."); }
  }

  async function removeCredit(id: number | undefined, idx: number) {
    if (id) {
      try { await apiClient.delete(`/credits/${id}/`); }
      catch (e: any) { setError(e?.message ?? "Failed to remove credit."); return; }
    }
    setCredits(prev => prev.filter((_, j) => j !== idx));
  }

  async function addUnion() {
    if (!newUnion.union.trim()) return;
    try {
      const created = await apiClient.post<UnionEntry>("/union-affiliations/", {
        union: newUnion.union.trim(), status: newUnion.status, joined_year: newUnion.joined_year,
      });
      setUnions(prev => [...prev, created]);
      setNewUnion({ union: "", status: "", joined_year: undefined });
    } catch (e: any) { setError(e?.message ?? "Failed to add union."); }
  }

  async function removeUnion(id: number | undefined, idx: number) {
    if (id) {
      try { await apiClient.delete(`/union-affiliations/${id}/`); }
      catch (e: any) { setError(e?.message ?? "Failed to remove union."); return; }
    }
    setUnions(prev => prev.filter((_, j) => j !== idx));
  }

  /* ─── Reel CRUD ──────────────────────────────────────────── */

  async function loadReels() {
    if (reelsLoaded) return;
    try {
      const data = await apiClient.get<ReelEntry[]>("/reels/");
      setReels(Array.isArray(data) ? data : []);
      setReelsLoaded(true);
    } catch { setReelsLoaded(true); }
  }

  async function addReel() {
    if (!newReel.title.trim() || !newReel.video_url.trim()) return;
    setReelSaving(true);
    try {
      const created = await apiClient.post<ReelEntry>("/reels/", newReel);
      setReels(prev => [...prev, created]);
      setNewReel({ title: "", type: "reel", video_url: "", visibility: "public" });
    } catch (e: any) { setError(e?.message ?? "Failed to add reel."); }
    finally { setReelSaving(false); }
  }

  async function deleteReel(id: number) {
    try {
      await apiClient.delete(`/reels/${id}/`);
      setReels(prev => prev.filter(r => r.id !== id));
    } catch (e: any) { setError(e?.message ?? "Failed to delete reel."); }
  }

  // Upload a recorded/selected video file to /upload/, then set it as the new reel's source.
  async function uploadReelVideo(file: File | Blob, name = "reel.webm") {
    setReelUploading(true); setError("");
    try {
      const f = file instanceof File ? file : new File([file], name, { type: file.type || "video/webm" });
      const url = await uploadFile(f);
      setNewReel(p => ({ ...p, video_url: url }));
      return url;
    } catch (e: any) {
      setError(e?.message ?? "Video upload failed.");
      return null;
    } finally {
      setReelUploading(false);
    }
  }

  async function handleReelFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadReelVideo(file, file.name);
    if (reelFileRef.current) reelFileRef.current.value = "";
  }

  /* ─── Avatar upload ──────────────────────────────────────── */

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setAvatarUploading(true);
    try { const url = await uploadFile(file); setAvatar(url); }
    catch { setError("Avatar upload failed."); }
    finally { setAvatarUploading(false); }
  }

  function openCamera() {
    setShowCamera(true); setCameraState("starting"); setCameraErr("");
    setTimeout(() => {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          cameraStreamRef.current = stream;
          if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream;
          setCameraState("live");
        })
        .catch(() => { setCameraErr("Camera permission denied."); setCameraState("error"); });
    }, 50);
  }

  function closeCamera() { cameraStreamRef.current?.getTracks().forEach(t => t.stop()); setShowCamera(false); }

  async function capturePhoto() {
    const video = cameraVideoRef.current; const canvas = cameraCanvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    setCameraState("uploading");
    canvas.toBlob(async blob => {
      if (!blob) { setCameraState("error"); setCameraErr("Capture failed."); return; }
      try {
        const url = await uploadFile(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
        setAvatar(url); setShowCamera(false);
      } catch { setCameraState("error"); setCameraErr("Upload failed."); }
    }, "image/jpeg", 0.85);
  }

  /* ─── Setup wizard helpers ───────────────────────────────── */

  // Persist everything and flip onboarding_complete server-side, then go to the app.
  async function finishSetup() {
    setWizardError("");
    // Final required-field guard (defence in depth — steps already validate).
    if (!talentName.trim() || !primaryDiscipline || !location.trim() || !bio.trim()) {
      setWizardError("Please complete your name, discipline, location and bio.");
      setWizardStep(0);
      return;
    }
    if (!avatar && headshots.length === 0) {
      setWizardError("Please add at least one photo.");
      setWizardStep(1);
      return;
    }
    setFinishing(true);
    try {
      // If no avatar yet, use the first headshot as the avatar.
      if (!avatar && headshots.length > 0) setAvatar(headshots[0]);
      await saveTalentFields(avatar ? {} : { avatar: headshots[0] ?? null });
      await saveArtistProfile();
      // Persist the optional showreel as a real Reel row.
      if (newReel.video_url.trim()) {
        try {
          await apiClient.post("/reels/", {
            title: newReel.title.trim() || `${talentName} — Showreel`,
            type: "reel",
            video_url: newReel.video_url.trim(),
            visibility: "public",
          });
          setNewReel({ title: "", type: "reel", video_url: "", visibility: "public" });
        } catch { /* non-blocking: showreel is optional */ }
      }
      // Re-fetch to confirm the gate flag flipped; only leave when truly complete.
      const me = await apiClient.get<{ onboarding_complete?: boolean }>("/auth/me/");
      if (me?.onboarding_complete) {
        router.replace("/explore");
      } else {
        setWizardError("Some required info is still missing. Please review each step.");
      }
    } catch (e: any) {
      setWizardError(e?.message ?? "Could not save your profile. Please try again.");
    } finally {
      setFinishing(false);
    }
  }

  /* ─── Render ─────────────────────────────────────────────── */

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading profile…
    </div>
  );

  /* ─── Setup wizard (first-time onboarding) ───────────────── */
  if (isSetup) {
    const WIZARD_STEPS = ["Basics", "Headshots", "Showreel"];
    const step1Valid = !!(talentName.trim() && primaryDiscipline && location.trim() && bio.trim());
    const step2Valid = !!avatar || headshots.length > 0;

    return (
      <div className="min-h-screen bg-background pt-8 pb-20">
        <div className="max-w-xl mx-auto px-4">
          {/* Progress */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Set up your profile</h1>
            <p className="text-sm text-muted-foreground mb-5">A few essentials so casting directors can find you. You can refine everything later.</p>
            <div className="flex items-center gap-2">
              {WIZARD_STEPS.map((label, i) => (
                <div key={label} className="flex-1">
                  <div className={`h-1.5 rounded-full transition-colors ${i <= wizardStep ? "bg-primary" : "bg-secondary"}`} />
                  <p className={`text-[11px] mt-1.5 font-medium ${i === wizardStep ? "text-primary" : "text-muted-foreground"}`}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {wizardError && (
            <div className="mb-4 px-4 py-2.5 rounded-lg text-sm bg-destructive/10 border border-destructive/30 text-destructive">
              {wizardError}
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border p-6">
            {/* Step 1 — Basics */}
            {wizardStep === 0 && (
              <div className="space-y-4">
                <SectionHeader title="The basics" hint="Required to use StageLink." />
                <div>
                  <Label>Stage name *</Label>
                  <Input value={talentName} onChange={e => setTalentName(e.target.value)} placeholder="Your stage name" className="bg-secondary border-border" />
                </div>
                <div>
                  <Label>Primary discipline *</Label>
                  <div className="flex flex-wrap gap-2">
                    {DISCIPLINE_OPTIONS.map(d => (
                      <button key={d} type="button" onClick={() => setPrimaryDiscipline(d)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          primaryDiscipline === d ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                        }`}>
                        {primaryDiscipline === d && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                        {DISCIPLINE_LABELS[d] ?? d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Location *</Label>
                  <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London, UK" className="bg-secondary border-border" />
                </div>
                <div>
                  <Label>Bio *</Label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
                    placeholder="Tell casting directors about yourself…"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none" />
                </div>
              </div>
            )}

            {/* Step 2 — Headshots */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <SectionHeader title="Add your headshots" hint="At least one photo is required. The first becomes your avatar." />
                <ImageUploader values={headshots} onChange={setHeadshots} max={8} />
              </div>
            )}

            {/* Step 3 — Showreel */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <SectionHeader title="Add a showreel" hint="Optional, but strongly recommended. Record now, upload a file, or paste a link." />
                <div className="rounded-xl border border-border overflow-hidden">
                  <ReelRecorder reelType="reel" onRecordingComplete={(blob) => uploadReelVideo(blob)} />
                </div>
                <div className="flex items-center gap-2">
                  <input ref={reelFileRef} type="file" accept="video/*" className="hidden" onChange={handleReelFile} />
                  <button type="button" onClick={() => reelFileRef.current?.click()} disabled={reelUploading}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-card transition-colors disabled:opacity-50">
                    {reelUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {reelUploading ? "Uploading…" : "Upload video file"}
                  </button>
                  {newReel.video_url && !reelUploading && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> Video ready</span>
                  )}
                </div>
                <div>
                  <Label>Or paste an embed URL</Label>
                  <Input value={newReel.video_url} onChange={e => setNewReel(p => ({ ...p, video_url: e.target.value }))} placeholder="https://youtube.com/embed/…" className="bg-secondary border-border text-sm" />
                </div>
              </div>
            )}

            {/* Nav */}
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
              <button type="button"
                onClick={() => { setWizardError(""); if (wizardStep === 0) router.push("/explore"); else setWizardStep(s => s - 1); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {wizardStep === 0 ? "Cancel" : "Back"}
              </button>

              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <button type="button"
                  onClick={() => {
                    setWizardError("");
                    if (wizardStep === 0 && !step1Valid) { setWizardError("Please fill in name, discipline, location and bio."); return; }
                    if (wizardStep === 1 && !step2Valid) { setWizardError("Please add at least one photo."); return; }
                    setWizardStep(s => s + 1);
                  }}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="button" disabled={finishing} onClick={finishSetup}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-60">
                  {finishing ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <>Finish & enter StageLink</>}
                </button>
              )}
            </div>

            {/* Step 3 finish shortcut: if a reel was added, persist it as a real reel before finishing */}
            {wizardStep === 2 && newReel.video_url && (
              <p className="text-[11px] text-muted-foreground mt-3 text-center">Your showreel will be saved when you finish.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const sectionHasData: Partial<Record<SectionId, boolean>> = {
    identity: !!(talentName),
    disciplines: !!(primaryDiscipline),
    location: !!(location),
    physical: Object.keys(physicalStats).length > 0,
    training: training.length > 0,
    credits: credits.length > 0,
    unions: unions.length > 0 || !!representation?.agency,
    media: !!(avatar) || headshots.length > 0,
    awards: awards.length > 0 || pressMentions.length > 0,
    availability: availabilityStatus !== "Available" || !!availabilityUntil,
    equipment: equipment.length > 0,
    visibility: profileVisibility !== "public",
    discipline_details: !!(primaryDiscipline && disciplineData[primaryDiscipline] && Object.keys(disciplineData[primaryDiscipline]).length > 0),
  };

  return (
    <div className="min-h-screen bg-background pt-6 pb-20">
      <div className="max-w-6xl mx-auto px-4">

        {isSetup && (
          <div className="mb-6 bg-primary/10 border border-primary/30 rounded-xl p-5">
            <h2 className="font-semibold text-primary mb-1">Welcome — let's build your profile</h2>
            <p className="text-sm text-muted-foreground">Fill in each section to help casting directors and hirers discover you.</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">

          {/* ── Mobile Section Picker (below md) ── */}
          <div className="md:hidden -mx-4 px-4">
            <div className="flex gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {SECTIONS.map(s => {
                const Icon = s.icon;
                const active = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id as SectionId)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors ${
                      active
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "text-muted-foreground border-transparent hover:bg-secondary"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {s.label}
                    {sectionHasData[s.id as SectionId] && !active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Sidebar (md+) ── */}
          <aside className="hidden md:block w-56 shrink-0 sticky top-20 self-start">
            {/* Completeness */}
            <div className="mb-4 p-4 bg-card rounded-xl border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile</span>
                <span className="text-sm font-bold text-primary">{completenessScore}%</span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completenessScore}%` }} />
              </div>
            </div>

            {/* Completeness checklist */}
            {(() => {
              const missing = SECTIONS.filter(s => !sectionHasData[s.id as SectionId]);
              return missing.length > 0 ? (
                <div className="mb-4 p-3 bg-card rounded-xl border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">What&apos;s missing</p>
                  <div className="space-y-1">
                    {missing.slice(0, 5).map(s => (
                      <button key={s.id} onClick={() => setActiveSection(s.id as SectionId)}
                        className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-primary transition-colors py-0.5">
                        <span>{s.label}</span>
                        <ChevronRight className="w-3 h-3 shrink-0" />
                      </button>
                    ))}
                    {missing.length > 5 && <p className="text-[10px] text-muted-foreground">+{missing.length - 5} more</p>}
                  </div>
                </div>
              ) : null;
            })()}

            <nav className="space-y-0.5">
              {SECTIONS.map(s => {
                const Icon = s.icon;
                const active = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id as SectionId)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{s.label}</span>
                    {sectionHasData[s.id as SectionId] && !active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                    )}
                    {active && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ── Content ── */}
          <main className="flex-1 min-w-0 bg-card rounded-xl border border-border p-6">
            {(error || success) && (
              <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${error ? "bg-destructive/10 border border-destructive/30 text-destructive" : "bg-green-50 border border-green-200 text-green-700"}`}>
                {error || success}
              </div>
            )}

            {/* ── Section 1: Identity ── */}
            {activeSection === "identity" && (
              <div>
                <SectionHeader title="Identity" hint="Your public stage name and private legal details." />
                <div className="space-y-4">
                  <div>
                    <Label>Stage name *</Label>
                    <Input value={talentName} onChange={e => setTalentName(e.target.value)} placeholder="Your stage name" className="bg-secondary border-border" />
                  </div>
                  <div>
                    <Label lock hint="Only visible to you">Legal name</Label>
                    <Input value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="Full legal name" className="bg-secondary border-border" />
                  </div>
                  <div>
                    <Label>Pronouns</Label>
                    <Input value={pronouns} onChange={e => setPronouns(e.target.value)} placeholder="e.g. she/her, they/them" className="bg-secondary border-border" />
                  </div>
                  <div>
                    <Label lock hint="Only visible to you">Date of birth</Label>
                    <Input type="date" value={dob} onChange={e => setDob(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label hint="Youngest age you'd play">Playable age min</Label>
                      <Input type="number" min={1} max={120} value={playableMin} onChange={e => setPlayableMin(e.target.value)} placeholder="e.g. 18" className="bg-secondary border-border" />
                    </div>
                    <div>
                      <Label hint="Oldest age you'd play">Playable age max</Label>
                      <Input type="number" min={1} max={120} value={playableMax} onChange={e => setPlayableMax(e.target.value)} placeholder="e.g. 35" className="bg-secondary border-border" />
                    </div>
                  </div>
                  <div>
                    <Label hint={`${tagline.length}/200`}>Tagline</Label>
                    <textarea
                      value={tagline}
                      onChange={e => setTagline(e.target.value.slice(0, 200))}
                      rows={2}
                      placeholder="A short memorable phrase about your work…"
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none"
                    />
                  </div>
                  <div>
                    <Label>Bio</Label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
                      placeholder="Tell casting directors about yourself…"
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none" />
                  </div>
                  <div>
                    <Label hint="Your representation or management agency">Agency</Label>
                    <Input value={agency} onChange={e => setAgency(e.target.value)} placeholder="e.g. Creative Artists Agency" className="bg-secondary border-border" />
                  </div>

                </div>
                <SaveBtn saving={saving} onClick={async () => { await saveTalentFields(); await saveArtistProfile(); }} />
              </div>
            )}

            {/* ── Section 2: Disciplines & Skills ── */}
            {activeSection === "disciplines" && (
              <div>
                <SectionHeader title="Disciplines & Skills" />
                <div className="space-y-6">
                  <div>
                    <Label>Primary discipline</Label>
                    <div className="flex flex-wrap gap-2">
                      {DISCIPLINE_OPTIONS.map(d => (
                        <button key={d} type="button" onClick={() => setPrimaryDiscipline(d)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            primaryDiscipline === d ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                          }`}>
                          {primaryDiscipline === d && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                          {DISCIPLINE_LABELS[d] ?? d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label hint="Additional disciplines you work in">Sub-disciplines / Specialisations</Label>
                    <TagInput values={subDisciplines} onChange={setSubDisciplines} placeholder="e.g. theater actor, voiceover" />
                  </div>

                  <div>
                    <Label>Secondary disciplines</Label>
                    <TagInput values={secondaryDisciplines} onChange={setSecondaryDisciplines} placeholder="e.g. dancer, writer" />
                  </div>

                  {/* Per-category skill entries */}
                  <div>
                    <Label>Skills</Label>
                    <div className="space-y-4">
                      {SKILL_CATEGORIES.map(({ key, label }) => {
                        const categorySkills = skillEntries.filter(s => s.category === key);
                        const nsk = newSkill[key] ?? { name: "", proficiency: "" };
                        return (
                          <div key={key} className="p-4 bg-secondary/50 rounded-lg border border-border/50">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{label}</p>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {categorySkills.map(s => (
                                <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary border border-border text-xs">
                                  {s.name}
                                  {s.proficiency && <span className="text-muted-foreground">· {s.proficiency}</span>}
                                  <button onClick={() => s.id && removeSkillEntry(s.id)} className="hover:text-destructive transition-colors ml-0.5">
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input value={nsk.name} onChange={e => setNewSkill(prev => ({ ...prev, [key]: { ...nsk, name: e.target.value } }))}
                                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkillEntry(key); } }}
                                placeholder={`Add ${label.toLowerCase()}…`} className="bg-[var(--as-surface)] border-border text-xs flex-1" />
                              <select value={nsk.proficiency}
                                onChange={e => setNewSkill(prev => ({ ...prev, [key]: { ...nsk, proficiency: e.target.value } }))}
                                className="bg-[var(--as-surface)] border border-border rounded-lg px-2 text-xs text-muted-foreground outline-none">
                                <option value="">Level</option>
                                {SKILL_PROFICIENCY.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                              <button type="button" onClick={() => addSkillEntry(key)} className="px-3 rounded-lg border border-border bg-[var(--as-surface)] hover:bg-secondary transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <SaveBtn saving={saving} onClick={async () => { await saveTalentFields(); await saveArtistProfile(); }} />
              </div>
            )}

            {/* ── Section 3: Location & Travel ── */}
            {activeSection === "location" && (
              <div>
                <SectionHeader title="Location & Travel" />
                <div className="space-y-4">
                  <div>
                    <Label>Home market</Label>
                    <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London, UK" className="bg-secondary border-border" />
                  </div>
                  <div>
                    <Label>Works locally in these cities</Label>
                    <TagInput values={travelInfo.works_local_cities ?? []}
                      onChange={v => setTravelInfo((p: any) => ({ ...p, works_local_cities: v }))}
                      placeholder="e.g. Manchester, Birmingham" />
                  </div>
                  <div>
                    <Label>Passport / citizenship countries</Label>
                    <TagInput values={travelInfo.passport_countries ?? []}
                      onChange={v => setTravelInfo((p: any) => ({ ...p, passport_countries: v }))}
                      placeholder="e.g. UK, Egypt" />
                  </div>
                  <div>
                    <Label>Visa / work permit notes</Label>
                    <Input value={travelInfo.visa_notes ?? ""}
                      onChange={e => setTravelInfo((p: any) => ({ ...p, visa_notes: e.target.value }))}
                      placeholder="e.g. EU work authorisation" className="bg-secondary border-border" />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="domestic" checked={travelInfo.domestic_travel ?? false}
                      onChange={e => setTravelInfo((p: any) => ({ ...p, domestic_travel: e.target.checked }))}
                      className="w-4 h-4 rounded accent-primary" />
                    <label htmlFor="domestic" className="text-sm">Available for domestic travel</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="intl" checked={travelInfo.international_travel ?? false}
                      onChange={e => setTravelInfo((p: any) => ({ ...p, international_travel: e.target.checked }))}
                      className="w-4 h-4 rounded accent-primary" />
                    <label htmlFor="intl" className="text-sm">Available for international travel</label>
                  </div>
                </div>
                <SaveBtn saving={saving} onClick={() => saveTalentFields()} />
              </div>
            )}

            {/* ── Section 4: Physical Attributes ── */}
            {activeSection === "physical" && (
              <div>
                <SectionHeader title="Physical Attributes" hint="Sensitive fields are private by default." />
                <div className="grid grid-cols-2 gap-4">
                  {[["height", "Height"], ["weight", "Weight", true], ["hair_color", "Hair colour"], ["eye_color", "Eye colour"], ["build", "Build"], ["dress_size", "Dress/suit size", true], ["shoe_size", "Shoe size"], ["age_range", "Apparent age range"]].map(([key, lbl, priv]) => (
                    <div key={key as string}>
                      <Label lock={!!priv}>{lbl as string}</Label>
                      <Input value={physicalStats[key as string] ?? ""}
                        onChange={e => setPhysicalStats(p => ({ ...p, [key as string]: e.target.value }))}
                        placeholder="—" className="bg-secondary border-border" />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Label>Distinguishing features / tattoos</Label>
                  <Input value={physicalStats.distinguishing ?? ""}
                    onChange={e => setPhysicalStats(p => ({ ...p, distinguishing: e.target.value }))}
                    placeholder="e.g. small tattoo on left wrist, scar on chin" className="bg-secondary border-border" />
                </div>
                <SaveBtn saving={saving} onClick={() => saveTalentFields()} />
              </div>
            )}

            {/* ── Section 5: Training ── */}
            {activeSection === "training" && (
              <div>
                <SectionHeader title="Education & Training" />
                <div className="space-y-3 mb-4">
                  {training.map((t, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{t.school}</p>
                          {t.type && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground capitalize">{t.type}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{t.program}{t.start_year ? ` · ${t.start_year}${t.end_year ? `–${t.end_year}` : "–present"}` : ""}{t.instructor ? ` · Instructor: ${t.instructor}` : ""}</p>
                      </div>
                      <button onClick={() => setTraining(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg border border-border space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add training</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={newTraining.school} onChange={e => setNewTraining(p => ({ ...p, school: e.target.value }))} placeholder="School / institution" className="bg-[var(--as-surface)] border-border text-sm" />
                    <Input value={newTraining.program ?? ""} onChange={e => setNewTraining(p => ({ ...p, program: e.target.value }))} placeholder="Programme / course" className="bg-[var(--as-surface)] border-border text-sm" />
                    <Input value={newTraining.degree ?? ""} onChange={e => setNewTraining(p => ({ ...p, degree: e.target.value }))} placeholder="Degree / qualification" className="bg-[var(--as-surface)] border-border text-sm" />
                    <Input value={newTraining.start_year ?? ""} onChange={e => setNewTraining(p => ({ ...p, start_year: e.target.value }))} placeholder="Start year" className="bg-[var(--as-surface)] border-border text-sm" />
                    <Input value={newTraining.end_year ?? ""} onChange={e => setNewTraining(p => ({ ...p, end_year: e.target.value }))} placeholder="End year" className="bg-[var(--as-surface)] border-border text-sm" />
                    <Input value={newTraining.instructor ?? ""} onChange={e => setNewTraining(p => ({ ...p, instructor: e.target.value }))} placeholder="Instructor name" className="bg-[var(--as-surface)] border-border text-sm" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Entry type</p>
                    <select value={newTraining.type ?? "school"} onChange={e => setNewTraining(p => ({ ...p, type: e.target.value }))}
                      className="bg-[var(--as-surface)] border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none">
                      <option value="school">School / programme</option>
                      <option value="certification">Certification</option>
                      <option value="workshop">Workshop</option>
                      <option value="masterclass">Masterclass</option>
                    </select>
                  </div>
                  <button type="button"
                    onClick={() => {
                      if (!newTraining.school.trim()) return;
                      setTraining(prev => [...prev, { ...newTraining }]);
                      setNewTraining({ school: "", program: "", degree: "", start_year: "", end_year: "", instructor: "", type: "school" });
                    }}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add entry
                  </button>
                </div>
                <SaveBtn saving={saving} onClick={() => saveTalentFields()} />
              </div>
            )}

            {/* ── Section 6: Credits ── */}
            {activeSection === "credits" && (
              <div>
                <SectionHeader title="Credits" hint="Add your professional performance and production credits." />
                <div className="space-y-2 mb-4">
                  {credits.map((c, i) => (
                    <div key={c.id ?? i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.role}{c.year ? ` · ${c.year}` : ""}{c.production_type ? ` · ${c.production_type}` : ""}</p>
                      </div>
                      <button onClick={() => removeCredit(c.id, i)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg border border-border space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add credit</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input value={newCredit.title} onChange={e => setNewCredit(p => ({ ...p, title: e.target.value }))} placeholder="Production title" className="bg-[var(--as-surface)] border-border text-sm" />
                    <Input value={newCredit.role} onChange={e => setNewCredit(p => ({ ...p, role: e.target.value }))} placeholder="Your role" className="bg-[var(--as-surface)] border-border text-sm" />
                    <select value={newCredit.production_type ?? ""} onChange={e => setNewCredit(p => ({ ...p, production_type: e.target.value }))}
                      className="bg-[var(--as-surface)] border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none">
                      <option value="">Production type</option>
                      {["film", "tv", "theater", "commercial", "music_video", "short_film", "web_series"].map(t => (
                        <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                    <Input type="number" min={1900} max={2099} value={newCredit.year ?? ""} onChange={e => setNewCredit(p => ({ ...p, year: parseInt(e.target.value) }))} placeholder="Year" className="bg-[var(--as-surface)] border-border text-sm" />
                    <Input value={newCredit.director ?? ""} onChange={e => setNewCredit(p => ({ ...p, director: e.target.value }))} placeholder="Director" className="bg-[var(--as-surface)] border-border text-sm" />
                    <Input value={newCredit.billing ?? ""} onChange={e => setNewCredit(p => ({ ...p, billing: e.target.value }))} placeholder="Billing (lead / supporting)" className="bg-[var(--as-surface)] border-border text-sm" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Collaborators (co-stars, crew)</p>
                    <TagInput values={newCredit.collaborators ?? []} onChange={v => setNewCredit(p => ({ ...p, collaborators: v }))} placeholder="Add name and press Enter" />
                  </div>
                  <button type="button"
                    onClick={addCredit}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add credit
                  </button>
                </div>
                <SaveBtn saving={saving} onClick={() => saveTalentFields()} />
              </div>
            )}

            {/* ── Section 7: Unions & Representation ── */}
            {activeSection === "unions" && (
              <div>
                <SectionHeader title="Unions & Representation" />
                <div className="space-y-6">
                  <div>
                    <Label>Union / Guild memberships</Label>
                    <div className="space-y-2 mb-3">
                      {unions.map((u, i) => (
                        <div key={u.id ?? i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                          <div className="flex-1"><p className="text-sm font-medium">{u.union}</p><p className="text-xs text-muted-foreground">{u.status}{u.joined_year ? ` · ${u.joined_year}` : ""}</p></div>
                          <button onClick={() => removeUnion(u.id, i)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input value={newUnion.union} onChange={e => setNewUnion(p => ({ ...p, union: e.target.value }))} placeholder="Union name (e.g. Equity)" className="bg-secondary border-border text-sm flex-1" />
                      <select value={newUnion.status ?? ""} onChange={e => setNewUnion(p => ({ ...p, status: e.target.value }))}
                        className="bg-secondary border border-border rounded-lg px-2 text-xs text-muted-foreground outline-none">
                        <option value="">Status</option>
                        {["active", "inactive", "eligible"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button type="button"
                        onClick={addUnion}
                        className="px-3 rounded-lg border border-border bg-secondary hover:bg-card transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div>
                    <Label>Representation</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Agency name</p>
                        <Input value={representation.agency ?? ""} onChange={e => setRepresentation(p => ({ ...p, agency: e.target.value }))} placeholder="Agency name" className="bg-secondary border-border text-sm" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Agent name</p>
                        <Input value={representation.agent ?? ""} onChange={e => setRepresentation(p => ({ ...p, agent: e.target.value }))} placeholder="Agent name" className="bg-secondary border-border text-sm" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Representation type</p>
                        <select value={representation.type ?? ""} onChange={e => setRepresentation(p => ({ ...p, type: e.target.value }))}
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none">
                          <option value="">Select type</option>
                          {["exclusive", "co_exclusive", "non_exclusive", "self_represented"].map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Manager name</p>
                        <Input value={representation.manager_name ?? ""} onChange={e => setRepresentation(p => ({ ...p, manager_name: e.target.value }))} placeholder="Manager's name" className="bg-secondary border-border text-sm" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Manager contact</p>
                        <Input value={representation.manager_contact ?? ""} onChange={e => setRepresentation(p => ({ ...p, manager_contact: e.target.value }))} placeholder="Email or phone" className="bg-secondary border-border text-sm" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Submission rules / notes</p>
                      <textarea value={submissionPrefs.submission_rules ?? ""} onChange={e => setSubmissionPrefs(p => ({ ...p, submission_rules: e.target.value }))} rows={3}
                        placeholder="e.g. Submit via agent only. No self-submissions. Include showreel link."
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="direct_contact" checked={submissionPrefs.allow_direct_contact ?? true}
                      onChange={e => setSubmissionPrefs(p => ({ ...p, allow_direct_contact: e.target.checked }))}
                      className="w-4 h-4 rounded accent-primary" />
                    <label htmlFor="direct_contact" className="text-sm">Allow direct contact from hirers (bypasses agent)</label>
                  </div>
                </div>
                <SaveBtn saving={saving} onClick={() => saveArtistProfile()} />
              </div>
            )}

            {/* ── Section 8: Media ── */}
            {activeSection === "media" && (
              <div>
                <SectionHeader title="Media" hint="Profile photo, headshots, cover image and showreel." />
                <div className="space-y-6">
                  <div>
                    <Label>Profile photo (avatar)</Label>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-16 h-16 rounded-xl border border-border bg-secondary overflow-hidden flex items-center justify-center shrink-0">
                        {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-muted-foreground">{talentName?.[0]?.toUpperCase() ?? "?"}</span>}
                      </div>
                      <div className="flex gap-2">
                        <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                        <button type="button" onClick={() => avatarFileRef.current?.click()} disabled={avatarUploading}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-card transition-colors disabled:opacity-50">
                          {avatarUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          {avatarUploading ? "Uploading…" : "Upload"}
                        </button>
                        <button type="button" onClick={openCamera}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-card transition-colors">
                          <Camera className="w-3 h-3" /> Camera
                        </button>
                      </div>
                    </div>
                    {showCamera && (
                      <div className="rounded-xl overflow-hidden bg-black mb-3 relative">
                        <video ref={cameraVideoRef} autoPlay playsInline muted className="w-full max-h-56 object-cover block" />
                        <canvas ref={cameraCanvasRef} className="hidden" />
                        {cameraState === "starting" && <div className="absolute inset-0 flex items-center justify-center bg-black/70"><Loader2 className="w-7 h-7 text-white animate-spin" /></div>}
                        {cameraState === "uploading" && <div className="absolute inset-0 flex items-center justify-center bg-black/70"><Loader2 className="w-7 h-7 text-white animate-spin" /></div>}
                        {cameraState === "error" && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-4"><span className="text-red-400 text-xs">{cameraErr}</span><button onClick={closeCamera} className="text-white text-xs underline">Close</button></div>}
                        {cameraState === "live" && (
                          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                            <button type="button" onClick={capturePhoto} className="px-4 py-1.5 bg-primary text-white text-sm rounded-full">Capture</button>
                            <button type="button" onClick={closeCamera} className="px-4 py-1.5 bg-black/50 text-white text-sm rounded-full border border-white/30">Cancel</button>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mb-1">Or paste URL:</p>
                    <Input value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://…" className="bg-secondary border-border text-xs" />
                  </div>

                  <div>
                    <Label hint="Manage your clips and showreels">Reels & Clips</Label>
                    <div className="space-y-2 mb-3">
                      {reels.map(r => (
                        <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{r.title}</p>
                              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">{r.type}</span>
                              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">{r.visibility}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{r.video_url}</p>
                          </div>
                          <button onClick={() => r.id && deleteReel(r.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-secondary/30 rounded-lg border border-border space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add reel</p>
                      {/* Upload a real video file (recommended) */}
                      <div className="flex items-center gap-2">
                        <input ref={reelFileRef} type="file" accept="video/*" className="hidden" onChange={handleReelFile} />
                        <button type="button" onClick={() => reelFileRef.current?.click()} disabled={reelUploading}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-[var(--as-surface)] hover:bg-secondary transition-colors disabled:opacity-50">
                          {reelUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          {reelUploading ? "Uploading…" : "Upload video file"}
                        </button>
                        {newReel.video_url && !reelUploading && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> Video ready</span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input value={newReel.title} onChange={e => setNewReel(p => ({ ...p, title: e.target.value }))} placeholder="Title" className="bg-[var(--as-surface)] border-border text-sm" />
                        <Input value={newReel.video_url} onChange={e => setNewReel(p => ({ ...p, video_url: e.target.value }))} placeholder="…or paste a URL (YouTube / Vimeo embed)" className="bg-[var(--as-surface)] border-border text-sm" />
                        <Input value={newReel.thumbnail_url ?? ""} onChange={e => setNewReel(p => ({ ...p, thumbnail_url: e.target.value }))} placeholder="Thumbnail URL (optional)" className="bg-[var(--as-surface)] border-border text-sm" />
                        <select value={newReel.type} onChange={e => setNewReel(p => ({ ...p, type: e.target.value }))}
                          className="bg-[var(--as-surface)] border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none">
                          {["reel", "monologue", "song", "dance", "voice_demo", "comedy", "cover"].map(t => (
                            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                          ))}
                        </select>
                        <select value={newReel.visibility} onChange={e => setNewReel(p => ({ ...p, visibility: e.target.value }))}
                          className="bg-[var(--as-surface)] border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none">
                          <option value="public">Public</option>
                          <option value="platform_only">Platform only</option>
                          <option value="industry_only">Industry only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                      <textarea value={newReel.description ?? ""} onChange={e => setNewReel(p => ({ ...p, description: e.target.value }))} rows={2}
                        placeholder="Description (optional)" className="w-full bg-[var(--as-surface)] border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none" />
                      <button type="button" onClick={addReel} disabled={reelSaving}
                        className="flex items-center gap-1.5 text-sm text-primary hover:underline disabled:opacity-50">
                        {reelSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add reel
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Featured showreel URL (fallback shortcut)</p>
                    <Input value={reelUrl} onChange={e => setReelUrl(e.target.value)} placeholder="https://youtube.com/embed/…" className="bg-secondary border-border mt-1" />
                  </div>

                  <div>
                    <Label hint="Upload up to 8 headshots — they appear in your public gallery">Headshots</Label>
                    <ImageUploader values={headshots} onChange={setHeadshots} max={8} />
                  </div>

                  <div>
                    <Label>Cover image URL</Label>
                    <Input value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://…" className="bg-secondary border-border" />
                  </div>

                  <div>
                    <Label>Social links</Label>
                    {["instagram", "youtube", "imdb", "spotify", "twitter", "tiktok", "website"].map(p => (
                      <div key={p} className="grid grid-cols-[100px_1fr] items-center gap-2 mb-2">
                        <span className="text-xs capitalize text-muted-foreground">{p}</span>
                        <Input value={socialLinks[p] ?? ""} onChange={e => setSocialLinks(prev => { const u = { ...prev }; if (e.target.value) u[p] = e.target.value; else delete u[p]; return u; })}
                          placeholder={`https://${p}.com/…`} className="bg-secondary border-border text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
                <SaveBtn saving={saving} onClick={async () => { await saveTalentFields(); if (artistUsername) await saveArtistProfile(); }} />
              </div>
            )}

            {/* ── Section 9: Awards & Press ── */}
            {activeSection === "awards" && (
              <div>
                <SectionHeader title="Awards & Press" />
                <div className="space-y-8">
                  <div>
                    <Label>Awards & laurels</Label>
                    <div className="space-y-2 mb-3">
                      {awards.map((a, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                          <div className="flex-1"><p className="text-sm font-medium">{a.name}</p><p className="text-xs text-muted-foreground">{a.festival}{a.year ? ` · ${a.year}` : ""}</p></div>
                          <button onClick={() => setAwards(p => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={newAward.name} onChange={e => setNewAward(p => ({ ...p, name: e.target.value }))} placeholder="Award name" className="bg-[var(--as-surface)] border-border text-sm" />
                        <Input value={newAward.festival ?? ""} onChange={e => setNewAward(p => ({ ...p, festival: e.target.value }))} placeholder="Festival / body" className="bg-[var(--as-surface)] border-border text-sm" />
                        <Input value={newAward.project ?? ""} onChange={e => setNewAward(p => ({ ...p, project: e.target.value }))} placeholder="Project" className="bg-[var(--as-surface)] border-border text-sm" />
                        <Input value={newAward.year ?? ""} onChange={e => setNewAward(p => ({ ...p, year: e.target.value }))} placeholder="Year" className="bg-[var(--as-surface)] border-border text-sm" />
                        <Input value={newAward.url ?? ""} onChange={e => setNewAward(p => ({ ...p, url: e.target.value }))} placeholder="Award URL (optional)" className="bg-[var(--as-surface)] border-border text-sm" />
                        <select value={newAward.award_type ?? ""} onChange={e => setNewAward(p => ({ ...p, award_type: e.target.value }))}
                          className="bg-[var(--as-surface)] border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none">
                          <option value="">Award type</option>
                          {["winner", "nominee", "grant", "special_mention", "honorary"].map(t => (
                            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                          ))}
                        </select>
                      </div>
                      <button type="button" onClick={() => {
                        if (!newAward.name.trim()) return;
                        setAwards(p => [...p, { ...newAward }]);
                        setNewAward({ name: "", festival: "", project: "", year: "", url: "", award_type: "" });
                      }} className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"><Plus className="w-3.5 h-3.5" /> Add award</button>
                    </div>
                  </div>

                  <div>
                    <Label>Press mentions</Label>
                    <div className="space-y-2 mb-3">
                      {pressMentions.map((pm, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                          <div className="flex-1"><p className="text-sm font-medium">{pm.headline}</p><p className="text-xs text-muted-foreground">{pm.publication}{pm.date ? ` · ${pm.date}` : ""}</p></div>
                          <button onClick={() => setPressMentions(p => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={newPressMention.headline} onChange={e => setNewPressMention(p => ({ ...p, headline: e.target.value }))} placeholder="Headline" className="bg-[var(--as-surface)] border-border text-sm" />
                        <Input value={newPressMention.publication ?? ""} onChange={e => setNewPressMention(p => ({ ...p, publication: e.target.value }))} placeholder="Publication" className="bg-[var(--as-surface)] border-border text-sm" />
                        <Input value={newPressMention.date ?? ""} onChange={e => setNewPressMention(p => ({ ...p, date: e.target.value }))} placeholder="Date (YYYY-MM-DD)" className="bg-[var(--as-surface)] border-border text-sm" />
                        <Input value={newPressMention.url ?? ""} onChange={e => setNewPressMention(p => ({ ...p, url: e.target.value }))} placeholder="URL" className="bg-[var(--as-surface)] border-border text-sm" />
                      </div>
                      <button type="button" onClick={() => {
                        if (!newPressMention.headline.trim()) return;
                        setPressMentions(p => [...p, { ...newPressMention }]);
                        setNewPressMention({ headline: "", publication: "", date: "", url: "" });
                      }} className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"><Plus className="w-3.5 h-3.5" /> Add press mention</button>
                    </div>
                  </div>

                  <div>
                    <Label>External links</Label>
                    {[["imdb", "IMDb"], ["wikipedia", "Wikipedia"], ["website", "Personal website"], ["spotify", "Spotify"], ["label_page", "Label page"]].map(([k, lbl]) => (
                      <div key={k} className="grid grid-cols-[130px_1fr] items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">{lbl}</span>
                        <Input value={externalLinks[k] ?? ""} onChange={e => setExternalLinks(p => { const u = { ...p }; if (e.target.value) u[k] = e.target.value; else delete u[k]; return u; })}
                          placeholder="https://…" className="bg-secondary border-border text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
                <SaveBtn saving={saving} onClick={() => saveTalentFields()} />
              </div>
            )}

            {/* ── Section 10: Availability ── */}
            {activeSection === "availability" && (
              <div>
                <SectionHeader title="Availability" hint="Let hirers and casting directors know when you're free." />
                {/* ── Quick status badge ── */}
                <div className="space-y-5 mb-8">
                  <div>
                    <Label>Quick status</Label>
                    <div className="flex gap-3">
                      {["Available", "Limited", "Unavailable"].map(s => (
                        <button key={s} type="button" onClick={() => setAvailabilityStatus(s)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                            availabilityStatus === s
                              ? s === "Available" ? "bg-green-50 border-green-400 text-green-700" : s === "Limited" ? "bg-[rgba(255,215,0,0.12)] border-amber-400 text-[var(--as-accent)]" : "bg-secondary border-border text-muted-foreground"
                              : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label hint="Shown next to your badge, e.g. &ldquo;Available from June&rdquo;">Status note</Label>
                    <Input value={availabilityUntil} onChange={e => setAvailabilityUntil(e.target.value)} placeholder="e.g. Available Jun – Aug 2025" className="bg-secondary border-border" />
                  </div>
                </div>
                <SaveBtn saving={saving} onClick={() => saveTalentFields()} />

                {/* ── Calendar date-window manager ── */}
                <div style={{ marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
                  <p className="text-sm font-semibold mb-1">Availability Calendar</p>
                  <p className="text-xs text-muted-foreground mb-4">Mark specific date ranges so hirers can check your schedule before booking.</p>

                  {/* Month navigation */}
                  {(() => {
                    const AVAIL_COLORS: Record<string, { bg: string; text: string }> = {
                      available: { bg: "#dcfce7", text: "#16a34a" },
                      tentative: { bg: "#fef9c3", text: "#a16207" },
                      unavailable: { bg: "#f3f4f6", text: "#6b7280" },
                      booked: { bg: "#ede9fe", text: "#7c3aed" },
                    };

                    const year = calMonth.getFullYear();
                    const month = calMonth.getMonth();
                    const firstDay = new Date(year, month, 1);
                    const lastDay = new Date(year, month + 1, 0);
                    // Day of week for first day (0=Sun → we shift to Mon=0)
                    const startDow = (firstDay.getDay() + 6) % 7;
                    const totalCells = startDow + lastDay.getDate();
                    const cells = Array.from({ length: Math.ceil(totalCells / 7) * 7 }, (_, i) => {
                      const dayNum = i - startDow + 1;
                      return dayNum >= 1 && dayNum <= lastDay.getDate() ? dayNum : null;
                    });

                    const getWindowForDay = (day: number) => {
                      const d = new Date(year, month, day);
                      return availWindows.find(w => {
                        const ws = new Date(w.start_date + "T00:00:00");
                        const we = new Date(w.end_date + "T00:00:00");
                        return d >= ws && d <= we;
                      });
                    };

                    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                    return (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                          <button type="button" onClick={() => setCalMonth(new Date(year, month - 1, 1))} style={{ padding: "4px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "none", cursor: "pointer", fontSize: "14px" }}>‹</button>
                          <span style={{ fontWeight: "600", fontSize: "14px" }}>{monthNames[month]} {year}</span>
                          <button type="button" onClick={() => setCalMonth(new Date(year, month + 1, 1))} style={{ padding: "4px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "none", cursor: "pointer", fontSize: "14px" }}>›</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "16px" }}>
                          {["M","T","W","T","F","S","S"].map((d, i) => (
                            <div key={i} style={{ textAlign: "center", fontSize: "11px", fontWeight: "600", color: "var(--muted-foreground)", padding: "4px 0" }}>{d}</div>
                          ))}
                          {cells.map((day, i) => {
                            if (!day) return <div key={i} />;
                            const w = getWindowForDay(day);
                            const c = w ? AVAIL_COLORS[w.state] : null;
                            return (
                              <div key={i} title={w ? `${w.state}${w.note ? ` · ${w.note}` : ""}` : undefined}
                                style={{ textAlign: "center", padding: "5px 0", borderRadius: "6px", fontSize: "12px", fontWeight: "500",
                                  backgroundColor: c ? c.bg : "transparent", color: c ? c.text : "var(--foreground)",
                                  cursor: "default",
                                }}>
                                {day}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
                          {Object.entries(AVAIL_COLORS).map(([state, c]) => (
                            <span key={state} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: c.text }}>
                              <span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: c.bg, border: `1px solid ${c.text}40`, display: "inline-block" }} />
                              {state.charAt(0).toUpperCase() + state.slice(1)}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Add window form */}
                  {!addingWindow ? (
                    <button type="button" onClick={() => setAddingWindow(true)} style={{ padding: "7px 16px", borderRadius: "9px", border: "1px dashed var(--border)", background: "none", cursor: "pointer", fontSize: "13px", color: "var(--muted-foreground)", width: "100%", marginBottom: "16px" }}>
                      + Add date window
                    </button>
                  ) : (
                    <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--secondary)", marginBottom: "16px" }}>
                      <p className="text-sm font-semibold mb-3">New availability window</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: "500", color: "var(--muted-foreground)", display: "block", marginBottom: "3px" }}>Start date</label>
                          <input type="date" value={newWindow.start} onChange={e => setNewWindow(p => ({ ...p, start: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", backgroundColor: "var(--background)" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: "500", color: "var(--muted-foreground)", display: "block", marginBottom: "3px" }}>End date</label>
                          <input type="date" value={newWindow.end} onChange={e => setNewWindow(p => ({ ...p, end: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", backgroundColor: "var(--background)" }} />
                        </div>
                      </div>
                      <div style={{ marginBottom: "8px" }}>
                        <label style={{ fontSize: "11px", fontWeight: "500", color: "var(--muted-foreground)", display: "block", marginBottom: "3px" }}>Status</label>
                        <select value={newWindow.state} onChange={e => setNewWindow(p => ({ ...p, state: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", backgroundColor: "var(--background)" }}>
                          <option value="available">Available</option>
                          <option value="tentative">Tentative</option>
                          <option value="unavailable">Unavailable</option>
                          <option value="booked">Booked</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: "8px" }}>
                        <label style={{ fontSize: "11px", fontWeight: "500", color: "var(--muted-foreground)", display: "block", marginBottom: "3px" }}>Note (optional)</label>
                        <input type="text" value={newWindow.note} onChange={e => setNewWindow(p => ({ ...p, note: e.target.value }))} placeholder="e.g. Film shoot in Atlanta" style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "13px", outline: "none", backgroundColor: "var(--background)" }} />
                      </div>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", marginBottom: "12px", cursor: "pointer" }}>
                        <input type="checkbox" checked={newWindow.willing_to_travel} onChange={e => setNewWindow(p => ({ ...p, willing_to_travel: e.target.checked }))} />
                        Willing to travel during this window
                      </label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button type="button" disabled={savingWindow || !newWindow.start || !newWindow.end} onClick={async () => {
                          if (!newWindow.start || !newWindow.end) return;
                          setSavingWindow(true);
                          try {
                            const created = await apiClient.post<typeof availWindows[0]>("/availability/", {
                              start_date: newWindow.start, end_date: newWindow.end,
                              state: newWindow.state, note: newWindow.note, willing_to_travel: newWindow.willing_to_travel,
                            });
                            setAvailWindows(p => [...p, created]);
                            setNewWindow({ start: "", end: "", state: "available", note: "", willing_to_travel: true });
                            setAddingWindow(false);
                          } catch { setWindowSaveError("Failed to save window. Please try again."); } finally { setSavingWindow(false); }
                        }} style={{ padding: "7px 16px", borderRadius: "8px", backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", border: "none", cursor: savingWindow ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: "500", opacity: savingWindow ? 0.7 : 1 }}>
                          {savingWindow ? "Saving…" : "Save"}
                        </button>
                        <button type="button" onClick={() => { setAddingWindow(false); setWindowSaveError(""); }} style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "none", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
                      </div>
                      {windowSaveError && <p style={{ marginTop: "8px", fontSize: "12px", color: "#b91c1c" }}>{windowSaveError}</p>}
                    </div>
                  )}

                  {/* Window list */}
                  {availWindows.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {availWindows.map(w => {
                        const STATE_COLORS: Record<string, string> = { available: "#16a34a", tentative: "#a16207", unavailable: "#6b7280", booked: "#7c3aed" };
                        const c = STATE_COLORS[w.state] || "#6b7280";
                        return (
                          <div key={w.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", borderLeft: `3px solid ${c}`, backgroundColor: "var(--background)" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "600", color: c }}>{w.state.charAt(0).toUpperCase() + w.state.slice(1)}</span>
                                <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{w.start_date} → {w.end_date}</span>
                                {w.willing_to_travel && <span style={{ fontSize: "10px", color: "var(--muted-foreground)" }}>✈ travel</span>}
                              </div>
                              {w.note && <p style={{ fontSize: "11px", color: "var(--muted-foreground)", margin: 0, fontStyle: "italic" }}>{w.note}</p>}
                            </div>
                            <button type="button" onClick={async () => {
                              try {
                                await apiClient.delete(`/availability/${w.id}/`);
                                setAvailWindows(p => p.filter(x => x.id !== w.id));
                              } catch { /* silent */ }
                            }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "var(--muted-foreground)", padding: "0 4px", lineHeight: 1 }}>×</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Section 11: Equipment & Tech ── */}
            {activeSection === "equipment" && (
              <div>
                <SectionHeader title="Equipment & Tech" hint="Own equipment you bring to a production — cameras, lighting, audio gear, software, etc." />
                <TagInput values={equipment} onChange={setEquipment} placeholder="e.g. Sony FX3, Godox SL200W, Sennheiser MKH416" />
                <SaveBtn saving={saving} onClick={() => saveTalentFields()} />
              </div>
            )}

            {/* ── Section 12: Visibility ── */}
            {activeSection === "visibility" && (
              <div>
                <SectionHeader title="Visibility" hint="Control who can see your profile." />
                <div className="space-y-3 mb-6">
                  {VISIBILITY_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setProfileVisibility(opt.value)}
                      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
                        profileVisibility === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
                      }`}>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 ${profileVisibility === opt.value ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                      <div>
                        <p className="font-medium text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div>
                  <Label hint="Override visibility for specific sensitive fields">Per-field privacy</Label>
                  {[
                    ["date_of_birth", "Date of birth"],
                    ["physical_stats", "Physical attributes"],
                    ["measurements", "Measurements"],
                    ["location", "Exact location"],
                    ["bio", "Bio"],
                    ["training", "Training & Education"],
                    ["credits", "Credits"],
                    ["awards", "Awards & Press"],
                    ["union_affiliations", "Union affiliations"],
                    ["representation", "Representation"],
                    ["equipment", "Equipment"],
                    ["availability", "Availability"],
                    ["press_mentions", "Press mentions"],
                    ["name_audio_url", "Name audio"],
                    ["languages", "Languages"],
                  ].map(([k, lbl]) => (
                    <div key={k} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <span className="text-sm">{lbl}</span>
                      <select value={fieldVisibility[k] ?? "default"}
                        onChange={e => setFieldVisibility(p => ({ ...p, [k]: e.target.value }))}
                        className="bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-muted-foreground outline-none">
                        <option value="default">Follow profile</option>
                        <option value="public">Always public</option>
                        <option value="platform_only">Platform only</option>
                        <option value="industry_only">Industry only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  ))}
                </div>
                <SaveBtn saving={saving} onClick={() => saveTalentFields()} />
              </div>
            )}

            {/* ── Section 11: Discipline Details ── */}
            {activeSection === "discipline_details" && (
              <div>
                <SectionHeader
                  title={primaryDiscipline ? `${DISCIPLINE_LABELS[primaryDiscipline] ?? primaryDiscipline} — Detailed Profile` : "Discipline Details"}
                  hint={primaryDiscipline ? "Craft-specific attributes for your primary discipline." : undefined}
                />
                {!primaryDiscipline ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Briefcase className="w-8 h-8 text-muted-foreground mb-3 opacity-40" />
                    <p className="text-sm text-muted-foreground mb-2">Set your primary discipline first.</p>
                    <button onClick={() => setActiveSection("disciplines")} className="text-sm text-primary hover:underline flex items-center gap-1">
                      Go to Disciplines &amp; Skills <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <DisciplineForm
                      discipline={primaryDiscipline}
                      data={(disciplineData[primaryDiscipline] ?? DISCIPLINE_DEFAULTS[primaryDiscipline] ?? {}) as Record<string, unknown>}
                      onChange={(key, value) => {
                        setDisciplineData(prev => ({
                          ...prev,
                          [primaryDiscipline]: { ...(prev[primaryDiscipline] ?? {}), [key]: value },
                        }));
                      }}
                    />
                    <SaveBtn saving={saving} onClick={() => saveTalentFields()} />
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProfileEditPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>}>
      <ProfileEditContent />
    </Suspense>
  );
}
