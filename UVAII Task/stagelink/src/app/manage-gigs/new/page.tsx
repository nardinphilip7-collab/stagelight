"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, X, Search, User } from "lucide-react";

const CATEGORIES = ["Acting", "Music", "Dance", "Voice Acting", "Directing", "Writing", "Comedy", "Presenting", "Modeling", "Other"];
const TYPES = ["Film Role", "Recording Contract", "Stage Play", "Commercial", "Voice Over", "Music Video", "TV Series", "Podcast", "Other"];
const SUBMISSION_TYPES = [
  { value: "SELF_TAPE", label: "Self-tape video" },
  { value: "PROFILE_ONLY", label: "Profile only (no video required)" },
];

function MentionInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [talents, setTalents] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    apiClient.get<any>('/talents/').then(res => {
      const items = Array.isArray(res) ? res : res.results || [];
      setTalents(items);
    }).catch(console.error);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    
    // Check if the user is typing a mention at the end of the string
    const match = val.match(/@(\w*)$/);
    if (match) {
      setFilter(match[1].toLowerCase());
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelect = (username: string) => {
    const newVal = value.replace(/@\w*$/, `@${username} `);
    onChange(newVal);
    setShowDropdown(false);
  };

  const filtered = talents.filter(t => (t.name || t.owner_name || '').toLowerCase().includes(filter) || (t.slug || '').toLowerCase().includes(filter));

  return (
    <div className="relative">
      <Input value={value} onChange={handleInput} placeholder={placeholder} />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute top-full mt-1 w-full max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-50 p-1">
          {filtered.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelect(t.slug || t.name || t.owner_name || 'unknown')}
              className="w-full text-left px-3 py-2 text-sm hover:bg-secondary rounded flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden shrink-0">
                {t.avatar ? <img src={t.avatar} className="w-full h-full object-cover" /> : <User className="w-4 h-4 m-1 text-muted-foreground" />}
              </div>
              <span className="font-medium">{t.name || t.owner_name || 'Unknown'}</span>
              <span className="text-xs text-muted-foreground">@{t.slug || (t.name || t.owner_name || 'unknown').replace(/\s+/g, '')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewGigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/login"); return; }
    if (user.role !== "HIRER" && user.role !== "AGENCY") { router.replace("/explore"); return; }
    
    apiClient.get<any>('/auth/me/').then(data => {
      if (data.company) set('company', data.company);
      if (data.location) set('location', data.location);
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [form, setForm] = useState({
    title: "",
    company: "",
    company_logo: "Film",
    type: "Film Role",
    category: "Acting",
    location: "",
    compensation: "",
    deadline: "",
    description: "",
    prompt_text: "",
    submission_type: "SELF_TAPE",
    urgent: false,
    featured: false,
    directors: "",
  });

  const [questionnaire, setQuestionnaire] = useState<{question: string, type: string}[]>([]);
  const [portfolioReqs, setPortfolioReqs] = useState<{label: string, description: string}[]>([]);
  const [productionReqs, setProductionReqs] = useState<string[]>([]);

  function set(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function addQuestion() {
    setQuestionnaire(prev => [...prev, { question: "", type: "Text" }]);
  }

  function removeQuestion(index: number) {
    setQuestionnaire(prev => prev.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, field: string, value: string) {
    const updated = [...questionnaire];
    updated[index] = { ...updated[index], [field]: value };
    setQuestionnaire(updated);
  }

  function addPortfolioReq() {
    setPortfolioReqs(prev => [...prev, { label: "", description: "" }]);
  }

  function removePortfolioReq(index: number) {
    setPortfolioReqs(prev => prev.filter((_, i) => i !== index));
  }

  function updatePortfolioReq(index: number, field: string, value: string) {
    const updated = [...portfolioReqs];
    updated[index] = { ...updated[index], [field]: value };
    setPortfolioReqs(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const now = new Date();
      const payload = {
        ...form,
        company: form.company || "Cairo Film Studios",
        location: form.location || "Cairo, Egypt",
        id: `opp-${Date.now()}`,
        posted: `${now.toLocaleString('default', { month: 'short' })} ${now.getDate()}, ${now.getFullYear()}`,
        applicants: 0,
        requirements: productionReqs.filter(r => r.trim() !== ""),
        questionnaire: questionnaire.filter(q => q.question.trim() !== ""),
        portfolio_requirements: portfolioReqs.filter(r => r.label.trim() !== ""),
        directors: form.directors,
      };
      await apiClient.post('/opportunities/', payload);
      router.push('/manage-gigs');
    } catch (err: unknown) {
      const data = (err as { data?: Record<string, string[]> })?.data;
      const message = data ? Object.values(data).flat().join(' ') : 'Failed to create gig.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-20">
      <Link
        href="/manage-gigs"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Gigs
      </Link>

      <h1 className="text-3xl font-outfit font-bold mb-2">Post a New Gig</h1>
      <p className="text-muted-foreground mb-8">Create a casting brief and customize application requirements.</p>

      <Card className="p-6 md:p-8 border-border bg-card">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section: Basic Details */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold border-b border-border pb-2">Basic Details</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1.5">Role Title</label>
              <Input
                required
                placeholder="e.g. Lead Actress — Feature Film 'Nile Noir'"
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Director(s) — Type @ to mention</label>
              <MentionInput
                placeholder="e.g. Directed by @ahmed_kamal"
                value={form.directors}
                onChange={v => set('directors', v)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Company / Studio</label>
                <Input
                  required
                  placeholder="Cairo Film Studios"
                  value={form.company || "Cairo Film Studios"}
                  readOnly
                  className="bg-secondary/50 cursor-not-allowed text-muted-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Location</label>
                <Input
                  required
                  placeholder="Cairo, Egypt"
                  value={form.location || "Cairo, Egypt"}
                  readOnly
                  className="bg-secondary/50 cursor-not-allowed text-muted-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <select
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Opportunity Type</label>
                <select
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                  value={form.type}
                  onChange={e => set('type', e.target.value)}
                >
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Compensation</label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 5000"
                  value={form.compensation}
                  onChange={e => set('compensation', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Deadline</label>
                <Input
                  required
                  type="date"
                  value={form.deadline}
                  onChange={e => set('deadline', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Role Description</label>
              <Textarea
                required
                placeholder="Describe the role, production, tone, and what you're looking for in a performer..."
                className="min-h-[120px] resize-none bg-secondary border-border"
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5">Recording Prompt (Optional)</label>
              <Textarea
                placeholder="e.g. Read the attached sides as if you are discovering a terrible secret. Use your own space creatively."
                className="min-h-[80px] resize-none bg-secondary border-border"
                value={form.prompt_text}
                onChange={e => set('prompt_text', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1.5">This prompt will be shown as an overlay to applicants when they record their self-tape.</p>
            </div>
          </div>

          {/* Section: Application Requirements */}
          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-bold border-b border-border pb-2">Application Requirements</h2>

            {/* Production Requirements */}
            <div className="bg-secondary/30 p-4 md:p-6 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-foreground">Production Requirements</h3>
                  <p className="text-xs text-muted-foreground mt-1">List specific requirements (e.g., Fluent Arabic and English, Available June-August).</p>
                </div>
                <Button type="button" onClick={() => setProductionReqs(prev => [...prev, ""])} variant="outline" size="sm" className="bg-background">
                  <Plus className="w-4 h-4 mr-1" /> Add Requirement
                </Button>
              </div>
              
              {productionReqs.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">No production requirements added.</p>
              ) : (
                <div className="space-y-3">
                  {productionReqs.map((req, idx) => (
                    <div key={idx} className="flex gap-3 items-center bg-background p-2 rounded-lg border border-border">
                      <Input 
                        placeholder="e.g. Strong dramatic range" 
                        value={req}
                        onChange={(e) => {
                          const updated = [...productionReqs];
                          updated[idx] = e.target.value;
                          setProductionReqs(updated);
                        }}
                      />
                      <button type="button" onClick={() => setProductionReqs(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Questionnaire */}
            <div className="bg-secondary/30 p-4 md:p-6 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-foreground">Custom Questionnaire</h3>
                  <p className="text-xs text-muted-foreground mt-1">Ask questions that applicants must answer when applying.</p>
                </div>
                <Button type="button" onClick={addQuestion} variant="outline" size="sm" className="bg-background">
                  <Plus className="w-4 h-4 mr-1" /> Add Question
                </Button>
              </div>
              
              {questionnaire.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">No custom questions added.</p>
              ) : (
                <div className="space-y-4">
                  {questionnaire.map((q, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-background p-3 rounded-lg border border-border">
                      <div className="flex-1 space-y-3">
                        <Input 
                          placeholder="e.g. Are you willing to travel for this role?" 
                          value={q.question}
                          onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                        />
                        <select 
                          className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                          value={q.type}
                          onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                        >
                          <option value="Text">Text Answer</option>
                          <option value="Yes/No">Yes/No</option>
                        </select>
                      </div>
                      <button type="button" onClick={() => removeQuestion(idx)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Portfolio / Video Upload Requirements */}
            <div className="bg-secondary/30 p-4 md:p-6 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-foreground">Portfolio Submissions</h3>
                  <p className="text-xs text-muted-foreground mt-1">Request specific files, reels, or self-tapes from applicants.</p>
                </div>
                <Button type="button" onClick={addPortfolioReq} variant="outline" size="sm" className="bg-background">
                  <Plus className="w-4 h-4 mr-1" /> Add Requirement
                </Button>
              </div>
              
              {portfolioReqs.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">No specific portfolio items requested.</p>
              ) : (
                <div className="space-y-4">
                  {portfolioReqs.map((req, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-background p-3 rounded-lg border border-border">
                      <div className="flex-1 space-y-3">
                        <Input 
                          placeholder="Label (e.g. Dramatic Monologue Video)" 
                          value={req.label}
                          onChange={(e) => updatePortfolioReq(idx, 'label', e.target.value)}
                        />
                        <Input 
                          placeholder="Description / Instructions (optional)" 
                          value={req.description}
                          onChange={(e) => updatePortfolioReq(idx, 'description', e.target.value)}
                        />
                      </div>
                      <button type="button" onClick={() => removePortfolioReq(idx)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Global Submission Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">Base Application Mode</label>
              <div className="space-y-2">
                {SUBMISSION_TYPES.map(st => (
                  <label key={st.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.submission_type === st.value ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'}`}>
                    <input
                      type="radio"
                      name="submission_type"
                      value={st.value}
                      checked={form.submission_type === st.value}
                      onChange={() => set('submission_type', st.value)}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium text-foreground">{st.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.urgent} onChange={e => set('urgent', e.target.checked)} className="rounded accent-primary" />
              <span className="text-sm font-medium">Mark as Urgent</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} className="rounded accent-primary" />
              <span className="text-sm font-medium">Featured listing</span>
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <Link href="/manage-gigs" className="sm:w-1/3">
              <Button type="button" variant="outline" className="w-full">Cancel</Button>
            </Link>
            <Button type="submit" className="sm:w-2/3 bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
              {loading ? "Posting..." : "Post Opportunity"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
