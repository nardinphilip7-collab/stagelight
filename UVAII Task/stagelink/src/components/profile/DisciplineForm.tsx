"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";

/* ─── Metadata ───────────────────────────────────────────────── */

export const DISCIPLINE_LABELS: Record<string, string> = {
  actor: "Actor",
  singer: "Singer",
  dancer: "Dancer",
  musician: "Musician",
  comedian: "Comedian",
  presenter: "Presenter / Host",
  director: "Director",
  writer: "Writer",
  cinematographer: "Cinematographer / Crew",
  choreographer: "Choreographer",
  composer: "Composer",
  visual_artist: "Visual / Design Artist",
  model: "Model",
  stage_technician: "Stage / Production Technician",
};

export const DISCIPLINE_DEFAULTS: Record<string, Record<string, unknown>> = {
  actor: { sub_types: [], equity_status: "", voice_range: "", accents: [], dialects: [], specialties: [], showreel_url: "", agent_submission: false },
  singer: { vocal_type: "", genres: [], vocal_range_low: "", vocal_range_high: "", repertoire: [], labels: [], sight_reads: false, streaming_links: {} },
  dancer: { styles: [], company_affiliations: [], pointe_work: false, partner_work: false, acrobatics_level: "none", shoe_size_uk: "", shoe_size_eu: "" },
  musician: { instruments: [], sight_reads: false, reads_charts: false, genres: [], session_experience: false, touring: false, home_studio: false, daw_software: [] },
  comedian: { styles: [], set_lengths: [], venue_history: [], clean_set_available: false, can_mc: false, can_roast: false, audience_types: [] },
  presenter: { formats: [], autocue_experience: false, languages: [], broadcast_credits: [], red_carpet_experience: false, interviewing_experience: false, earpiece_work: false },
  director: { discipline: "", genres: [], production_scale: "", credits: [], movement_director: false, workshop_facilitator: false },
  writer: { forms: [], genres: [], samples: [], produced_credits: [], represented: false, guild_memberships: [] },
  cinematographer: { crew_role: "", equipment_owned: [], formats: [], software: [], union_status: "", reel_url: "", kit_insurance: false },
  choreographer: { styles: [], production_credits: [], video_credits: [], audition_choreographer: false, workshop_facilitator: false, resident_choreographer: false },
  composer: { commissioned_works: [], catalog_works: [], genres: [], notation_software: [], performing_rights_org: "", licensing_available: false },
  visual_artist: { specialization: "", software: [], production_credits: [], portfolio_url: "", supervisor_experience: false, period_expertise: [] },
  model: { categories: [], measurements: { bust_chest: "", waist: "", hips: "", dress_size: "", suit_size: "", shoe_size: "", inseam: "" }, brand_history: [], conflicts: [], swimwear: false, lingerie: false, comp_card_url: "", stats_public: false },
  stage_technician: { specialization: "", certifications: [], production_credits: [], union_status: "", cad_software: [], first_aid_certified: false, ipaf_certified: false, working_at_height: false },
};

/* ─── Shared primitives ──────────────────────────────────────── */

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function ToggleChips({ options, selected, onChange }: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (o: string) =>
    onChange(selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            selected.includes(o)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.replace(/_/g, " ")}
        </button>
      ))}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 capitalize"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
      ))}
    </select>
  );
}

