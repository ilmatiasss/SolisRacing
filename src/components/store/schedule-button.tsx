"use client";

import { CalendarClock } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

/** Lleva al formulario de agenda con el servicio ya seleccionado. */
export function ScheduleButton({ serviceId }: { serviceId: number }) {
  return (
    <a
      href="#agendar"
      onClick={() => {
        const select = document.getElementById("serviceId");
        if (select instanceof HTMLSelectElement) select.value = String(serviceId);
      }}
      className={buttonClasses({ variant: "outline", size: "sm" })}
    >
      <CalendarClock className="size-4" />
      Agendar
    </a>
  );
}
