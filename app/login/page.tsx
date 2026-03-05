import { redirect } from "next/navigation";
import { getAuthUser } from "../lib/auth";
import { loginAction } from "../lib/auth-actions";

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function errorText(code: string) {
  if (code === "required") return "Correo y contrase�a son obligatorios.";
  if (code === "invalid") return "Credenciales inv�lidas.";
  return "";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthUser();
  if (user) {
    redirect("/Dashboard");
  }

  const params = await searchParams;
  const error = errorText(readParam(params.error));

  return (
    <div className="mx-auto mt-16 max-w-md space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-[#0B3A6E]">Iniciar sesi�n</h1>
        <p className="mt-1 text-sm text-[#6E6E6E]">Accede al Gestor de Proyectos Draxton</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form action={loginAction} className="rounded-xl bg-white p-5 shadow space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Correo</span>
          <input
            name="email"
            type="email"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            autoComplete="email"
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Contrase�a</span>
          <input
            name="password"
            type="password"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            autoComplete="current-password"
            required
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-[#0B3A6E] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
