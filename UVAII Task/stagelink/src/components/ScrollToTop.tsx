"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Attempt to override Next.js scroll preservation by forcing the scroll on route change
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Fallback for cases where main containers are holding the scroll
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname]);

  return null;
}
