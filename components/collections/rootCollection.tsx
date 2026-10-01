"use client"
import { ChevronDown, ChevronRight, FolderTree } from "lucide-react"
import { sep } from "node:path"
import Collection from "./collection"
import { RootCollection, useHierarchy } from "@/context/HierarchyContext"

export default ({ root }: { root: RootCollection }) => {
    
    const {
        selectedEntity,
        expandedNodes,

        selectEntity,
        toggleExpand
    } = useHierarchy()
        
    const isDeleted = root.isEffectivelyDeleted
    const isSelected = selectedEntity?.id === root.id
    const isExpanded = expandedNodes[root.id] ?? true
        
        
    return (
        <div className="space-y-1">
            <div
                onClick={() => selectEntity(root)}
                className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isSelected
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/40"
                        : isDeleted
                            ? "bg-rose-950/20 text-rose-300 border border-rose-900/40"
                            : "hover:bg-slate-900 text-slate-200"
                }`}
            >
                <div className="flex items-center gap-2 truncate">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(root.id)
                        }}
                        className="p-1 text-slate-400 hover:text-white"
                    >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    <FolderTree className="w-4 h-4 shrink-0 text-amber-400" />
                    <span className="truncate">{root.path.split(sep).pop()}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {isDeleted && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200 border border-rose-700">
                            Deleted
                        </span>
                    )}
                    <span className="text-[10px] font-mono opacity-70">{root.mediaCount || 0} media</span>
                </div>
            </div>

            {isExpanded && (
                <div className="pl-6 space-y-1 border-l border-slate-800/80 ml-4">
                    {root.collections?.map((col) => (
                        <Collection
                            key={col.id}
                            collection={col}
                            parent={root}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
