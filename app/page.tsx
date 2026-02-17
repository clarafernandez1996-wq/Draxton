import Link from "next/link";

export default function Home() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0B3A6E]">
        Draxton Project Manager
      </h1>
      <p className="text-[#6E6E6E]">
        Bienvenida. Accede al panel para empezar.
      </p>

      <Link
        href="/dashboard"
        className="inline-block bg-[#C8102E] text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
      >
        Ir al Dashboard
      </Link>
    </main>
  );
}
