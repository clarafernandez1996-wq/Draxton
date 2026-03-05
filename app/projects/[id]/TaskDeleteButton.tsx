"use client";

type DeleteTaskAction = (formData: FormData) => void | Promise<void>;

export function TaskDeleteButton({
  action,
  projectId,
  taskId,
  taskOrder,
}: {
  action: DeleteTaskAction;
  projectId: string;
  taskId: string;
  taskOrder: "planned" | "recent";
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const ok = window.confirm("\u00bfSeguro que quieres eliminar esta tarea?");
        if (!ok) event.preventDefault();
      }}
      className="inline"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="taskOrder" value={taskOrder} />
      <button
        type="submit"
        className="rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition"
      >
        Eliminar
      </button>
    </form>
  );
}
