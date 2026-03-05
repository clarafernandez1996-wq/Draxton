"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EntityModal } from "@/app/components/ui/EntityModal";
import { useEntityModal } from "@/app/hooks/useEntityModal";
import { createFinanceEntryAction, FinanceActionState, upsertFinanceSummaryAction } from "./finance-actions";

type FinanceEntryRow = {
  id: string;
  type: "COST" | "INCOME" | "BENEFIT";
  category: string;
  description: string | null;
  supplier: string | null;
  ownerName: string | null;
  leverage: string | null;
  budgetAmount: number;
  actualAmount: number;
  probability: number | null;
  weightedAmount: number | null;
  capex: number | null;
  opexAnnual: number | null;
  paybackYears: number | null;
  roiPercent: number | null;
};

type FinanceSummary = {
  budgetApproved: number;
  actualCost: number;
  committedCost: number;
  economicRiskNote: string | null;
};

type FinancePanelProps = {
  projectId: string;
  summary: FinanceSummary;
  entries: FinanceEntryRow[];
};

type FinanceType = "COST" | "INCOME" | "BENEFIT";

const INITIAL_STATE: FinanceActionState = { ok: false, message: "" };

const EMPTY_ENTRY = {
  type: "COST" as FinanceType,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0);
}

function sumBy(entries: FinanceEntryRow[], getter: (row: FinanceEntryRow) => number) {
  return entries.reduce((acc, row) => acc + getter(row), 0);
}

