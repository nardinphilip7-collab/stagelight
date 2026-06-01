"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";

/**
 * Hard onboarding gate. Artists/fans who have not completed their basic info
 * (name + primary discipline + location + an image + bio) are redirected to the
 * setup wizard and cannot use the rest of the app until they finish.
 *
 * Hirers/agencies are exempt (they use /profile/hirer, not the talent profile).
 */

// Routes that must never be redirected away from.
const ALLOW = [
  "/profile/edit",
  "/login",
  "/register",
  "/logout",
];

function isAllowed(pathname: string): boolean {
  return ALLOW.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function OnboardingGate() {
  const router = useRouter();
  const pathname = usePathname();
  // Once we've confirmed the user is onboarded we don't re-check every navigation.
  const clearedRef = useRef(false);

  useEffect(() => {
    if (clearedRef.current) return;
    if (isAllowed(pathname)) return;

    const user = getUser();
    // Not logged in, or a hirer/agency — gate does not apply here.
    if (!user) return;
    if (user.role === "HIRER" || user.role === "AGENCY") {
      clearedRef.current = true;
      return;
    }

    let cancelled = false;
    apiClient
      .get<{ onboarding_complete?: boolean }>("/auth/me/", true)
      .then((me) => {
        if (cancelled) return;
        if (me?.onboarding_complete) {
          clearedRef.current = true;
        } else {
          router.replace("/profile/edit?setup=1");
        }
      })
      .catch(() => {
        // If the check fails (network/auth), don't trap the user.
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
