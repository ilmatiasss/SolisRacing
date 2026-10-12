import { LogOut } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { logout } from "@/lib/actions/admin/session";
import { requireAdmin } from "@/lib/auth";
import { getNavCounts } from "@/lib/data/admin";
import { SidebarNav } from "./sidebar-nav";
import { ActiveSidebarNav, MobileAdminNav } from "./sidebar-nav-active";

async function NavWithCounts({ mobile }: { mobile?: boolean }) {
  await requireAdmin();
  const counts = await getNavCounts();
  return mobile ? <MobileAdminNav counts={counts} /> : <ActiveSidebarNav counts={counts} />;
}

async function CurrentUser() {
  const user = await requireAdmin();
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white shadow-[0_0_14px_rgba(225,6,0,0.45)]">
        {user.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <p className="truncate text-xs text-muted">{user.email}</p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4.5" />
        </button>
      </form>
    </div>
  );
}

export function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/80 backdrop-blur lg:flex">
      <div className="flex h-16 items-center justify-between border-b border-line px-5">
        <Link href="/admin" aria-label="Inicio del panel">
          <Logo size="sm" turbo />
        </Link>
        <span className="rounded-md border border-brand-600/40 bg-brand-600/10 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-brand-500 uppercase">
          Panel
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <Suspense fallback={<SidebarNav />}>
          <NavWithCounts />
        </Suspense>
      </div>
      <div className="border-t border-line p-4">
        <Suspense fallback={<div className="h-9 animate-pulse rounded-lg bg-surface-2" />}>
          <CurrentUser />
        </Suspense>
      </div>
    </aside>
  );
}

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur lg:hidden">
      <Suspense fallback={<div className="size-10" />}>
        <NavWithCounts mobile />
      </Suspense>
      <Link href="/admin">
        <Logo size="sm" />
      </Link>
    </header>
  );
}
