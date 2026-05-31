export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--as-bg)" }}>
      <div className="w-10 h-10 rounded-full border-[3px] animate-spin" style={{ borderColor: "var(--as-border)", borderTopColor: "var(--as-accent)" }} />
    </div>
  );
}
