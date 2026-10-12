"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { clearIntegrationRequests } from "@/lib/data/integration";

export async function clearIntegrationLog() {
  await requireAdmin();
  await clearIntegrationRequests();
  refresh();
}
