import { redirect } from "next/navigation";
import { requireAuth } from "../lib/auth";

export default async function AdminPage() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    redirect("/Dashboard");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#0B3A6E]">{"Administraci\u00f3n"}</h1>
      <div className="rounded-xl bg-white p-5 shadow text-sm text-[#1A1A1A]">
        {"\u00c1rea de administraci\u00f3n habilitada solo para usuarios con rol "}
        <strong>ADMIN</strong>.
      </div>
    </div>
  );
}
