"use client"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useHierarchy } from "@/context/HierarchyContext"
import { AlertCircle, RotateCcw, Trash2 } from "lucide-react"
import { useState } from "react"

export default () => {
    const {
        selectedEntity,
        actionLoading,

        handleRestore,
        handleSoftDelete
    } = useHierarchy()

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

    const title =
        selectedEntity?.type === "ROOT_COLLECTION" ? "Root Collection":
        selectedEntity?.type === "COLLECTION" ? "Collection" :
        "Media User / Owner"

    const isDeleted = selectedEntity?.isEffectivelyDeleted

    return (
        <>
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                        {title}
                    </span>
                    <h2 className="text-xl font-bold text-white mt-0.5">
                        {selectedEntity?.name}
                    </h2>
                    <p className="text-xs font-mono text-slate-400 mt-1">
                        Path:{" "}
                        {selectedEntity?.path}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {isDeleted ? (
                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={handleRestore}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore Entity
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => setConfirmDeleteOpen(true)}
                            className="px-3.5 py-1.5 bg-rose-950 border border-rose-800 hover:bg-rose-900 text-rose-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Mark Soft-Deleted
                        </button>
                    )}
                </div>
            </div>

            {/* Soft deletion information banner */}
            {isDeleted && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-200">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        Entity is Soft-Deleted
                    </div>
                    <p className="leading-relaxed">
                        All descendant media under this entity are effectively
                        marked as deleted in the library, while preserving database
                        integrity. Files remain in the filesystem until external
                        cleanup.
                    </p>
                </div>
            )}


            <ConfirmDialog
                isOpen={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={handleSoftDelete}
                title={`Mark ${selectedEntity?.name} as Soft-Deleted`}
                variant="danger"
                confirmText="Mark Soft-Deleted"
                description={
                    <span>
                        Marking this {selectedEntity?.type} as soft-deleted will cause all
                        descendant media items to become
                        <strong> effectively deleted</strong>. No media files are removed from the
                        filesystem by this action.
                    </span>
                }
            />
        </>
    )
}