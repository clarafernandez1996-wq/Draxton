import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Draxton Project Manager",
  description: "Gestión interna de proyectos Draxton",
};

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Proyectos" },
  { href: "/admin", label: "Administración" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A]">
        <div className="min-h-screen flex">
          <aside className="w-64 bg-[#0B3A6E] text-white p-6">
            <div className="mb-8">
              <div className="text-lg font-semibold">DRAXTON</div>
              <div className="text-sm opacity-80">Project Manager</div>
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

            <div className="mt-10 text-xs opacity-70">
              Uso interno • MVP
            </div>
          </aside>

          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
