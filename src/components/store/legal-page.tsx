import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "./section-heading";

export function LegalPage({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <>
      <PageHeader eyebrow="Información" title={title} description={intro} />
      <Container className="py-12">
        <div className="max-w-3xl space-y-8 text-[0.95rem] leading-relaxed text-zinc-300 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:uppercase [&_h2]:italic [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_section>*+*]:mt-3">
          {children}
        </div>
      </Container>
    </>
  );
}
