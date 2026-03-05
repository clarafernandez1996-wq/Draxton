import Link from "next/link";
import { PortfolioTab } from "./PortfolioTab";
import { getDashboardData } from "./metrics";
import type { DashboardData } from "./types";

function monthPeriod(base: Date, deltaMonths: number) {
  const date = new Date(base.getFullYear(), base.getMonth() + deltaMonths, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function periodLabel(period: string) {
  const [yearRaw, monthRaw] = period.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (Number.isNaN(year) || Number.isNaN(month)) return period;
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("es-ES", { month: "short", year: "2-digit" }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ragPill(value: string) {
  if (value === "RED") return "bg-red-100 text-red-700";
  if (value === "YELLOW") return "bg-yellow-100 text-yellow-700";
  if (value === "GREEN") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}

function ragLabel(value: string) {
  if (value === "GREEN") return "En l\u00ednea";
  if (value === "YELLOW") return "En seguimiento";
  if (value === "RED") return "Requiere atenci\u00f3n";
  return "Sin datos";
}

function MetricCard({
  title,
  value,
  subtitle,
  accentClass,
  helpText,
  href,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  accentClass: string;
  helpText?: string;
  href?: string;
}) {
  const content = (
    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm">
      <div className={`absolute left-0 top-0 h-full w-2 ${accentClass}`} />
      <div className="pl-4">
        <p className="text-sm font-medium uppercase tracking-wide text-[#6E6E6E]" title={helpText}>
          {title}
        </p>
        <p className="mt-3 text-5xl font-bold leading-none text-[#0B3A6E]">{value}</p>
        {subtitle ? <p className="mt-2 text-xs text-[#6E6E6E]">{subtitle}</p> : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition hover:-translate-y-0.5 hover:shadow-md" title={helpText}>
        {content}
      </Link>
    );
  }

  return content;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const view = (Array.isArray(query.view) ? query.view[0] : query.view) === "portfolio" ? "portfolio" : "committee";
  const area = Array.isArray(query.area) ? query.area[0] : query.area;
  const phase = Array.isArray(query.phase) ? query.phase[0] : query.phase;
  const priority = Array.isArray(query.priority) ? query.priority[0] : query.priority;
  const period = Array.isArray(query.period) ? query.period[0] : query.period;
  const quickFilter = Array.isArray(query.quick) ? query.quick[0] : query.quick;

  const emptyData: DashboardData = {
    filters: {
      area: area ?? "",
      phase: phase ?? "",
      priority: priority ?? "",
      period: period ?? monthPeriod(new Date(), 0),
    },
    portfolio: [],
    committee: {
      healthIndex: 0,
      riskPercent: 0,
      highAttentionProjects: 0,
      highRisks: 0,
      ragByDimension: {
        planning: { GREEN: 0, YELLOW: 0, RED: 0, NA: 0 },
        cost: { GREEN: 0, YELLOW: 0, RED: 0, NA: 0 },
        risk: { GREEN: 0, YELLOW: 0, RED: 0, NA: 0 },
      },
      trend6m: Array.from({ length: 6 }).map((_, idx) => ({
        period: monthPeriod(new Date(), idx - 5),
        attentionHigh: 0,
      })),
      topAttention: [],
      bubbles: [],
      hygiene: {
        withOwnerPct: 0,
        updated30dPct: 0,
        withSnapshotPct: 0,
      },
      alerts: [],
    },
  };

  let data = emptyData;
  try {
    data = await getDashboardData({ area, phase, priority, period });
  } catch (error) {
    console.error("Dashboard data error", error);
  }

  const now = new Date();
  const periodOptions = Array.from({ length: 6 }).map((_, idx) => monthPeriod(now, -idx));
  const trendMax = Math.max(1, ...data.committee.trend6m.map((item) => item.attentionHigh));
  const monthsWithHistory = data.committee.trend6m.filter((month) =>
    data.portfolio.some((project) => {
      const point = project.trend6m.find((item) => item.period === month.period);
      return point && (point.planning !== "NA" || point.cost !== "NA" || point.risk !== "NA");
    }),
  ).length;
  const hasLimitedHistory = monthsWithHistory < 6;
  const latestUpdate = data.portfolio
    .map((row) => new Date(`${row.lastUpdate}T00:00:00`))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const buildPortfolioHref = (quick: string) => {
    const params = new URLSearchParams({
      view: "portfolio",
      area: data.filters.area,
      phase: data.filters.phase,
      priority: data.filters.priority,
      period: data.filters.period,
      quick,
    });
    return `/dashboard?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#0B3A6E]">Panel</h1>
          <p className="mt-1 text-sm text-[#6E6E6E]">{"Visi\u00f3n ejecutiva y cartera de proyectos."}</p>
          <p className="mt-1 text-xs text-[#6E6E6E]">
            {"\u00daltima actualizaci\u00f3n: "}
            {latestUpdate ? formatDate(latestUpdate) : "Sin datos"}
          </p>
        </div>
        <Link href="/dashboard/portfolio" className="rounded-lg border px-3 py-2 text-xs text-[#0B3A6E]">
          API cartera (JSON)
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white p-2 shadow">
        <div className="flex min-w-max items-center gap-2">
          <Link
            href={`/dashboard?view=committee&area=${data.filters.area}&phase=${data.filters.phase}&priority=${data.filters.priority}&period=${data.filters.period}`}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${view === "committee" ? "bg-[#0B3A6E] text-white" : "text-[#0B3A6E] hover:bg-[#EAF2FB]"}`}
          >
            {"Visi\u00f3n Comit\u00e9"}
          </Link>
          <Link
            href={`/dashboard?view=portfolio&area=${data.filters.area}&phase=${data.filters.phase}&priority=${data.filters.priority}&period=${data.filters.period}`}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${view === "portfolio" ? "bg-[#0B3A6E] text-white" : "text-[#0B3A6E] hover:bg-[#EAF2FB]"}`}
          >
            Cartera de Proyectos
          </Link>
        </div>
      </div>

      <form className="rounded-2xl bg-white p-4 shadow-sm">
        <input type="hidden" name="view" value={view} />
        <div className="grid gap-3 md:grid-cols-5">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">{"\u00c1rea"}</span>
            <select name="area" defaultValue={data.filters.area} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Todas</option>
              <option value="IT">IT</option>
              <option value="RRHH">RRHH</option>
              <option value="INGENIERIA">{"Ingenier\u00eda"}</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Fase</span>
            <select name="phase" defaultValue={data.filters.phase} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Todas</option>
              <option value="DEFINICION">{"Definici\u00f3n"}</option>
              <option value="EJECUCION">{"Ejecuci\u00f3n"}</option>
              <option value="IMPLANTACION">{"Implantaci\u00f3n"}</option>
              <option value="ESTABILIZACION">{"Estabilizaci\u00f3n"}</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Prioridad</span>
            <select name="priority" defaultValue={data.filters.priority} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Todas</option>
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">{"Cr\u00edtica"}</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Periodo</span>
            <select name="period" defaultValue={data.filters.period} className="w-full rounded-lg border px-3 py-2 text-sm">
              {periodOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className="w-full rounded-lg bg-[#0B3A6E] px-4 py-2 text-sm font-medium text-white">
              Aplicar filtros
            </button>
          </div>
        </div>
      </form>

      {view === "committee" ? (
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title={"\u00cdndice de salud"}
              value={data.committee.healthIndex}
              subtitle="0-100 (100 mejor)"
              accentClass="bg-[#0B3A6E]"
              helpText="Mide el estado global de cartera combinando plazo, coste, riesgo y proveedor."
              href={buildPortfolioHref("attention")}
            />
            <MetricCard
              title="% Riesgo"
              value={`${data.committee.riskPercent}%`}
              subtitle="Riesgos altos / riesgos abiertos"
              accentClass="bg-[#F59E0B]"
              helpText="Porcentaje de riesgos abiertos con nivel alto (probabilidad x impacto >= 15)."
              href={buildPortfolioHref("red")}
            />
            <MetricCard
              title={"Atenci\u00f3n alta"}
              value={data.committee.highAttentionProjects}
              subtitle={"\u00cdndice de atenci\u00f3n >= 70"}
              accentClass="bg-[#C8102E]"
              helpText="N\u00famero de proyectos con AttentionScore igual o superior a 70."
              href={buildPortfolioHref("high")}
            />
            <MetricCard
              title="Riesgos altos"
              value={data.committee.highRisks}
              subtitle="Probabilidad x impacto >= 15"
              accentClass="bg-[#6E6E6E]"
              helpText="Riesgos abiertos catalogados como altos o cr\u00edticos."
              href={buildPortfolioHref("red")}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0B3A6E]">{"Estado de proyectos por dimensi\u00f3n"}</h2>
              <div className="mt-4 space-y-3 text-sm">
                {(["planning", "cost", "risk"] as const).map((dim) => (
                  <div key={dim} className="rounded-lg border p-3">
                    <div className="font-semibold capitalize">{dim}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(["GREEN", "YELLOW", "RED", "NA"] as const).map((rag) => (
                        <span
                          key={rag}
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${ragPill(rag)}`}
                          title={`Estado: ${ragLabel(rag)}`}
                        >
                          {ragLabel(rag)}: {data.committee.ragByDimension[dim][rag]}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-semibold text-[#0B3A6E]">{"Proyectos que requieren atenci\u00f3n (\u00faltimos 6 meses)"}</h2>
              <p className="mt-1 text-xs text-[#6E6E6E]">
                Incluye proyectos con tareas vencidas, riesgos altos o desviaciones de planificaci\u00f3n.
              </p>
              {hasLimitedHistory ? (
                <p className="mt-2 rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                  {"Hist\u00f3rico limitado. Se muestran datos estimados."}
                </p>
              ) : null}
              <div className="mt-4 grid grid-cols-6 gap-3">
                {data.committee.trend6m.map((point) => (
                  <div key={point.period} className="flex flex-col items-center gap-2">
                    <div className="flex h-32 w-full items-end rounded-lg border bg-[#F8FAFC] p-2">
                      <div className="w-full rounded bg-[#C8102E]" style={{ height: `${Math.max(8, Math.round((point.attentionHigh / trendMax) * 100))}%` }} />
                    </div>
                    <div className="text-xs font-semibold">{point.attentionHigh}</div>
                    <div className="text-[11px] text-[#6E6E6E]">{periodLabel(point.period)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0B3A6E]">{"Top atenci\u00f3n (Top 10)"}</h2>
              {data.committee.topAttention.length === 0 ? (
                <p className="mt-3 text-sm text-[#6E6E6E]">Sin datos para este periodo.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Proyecto</th>
                        <th className="px-3 py-2 font-semibold">{"Puntuaci\u00f3n"}</th>
                        <th className="px-3 py-2 font-semibold">Motivos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.committee.topAttention.map((row) => (
                        <tr key={row.projectId}>
                          <td className="px-3 py-2">{row.project}</td>
                          <td className="px-3 py-2 font-semibold">{row.attentionScore}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {row.motives.slice(0, 3).map((motive) => (
                                <span key={motive} className="rounded bg-[#EAF2FB] px-2 py-1 text-[11px] text-[#0B3A6E]">
                                  {motive}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0B3A6E]">Burbuja impacto vs riesgo</h2>
              <div className="relative mt-4 h-64 rounded-xl border bg-[#F8FAFC]">
                {data.committee.bubbles.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-[#6E6E6E]">Sin datos de riesgos.</div>
                ) : (
                  data.committee.bubbles.map((bubble, idx) => (
                    <div
                      key={`${bubble.project}-${idx}`}
                      className="absolute rounded-full border border-white/50 text-[10px] text-white shadow"
                      title={`${bubble.project} (${bubble.xProbability}, ${bubble.yImpact})`}
                      style={{
                        left: `${Math.min(90, Math.max(5, bubble.xProbability * 18))}%`,
                        bottom: `${Math.min(90, Math.max(5, bubble.yImpact * 18))}%`,
                        width: `${bubble.size}px`,
                        height: `${bubble.size}px`,
                        backgroundColor: bubble.color,
                        transform: "translate(-50%, 50%)",
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#0B3A6E]">Alertas accionables</h2>
              {data.committee.alerts.length === 0 ? (
                <p className="mt-3 text-sm text-[#6E6E6E]">No hay alertas de alta prioridad para este filtro.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {data.committee.alerts.map((alert) => (
                    <li key={`${alert.project}-${alert.score}`} className="rounded-lg border p-3">
                      <div className="font-semibold text-[#0B3A6E]">
                        {alert.project} - {alert.score}
                      </div>
                      <div className="mt-1 text-[#6E6E6E]">{alert.reasons.join(", ")}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : (
        <PortfolioTab rows={data.portfolio} quickFilter={quickFilter} />
      )}
    </div>
  );
}
