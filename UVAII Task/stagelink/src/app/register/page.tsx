"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ARTIST");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  function isWorkEmail(emailStr: string): boolean {
    const freeDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
      'icloud.com', 'aol.com', 'zoho.com', 'proton.me', 'protonmail.com',
      'mail.com', 'yandex.com', 'gmx.com', 'live.com', 'msn.com'
    ];
    const domain = emailStr.split('@')[1]?.toLowerCase().trim();
    if (!domain) return false;
    return !freeDomains.includes(domain);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy");
      return;
    }

    if (role === 'HIRER' && !isWorkEmail(email)) {
      setError("Hirers must register with a valid company work email (e.g. name@company.com). Free public emails like @gmail, @yahoo, etc. are not accepted.");
      return;
    }

    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || " ";

    setLoading(true);
    try {
      await register(email, password, role, firstName, lastName);
      router.push("/login?registered=true");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@400;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .font-syne { font-family: 'Syne', sans-serif; }
        .font-outfit { font-family: 'Outfit', sans-serif; }

        .material-symbols-outlined {
            font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24
        }
        
        .bg-cinematic {
            background-image: linear-gradient(rgba(10, 10, 11, 0.85), rgba(10, 10, 11, 0.85)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuBZoS4TeT-k3Nw1hflQ6Cv2R25Lxg1zo8xK-bv2PpmC0hPQwDUA2xopfvQEGqJWdxnglT61PVxj5EmE6oKFw9AkmFZeqeM7aJBr42LfyQa9-opRPoectCg6T99DAbnl9cMxABskjahHQAqYMOFA8tyv7cc6FQSEwCL9xWGzPK_E4IjN5wltdbte0P2mjMxv_dhbhfwpNbzqst8TH7vlNmCFHNUT9jTzMCRBfQKU7IiiUs80PN5wydy2XnvACmuPJ1mnvIYOHWtDdlLG');
            background-size: cover;
            background-position: center;
        }

        .glass-panel {
            background: rgba(22, 22, 24, 0.75);
            backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
        }

        .rim-light {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 1px solid rgba(255, 255, 255, 0.05);
        }

        .input-focus-effect:focus {
            outline: none;
            border-color: #ffd700;
            box-shadow: inset 0 0 8px rgba(255, 215, 0, 0.2);
        }
      `}} />

      <div className="min-h-screen flex flex-col font-outfit text-[var(--as-text)] antialiased bg-cinematic bg-[#0A0A0B] overflow-x-hidden selection:bg-[#ffd700] selection:text-[#705e00]">
        
        {/* Header / Brand Anchor */}
        <header className="fixed top-0 w-full z-50 flex justify-between items-center px-[20px] md:px-[64px] h-20 bg-[var(--as-bg)]/80 backdrop-blur-3xl border-b border-[#4d4732]/30">
          <div className="font-syne text-[32px] leading-[1.3] font-bold text-[#ffd700] tracking-tighter">
            StageLight
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/explore" className="text-[#d0c6ab] hover:text-[var(--as-text)] transition-colors font-outfit font-semibold text-[14px] leading-[1.2] tracking-[0.05em]">Explore</Link>
            <Link href="/talent" className="text-[#d0c6ab] hover:text-[var(--as-text)] transition-colors font-outfit font-semibold text-[14px] leading-[1.2] tracking-[0.05em]">Talent</Link>
            <Link href="/login" className="bg-[#ffd700] text-[#221b00] px-6 py-2 rounded-lg font-outfit font-bold text-[14px] leading-[1.2] tracking-[0.05em] active:scale-95 transition-all">Sign In</Link>
          </div>
        </header>

        {/* Main Content Container */}
        <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-[20px]">
          <div 
            className="fixed inset-0 pointer-events-none transition-all duration-75"
            style={{ background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 215, 0, 0.08) 0%, transparent 70%)` }}
          ></div>
          
          <div className="w-full max-w-[480px] glass-panel rim-light rounded-xl p-10 relative z-10">
            {/* Form Header */}
            <div className="mb-10 text-center">
              <h1 className="font-syne text-[48px] leading-[1.2] font-bold text-[#fff6df] mb-3">Create Your Backstage Pass</h1>
              <p className="text-[#d0c6ab] font-outfit text-[16px] leading-[1.6]">Join the elite network of entertainment professionals.</p>
            </div>

            {/* Registration Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {/* Full Name Field */}
              <div className="space-y-2">
                <label className="block font-outfit font-semibold text-[14px] leading-[1.2] tracking-[0.05em] text-[#d0c6ab] uppercase" htmlFor="full_name">Full Name</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4d4732]">person</span>
                  <input 
                    className="w-full bg-[#0e0e0f] border border-[#4d4732]/50 rounded-lg py-4 pl-12 pr-4 text-[var(--as-text)] font-outfit text-[16px] input-focus-effect transition-all placeholder:text-[#4d4732]/50" 
                    id="full_name" 
                    name="fullName"
                    placeholder="Stage name or legal name" 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block font-outfit font-semibold text-[14px] leading-[1.2] tracking-[0.05em] text-[#d0c6ab] uppercase" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4d4732]">mail</span>
                  <input 
                    className="w-full bg-[#0e0e0f] border border-[#4d4732]/50 rounded-lg py-4 pl-12 pr-4 text-[var(--as-text)] font-outfit text-[16px] input-focus-effect transition-all placeholder:text-[#4d4732]/50" 
                    id="email" 
                    name="email"
                    placeholder="professional@industry.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2 relative">
                <label className="block font-outfit font-semibold text-[14px] leading-[1.2] tracking-[0.05em] text-[#d0c6ab] uppercase" htmlFor="password">Password</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4d4732]">lock</span>
                  <input 
                    className="w-full bg-[#0e0e0f] border border-[#4d4732]/50 rounded-lg py-4 pl-12 pr-12 text-[var(--as-text)] font-outfit text-[16px] input-focus-effect transition-all placeholder:text-[#4d4732]/50" 
                    id="password" 
                    name="password"
                    placeholder="Create a secure password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4d4732] hover:text-[var(--as-text)] transition-colors" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-base">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              {/* Role Dropdown */}
              <div className="space-y-2">
                <label className="block font-outfit font-semibold text-[14px] leading-[1.2] tracking-[0.05em] text-[#d0c6ab] uppercase" htmlFor="role">Professional Role</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4d4732]">theaters</span>
                  <select 
                    className="w-full appearance-none bg-[#0e0e0f] border border-[#4d4732]/50 rounded-lg py-4 pl-12 pr-10 text-[var(--as-text)] font-outfit text-[16px] input-focus-effect transition-all cursor-pointer" 
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="" disabled className="bg-[var(--as-bg)]">Select your craft</option>
                    <option value="ARTIST" className="bg-[var(--as-bg)]">Actor / Performer / Talent</option>
                    <option value="HIRER" className="bg-[var(--as-bg)]">Director / Casting / Producer</option>
                    <option value="FAN" className="bg-[var(--as-bg)]">Industry Enthusiast / Fan</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#4d4732] pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-3 group cursor-pointer relative mt-2">
                <div className="relative flex items-center">
                  <input 
                    className="peer appearance-none w-5 h-5 border border-[#4d4732] rounded bg-transparent checked:bg-[#ffd700] checked:border-[#ffd700] transition-all cursor-pointer" 
                    id="terms" 
                    type="checkbox" 
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#705e00] opacity-0 peer-checked:opacity-100 text-[16px] pointer-events-none" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                </div>
                <label className="font-outfit text-[16px] leading-[1.6] text-[#d0c6ab] cursor-pointer select-none" htmlFor="terms">
                  I agree to the <Link href="/terms" className="text-[#ffd700] hover:underline" onClick={(e) => e.stopPropagation()}>Terms of Service</Link> & <Link href="/privacy" className="text-[#ffd700] hover:underline" onClick={(e) => e.stopPropagation()}>Privacy</Link>
                </label>
              </div>

              {error && (
                <div className="text-red-500 text-sm font-outfit mt-2">{error}</div>
              )}

              {/* CTA Button */}
              <div className="pt-4">
                <button 
                  disabled={loading}
                  className="w-full bg-[#ffd700] text-[#221b00] py-5 rounded-lg font-syne text-[18px] font-bold tracking-tight shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed" 
                  type="submit"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                  {!loading && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                </button>
              </div>
            </form>

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-[#d0c6ab] font-outfit font-semibold text-[14px] leading-[1.2] tracking-[0.05em]">
                Already part of the crew? <Link className="text-[#fff6df] hover:underline transition-all" href="/login">Sign In</Link>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full py-12 bg-[#0e0e0f]/50 backdrop-blur-md border-t border-[#4d4732]/10 z-10 relative">
          <div className="flex flex-col md:flex-row justify-between items-center px-[20px] md:px-[64px] max-w-[1440px] mx-auto gap-6">
            <div className="font-outfit text-[16px] leading-[1.6] text-[#d0c6ab]">
              © 2024 StageLight Entertainment Platform. All rights reserved.
            </div>
            <div className="flex gap-8">
              <Link className="text-[#d0c6ab] hover:text-[#fff6df] transition-colors font-outfit font-semibold text-[14px] leading-[1.2] tracking-[0.05em]" href="#">Privacy Policy</Link>
              <Link className="text-[#d0c6ab] hover:text-[#fff6df] transition-colors font-outfit font-semibold text-[14px] leading-[1.2] tracking-[0.05em]" href="#">Terms of Service</Link>
              <Link className="text-[#d0c6ab] hover:text-[#fff6df] transition-colors font-outfit font-semibold text-[14px] leading-[1.2] tracking-[0.05em]" href="#">Cookie Policy</Link>
              <Link className="text-[#d0c6ab] hover:text-[#fff6df] transition-colors font-outfit font-semibold text-[14px] leading-[1.2] tracking-[0.05em]" href="#">Contact Support</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

