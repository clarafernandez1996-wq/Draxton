import "./globals.css";
import Link from "next/link";
import { getAuthUser } from "./lib/auth";
import { logoutAction } from "./lib/auth-actions";

export const metadata = {
  title: "Draxton Gestor de Proyectos",
  description: "Gesti\u00f3n interna de proyectos Draxton",
};

const nav = [
  { href: "/Dashboard", label: "Panel" },
  { href: "/projects", label: "Proyectos" },
  { href: "/reports", label: "Reportes" },
  { href: "/Admin", label: "Administraci\u00f3n" },
];

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  return (
    <html lang="es">
      <body className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A]">
        <div className="min-h-screen flex">
          <aside className="w-64 bg-[#0B3A6E] text-white p-6">
            <div className="mb-8">
              <div className="text-lg font-semibold">DRAXTON</div>
              <div className="text-sm opacity-80">Gestor de Proyectos</div>
            </div>

            <nav className="space-y-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 hover:bg-white/10 transition"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-10 text-xs opacity-70">Uso interno MVP</div>

            <div className="mt-6 text-xs">
              {user ? (
                <div className="space-y-2">
                  <div className="opacity-80">{user.email}</div>
                  <div className="opacity-80">Rol: {user.role}</div>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-white/30 px-3 py-2 text-left text-xs font-medium hover:bg-white/10 transition"
                    >
                      Cerrar sesi\u00f3n
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="block rounded-lg border border-white/30 px-3 py-2 text-xs font-medium hover:bg-white/10 transition"
                >
                  Iniciar sesi\u00f3n
                </Link>
              )}
            </div>
          </aside>

          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
