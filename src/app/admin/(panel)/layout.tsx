import { AdminSidebar, AdminTopbar } from "@/components/admin/sidebar";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminTopbar />
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
