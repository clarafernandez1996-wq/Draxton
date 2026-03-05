"use client";

import { TaskStatus } from "@prisma/client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { EntityModal } from "@/app/components/ui/EntityModal";
import { useEntityModal } from "@/app/hooks/useEntityModal";
import {
  createTaskAction,
  deleteTaskAction,
  quickUpdateTaskAction,
  TaskActionState,
  updateTaskAction,
} from "./task-actions";

type TaskRow = {
  id: string;
  title: string;
  ownerName: string | null;
  priority: string;
  status: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  progressActual: number;
  comments: string | null;
  createdAt: string;
};

type TaskPanelProps = {
  projectId: string;
  tasks: TaskRow[];
  canDelete: boolean;
};

const INITIAL_ACTION_STATE: TaskActionState = { ok: false, message: "" };

function normalizeStatus(status: string): TaskStatus {
  if (status === "IN_PROGRESS" || status === "DONE" || status === "BLOCKED" || status === "TODO") return status;
  return "NOT_STARTED";
}

function statusLabel(status: string): string {
  switch (normalizeStatus(status)) {
    case "IN_PROGRESS":
      return "En curso";
    case "DONE":
      return "Completada";
    case "BLOCKED":
      return "Bloqueada";
    case "TODO":
    case "NOT_STARTED":
    default:
      return "No iniciada";
  }
}

function statusBadge(status: string): string {
  const base = "rounded-full px-2 py-1 text-xs font-semibold";
  switch (normalizeStatus(status)) {
    case "IN_PROGRESS":
      return `${base} bg-blue-100 text-blue-700`;
    case "DONE":
      return `${base} bg-green-100 text-green-700`;
    case "BLOCKED":
      return `${base} bg-red-100 text-red-700`;
    default:
      return `${base} bg-gray-100 text-gray-700`;
  }
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function dayDiff(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return null;
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(0, 0, 0, 0);
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86400000);
}

