import { ChevronDown, ChevronRight, Folder } from "lucide-react"
import { Collection, RootCollection, useHierarchy } from "@/context/HierarchyContext"
import User from "./User"

export default ({ collection, parent }: { collection: Collection, parent: RootCollection }) => {
    
    const {
        selectedEntity,
        expandedNodes,

        selectEntity,
        toggleExpand
    } = useHierarchy()
        
    const isDeleted = collection.isEffectivelyDeleted || parent.isEffectivelyDeleted
    const isSelected = selectedEntity?.id === collection.id
    const isExpanded = expandedNodes[collection.id] ?? true
        
    return (
        <div className="space-y-1">
            {/* Collection Node */}
            <div
                onClick={() => selectEntity(collection) }
                className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isSelected
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/40"
                        : isDeleted
                            ? "bg-rose-950/20 text-rose-300 border border-rose-900/40"
                            : "hover:bg-slate-900 text-slate-300"
                }`}
            >
                <div className="flex items-center gap-2 truncate">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(collection.id)
                        }}
                        className="p-0.5 text-slate-400 hover:text-white"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                        )}
                    </button>
                    <Folder className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                    <span className="truncate">
                        {collection.name}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {isDeleted && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200">
                            Deleted
                        </span>
                    )}
                    <span className="text-[10px] font-mono opacity-70">
                        {collection.mediaCount || 0}
                    </span>
                </div>
            </div>

            {/* Users in Collection */}
            {isExpanded && (
                <div className="pl-6 space-y-1 border-l border-slate-800/60 ml-3">
                    {collection.users.map((user) => (
                        <User
                            key={user.id}
                            user={user}
                            parent={collection}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}