function TagInput({ values, onChange, placeholder }: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  function add() {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  }
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder ?? "Type and press Enter"}
          className="bg-secondary border-border flex-1 text-sm"
        />
        <button type="button" onClick={add} className="px-3 rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary border border-border text-xs">
            {v}
            <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} className="hover:text-destructive transition-colors ml-0.5">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        className={`w-10 h-6 rounded-full transition-colors relative ${checked ? "bg-primary" : "bg-secondary border border-border"}`}
        onClick={() => onChange(!checked)}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : ""}`} />
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </label>
  );
}

/* ─── Discipline-specific forms ──────────────────────────────── */

function ActorForm({ data, set }: { data: Record<string, any>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Sub-types">
        <ToggleChips
          options={["theater", "film_tv", "voice", "commercial"]}
          selected={data.sub_types ?? []}
          onChange={v => set("sub_types", v)}
        />
      </Field>
      <Field label="Equity / Union Status">
        <Select value={data.equity_status ?? ""} onChange={v => set("equity_status", v)} placeholder="Select status"
          options={["active", "inactive", "eligible", "non_union"]} />
      </Field>
      <Field label="Voice Range">
        <Select value={data.voice_range ?? ""} onChange={v => set("voice_range", v)} placeholder="Select range"
          options={["soprano", "mezzo_soprano", "contralto", "tenor", "baritone", "bass"]} />
      </Field>
      <Field label="Accents">
        <TagInput values={data.accents ?? []} onChange={v => set("accents", v)} placeholder="e.g. British RP" />
      </Field>
      <Field label="Dialects">
        <TagInput values={data.dialects ?? []} onChange={v => set("dialects", v)} placeholder="e.g. Southern US" />
      </Field>
      <Field label="Specialties">
        <ToggleChips
          options={["stage_combat", "improv", "mask_work", "puppetry", "physical_theatre", "musical_theatre"]}
          selected={data.specialties ?? []}
          onChange={v => set("specialties", v)}
        />
      </Field>
      <Field label="Showreel URL">
        <Input value={data.showreel_url ?? ""} onChange={e => set("showreel_url", e.target.value)} placeholder="https://..." className="bg-secondary border-border" />
      </Field>
      <Toggle checked={data.agent_submission ?? false} onChange={v => set("agent_submission", v)} label="Open to agent submissions" />
    </div>
  );
}

function SingerForm({ data, set }: { data: Record<string, any>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Vocal Type">
        <Select value={data.vocal_type ?? ""} onChange={v => set("vocal_type", v)} placeholder="Select type"
          options={["soprano", "mezzo_soprano", "contralto", "tenor", "baritone", "bass"]} />
      </Field>
      <Field label="Genres">
        <ToggleChips
          options={["pop", "classical", "jazz", "musical_theater", "opera", "r_and_b", "gospel", "folk", "country", "electronic"]}
          selected={data.genres ?? []}
          onChange={v => set("genres", v)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Vocal Range — Low">
          <Input value={data.vocal_range_low ?? ""} onChange={e => set("vocal_range_low", e.target.value)} placeholder="e.g. C3" className="bg-secondary border-border" />
        </Field>
        <Field label="Vocal Range — High">
          <Input value={data.vocal_range_high ?? ""} onChange={e => set("vocal_range_high", e.target.value)} placeholder="e.g. C6" className="bg-secondary border-border" />
        </Field>
      </div>
      <Toggle checked={data.sight_reads ?? false} onChange={v => set("sight_reads", v)} label="Sight reads music" />
      <Field label="Streaming links" hint="Spotify, Apple Music, etc.">
        {["spotify", "apple_music", "bandcamp", "soundcloud"].map(platform => (
          <div key={platform} className="grid grid-cols-[100px_1fr] items-center gap-2 mb-2">
            <span className="text-xs capitalize text-muted-foreground">{platform.replace(/_/g, " ")}</span>
            <Input value={(data.streaming_links as Record<string, string>)?.[platform] ?? ""}
              onChange={e => set("streaming_links", { ...data.streaming_links, [platform]: e.target.value })}
              placeholder="https://..." className="bg-secondary border-border text-xs" />
          </div>
        ))}
      </Field>
    </div>
  );
}

function DancerForm({ data, set }: { data: Record<string, any>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Dance Styles">
        <ToggleChips
          options={["ballet", "contemporary", "jazz", "tap", "hip_hop", "ballroom", "west_african", "flamenco", "salsa", "breaking", "lyrical"]}
          selected={data.styles ?? []}
          onChange={v => set("styles", v)}
        />
      </Field>
      <Field label="Acrobatics Level">
        <Select value={data.acrobatics_level ?? "none"} onChange={v => set("acrobatics_level", v)}
          options={["none", "basic", "intermediate", "advanced"]} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Toggle checked={data.pointe_work ?? false} onChange={v => set("pointe_work", v)} label="Pointe work" />
        <Toggle checked={data.partner_work ?? false} onChange={v => set("partner_work", v)} label="Partner work" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Shoe Size (UK)">
          <Input value={data.shoe_size_uk ?? ""} onChange={e => set("shoe_size_uk", e.target.value)} placeholder="e.g. 6" className="bg-secondary border-border" />
        </Field>
        <Field label="Shoe Size (EU)">
          <Input value={data.shoe_size_eu ?? ""} onChange={e => set("shoe_size_eu", e.target.value)} placeholder="e.g. 39" className="bg-secondary border-border" />
        </Field>
      </div>
    </div>
  );
}

function MusicianForm({ data, set }: { data: Record<string, any>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Genres">
        <ToggleChips
          options={["jazz", "classical", "pop", "rock", "folk", "electronic", "world", "film_tv"]}
          selected={data.genres ?? []}
          onChange={v => set("genres", v)}
        />
      </Field>
      <Field label="DAW Software">
        <ToggleChips
          options={["pro_tools", "logic", "ableton", "reaper", "cubase", "garageband"]}
          selected={data.daw_software ?? []}
          onChange={v => set("daw_software", v)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Toggle checked={data.sight_reads ?? false} onChange={v => set("sight_reads", v)} label="Sight reads music" />
        <Toggle checked={data.reads_charts ?? false} onChange={v => set("reads_charts", v)} label="Reads charts" />
        <Toggle checked={data.session_experience ?? false} onChange={v => set("session_experience", v)} label="Session experience" />
        <Toggle checked={data.touring ?? false} onChange={v => set("touring", v)} label="Available for touring" />
        <Toggle checked={data.home_studio ?? false} onChange={v => set("home_studio", v)} label="Has home studio" />
      </div>
    </div>
  );
}

function ComedianForm({ data, set }: { data: Record<string, any>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Comedy Styles">
        <ToggleChips
          options={["stand_up", "sketch", "improv", "physical", "character", "observational", "satire", "dark"]}
          selected={data.styles ?? []}
          onChange={v => set("styles", v)}
        />
      </Field>
      <Field label="Audience Types">
        <ToggleChips
          options={["general", "corporate", "adult_only", "family"]}
          selected={data.audience_types ?? []}
          onChange={v => set("audience_types", v)}
        />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Toggle checked={data.clean_set_available ?? false} onChange={v => set("clean_set_available", v)} label="Clean set" />
        <Toggle checked={data.can_mc ?? false} onChange={v => set("can_mc", v)} label="Available as MC" />
        <Toggle checked={data.can_roast ?? false} onChange={v => set("can_roast", v)} label="Can roast" />
      </div>
    </div>
  );
}

function PresenterForm({ data, set }: { data: Record<string, any>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Formats">
        <ToggleChips
          options={["live_tv", "pre_recorded", "podcast", "events", "corporate", "awards", "sports", "documentary"]}
          selected={data.formats ?? []}
          onChange={v => set("formats", v)}
        />
      </Field>
      <Field label="Languages">
        <TagInput values={data.languages ?? []} onChange={v => set("languages", v)} placeholder="e.g. English, Arabic" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Toggle checked={data.autocue_experience ?? false} onChange={v => set("autocue_experience", v)} label="Autocue experience" />
        <Toggle checked={data.red_carpet_experience ?? false} onChange={v => set("red_carpet_experience", v)} label="Red carpet" />
        <Toggle checked={data.interviewing_experience ?? false} onChange={v => set("interviewing_experience", v)} label="Interviewing" />
        <Toggle checked={data.earpiece_work ?? false} onChange={v => set("earpiece_work", v)} label="Earpiece work" />
      </div>
    </div>
  );
}

function DirectorForm({ data, set }: { data: Record<string, any>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Primary Discipline">
        <Select value={data.discipline ?? ""} onChange={v => set("discipline", v)} placeholder="Select discipline"
          options={["theater", "film", "tv", "music_video", "commercial", "opera", "dance"]} />
      </Field>
      <Field label="Genres">
        <ToggleChips
          options={["drama", "comedy", "musical", "thriller", "documentary", "experimental", "horror", "sci_fi"]}
          selected={data.genres ?? []}
          onChange={v => set("genres", v)}
        />
      </Field>
      <Field label="Production Scale">
        <Select value={data.production_scale ?? ""} onChange={v => set("production_scale", v)} placeholder="Select scale"
          options={["fringe", "mid_scale", "large_scale", "west_end", "broadway", "touring"]} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Toggle checked={data.movement_director ?? false} onChange={v => set("movement_director", v)} label="Movement direction" />
        <Toggle checked={data.workshop_facilitator ?? false} onChange={v => set("workshop_facilitator", v)} label="Workshop facilitator" />
      </div>
    </div>
  );
}

function WriterForm({ data, set }: { data: Record<string, any>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Writing Forms">
        <ToggleChips
          options={["screenplay", "stage_play", "tv_pilot", "musical_book", "libretto", "poetry", "prose", "comic_book"]}
          selected={data.forms ?? []}
          onChange={v => set("forms", v)}
        />
      </Field>
      <Field label="Genres">
        <ToggleChips
          options={["drama", "comedy", "thriller", "sci_fi", "horror", "romance", "historical", "fantasy", "biopic"]}
          selected={data.genres ?? []}
          onChange={v => set("genres", v)}
        />
      </Field>
      <Field label="Guild Memberships">
        <ToggleChips
          options={["wga", "wggb", "pma", "scripted_arab"]}
          selected={data.guild_memberships ?? []}
          onChange={v => set("guild_memberships", v)}
        />
      </Field>
      <Toggle checked={data.represented ?? false} onChange={v => set("represented", v)} label="Represented by an agent" />
    </div>
  );
}

function CinematographerForm({ data, set }: { data: Record<string, any>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Crew Role">
        <Select value={data.crew_role ?? ""} onChange={v => set("crew_role", v)} placeholder="Select role"
          options={["dp", "camera_op", "focus_puller", "gaffer", "sound_mixer", "art_director", "prod_designer", "colorist"]} />
      </Field>
      <Field label="Formats">
        <ToggleChips
          options={["digital", "film_16mm", "film_35mm", "anamorphic", "imax", "drone"]}
          selected={data.formats ?? []}
          onChange={v => set("formats", v)}
        />
      </Field>
      <Field label="Software">
        <ToggleChips
          options={["davinci_resolve", "avid", "premiere", "final_cut", "nuke", "after_effects"]}
          selected={data.software ?? []}
          onChange={v => set("software", v)}
        />
      </Field>
      <Field label="Equipment Owned">
        <TagInput values={data.equipment_owned ?? []} onChange={v => set("equipment_owned", v)} placeholder="e.g. Sony FX9" />
      </Field>
      <Field label="Union Status">
        <Select value={data.union_status ?? ""} onChange={v => set("union_status", v)} placeholder="Select status"
          options={["iatse", "bectu", "non_union"]} />
      </Field>
      <Field label="Reel URL">
        <Input value={data.reel_url ?? ""} onChange={e => set("reel_url", e.target.value)} placeholder="https://..." className="bg-secondary border-border" />
      </Field>
      <Toggle checked={data.kit_insurance ?? false} onChange={v => set("kit_insurance", v)} label="Kit insured" />
    </div>
  );
}

function ChoreographerForm({ data, set }: { data: Record<string, any>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Styles">
        <ToggleChips
          options={["ballet", "contemporary", "commercial", "opera", "musical_theater", "film_tv", "hip_hop", "ballroom"]}
          selected={data.styles ?? []}
          onChange={v => set("styles", v)}
        />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Toggle checked={data.audition_choreographer ?? false} onChange={v => set("audition_choreographer", v)} label="Audition choreo" />
        <Toggle checked={data.workshop_facilitator ?? false} onChange={v => set("workshop_facilitator", v)} label="Workshop facilitator" />
        <Toggle checked={data.resident_choreographer ?? false} onChange={v => set("resident_choreographer", v)} label="Resident role" />
      </div>
    </div>
  );
}

function ComposerForm({ data, set }: { data: Record<string, any>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Genres">
        <ToggleChips
          options={["orchestral", "choral", "chamber", "electronic", "musical_theater", "film_tv", "jazz", "contemporary_classical"]}
          selected={data.genres ?? []}
          onChange={v => set("genres", v)}
        />
      </Field>
      <Field label="Notation Software">
        <ToggleChips
          options={["sibelius", "finale", "dorico", "lilypond", "musescore"]}
          selected={data.notation_software ?? []}
          onChange={v => set("notation_software", v)}
        />
      </Field>
      <Field label="Performing Rights Organisation">
        <Select value={data.performing_rights_org ?? ""} onChange={v => set("performing_rights_org", v)} placeholder="Select PRO"
          options={["prs", "ascap", "bmi", "socan", "apra", "sabam", "other"]} />
      </Field>
      <Toggle checked={data.licensing_available ?? false} onChange={v => set("licensing_available", v)} label="Work available for licensing" />
    </div>
  );
}

function VisualArtistForm({ data, set }: { data: Record<string, any>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Specialization">
        <Select value={data.specialization ?? ""} onChange={v => set("specialization", v)} placeholder="Select specialization"
          options={["costume_designer", "set_designer", "prop_maker", "makeup_sfx", "lighting_designer", "sound_designer", "production_designer", "scenic_painter"]} />
      </Field>
      <Field label="Software">
        <ToggleChips
          options={["autocad", "vectorworks", "photoshop", "illustrator", "blender", "sketchup", "revit"]}
          selected={data.software ?? []}
          onChange={v => set("software", v)}
        />
      </Field>
      <Field label="Period Expertise">
        <TagInput values={data.period_expertise ?? []} onChange={v => set("period_expertise", v)} placeholder="e.g. Victorian, 1920s" />
      </Field>
      <Field label="Portfolio URL">
        <Input value={data.portfolio_url ?? ""} onChange={e => set("portfolio_url", e.target.value)} placeholder="https://..." className="bg-secondary border-border" />
      </Field>
      <Toggle checked={data.supervisor_experience ?? false} onChange={v => set("supervisor_experience", v)} label="Supervisor / Head of Department experience" />
    </div>
  );
}

function ModelForm({ data, set }: { data: Record<string, any>; set: (k: string, v: unknown) => void }) {
  const m = (data.measurements as Record<string, string>) ?? {};
  const setM = (k: string, v: string) => set("measurements", { ...m, [k]: v });
  return (
    <div className="space-y-5">
      <Field label="Categories">
        <ToggleChips
          options={["fashion", "commercial", "runway", "editorial", "fitness", "plus_size", "alternative", "petite", "plus"]}
          selected={data.categories ?? []}
          onChange={v => set("categories", v)}
        />
      </Field>
      <Field label="Measurements" hint="All measurements are private by default.">
        <div className="grid grid-cols-2 gap-3">
          {[["bust_chest", "Bust/Chest"], ["waist", "Waist"], ["hips", "Hips"], ["dress_size", "Dress Size"], ["suit_size", "Suit Size"], ["shoe_size", "Shoe Size"], ["inseam", "Inseam"]].map(([k, lbl]) => (
            <div key={k}>
              <p className="text-[11px] text-muted-foreground mb-1">{lbl}</p>
              <Input value={m[k] ?? ""} onChange={e => setM(k, e.target.value)} placeholder="—" className="bg-secondary border-border text-xs" />
            </div>
          ))}
        </div>
      </Field>
      <Field label="Comp Card URL">
        <Input value={data.comp_card_url ?? ""} onChange={e => set("comp_card_url", e.target.value)} placeholder="https://..." className="bg-secondary border-border" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Toggle checked={data.swimwear ?? false} onChange={v => set("swimwear", v)} label="Available: swimwear" />
        <Toggle checked={data.lingerie ?? false} onChange={v => set("lingerie", v)} label="Available: lingerie" />
        <Toggle checked={data.stats_public ?? false} onChange={v => set("stats_public", v)} label="Measurements public" />
      </div>
    </div>
  );
}

function StageTechForm({ data, set }: { data: Record<string, any>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Specialization">
        <Select value={data.specialization ?? ""} onChange={v => set("specialization", v)} placeholder="Select role"
          options={["stage_manager", "deputy_sm", "asm", "technical_director", "fly_operator", "rigger", "automation", "carpenter", "electrician", "follow_spot"]} />
      </Field>
      <Field label="Union Status">
        <Select value={data.union_status ?? ""} onChange={v => set("union_status", v)} placeholder="Select status"
          options={["equity", "bectu", "iatse", "non_union"]} />
      </Field>
      <Field label="CAD Software">
        <ToggleChips
          options={["vectorworks", "autocad", "sketchup", "revit"]}
          selected={data.cad_software ?? []}
          onChange={v => set("cad_software", v)}
        />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Toggle checked={data.first_aid_certified ?? false} onChange={v => set("first_aid_certified", v)} label="First aid" />
        <Toggle checked={data.ipaf_certified ?? false} onChange={v => set("ipaf_certified", v)} label="IPAF certified" />
        <Toggle checked={data.working_at_height ?? false} onChange={v => set("working_at_height", v)} label="Working at height" />
      </div>
    </div>
  );
}

/* ─── Dispatcher (edit) ──────────────────────────────────────── */

interface DisciplineFormProps {
  discipline: string;
  data: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function DisciplineForm({ discipline, data, onChange }: DisciplineFormProps) {
  const set = (k: string, v: unknown) => onChange(k, v);
  const d = data as Record<string, any>;

  switch (discipline) {
    case "actor":           return <ActorForm data={d} set={set} />;
    case "singer":          return <SingerForm data={d} set={set} />;
    case "dancer":          return <DancerForm data={d} set={set} />;
    case "musician":        return <MusicianForm data={d} set={set} />;
    case "comedian":        return <ComedianForm data={d} set={set} />;
    case "presenter":       return <PresenterForm data={d} set={set} />;
    case "director":        return <DirectorForm data={d} set={set} />;
    case "writer":          return <WriterForm data={d} set={set} />;
    case "cinematographer": return <CinematographerForm data={d} set={set} />;
    case "choreographer":   return <ChoreographerForm data={d} set={set} />;
    case "composer":        return <ComposerForm data={d} set={set} />;
    case "visual_artist":   return <VisualArtistForm data={d} set={set} />;
    case "model":           return <ModelForm data={d} set={set} />;
    case "stage_technician":return <StageTechForm data={d} set={set} />;
    default:
      return <p className="text-sm text-muted-foreground">No specific attributes for this discipline yet.</p>;
  }
}

/* ─── Read-only detail view for profile page ─────────────────── */

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== false) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-28 shrink-0 mt-0.5">{label}</span>
      <span className="text-sm text-foreground flex-1">{value}</span>
    </div>
  );
}

function Chips({ values }: { values: string[] }) {
  if (!values?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v, i) => (
        <span key={i} className="px-2 py-0.5 rounded-full bg-secondary border border-border text-xs">{v.replace(/_/g, " ")}</span>
      ))}
    </div>
  );
}

export function DisciplineDetails({ discipline, data }: { discipline: string; data: Record<string, unknown> }) {
  const d = data as Record<string, any>;

  switch (discipline) {
    case "actor": return (
      <div className="space-y-3">
        <Row label="Sub-types" value={<Chips values={d.sub_types} />} />
        <Row label="Equity status" value={d.equity_status?.replace(/_/g, " ")} />
        <Row label="Voice range" value={d.voice_range?.replace(/_/g, " ")} />
        <Row label="Accents" value={<Chips values={d.accents} />} />
        <Row label="Dialects" value={<Chips values={d.dialects} />} />
        <Row label="Specialties" value={<Chips values={d.specialties} />} />
      </div>
    );
    case "singer": return (
      <div className="space-y-3">
        <Row label="Vocal type" value={d.vocal_type?.replace(/_/g, " ")} />
        <Row label="Genres" value={<Chips values={d.genres} />} />
        <Row label="Range" value={d.vocal_range_low && d.vocal_range_high ? `${d.vocal_range_low} – ${d.vocal_range_high}` : d.vocal_range_low || d.vocal_range_high} />
        <Row label="Sight reads" value={d.sight_reads ? "Yes" : null} />
      </div>
    );
    case "dancer": return (
      <div className="space-y-3">
        <Row label="Styles" value={<Chips values={d.styles} />} />
        <Row label="Acrobatics" value={d.acrobatics_level !== "none" ? d.acrobatics_level : null} />
        <Row label="Pointe work" value={d.pointe_work ? "Yes" : null} />
        <Row label="Partner work" value={d.partner_work ? "Yes" : null} />
      </div>
    );
    case "musician": return (
      <div className="space-y-3">
        <Row label="Genres" value={<Chips values={d.genres} />} />
        <Row label="DAW" value={<Chips values={d.daw_software} />} />
        <Row label="Touring" value={d.touring ? "Available for touring" : null} />
        <Row label="Home studio" value={d.home_studio ? "Yes" : null} />
      </div>
    );
    case "comedian": return (
      <div className="space-y-3">
        <Row label="Styles" value={<Chips values={d.styles} />} />
        <Row label="Audience" value={<Chips values={d.audience_types} />} />
        <Row label="Clean set" value={d.clean_set_available ? "Available" : null} />
        <Row label="MC" value={d.can_mc ? "Available as MC" : null} />
      </div>
    );
    case "presenter": return (
      <div className="space-y-3">
        <Row label="Formats" value={<Chips values={d.formats} />} />
        <Row label="Languages" value={<Chips values={d.languages} />} />
        <Row label="Autocue" value={d.autocue_experience ? "Experienced" : null} />
        <Row label="Red carpet" value={d.red_carpet_experience ? "Yes" : null} />
      </div>
    );
    case "director": return (
      <div className="space-y-3">
        <Row label="Discipline" value={d.discipline?.replace(/_/g, " ")} />
        <Row label="Genres" value={<Chips values={d.genres} />} />
        <Row label="Scale" value={d.production_scale?.replace(/_/g, " ")} />
      </div>
    );
    case "writer": return (
      <div className="space-y-3">
        <Row label="Forms" value={<Chips values={d.forms} />} />
        <Row label="Genres" value={<Chips values={d.genres} />} />
        <Row label="Guilds" value={<Chips values={d.guild_memberships} />} />
        <Row label="Represented" value={d.represented ? "Yes" : null} />
      </div>
    );
    case "cinematographer": return (
      <div className="space-y-3">
        <Row label="Role" value={d.crew_role?.replace(/_/g, " ")} />
        <Row label="Formats" value={<Chips values={d.formats} />} />
        <Row label="Software" value={<Chips values={d.software} />} />
        <Row label="Union" value={d.union_status} />
        <Row label="Kit insured" value={d.kit_insurance ? "Yes" : null} />
      </div>
    );
    case "choreographer": return (
      <div className="space-y-3">
        <Row label="Styles" value={<Chips values={d.styles} />} />
        <Row label="Audition choreo" value={d.audition_choreographer ? "Yes" : null} />
        <Row label="Resident" value={d.resident_choreographer ? "Open to resident role" : null} />
      </div>
    );
    case "composer": return (
      <div className="space-y-3">
        <Row label="Genres" value={<Chips values={d.genres} />} />
        <Row label="Notation" value={<Chips values={d.notation_software} />} />
        <Row label="PRO" value={d.performing_rights_org?.toUpperCase()} />
        <Row label="Licensing" value={d.licensing_available ? "Work available for licensing" : null} />
      </div>
    );
    case "visual_artist": return (
      <div className="space-y-3">
        <Row label="Specialization" value={d.specialization?.replace(/_/g, " ")} />
        <Row label="Software" value={<Chips values={d.software} />} />
        <Row label="Periods" value={<Chips values={d.period_expertise} />} />
      </div>
    );
    case "model": return (
      <div className="space-y-3">
        <Row label="Categories" value={<Chips values={d.categories} />} />
        {d.stats_public && d.measurements && (
          <Row label="Measurements" value={
            Object.entries(d.measurements as Record<string, string>)
              .filter(([, v]) => v)
              .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
              .join(" · ")
          } />
        )}
      </div>
    );
    case "stage_technician": return (
      <div className="space-y-3">
        <Row label="Role" value={d.specialization?.replace(/_/g, " ")} />
        <Row label="Union" value={d.union_status} />
        <Row label="CAD" value={<Chips values={d.cad_software} />} />
        <Row label="Certifications" value={[
          d.first_aid_certified && "First Aid",
          d.ipaf_certified && "IPAF",
          d.working_at_height && "Working at Height",
        ].filter(Boolean).join(", ") || null} />
      </div>
    );
    default: return null;
  }
}
