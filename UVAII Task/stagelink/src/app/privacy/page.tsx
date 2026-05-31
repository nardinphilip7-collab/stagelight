export default function PrivacyPage() {
  return (
    <div className="artstage min-h-screen" style={{ backgroundColor: "var(--as-bg)", padding: "48px 24px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", color: "var(--as-text)", marginBottom: "8px" }}>Privacy Policy</h1>
        <p style={{ color: "var(--as-text-muted)", fontSize: "14px", marginBottom: "40px" }}>Last updated: January 2025</p>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>1. Information We Collect</h2>
          <p style={{ color: "var(--as-text-muted)", lineHeight: "1.7", fontSize: "15px" }}>
            We collect information you provide directly, such as your name, email address, and profile content. We also collect usage data to improve the platform experience.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>2. How We Use Your Information</h2>
          <p style={{ color: "var(--as-text-muted)", lineHeight: "1.7", fontSize: "15px" }}>
            Your information is used to operate and improve StageLink, personalise your experience, and communicate with you about your account. We do not sell your personal data to third parties.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>3. Data Sharing</h2>
          <p style={{ color: "var(--as-text-muted)", lineHeight: "1.7", fontSize: "15px" }}>
            Profile information you mark as public is visible to other users of the platform. We may share data with service providers who assist us in operating StageLink, under confidentiality agreements.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>4. Cookies</h2>
          <p style={{ color: "var(--as-text-muted)", lineHeight: "1.7", fontSize: "15px" }}>
            We use localStorage and session storage to maintain your login session. We do not currently use third-party tracking cookies.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>5. Your Rights</h2>
          <p style={{ color: "var(--as-text-muted)", lineHeight: "1.7", fontSize: "15px" }}>
            You may access, correct, or delete your personal data at any time by visiting your account settings or contacting us. You may also request a copy of the data we hold about you.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>6. Changes to This Policy</h2>
          <p style={{ color: "var(--as-text-muted)", lineHeight: "1.7", fontSize: "15px" }}>
            We may update this policy periodically. We will notify you of significant changes via email or a notice on the platform.
          </p>
        </section>

        <p style={{ color: "var(--as-text-muted)", fontSize: "13px", borderTop: "1px solid var(--as-border)", paddingTop: "24px" }}>
          For privacy enquiries, contact us at privacy@stagelink.com
        </p>
      </div>
    </div>
  );
}
