"use client";

import { useState } from "react";

type ModalMode = "create" | "edit";

export function useEntityModal<T>(emptyData: T) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [data, setData] = useState<T>(emptyData);

  function openCreate() {
    setMode("create");
    setData(emptyData);
    setOpen(true);
  }

  function openEdit(nextData: T) {
    setMode("edit");
    setData(nextData);
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  return {
    open,
    mode,
    data,
    setData,
    setOpen,
    openCreate,
    openEdit,
    close,
  };
}
