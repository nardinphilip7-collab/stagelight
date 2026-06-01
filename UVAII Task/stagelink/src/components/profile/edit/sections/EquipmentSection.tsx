import { useProfile } from "../ProfileContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MAX_MULTI_ITEMS } from "@/lib/validation";
import { Plus, X } from "lucide-react";
import { useState } from "react";

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [inp, setInp] = useState("");
  const add = () => {
    const v = inp.trim();
    if (v && !values.includes(v) && values.length < MAX_MULTI_ITEMS) onChange([...values, v]);
    setInp("");
  };
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Input value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder ?? "Type and press Enter"}
          className="bg-secondary/50 border-border/60 focus:bg-background transition-colors text-sm flex-1" />
        <button type="button" onClick={add} className="px-4 rounded-lg border border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((v, i) => (
          <Badge key={i} variant="secondary" className="pl-3 pr-1.5 py-1 flex items-center gap-1.5 text-xs font-medium rounded-full border border-border/40">
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="hover:text-destructive transition-colors opacity-70 hover:opacity-100">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function EquipmentSection() {
  const { equipment, setEquipment } = useProfile();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Equipment & Tech</h2>
        <p className="text-sm text-muted-foreground mt-1">List your home studio gear, cameras, instruments, or tech setups.</p>
      </div>

      <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-4">
        <label className="text-[13px] font-semibold text-foreground/80 tracking-wide block">Your equipment</label>
        <TagInput 
          values={equipment ?? []} 
          onChange={setEquipment} 
          placeholder="e.g. Rode NT1-A Microphone, Sony A7III, Home Voiceover Booth" 
        />
      </div>
    </div>
  );
}
