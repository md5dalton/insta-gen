import { Collection, MediaUser, RootCollection } from "@/types/types"
import { ChevronDown, ChevronRight, Folder, User } from "lucide-react"
import { sep } from "node:path"
import Users from "./Users"

type Props = {
    collection: Collection
    isSelected: boolean
    isDeleted: boolean
    isExpanded: boolean
    selectHandler: (collection: Collection) => void
    toggleExpandHandler: (targetId: string) => void
    selectedEntity: { id: string; type: "root" | "collection" | "user" } | null
    selectUser: (user: MediaUser, collection: Collection, root: RootCollection) => void
    root: RootCollection
}
export default ({ collection, isDeleted, isSelected, isExpanded, selectHandler, toggleExpandHandler, selectedEntity, selectUser, root }: Props) => (
    <div className="space-y-1">
        {/* Collection Node */}
        <div
            onClick={() => selectHandler(collection) }
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
                        toggleExpandHandler(collection.id)
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
                    {collection.path.split(sep).pop()}
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
            <Users
                selectedEntity={selectedEntity}
                selectHandler={(user) => selectUser(user, collection, root)}
                parentDeleted={isDeleted}
                users={collection.users || []}
            />
        )}
    </div>
)