function toDateInput(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function progressNumber(value: number | string | null | undefined): number {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return 0;
  if (num < 0) return 0;
  if (num > 100) return 100;
  return Math.round(num);
}

function scheduleAlertState(task: TaskRow, now: Date): "overdue" | "upcoming" | "none" {
  const due = task.plannedEnd ? new Date(task.plannedEnd) : null;
  if (!due || Number.isNaN(due.getTime())) return "none";
  due.setHours(0, 0, 0, 0);
  const isDone = normalizeStatus(task.status) === "DONE";
  if (isDone) return "none";
  if (due < now) return "overdue";
  const in14Days = new Date(now);
  in14Days.setDate(in14Days.getDate() + 14);
  return due <= in14Days ? "upcoming" : "none";
}

type ModalTaskState = {
  taskId: string;
  title: string;
  ownerName: string;
  priority: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string;
  actualEnd: string;
  progressActual: number;
  status: TaskStatus;
  comments: string;
};

const EMPTY_TASK: ModalTaskState = {
  taskId: "",
  title: "",
  ownerName: "",
  priority: "MEDIUM",
  plannedStart: "",
  plannedEnd: "",
  actualStart: "",
  actualEnd: "",
  progressActual: 0,
  status: "NOT_STARTED",
  comments: "",
};

export function TaskPanel({ projectId, tasks, canDelete }: TaskPanelProps) {
  const router = useRouter();
  const modal = useEntityModal<ModalTaskState>(EMPTY_TASK);
  const [inlineTaskId, setInlineTaskId] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const [createState, createFormAction] = useActionState(createTaskAction, INITIAL_ACTION_STATE);
  const [updateState, updateFormAction] = useActionState(updateTaskAction, INITIAL_ACTION_STATE);
  const [quickState, quickFormAction] = useActionState(quickUpdateTaskAction, INITIAL_ACTION_STATE);
  const [deleteState, deleteFormAction] = useActionState(deleteTaskAction, INITIAL_ACTION_STATE);

  const feedback = createState.message || updateState.message || quickState.message || deleteState.message;
  const hasSuccess = createState.ok || updateState.ok || quickState.ok || deleteState.ok;
  const hasError = Boolean(feedback) && !hasSuccess;

  useEffect(() => {
    if (!hasSuccess) return;
    modal.setOpen(false);
    setInlineTaskId(null);
    setDeleteTaskId(null);
    router.refresh();
  }, [hasSuccess, modal.setOpen, router]);

  const orderedTasks = useMemo(
    () => [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [tasks],
  );
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const overdueCount = useMemo(
    () => orderedTasks.filter((task) => scheduleAlertState(task, today) === "overdue").length,
    [orderedTasks, today],
  );
  const upcomingCount = useMemo(
    () => orderedTasks.filter((task) => scheduleAlertState(task, today) === "upcoming").length,
    [orderedTasks, today],
  );

  function openEditModal(task: TaskRow) {
    modal.openEdit({
      taskId: task.id,
      title: task.title,
      ownerName: task.ownerName ?? "",
      priority: task.priority,
      plannedStart: toDateInput(task.plannedStart),
      plannedEnd: toDateInput(task.plannedEnd),
      actualStart: toDateInput(task.actualStart),
      actualEnd: toDateInput(task.actualEnd),
      progressActual: progressNumber(task.progressActual),
      status: normalizeStatus(task.status),
      comments: task.comments ?? "",
    });
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#0B3A6E]">Plan y tareas</h2>
        <button
          type="button"
          onClick={modal.openCreate}
          className="rounded-lg bg-[#C8102E] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
        >
          A&ntilde;adir tarea
        </button>
      </div>

      {feedback ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${hasError ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}
        >
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-[#6E6E6E]">Total tareas</div>
          <div className="mt-1 text-xl font-bold text-[#0B3A6E]">{orderedTasks.length}</div>
        </div>
        <div className="rounded-lg border bg-red-50 p-3">
          <div className="text-xs uppercase tracking-wide text-red-700">Vencidas</div>
          <div className="mt-1 text-xl font-bold text-red-700">{overdueCount}</div>
        </div>
        <div className="rounded-lg border bg-amber-50 p-3">
          <div className="text-xs uppercase tracking-wide text-amber-700">{"Pr\u00f3ximas 2 semanas"}</div>
          <div className="mt-1 text-xl font-bold text-amber-700">{upcomingCount}</div>
        </div>
      </div>

      {orderedTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-[#6E6E6E]">No hay tareas asociadas a este proyecto.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Tarea</th>
                <th className="px-3 py-2 font-semibold">Responsable</th>
                <th className="px-3 py-2 font-semibold">Inicio planificado</th>
                <th className="px-3 py-2 font-semibold">Fin planificado</th>
                <th className="px-3 py-2 font-semibold">Inicio real</th>
                <th className="px-3 py-2 font-semibold">Fin real</th>
                <th className="px-3 py-2 font-semibold">% real</th>
                <th className="px-3 py-2 font-semibold">Desviaci&oacute;n (d&iacute;as)</th>
                <th className="px-3 py-2 font-semibold">Estado</th>
                <th className="px-3 py-2 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orderedTasks.map((task) => {
                const isInline = inlineTaskId === task.id;
                const deviation = dayDiff(task.plannedEnd, task.actualEnd);
                const alertState = scheduleAlertState(task, today);
                const rowClass =
                  alertState === "overdue"
                    ? "bg-red-50/40"
                    : alertState === "upcoming"
                      ? "bg-amber-50/40"
                      : "";
                return (
                  <tr key={task.id} className={rowClass}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-[#1A1A1A]">{task.title}</div>
                      {task.comments ? <div className="text-xs text-[#6E6E6E]">{task.comments}</div> : null}
                    </td>
                    {isInline ? (
                      <>
                        <td className="px-3 py-2" colSpan={8}>
                          <form action={quickFormAction} className="grid gap-2 md:grid-cols-4">
                            <input type="hidden" name="projectId" value={projectId} />
                            <input type="hidden" name="taskId" value={task.id} />
                            <input name="actualStart" type="date" defaultValue={toDateInput(task.actualStart)} className="rounded-lg border px-2 py-1.5 text-xs" />
                            <input name="actualEnd" type="date" defaultValue={toDateInput(task.actualEnd)} className="rounded-lg border px-2 py-1.5 text-xs" />
                            <input name="progressActual" type="number" min={0} max={100} defaultValue={progressNumber(task.progressActual)} className="rounded-lg border px-2 py-1.5 text-xs" />
                            <select name="status" defaultValue={normalizeStatus(task.status)} className="rounded-lg border px-2 py-1.5 text-xs">
                              <option value="NOT_STARTED">NO_INICIADA</option>
                              <option value="IN_PROGRESS">EN_CURSO</option>
                              <option value="BLOCKED">BLOQUEADA</option>
                              <option value="DONE">COMPLETADA</option>
                            </select>
                            <div className="md:col-span-5 flex justify-end gap-2">
                              <button type="button" onClick={() => setInlineTaskId(null)} className="rounded-lg border px-2.5 py-1.5 text-xs">
                                Cancelar
                              </button>
                              <button type="submit" className="rounded-lg bg-[#0B3A6E] px-2.5 py-1.5 text-xs text-white">
                                Guardar fila
                              </button>
                            </div>
                          </form>
                        </td>
                        <td className="px-3 py-2" />
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2">{task.ownerName || "-"}</td>
                        <td className="px-3 py-2">{formatDate(task.plannedStart)}</td>
                        <td className="px-3 py-2">{formatDate(task.plannedEnd)}</td>
                        <td className="px-3 py-2">{formatDate(task.actualStart)}</td>
                        <td className="px-3 py-2">{formatDate(task.actualEnd)}</td>
                        <td className="px-3 py-2">{progressNumber(task.progressActual)}%</td>
                        <td className="px-3 py-2">
                          {deviation === null ? "-" : deviation > 0 ? `+${deviation}` : String(deviation)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={statusBadge(task.status)}>{statusLabel(task.status)}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setInlineTaskId(task.id)} className="rounded-lg border px-2.5 py-1.5 text-xs text-[#0B3A6E]">
                              Editar fila
                            </button>
                            <button type="button" onClick={() => openEditModal(task)} className="rounded-lg border px-2.5 py-1.5 text-xs text-[#0B3A6E]">
                              Editar
                            </button>
                            {canDelete ? (
                              <button type="button" onClick={() => setDeleteTaskId(task.id)} className="rounded-lg border border-red-300 px-2.5 py-1.5 text-xs text-red-700">
                                Eliminar
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <EntityModal
        title={modal.mode === "create" ? "A\u00f1adir tarea" : "Editar tarea"}
        open={modal.open}
        onOpenChange={modal.setOpen}
      >
        <form action={modal.mode === "create" ? createFormAction : updateFormAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="projectId" value={projectId} />
          {modal.mode === "edit" ? <input type="hidden" name="taskId" value={modal.data.taskId} /> : null}

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">T&iacute;tulo</span>
            <input name="title" defaultValue={modal.data.title} className="w-full rounded-lg border px-3 py-2 text-sm" required />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Responsable</span>
            <input name="ownerName" defaultValue={modal.data.ownerName} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Prioridad</span>
            <select name="priority" defaultValue={modal.data.priority} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Cr&iacute;tica</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Inicio planificado</span>
            <input name="plannedStart" type="date" defaultValue={modal.data.plannedStart} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Fin planificado</span>
            <input name="plannedEnd" type="date" defaultValue={modal.data.plannedEnd} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Inicio real</span>
            <input name="actualStart" type="date" defaultValue={modal.data.actualStart} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Fin real</span>
            <input name="actualEnd" type="date" defaultValue={modal.data.actualEnd} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">% completado real</span>
            <input name="progressActual" type="number" min={0} max={100} defaultValue={modal.data.progressActual} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Estado</span>
            <select name="status" defaultValue={modal.data.status} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="NOT_STARTED">NO_INICIADA</option>
              <option value="IN_PROGRESS">EN_CURSO</option>
              <option value="BLOCKED">BLOQUEADA</option>
              <option value="DONE">COMPLETADA</option>
            </select>
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Comentarios</span>
            <input name="comments" defaultValue={modal.data.comments} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </label>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={modal.close} className="rounded-lg border px-4 py-2 text-sm">
              Cancelar
            </button>
            <button type="submit" className="rounded-lg bg-[#C8102E] px-4 py-2 text-sm font-medium text-white">
              {modal.mode === "create" ? "Guardar tarea" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </EntityModal>

      <ConfirmDialog
        open={Boolean(deleteTaskId)}
        title="Eliminar tarea"
        message="Esta acci\u00f3n no se puede deshacer."
        onCancel={() => setDeleteTaskId(null)}
        onConfirm={() => {
          if (!deleteTaskId) return;
          const formData = new FormData();
          formData.set("projectId", projectId);
          formData.set("taskId", deleteTaskId);
          deleteFormAction(formData);
        }}
        confirmLabel="Eliminar"
      />
    </div>
  );
}




