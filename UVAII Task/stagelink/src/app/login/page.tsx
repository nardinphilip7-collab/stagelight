"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/auth";
import { apiClient } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'HIRER' || user.role === 'AGENCY') {
        router.push('/dashboard');
        return;
      }
      if (user.role === 'ARTIST') {
        const hasTalent = await apiClient.get<{ id?: string }>('/profile/').then(() => true).catch(() => false);
        if (!hasTalent) {
          router.push('/profile/edit?setup=1');
          return;
        }
      }
      router.push("/explore");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
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
        .glass-input {
            background: rgba(10, 10, 11, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }
        .glass-input:focus {
            border-color: #ffd700;
            box-shadow: inset 0 0 8px rgba(255, 215, 0, 0.2);
            outline: none;
        }
        .spotlight-glow {
            box-shadow: 0 0 25px rgba(255, 215, 0, 0.15);
        }
        .spotlight-hover:hover {
            box-shadow: 0 0 35px rgba(255, 215, 0, 0.3);
            transform: scale(1.02);
        }
        .split-screen-image {
            background-image: linear-gradient(to right, rgba(10, 10, 11, 0) 60%, rgba(10, 10, 11, 1) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCfKbbwF3xaG_Hk900aFHQokCK42ybO9fzDYiqRx_Js9sA7omSqK80geg5NEqPDPidXTkfk2wUgHSBFfJ2RX5RtpCwhVoYfxIUM8HZjBquaWss7fzKXT_AlX-ZxfZRWszZ90qhqoZPZQr0YFFaqNM_6_YqN8NRMrCUZFe0vsOzL3vFcghvNmHiF3zZcYNIHID7HWt3GlzqOQEvKBZvotBvDmq4Ls2graZiy0lGqbsXd7Tkh1LzhJeacuSmxhd5s_n4mCQW0QuEjGYiv');
            background-size: cover;
            background-position: center;
        }
        /* Custom scrollbar for premium feel */
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #0A0A0B;
        }
        ::-webkit-scrollbar-thumb {
            background: #353436;
            border-radius: 10px;
        }
      `}} />

      <div className="bg-[var(--as-bg)] text-[var(--as-text)] font-outfit text-[16px] leading-[1.6] selection:bg-[#ffd700] selection:text-[#705e00] min-h-screen">
        <main className="flex min-h-screen w-full">
          {/* Left Side: Cinematic High-Impact Image */}
          <section className="hidden lg:block lg:w-1/2 relative overflow-hidden group sticky top-0 h-screen">
            <div className="absolute inset-0 split-screen-image transition-transform duration-700 group-hover:scale-105"></div>
            {/* Branding Overlay for Desktop */}
            <div className="absolute bottom-[64px] left-[64px] z-10 max-w-lg">
              <h1 className="font-syne text-[64px] leading-[1.1] tracking-[-0.02em] font-extrabold text-[#fff6df] mb-[8px] drop-shadow-2xl">
                Where the Vision <br /> Takes Center Stage.
              </h1>
              <p className="font-outfit text-[18px] leading-[1.6] text-[#d0c6ab] max-w-sm">
                Enter the production ecosystem designed for industry leaders and rising talent.
              </p>
            </div>
            {/* Spotlight Rim Light Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,_rgba(255,215,0,0.05)_0%,_transparent_50%)]"></div>
          </section>
          
          {/* Right Side: Dark Charcoal Form Container */}
          <section className="w-full lg:w-1/2 flex items-center justify-center bg-[#0e0e0f] px-[20px] md:px-[64px] relative py-12 min-h-screen">
            {/* Atmospheric Glow Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffd700]/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="w-full max-w-md z-10">
              {/* Header / Logo */}
              <div className="mb-12 flex flex-col items-start">
                <div className="flex items-center gap-3 mb-8 group cursor-pointer">
                  <div className="w-10 h-10 bg-[#ffd700] rounded flex items-center justify-center spotlight-glow transition-transform group-hover:rotate-12">
                    <span className="material-symbols-outlined text-[#705e00]" style={{ fontVariationSettings: "'FILL' 1" }}>movie_filter</span>
                  </div>
                  <span className="font-syne text-[32px] font-bold text-[#fff6df] tracking-tighter">StageLight</span>
                </div>
                <h2 className="font-syne text-[32px] leading-[1.3] font-bold text-[var(--as-text)] mb-2">Welcome Back</h2>
                <p className="font-outfit text-[16px] leading-[1.6] text-[#d0c6ab]">Sign in to your production dashboard.</p>
              </div>

              {/* Login Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div className="space-y-2 relative">
                  <label className="font-outfit text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-[#d0c6ab] block uppercase" htmlFor="email">Email Address</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4d4732] text-base">mail</span>
                    <input 
                      className="glass-input w-full h-14 pl-12 pr-4 rounded-lg text-[var(--as-text)] placeholder:text-[#4d4732]/50" 
                      id="email" 
                      name="email" 
                      placeholder="producer@stagelight.com" 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      onFocus={(e) => e.target.parentElement?.classList.add('scale-[1.01]')}
                      onBlur={(e) => e.target.parentElement?.classList.remove('scale-[1.01]')}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <label className="font-outfit text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-[#d0c6ab] block uppercase" htmlFor="password">Password</label>
                    <a className="font-outfit text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-[#e9c400] hover:text-[#ffd700] transition-colors duration-200" href="#">Forgot Password?</a>
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4d4732] text-base">lock</span>
                    <input 
                      className="glass-input w-full h-14 pl-12 pr-12 rounded-lg text-[var(--as-text)] placeholder:text-[#4d4732]/50" 
                      id="password" 
                      name="password" 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      onFocus={(e) => e.target.parentElement?.classList.add('scale-[1.01]')}
                      onBlur={(e) => e.target.parentElement?.classList.remove('scale-[1.01]')}
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

                {/* Stay Signed In */}
                <div className="flex items-center gap-3 group cursor-pointer relative">
                  <div className="relative flex items-center">
                    <input className="peer appearance-none w-5 h-5 border border-[#4d4732] rounded bg-transparent checked:bg-[#ffd700] checked:border-[#ffd700] transition-all cursor-pointer" id="remember" type="checkbox" />
                    <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#705e00] opacity-0 peer-checked:opacity-100 text-[16px] pointer-events-none" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                  </div>
                  <label className="font-outfit text-[16px] leading-[1.6] text-[#d0c6ab] group-hover:text-[var(--as-text)] cursor-pointer transition-colors select-none" htmlFor="remember">Remember this device</label>
                </div>

                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}

                {/* Action Button */}
                <div className="pt-4">
                  <button 
                    disabled={loading}
                    className="w-full h-14 bg-[#ffd700] text-[#221b00] font-outfit text-[14px] leading-[1.2] tracking-[0.05em] font-semibold rounded-lg spotlight-hover transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    type="submit"
                  >
                    {loading ? "Signing In..." : "Sign In"}
                    {!loading && <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                  </button>
                </div>
              </form>

              {/* Footer Links */}
              <div className="mt-12 text-center">
                <p className="font-outfit text-[16px] leading-[1.6] text-[#d0c6ab]">
                  New to StageLight? 
                  <Link className="text-[#fff6df] font-semibold hover:underline decoration-[#fff6df]/30 underline-offset-4 transition-all ml-1" href="/register">Join Now</Link>
                </p>
              </div>

              {/* Small Brand Footnote */}
              <div className="mt-24 pt-8 border-t border-[#4d4732]/10 flex flex-col sm:flex-row justify-between items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <span className="font-outfit font-semibold text-[10px] uppercase tracking-[0.2em] text-[#d0c6ab]">© 2024 StageLight Entertainment</span>
                <div className="flex gap-6">
                  <a className="font-outfit font-semibold text-[10px] uppercase tracking-[0.2em] hover:text-[#fff6df] transition-colors" href="#">Privacy</a>
                  <a className="font-outfit font-semibold text-[10px] uppercase tracking-[0.2em] hover:text-[#fff6df] transition-colors" href="#">Terms</a>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
