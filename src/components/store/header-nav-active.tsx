"use client";

import { usePathname } from "next/navigation";
import { HeaderNavLinks } from "./header-nav";

export function ActiveHeaderNav() {
  const pathname = usePathname();
  return <HeaderNavLinks activePath={pathname} />;
}
