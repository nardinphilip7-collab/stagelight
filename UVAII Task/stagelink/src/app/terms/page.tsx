export default function TermsPage() {
  return (
    <div className="artstage min-h-screen" style={{ backgroundColor: "var(--as-bg)", padding: "48px 24px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", color: "var(--as-text)", marginBottom: "8px" }}>Terms of Service</h1>
        <p style={{ color: "var(--as-text-muted)", fontSize: "14px", marginBottom: "40px" }}>Last updated: January 2025</p>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>1. Acceptance of Terms</h2>
          <p style={{ color: "var(--as-text-muted)", lineHeight: "1.7", fontSize: "15px" }}>
            By accessing or using StageLink, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>2. Use of the Platform</h2>
          <p style={{ color: "var(--as-text-muted)", lineHeight: "1.7", fontSize: "15px" }}>
            StageLink is a professional network for creative talent. You agree to use the platform only for lawful purposes and in a manner consistent with these terms. You are responsible for all activity that occurs under your account.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>3. Content</h2>
          <p style={{ color: "var(--as-text-muted)", lineHeight: "1.7", fontSize: "15px" }}>
            You retain ownership of content you upload to StageLink. By uploading content, you grant StageLink a non-exclusive licence to display and distribute it within the platform. You are solely responsible for ensuring your content does not infringe the rights of others.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>4. Termination</h2>
          <p style={{ color: "var(--as-text-muted)", lineHeight: "1.7", fontSize: "15px" }}>
            StageLink reserves the right to suspend or terminate accounts that violate these terms or engage in behaviour harmful to the community.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>5. Changes to Terms</h2>
          <p style={{ color: "var(--as-text-muted)", lineHeight: "1.7", fontSize: "15px" }}>
            We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the revised terms.
          </p>
        </section>

        <p style={{ color: "var(--as-text-muted)", fontSize: "13px", borderTop: "1px solid var(--as-border)", paddingTop: "24px" }}>
          For questions about these terms, contact us at support@stagelink.com
        </p>
      </div>
    </div>
  );
}
