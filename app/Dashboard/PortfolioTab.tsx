"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PortfolioRow } from "./types";

function ragClass(rag: string) {
  if (rag === "RED") return "bg-red-100 text-red-700";
  if (rag === "YELLOW") return "bg-yellow-100 text-yellow-700";
  if (rag === "GREEN") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}

function ragLabel(rag: string) {
  if (rag === "GREEN") return "En l\u00ednea";
  if (rag === "YELLOW") return "En seguimiento";
  if (rag === "RED") return "Requiere atenci\u00f3n";
  return "Sin datos";
}

function trendSymbol(trend: -1 | 0 | 1 | null) {
  if (trend === 1) return "^";
  if (trend === -1) return "v";
  if (trend === 0) return "-";
  return "-";
}

type SortKey = "attention" | "planning" | "cost" | "highRisks";

function ragWeight(rag: string) {
  if (rag === "RED") return 3;
  if (rag === "YELLOW") return 2;
  if (rag === "GREEN") return 1;
  return 0;
}

export function PortfolioTab({ rows, quickFilter }: { rows: PortfolioRow[]; quickFilter?: string }) {
  const [search, setSearch] = useState("");
  const [onlyHighAttention, setOnlyHighAttention] = useState(false);
  const [onlyRed, setOnlyRed] = useState(false);
  const [stale30d, setStale30d] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("attention");
  const [selected, setSelected] = useState<PortfolioRow | null>(null);

  useEffect(() => {
    setOnlyHighAttention(false);
    setOnlyRed(false);
    setStale30d(false);
    setSortBy("attention");

    if (quickFilter === "high") setOnlyHighAttention(true);
    if (quickFilter === "red") setOnlyRed(true);
    if (quickFilter === "stale") setStale30d(true);
    if (quickFilter === "attention") setSortBy("attention");
  }, [quickFilter]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let next = rows.filter((row) => row.project.toLowerCase().includes(query));
    if (onlyHighAttention) next = next.filter((row) => row.attentionHigh);
    if (onlyRed) next = next.filter((row) => row.anyRed);
    if (stale30d) next = next.filter((row) => row.stale30d);

    next = [...next].sort((a, b) => {
      if (sortBy === "attention") return b.attentionScore - a.attentionScore;
      if (sortBy === "planning") return ragWeight(b.planningRag) - ragWeight(a.planningRag);
      if (sortBy === "cost") return ragWeight(b.costRag) - ragWeight(a.costRag);
      return b.riskHigh - a.riskHigh;
    });
    return next;
  }, [rows, search, onlyHighAttention, onlyRed, stale30d, sortBy]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        {quickFilter ? (
          <div className="mb-3 rounded-lg border border-[#0B3A6E]/20 bg-[#EAF2FB] px-3 py-2 text-xs text-[#0B3A6E]">
            Filtro r\u00e1pido aplicado desde panel.
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Buscar proyecto</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Nombre proyecto..." />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Ordenar por</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="attention">{"\u00cdndice de atenci\u00f3n"}</option>
              <option value="planning">Peor plazo</option>
              <option value="cost">Peor coste</option>
              <option value="highRisks">{"M\u00e1s riesgos altos"}</option>
            </select>
          </label>
          <div className="flex items-end gap-3 text-xs">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={onlyHighAttention} onChange={(e) => setOnlyHighAttention(e.target.checked)} />
              {"Solo atenci\u00f3n alta"}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={onlyRed} onChange={(e) => setOnlyRed(e.target.checked)} />
              Solo en rojo
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={stale30d} onChange={(e) => setStale30d(e.target.checked)} />
              {"Sin actualizaci\u00f3n 30d"}
            </label>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-6 text-sm text-[#6E6E6E]">No hay datos para los filtros seleccionados.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="w-full min-w-[1500px] text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Prioridad</th>
                <th className="px-3 py-2 font-semibold">Proyecto</th>
                <th className="px-3 py-2 font-semibold">{"\u00c1rea"}</th>
                <th className="px-3 py-2 font-semibold">Responsable</th>
                <th className="px-3 py-2 font-semibold">Fase</th>
                <th className="px-3 py-2 font-semibold">Fin plan.</th>
                <th className="px-3 py-2 font-semibold">{"\u00dalt. actualizaci\u00f3n"}</th>
                <th className="px-3 py-2 font-semibold">Plazo</th>
                <th className="px-3 py-2 font-semibold">Coste</th>
                <th className="px-3 py-2 font-semibold">Avance</th>
                <th className="px-3 py-2 font-semibold">Riesgos</th>
                <th className="px-3 py-2 font-semibold">Proveedor</th>
                <th className="px-3 py-2 font-semibold">{"Atenci\u00f3n"}</th>
                <th className="px-3 py-2 font-semibold">Motivos</th>
                <th className="px-3 py-2 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((row) => (
                <tr key={row.projectId} className="hover:bg-[#F8FAFC]">
                  <td className="px-3 py-2">{"*".repeat(Math.max(1, row.priorityScore))}</td>
                  <td className="px-3 py-2 font-medium text-[#0B3A6E]">{row.project}</td>
                  <td className="px-3 py-2">{row.area}</td>
                  <td className="px-3 py-2">{row.owner}</td>
                  <td className="px-3 py-2">{row.phase}</td>
                  <td className="px-3 py-2">{row.plannedEnd}</td>
                  <td className="px-3 py-2">{row.lastUpdate}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${ragClass(row.planningRag)}`} title={`Plazo: ${ragLabel(row.planningRag)}`}>
                      {ragLabel(row.planningRag)}
                    </span>{" "}
                    <span className="text-xs">{trendSymbol(row.planningTrend)}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${ragClass(row.costRag)}`} title={`Coste: ${ragLabel(row.costRag)}`}>
                      {ragLabel(row.costRag)}
                    </span>{" "}
                    <span className="text-xs">{trendSymbol(row.costTrend)}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded bg-gray-200"><div className="h-2 rounded bg-[#0B3A6E]" style={{ width: `${row.progressPercent}%` }} /></div>
                      <span>{row.progressPercent}% {trendSymbol(row.progressTrend)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${ragClass(row.riskRag)}`} title={`Riesgos: ${ragLabel(row.riskRag)}`}>
                      {ragLabel(row.riskRag)}
                    </span>{" "}
                    <span className="text-xs">{row.riskHigh}/{row.riskTotal}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${ragClass(row.supplierRag)}`} title={`Proveedor: ${ragLabel(row.supplierRag)}`}>
                      {ragLabel(row.supplierRag)}
                    </span>{" "}
                    <span className="text-xs">{row.supplierName}</span>
                  </td>
                  <td className="px-3 py-2 font-semibold">{row.attentionScore}</td>
                  <td className="px-3 py-2"><div className="flex flex-wrap gap-1">{row.motives.slice(0, 2).map((motive) => (<span key={motive} className="rounded bg-[#EAF2FB] px-2 py-1 text-[11px] text-[#0B3A6E]">{motive}</span>))}</div></td>
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><button type="button" onClick={() => setSelected(row)} className="rounded-lg border px-2 py-1 text-xs text-[#0B3A6E]">Abrir</button><button type="button" className="rounded-lg border px-2 py-1 text-xs">Comentar</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l bg-white p-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#0B3A6E]">{selected.project}</h3>
            <button type="button" onClick={() => setSelected(null)} className="rounded border px-2 py-1 text-sm">Cerrar</button>
          </div>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-[#6E6E6E]">Resumen</div>
              <div className="mt-1">{"\u00cdndice de atenci\u00f3n"}: {selected.attentionScore}</div>
              <div>Responsable: {selected.owner}</div>
              <div>Fase: {selected.phase}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-[#6E6E6E]">Tendencia 6 meses</div>
              <div className="mt-2 grid grid-cols-6 gap-1">
                {selected.trend6m.map((point) => (
                  <div key={point.period} className="rounded border p-1 text-center text-[11px]">
                    <div>{point.period.slice(5)}</div>
                    <div className={ragClass(point.planning)} title={`Plazo: ${ragLabel(point.planning)}`}>P</div>
                    <div className={ragClass(point.cost)} title={`Coste: ${ragLabel(point.cost)}`}>C</div>
                    <div className={ragClass(point.risk)} title={`Riesgos: ${ragLabel(point.risk)}`}>R</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-[#6E6E6E]">Top riesgos altos</div>
              <ul className="mt-1 space-y-1">{selected.topHighRisks.length === 0 ? <li>-</li> : selected.topHighRisks.map((risk) => <li key={risk.title}>{risk.title} ({risk.score})</li>)}</ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-[#6E6E6E]">{"Pr\u00f3ximas tareas"}</div>
              <ul className="mt-1 space-y-1">{selected.upcomingTasks.length === 0 ? <li>-</li> : selected.upcomingTasks.map((task) => <li key={`${task.title}-${task.due}`}>{task.title} - {task.due}</li>)}</ul>
            </div>
            <div className="pt-2"><Link href={`/projects/${selected.projectId}`} className="rounded-lg bg-[#0B3A6E] px-3 py-2 text-xs font-medium text-white">Ir a ficha del proyecto</Link></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
