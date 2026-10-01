"use client"
import { Collection, useHierarchy, User as UserType } from "@/context/HierarchyContext"
import { User } from "lucide-react"

export default ({ user, parent }: { user: UserType, parent: Collection }) => {
    
    const {
        selectedEntity,

        selectEntity,
    } = useHierarchy()
        
    const isDeleted = user.isEffectivelyDeleted || parent.isEffectivelyDeleted
    const isSelected = selectedEntity?.id === user.id
        
    return (
        <div
            key={user.id}
            onClick={() => selectEntity(user)}
            className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                isSelected
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/40"
                    : isDeleted
                        ? "bg-rose-950/20 text-rose-300 border border-rose-900/40"
                        : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
        >
            <div className="flex items-center gap-2 truncate">
                <User className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                <span className="truncate">
                    @{user.name}
                </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
                {isDeleted && (
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200">
                        Deleted
                    </span>
                )}
                <span className="text-[10px] font-mono opacity-70">
                    {user.mediaCount ||
                        0}{" "}
                    media
                </span>
            </div>
        </div>
    )
}