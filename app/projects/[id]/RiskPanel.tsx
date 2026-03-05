"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EntityModal } from "@/app/components/ui/EntityModal";
import { useEntityModal } from "@/app/hooks/useEntityModal";
import { createRiskAction, RiskActionState } from "./risk-actions";

type RiskRow = {
  id: string;
  title: string;
  status: string;
  probability: number;
  impact: number;
  targetDate: string | null;
  ownerName: string | null;
};

type RiskPanelProps = {
  projectId: string;
  risks: RiskRow[];
};

const INITIAL_STATE: RiskActionState = { ok: false, message: "" };

const EMPTY_RISK = {
  title: "",
  ownerName: "",
  targetDate: "",
  probability: 3,
  impact: 3,
  description: "",
  mitigationPlan: "",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(date);
}

function riskStatusLabel(status: string) {
  return status === "CLOSED" ? "Cerrado" : "Abierto";
}

function riskLevel(score: number) {
  if (score >= 15) return "alto";
  if (score >= 8) return "medio";
  return "bajo";
}

function riskBadgeClass(score: number) {
  const base = "inline-flex rounded-full px-2 py-1 text-xs font-semibold";
  const level = riskLevel(score);
  if (level === "alto") return `${base} bg-red-100 text-red-700`;
  if (level === "medio") return `${base} bg-amber-100 text-amber-700`;
  return `${base} bg-green-100 text-green-700`;
}

function riskCellClass(score: number) {
  if (score >= 15) return "bg-red-50";
  if (score >= 8) return "bg-amber-50";
  return "bg-green-50";
}

function shortRiskName(title: string, max = 18) {
  const text = title.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function RiskPanel({ projectId, risks }: RiskPanelProps) {
  const router = useRouter();
  const modal = useEntityModal(EMPTY_RISK);
  const [createState, createFormAction] = useActionState(createRiskAction, INITIAL_STATE);
  const openRisks = risks.filter((r) => r.status === "OPEN");
  const criticalOpenRisks = openRisks.filter((r) => r.probability * r.impact >= 15);

  useEffect(() => {
    if (!createState.ok) return;
    modal.close();
    router.refresh();
  }, [createState.ok, modal, router]);

  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#0B3A6E]">Riesgos</h2>
        <button
          type="button"
          onClick={modal.openCreate}
          className="rounded-lg bg-[#C8102E] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
        >
          Añadir riesgo
        </button>
      </div>

      {createState.message ? (
        <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${createState.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {createState.message}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-red-50 p-3">
          <div className="text-xs uppercase tracking-wide text-red-700">Riesgos abiertos</div>
          <div className="mt-1 text-2xl font-bold text-red-700">{openRisks.length}</div>
        </div>
        <div className="rounded-lg border bg-amber-50 p-3">
          <div className="text-xs uppercase tracking-wide text-amber-700">Críticos</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{criticalOpenRisks.length}</div>
        </div>
      </div>

      <details className="mt-4 rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-semibold text-[#0B3A6E]">Matriz 5x5</summary>
        <div className="mt-3 overflow-x-auto">
          <div className="min-w-[540px]">
            <div className="mb-2 grid grid-cols-[40px_repeat(5,minmax(0,1fr))] gap-1 text-[11px] text-[#6E6E6E]">
              <div />
              {[1, 2, 3, 4, 5].map((p) => (
                <div key={`x-${p}`} className="text-center font-semibold">{p}</div>
              ))}
            </div>
            <div className="grid grid-cols-[40px_repeat(5,minmax(0,1fr))] gap-1">
              {[5, 4, 3, 2, 1].map((impact) => (
                <div key={`row-${impact}`} className="contents">
                  <div className="flex items-center justify-center text-[11px] font-semibold text-[#6E6E6E]">{impact}</div>
                  {[1, 2, 3, 4, 5].map((prob) => {
                    const score = impact * prob;
                    const risksInCell = openRisks.filter((r) => r.impact === impact && r.probability === prob);
                    return (
                      <div key={`cell-${impact}-${prob}`} className={`relative min-h-16 rounded border p-1 ${riskCellClass(score)}`}>
                        <div className="absolute right-1 top-1 text-[10px] font-semibold text-[#6E6E6E]">{score}</div>
                        <div className="flex flex-wrap gap-1 pt-4">
                          {risksInCell.map((r, idx) => (
                            <span
                              key={r.id}
                              className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#0B3A6E] px-1.5 py-0.5 text-[10px] font-semibold text-white"
                              title={r.title}
                            >
                              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1">
                                {idx + 1}
                              </span>
                              <span className="truncate">{shortRiskName(r.title)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-[#6E6E6E]">Eje X: Probabilidad | Eje Y: Impacto</div>
          </div>
        </div>
      </details>

      {risks.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-[#6E6E6E]">No hay riesgos registrados.</div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Riesgo</th>
                <th className="px-3 py-2 font-semibold">Estado</th>
                <th className="px-3 py-2 font-semibold">Prob.</th>
                <th className="px-3 py-2 font-semibold">Impacto</th>
                <th className="px-3 py-2 font-semibold">Nivel</th>
                <th className="px-3 py-2 font-semibold">Fecha objetivo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {risks.map((risk) => {
                const score = risk.probability * risk.impact;
                return (
                  <tr key={risk.id}>
                    <td className="px-3 py-2">{risk.title}</td>
                    <td className="px-3 py-2">{riskStatusLabel(risk.status)}</td>
                    <td className="px-3 py-2">{risk.probability}</td>
                    <td className="px-3 py-2">{risk.impact}</td>
                    <td className="px-3 py-2">
                      <span className={riskBadgeClass(score)}>{score}</span>
                    </td>
                    <td className="px-3 py-2">{formatDate(risk.targetDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <EntityModal title="Añadir riesgo" open={modal.open} onOpenChange={modal.setOpen}>
        <form action={createFormAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="projectId" value={projectId} />
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Título</span>
            <input name="title" className="w-full rounded-lg border px-3 py-2 text-sm" required />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Responsable</span>
            <input name="ownerName" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Fecha objetivo</span>
            <input name="targetDate" type="date" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Probabilidad (1-5)</span>
            <input name="probability" type="number" min={1} max={5} defaultValue={3} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Impacto (1-5)</span>
            <input name="impact" type="number" min={1} max={5} defaultValue={3} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Descripción</span>
            <textarea name="description" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Plan de mitigación</span>
            <textarea name="mitigationPlan" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={modal.close} className="rounded-lg border px-4 py-2 text-sm">
              Cancelar
            </button>
            <button type="submit" className="rounded-lg bg-[#C8102E] px-4 py-2 text-sm font-medium text-white">
              Guardar riesgo
            </button>
          </div>
        </form>
      </EntityModal>
    </div>
  );
}
