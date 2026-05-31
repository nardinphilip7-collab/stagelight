"use client";

import { usePathname } from "next/navigation";

const authPaths = ['/login', '/register'];

export function NavbarSpacer() {
  const pathname = usePathname();
  if (authPaths.includes(pathname)) return null;
  return <div className="h-14" />;
}
