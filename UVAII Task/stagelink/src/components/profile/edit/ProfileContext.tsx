"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";
import { SectionId, SkillEntry, TrainingEntry, AwardEntry, PressMention, CreditEntry, UnionEntry, ReelEntry } from "./types";
import { AGE_MIN, AGE_MAX, YEAR_MIN, YEAR_MAX, isPlausibleYear, isValidHttpUrl, isValidEmail, isFutureDate } from "@/lib/validation";

export function useProfileStateRoot() {
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
  const [newTraining, setNewTraining] = useState<TrainingEntry>({ school: "", program: "", degree: "", start_year: "", end_year: "", instructor: "", type: "school", certificate_url: "", certificate_name: "" });

  // Awards form (controlled)
  const [newAward, setNewAward] = useState<AwardEntry>({ name: "", festival: "", project: "", year: "", url: "", award_type: "won" });

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
      apiClient.get<any>("/profile/", true),
      apiClient.get<any[]>("/skill-entries/", true),
      apiClient.get<CreditEntry[]>("/credits/", true).catch(() => [] as CreditEntry[]),
      apiClient.get<UnionEntry[]>("/union-affiliations/", true).catch(() => [] as UnionEntry[]),
    ])
      .then(([talent, skills, creditList, unionList]) => {
        setTalentName(talent.name ?? "");
        setLegalName(talent.legal_name ?? "");
        // pronouns live on ArtistProfile, not Talent — set below from the artist GET.
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
          apiClient.get<any>(`/artists/${talent.artstage_username}/`, true)
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
      apiClient.get<typeof availWindows>("/availability/", true).then(setAvailWindows).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  /* ─── Save helpers ───────────────────────────────────────── */

  // ArtistProfile (ArtStage) fields — shared by the talent PUT follow-up and the artist PATCH.
  function artistProfilePayload(extra: Record<string, unknown> = {}) {
    const payload: Record<string, unknown> = {
      primary_discipline: primaryDiscipline,
      secondary_disciplines: secondaryDisciplines,
      pronouns,
      tagline,
      headshots,
      cover_image: coverImage || null,
      representation,
      submission_preferences: submissionPrefs,
      ...extra,
    };
    // playable_age_* are non-nullable integers on the backend. Only send them when set
    // (PATCH is partial, so omitting keeps the existing/default value) and never send null.
    if (playableMin !== "") payload.playable_age_min = Number(playableMin);
    if (playableMax !== "") payload.playable_age_max = Number(playableMax);
    return payload;
  }

  // Whole-form validation gate — returns the first problem found, or null when clean.
  // Defence in depth: even if a section guard is bypassed, Save can't submit bad data.
  function validateAll(): string | null {
    if (playableMin !== "" && (Number(playableMin) < AGE_MIN || Number(playableMin) > AGE_MAX))
      return `Playable age min must be between ${AGE_MIN} and ${AGE_MAX}.`;
    if (playableMax !== "" && (Number(playableMax) < AGE_MIN || Number(playableMax) > AGE_MAX))
      return `Playable age max must be between ${AGE_MIN} and ${AGE_MAX}.`;
    if (playableMin !== "" && playableMax !== "" && Number(playableMin) > Number(playableMax))
      return "Minimum playable age can't be greater than the maximum.";
    if (isFutureDate(dob)) return "Date of birth can't be in the future.";
    for (const t of training) {
      if (!isPlausibleYear(t.start_year) || !isPlausibleYear(t.end_year))
        return `Training years must be between ${YEAR_MIN} and ${YEAR_MAX}.`;
      if (t.start_year && t.end_year && Number(t.start_year) > Number(t.end_year))
        return `Training "${t.school}" has a start year after its end year.`;
    }
    for (const a of awards) {
      if (!isPlausibleYear(a.year)) return `Award "${a.name}" has an invalid year.`;
      if (!isValidHttpUrl(a.url)) return `Award "${a.name}" has an invalid link.`;
    }
    for (const pm of pressMentions) {
      if (!isValidHttpUrl(pm.url)) return `Press mention "${pm.headline}" has an invalid link.`;
    }
    if (!isValidEmail(representation?.agent_email as string | undefined))
      return "Agent email is not a valid email address.";
    return null;
  }

  // Persist the whole form: PUT the Talent record, then PATCH the ArtistProfile.
  // `extra` is merged into the Talent payload (used by the setup wizard to set a default avatar).
  async function saveAll(extra: Record<string, unknown> = {}) {
    const problem = validateAll();
    if (problem) { setError(problem); setSuccess(""); return; }
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
      // The ArtistProfile is auto-created on first PUT; pick up its username so we can
      // always persist the ArtStage fields (disciplines, pronouns, tagline, headshots, …).
      const username = artistUsername || updated?.artstage_username;
      if (username) {
        if (!artistUsername) setArtistUsername(username);
        await apiClient.patch(`/artists/${username}/`, artistProfilePayload());
      }
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
    if (!newCredit.title?.trim() || !newCredit.role?.trim()) {
      setError("Credit needs a title and a role."); return;
    }
    if (!newCredit.year || !isPlausibleYear(newCredit.year)) {
      setError(`Credit needs a valid year between ${YEAR_MIN} and ${YEAR_MAX}.`); return;
    }
    setError("");
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
    if (!newUnion.union.trim()) { setError("Select or enter a union."); return; }
    if (newUnion.joined_year != null && !isPlausibleYear(newUnion.joined_year)) {
      setError(`Joined year must be between ${YEAR_MIN} and ${YEAR_MAX}.`); return;
    }
    setError("");
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

  /* ─── Availability Windows ───────────────────────────────── */
  async function addAvailWindow() {
    setSavingWindow(true);
    setWindowSaveError("");
    try {
      if (!newWindow.start || !newWindow.end) throw new Error("Start and end dates are required.");
      const created = await apiClient.post<any>("/availability/", {
        start_date: newWindow.start,
        end_date: newWindow.end,
        state: newWindow.state,
        note: newWindow.note,
        willing_to_travel: newWindow.willing_to_travel
      });
      setAvailWindows(prev => [...prev, created]);
      setAddingWindow(false);
      setNewWindow({ start: "", end: "", state: "available", note: "", willing_to_travel: true });
    } catch (e: any) {
      setWindowSaveError(e?.message ?? "Failed to save availability window.");
    } finally {
      setSavingWindow(false);
    }
  }

  async function removeAvailWindow(id: number) {
    try {
      await apiClient.delete(`/availability/${id}/`);
      setAvailWindows(prev => prev.filter(w => w.id !== id));
    } catch (e: any) {
      console.error(e);
    }
  }

  /* ─── Reel CRUD ──────────────────────────────────────────── */

  async function loadReels() {
    if (reelsLoaded) return;
    try {
      const data = await apiClient.get<ReelEntry[]>("/reels/", true);
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
      await saveAll(avatar ? {} : { avatar: headshots[0] ?? null });
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
      const me = await apiClient.get<{ onboarding_complete?: boolean }>("/auth/me/", true);
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

  return {
    activeSection, setActiveSection, loading, setLoading, saving, setSaving, error, setError, success, setSuccess, wizardStep, setWizardStep, wizardError, setWizardError, finishing, setFinishing, talentName, setTalentName, legalName, setLegalName, pronouns, setPronouns, dob, setDob, tagline, setTagline, playableMin, setPlayableMin, playableMax, setPlayableMax, bio, setBio, location, setLocation, avatar, setAvatar, reelUrl, setReelUrl, unionName, setUnionName, socialLinks, setSocialLinks, subDisciplines, setSubDisciplines, physicalStats, setPhysicalStats, travelInfo, setTravelInfo, training, setTraining, awards, setAwards, pressMentions, setPressMentions, externalLinks, setExternalLinks, profileVisibility, setProfileVisibility, fieldVisibility, setFieldVisibility, disciplineData, setDisciplineData, availabilityStatus, setAvailabilityStatus, availabilityUntil, setAvailabilityUntil, availWindows, setAvailWindows, calMonth, setCalMonth, addingWindow, setAddingWindow, newWindow, setNewWindow, savingWindow, setSavingWindow, equipment, setEquipment, agency, setAgency, nameAudioUrl, setNameAudioUrl, artistUsername, setArtistUsername, primaryDiscipline, setPrimaryDiscipline, secondaryDisciplines, setSecondaryDisciplines, completenessScore, setCompletenessScore, headshots, setHeadshots, coverImage, setCoverImage, representation, setRepresentation, submissionPrefs, setSubmissionPrefs, skillEntries, setSkillEntries, newSkill, setNewSkill, credits, setCredits, newCredit, setNewCredit, newTraining, setNewTraining, newAward, setNewAward, newPressMention, setNewPressMention, windowSaveError, setWindowSaveError, unions, setUnions, newUnion, setNewUnion, reels, setReels, newReel, setNewReel, reelsLoaded, setReelsLoaded, reelSaving, setReelSaving, reelUploading, setReelUploading, reelFileRef, avatarFileRef, avatarUploading, setAvatarUploading, showCamera, setShowCamera, cameraVideoRef, cameraCanvasRef, cameraStreamRef, cameraState, setCameraState, cameraErr, setCameraErr, saveAll, addSkillEntry, removeSkillEntry, addCredit, removeCredit, addUnion, removeUnion, loadReels, addReel, deleteReel, uploadReelVideo, handleReelFile, handleAvatarFile, openCamera, closeCamera, capturePhoto, finishSetup, router, searchParams, isSetup, sectionParam, currentUser, addAvailWindow, removeAvailWindow
  };
}

export const ProfileContext = createContext<ReturnType<typeof useProfileStateRoot> | null>(null);

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const state = useProfileStateRoot();
  return <ProfileContext.Provider value={state}>{children}</ProfileContext.Provider>;
}
