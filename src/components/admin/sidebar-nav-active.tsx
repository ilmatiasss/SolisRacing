"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/logo";
import { Drawer } from "@/components/ui/drawer";
import { SidebarNav, type NavCounts } from "./sidebar-nav";

export function ActiveSidebarNav({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();
  return <SidebarNav activePath={pathname} counts={counts} />;
}

export function MobileAdminNav({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú del panel"
        className="flex size-10 cursor-pointer items-center justify-center rounded-lg hover:bg-zinc-100"
      >
        <Menu className="size-5" />
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side="left"
        theme="admin"
        title={
          <span className="flex items-center gap-2 not-italic">
            <LogoMark className="h-5 w-auto" /> Panel
          </span>
        }
      >
        <div className="p-4">
          <SidebarNav activePath={pathname} counts={counts} onNavigate={() => setOpen(false)} />
        </div>
      </Drawer>
    </>
  );
}
