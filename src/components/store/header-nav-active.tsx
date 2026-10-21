"use client";

import { usePathname } from "next/navigation";
import { HeaderNavLinks } from "./header-nav";

export function ActiveHeaderNav({ hasOffers }: { hasOffers: boolean }) {
  const pathname = usePathname();
  return <HeaderNavLinks activePath={pathname} hasOffers={hasOffers} />;
}
