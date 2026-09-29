"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { destroyItemForever, restoreItem } from "@/app/actions/trash-actions";

/**
 * Restore / delete-forever controls for a trashed record.
 *
 * Restoring is the default action. Permanent deletion sits behind an explicit
 * second confirmation because it cannot be undone.
 */
export function TrashRestoreButton({
  model,
  id,
  canRestore,
}: {
  model: "scholarship" | "resource";
  id: string;
  canRestore: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  if (!canRestore) {
    return <span className="text-xs text-slate-400">Administrator only</span>;
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600" aria-hidden="true" />
        <span className="text-xs font-medium text-red-800">
          Delete permanently? This cannot be undone.
        </span>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-white"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await destroyItemForever(model, id, true);
              if (result.error) {
                toast.error(result.error);
                return;
              }
              toast.success("Deleted permanently");
              setConfirming(false);
              router.refresh();
            })
          }
          className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : null}
          Delete
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await restoreItem(model, id);
            if (result.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Restored");
            router.refresh();
          })
        }
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        Restore
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Delete permanently"
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