export function FinancePanel({ projectId, summary, entries }: FinancePanelProps) {
  const router = useRouter();
  const modal = useEntityModal(EMPTY_ENTRY);
  const [summaryState, summaryAction] = useActionState(upsertFinanceSummaryAction, INITIAL_STATE);
  const [entryState, entryAction] = useActionState(createFinanceEntryAction, INITIAL_STATE);

  useEffect(() => {
    if (!entryState.ok) return;
    modal.close();
    router.refresh();
  }, [entryState.ok, modal, router]);

  const costs = entries.filter((row) => row.type === "COST");
  const incomes = entries.filter((row) => row.type === "INCOME");
  const benefits = entries.filter((row) => row.type === "BENEFIT");

  const deviationAmount = summary.actualCost - summary.budgetApproved;
  const deviationPct = summary.budgetApproved === 0 ? 0 : (deviationAmount / summary.budgetApproved) * 100;

  const costBudget = sumBy(costs, (r) => r.budgetAmount);
  const costActual = sumBy(costs, (r) => r.actualAmount);
  const incomeWeighted = sumBy(incomes, (r) => r.weightedAmount ?? 0);
  const benefitRoiAvg = benefits.length === 0 ? 0 : sumBy(benefits, (r) => r.roiPercent ?? 0) / benefits.length;

  return (
    <div className="space-y-5 rounded-xl bg-white p-5 shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#0B3A6E]">Control económico</h2>
        <button
          type="button"
          onClick={() => modal.openCreate()}
          className="rounded-lg bg-[#C8102E] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
        >
          Añadir partida
        </button>
      </div>

      {(summaryState.message || entryState.message) ? (
        <div className={`rounded-lg border px-4 py-3 text-sm ${(summaryState.ok || entryState.ok) ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {entryState.message || summaryState.message}
        </div>
      ) : null}

      <form action={summaryAction} className="rounded-lg border bg-[#F8FAFC] p-4">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="grid gap-3 md:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Presupuesto aprobado (€)</span>
            <input name="budgetApproved" type="number" step="0.01" defaultValue={summary.budgetApproved} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Coste real (€)</span>
            <input name="actualCost" type="number" step="0.01" defaultValue={summary.actualCost} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Comprometido (€)</span>
            <input name="committedCost" type="number" step="0.01" defaultValue={summary.committedCost} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <div className="rounded-lg border bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-[#6E6E6E]">Desviación</div>
            <div className={`mt-1 text-lg font-bold ${deviationAmount > 0 ? "text-red-700" : "text-green-700"}`}>
              {formatCurrency(deviationAmount)}
            </div>
            <div className="text-xs text-[#6E6E6E]">{deviationPct.toFixed(1)}%</div>
          </div>
          <label className="space-y-1 md:col-span-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Nota de riesgo económico</span>
            <textarea name="economicRiskNote" rows={2} defaultValue={summary.economicRiskNote ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-4 flex justify-end">
            <button type="submit" className="rounded-lg bg-[#0B3A6E] px-4 py-2 text-sm font-medium text-white">
              Guardar resumen
            </button>
          </div>
        </div>
      </form>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border p-3">
          <div className="text-xs uppercase tracking-wide text-[#6E6E6E]">Coste presupuestado</div>
          <div className="mt-1 text-xl font-bold text-[#0B3A6E]">{formatCurrency(costBudget)}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs uppercase tracking-wide text-[#6E6E6E]">Coste real partidas</div>
          <div className="mt-1 text-xl font-bold text-[#0B3A6E]">{formatCurrency(costActual)}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs uppercase tracking-wide text-[#6E6E6E]">Ingreso ponderado</div>
          <div className="mt-1 text-xl font-bold text-[#0B3A6E]">{formatCurrency(incomeWeighted)}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs uppercase tracking-wide text-[#6E6E6E]">ROI medio</div>
          <div className="mt-1 text-xl font-bold text-[#0B3A6E]">{benefitRoiAvg.toFixed(1)}%</div>
        </div>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-[#0B3A6E]">Costes</h3>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Partida</th>
                <th className="px-3 py-2 font-semibold">Descripción</th>
                <th className="px-3 py-2 font-semibold">Proveedor</th>
                <th className="px-3 py-2 font-semibold">Responsable</th>
                <th className="px-3 py-2 font-semibold">Presupuestado (€)</th>
                <th className="px-3 py-2 font-semibold">Coste real (€)</th>
                <th className="px-3 py-2 font-semibold">Desviación (€)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {costs.length === 0 ? (
                <tr><td className="px-3 py-3 text-[#6E6E6E]" colSpan={7}>Sin partidas de costes.</td></tr>
              ) : (
                costs.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2">{row.category}</td>
                    <td className="px-3 py-2">{row.description ?? "-"}</td>
                    <td className="px-3 py-2">{row.supplier ?? "-"}</td>
                    <td className="px-3 py-2">{row.ownerName ?? "-"}</td>
                    <td className="px-3 py-2">{formatCurrency(row.budgetAmount)}</td>
                    <td className="px-3 py-2">{formatCurrency(row.actualAmount)}</td>
                    <td className="px-3 py-2">{formatCurrency(row.actualAmount - row.budgetAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-[#0B3A6E]">Ingresos / Subvenciones</h3>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Partida</th>
                <th className="px-3 py-2 font-semibold">Descripción</th>
                <th className="px-3 py-2 font-semibold">Responsable</th>
                <th className="px-3 py-2 font-semibold">Presupuestado (€)</th>
                <th className="px-3 py-2 font-semibold">Ingreso real (€)</th>
                <th className="px-3 py-2 font-semibold">Desviación (€)</th>
                <th className="px-3 py-2 font-semibold">Probabilidad (%)</th>
                <th className="px-3 py-2 font-semibold">Importe ponderado (€)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {incomes.length === 0 ? (
                <tr><td className="px-3 py-3 text-[#6E6E6E]" colSpan={8}>Sin partidas de ingresos.</td></tr>
              ) : (
                incomes.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2">{row.category}</td>
                    <td className="px-3 py-2">{row.description ?? "-"}</td>
                    <td className="px-3 py-2">{row.ownerName ?? "-"}</td>
                    <td className="px-3 py-2">{formatCurrency(row.budgetAmount)}</td>
                    <td className="px-3 py-2">{formatCurrency(row.actualAmount)}</td>
                    <td className="px-3 py-2">{formatCurrency(row.actualAmount - row.budgetAmount)}</td>
                    <td className="px-3 py-2">{row.probability ?? "-"}{row.probability !== null ? "%" : ""}</td>
                    <td className="px-3 py-2">{formatCurrency(row.weightedAmount ?? 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-[#0B3A6E]">Beneficios / ROI</h3>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Partida</th>
                <th className="px-3 py-2 font-semibold">Descripción</th>
                <th className="px-3 py-2 font-semibold">Palanca</th>
                <th className="px-3 py-2 font-semibold">Responsable</th>
                <th className="px-3 py-2 font-semibold">Beneficio previsto (€)</th>
                <th className="px-3 py-2 font-semibold">Beneficio real (€)</th>
                <th className="px-3 py-2 font-semibold">Desviación (€)</th>
                <th className="px-3 py-2 font-semibold">CAPEX (€)</th>
                <th className="px-3 py-2 font-semibold">OPEX anual (€)</th>
                <th className="px-3 py-2 font-semibold">Payback (años)</th>
                <th className="px-3 py-2 font-semibold">ROI (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {benefits.length === 0 ? (
                <tr><td className="px-3 py-3 text-[#6E6E6E]" colSpan={11}>Sin partidas de beneficios.</td></tr>
              ) : (
                benefits.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2">{row.category}</td>
                    <td className="px-3 py-2">{row.description ?? "-"}</td>
                    <td className="px-3 py-2">{row.leverage ?? "-"}</td>
                    <td className="px-3 py-2">{row.ownerName ?? "-"}</td>
                    <td className="px-3 py-2">{formatCurrency(row.budgetAmount)}</td>
                    <td className="px-3 py-2">{formatCurrency(row.actualAmount)}</td>
                    <td className="px-3 py-2">{formatCurrency(row.actualAmount - row.budgetAmount)}</td>
                    <td className="px-3 py-2">{formatCurrency(row.capex ?? 0)}</td>
                    <td className="px-3 py-2">{formatCurrency(row.opexAnnual ?? 0)}</td>
                    <td className="px-3 py-2">{row.paybackYears ?? "-"}</td>
                    <td className="px-3 py-2">{row.roiPercent ?? "-"}{row.roiPercent !== null ? "%" : ""}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <EntityModal title="Añadir partida económica" open={modal.open} onOpenChange={modal.setOpen}>
        <form action={entryAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="projectId" value={projectId} />
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Bloque</span>
            <select name="type" defaultValue={modal.data.type} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="COST">Costes</option>
              <option value="INCOME">Ingresos / Subvenciones</option>
              <option value="BENEFIT">Beneficios / ROI</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Partida</span>
            <input name="category" className="w-full rounded-lg border px-3 py-2 text-sm" required />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Descripción</span>
            <input name="description" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Proveedor</span>
            <input name="supplier" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Responsable</span>
            <input name="ownerName" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Presupuestado (€)</span>
            <input name="budgetAmount" type="number" step="0.01" defaultValue={0} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Real (€)</span>
            <input name="actualAmount" type="number" step="0.01" defaultValue={0} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Probabilidad (%)</span>
            <input name="probability" type="number" min={0} max={100} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Palanca</span>
            <input name="leverage" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">CAPEX (€)</span>
            <input name="capex" type="number" step="0.01" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">OPEX anual (€)</span>
            <input name="opexAnnual" type="number" step="0.01" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Payback (años)</span>
            <input name="paybackYears" type="number" step="0.1" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">ROI (%)</span>
            <input name="roiPercent" type="number" step="0.1" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={modal.close} className="rounded-lg border px-4 py-2 text-sm">
              Cancelar
            </button>
            <button type="submit" className="rounded-lg bg-[#C8102E] px-4 py-2 text-sm font-medium text-white">
              Guardar partida
            </button>
          </div>
        </form>
      </EntityModal>
    </div>
  );
}
