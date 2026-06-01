import { useProfile } from "../ProfileContext";
import { Input } from "@/components/ui/input";

export function AvailabilitySection() {
  const { availabilityStatus, setAvailabilityStatus, availabilityUntil, setAvailabilityUntil, availWindows, addAvailWindow, removeAvailWindow, addingWindow, setAddingWindow, newWindow, setNewWindow, savingWindow, windowSaveError } = useProfile();

  const statusOptions = [
    { value: "Available", label: "Available", desc: "Currently open to new projects", color: "bg-green-500" },
    { value: "Busy", label: "Currently Busy", desc: "Working, but open to future dates", color: "bg-amber-500" },
    { value: "Unavailable", label: "Unavailable", desc: "Not taking on new projects", color: "bg-destructive" },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Availability</h2>
        <p className="text-sm text-muted-foreground mt-1">Let casting directors know your current working status.</p>
      </div>

      <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-6">
        <div>
          <label className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-3 block">Current Status</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {statusOptions.map((s) => (
              <label key={s.value} className={`relative flex flex-col p-4 cursor-pointer rounded-xl border transition-all ${
                availabilityStatus === s.value 
                  ? "border-primary bg-primary/5 shadow-sm" 
                  : "border-border/60 bg-secondary/20 hover:border-border hover:bg-secondary/40"
              }`}>
                <input 
                  type="radio" 
                  name="availabilityStatus" 
                  value={s.value}
                  checked={availabilityStatus === s.value}
                  onChange={(e) => setAvailabilityStatus(e.target.value)}
                  className="hidden"
                />
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-2 h-2 rounded-full ${s.color} ${availabilityStatus === s.value ? 'animate-pulse' : ''}`} />
                  <span className={`font-semibold text-sm ${availabilityStatus === s.value ? 'text-foreground' : 'text-foreground/80'}`}>
                    {s.label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground pl-4">{s.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {availabilityStatus !== "Available" && (
          <div className="pt-4 border-t border-border/40 animate-in fade-in slide-in-from-top-2">
            <label className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-2 block">
              Unavailable until (optional)
            </label>
            <Input 
              type="date" 
              value={availabilityUntil} 
              onChange={e => setAvailabilityUntil(e.target.value)} 
              className="bg-secondary/50 border-border/60 focus:bg-background transition-colors max-w-sm" 
            />
          </div>
        )}

        <div className="pt-6 border-t border-border/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="text-[13px] font-semibold text-foreground/80 tracking-wide block">Calendar & Specific Dates</label>
              <p className="text-xs text-muted-foreground mt-1">Add specific upcoming windows where you are busy or traveling.</p>
            </div>
            <button
              onClick={() => setAddingWindow(!addingWindow)}
              className="text-xs font-semibold px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
            >
              {addingWindow ? "Cancel" : "+ Add Window"}
            </button>
          </div>

          {addingWindow && (
            <div className="p-4 rounded-lg bg-secondary/20 border border-border/50 mb-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Start Date</label>
                  <Input type="date" value={newWindow.start} onChange={e => setNewWindow(p => ({ ...p, start: e.target.value }))} className="bg-background" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">End Date</label>
                  <Input type="date" value={newWindow.end} onChange={e => setNewWindow(p => ({ ...p, end: e.target.value }))} className="bg-background" />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Note / Location</label>
                <Input placeholder="e.g., Shooting in London" value={newWindow.note} onChange={e => setNewWindow(p => ({ ...p, note: e.target.value }))} className="bg-background" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" id="willingToTravel" checked={newWindow.willing_to_travel} onChange={e => setNewWindow(p => ({ ...p, willing_to_travel: e.target.checked }))} className="rounded border-border" />
                <label htmlFor="willingToTravel" className="text-sm text-foreground/80">Willing to travel from location</label>
              </div>
              {windowSaveError && <p className="text-destructive text-sm mb-3">{windowSaveError}</p>}
              <button
                onClick={addAvailWindow}
                disabled={savingWindow}
                className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {savingWindow ? "Saving..." : "Save Window"}
              </button>
            </div>
          )}

          {availWindows.length > 0 ? (
            <div className="space-y-3">
              {availWindows.map(w => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-secondary/10 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{w.start_date} to {w.end_date}</p>
                    {w.note && <p className="text-xs text-muted-foreground">{w.note}</p>}
                  </div>
                  <button onClick={() => removeAvailWindow(w.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 rounded-lg border border-dashed border-border/60 bg-secondary/10">
              <p className="text-sm text-muted-foreground">No specific availability windows added.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
