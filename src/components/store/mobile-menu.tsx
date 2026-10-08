"use client";

import { Menu, Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useState } from "react";
import { DynamicIcon } from "@/components/icons";
import { Drawer } from "@/components/ui/drawer";
import { MAIN_NAV } from "./header-nav";

type MenuCategory = { name: string; slug: string; icon: string };

export function MobileMenu({ categories }: { categories: MenuCategory[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-zinc-200 hover:bg-white/5 lg:hidden"
      >
        <Menu className="size-5.5" />
      </button>
      <Drawer open={open} onClose={close} side="left" title="Menú">
        <div className="space-y-6 p-5">
          <Form action="/productos" onSubmit={close} className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
            <input
              name="q"
              type="search"
              placeholder="Buscar repuestos, marcas, autos…"
              aria-label="Buscar en la tienda"
              className="h-11 w-full rounded-xl border border-line bg-surface-2 pr-3 pl-10 text-sm placeholder:text-muted focus:border-brand-600 focus:outline-none"
            />
          </Form>
          <nav aria-label="Menú móvil" className="grid gap-1">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="rounded-xl px-3 py-3 text-base font-semibold hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {categories.length > 0 && (
            <div>
              <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-muted uppercase">Categorías</p>
              <div className="grid gap-1">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/productos?categoria=${category.slug}`}
                    onClick={close}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
                  >
                    <DynamicIcon name={category.icon} className="size-4.5 text-brand-500" />
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}
