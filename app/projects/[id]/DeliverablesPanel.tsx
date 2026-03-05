"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EntityModal } from "@/app/components/ui/EntityModal";
import { useEntityModal } from "@/app/hooks/useEntityModal";
import { createDeliverableItemAction, DeliverableActionState } from "./deliverable-actions";

type TaskOption = {
  id: string;
  title: string;
};

type DeliverableRow = {
  id: string;
  name: string;
  taskId: string | null;
  taskTitle: string | null;
  status: string;
  committedDate: string | null;
  ownerName: string | null;
  sharepointLink: string | null;
};

type DeliverablesPanelProps = {
  projectId: string;
  tasks: TaskOption[];
  deliverables: DeliverableRow[];
};

const INITIAL_STATE: DeliverableActionState = { ok: false, message: "" };
const EMPTY_DATA = {};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(date);
}

function statusLabel(status: string) {
  switch (status) {
    case "IN_PROGRESS":
      return "En curso";
    case "IN_REVIEW":
      return "En revisión";
    case "DELIVERED":
      return "Entregado";
    default:
      return "No iniciado";
  }
}

export function DeliverablesPanel({ projectId, tasks, deliverables }: DeliverablesPanelProps) {
  const router = useRouter();
  const modal = useEntityModal(EMPTY_DATA);
  const [createState, createFormAction] = useActionState(createDeliverableItemAction, INITIAL_STATE);

  useEffect(() => {
    if (!createState.ok) return;
    modal.close();
    router.refresh();
  }, [createState.ok, modal, router]);

  return (
    <div className="space-y-4 rounded-xl bg-white p-5 shadow">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#0B3A6E]">Entregables</h2>
        <button
          type="button"
          onClick={modal.openCreate}
          className="rounded-lg bg-[#C8102E] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
        >
          Añadir entregable
        </button>
      </div>

      {createState.message ? (
        <div className={`rounded-lg border px-4 py-3 text-sm ${createState.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {createState.message}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2 font-semibold">ID entregable</th>
              <th className="px-3 py-2 font-semibold">Nombre entregable</th>
              <th className="px-3 py-2 font-semibold">Tarea relacionada</th>
              <th className="px-3 py-2 font-semibold">Estado</th>
              <th className="px-3 py-2 font-semibold">Fecha comprometida entrega</th>
              <th className="px-3 py-2 font-semibold">Responsable</th>
              <th className="px-3 py-2 font-semibold">Enlace SharePoint</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {deliverables.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-[#6E6E6E]" colSpan={7}>
                  No hay entregables registrados.
                </td>
              </tr>
            ) : (
              deliverables.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 font-mono text-xs">{row.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.taskTitle ?? "-"}</td>
                  <td className="px-3 py-2">{statusLabel(row.status)}</td>
                  <td className="px-3 py-2">{formatDate(row.committedDate)}</td>
                  <td className="px-3 py-2">{row.ownerName ?? "-"}</td>
                  <td className="px-3 py-2">
                    {row.sharepointLink ? (
                      <a href={row.sharepointLink} target="_blank" rel="noreferrer" className="text-[#0B3A6E] underline">
                        Abrir enlace
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EntityModal title="Añadir entregable" open={modal.open} onOpenChange={modal.setOpen}>
        <form action={createFormAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="projectId" value={projectId} />
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Nombre entregable</span>
            <input name="name" className="w-full rounded-lg border px-3 py-2 text-sm" required />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Tarea relacionada</span>
            <select name="taskId" className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Sin tarea</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Estado</span>
            <select name="status" defaultValue="NOT_STARTED" className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="NOT_STARTED">No iniciado</option>
              <option value="IN_PROGRESS">En curso</option>
              <option value="IN_REVIEW">En revisión</option>
              <option value="DELIVERED">Entregado</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Fecha comprometida entrega</span>
            <input name="committedDate" type="date" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Responsable</span>
            <input name="ownerName" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Enlace SharePoint</span>
            <input name="sharepointLink" type="url" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={modal.close} className="rounded-lg border px-4 py-2 text-sm">
              Cancelar
            </button>
            <button type="submit" className="rounded-lg bg-[#C8102E] px-4 py-2 text-sm font-medium text-white">
              Guardar entregable
            </button>
          </div>
        </form>
      </EntityModal>
    </div>
  );
}
