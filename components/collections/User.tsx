import { MediaUser } from "@/types/types"
import { User } from "lucide-react"
import { sep } from "node:path"

type Props = {
    user: MediaUser
    isSelected: boolean
    isDeleted: boolean
    selectHandler: () => void
}
export default ({ user, isDeleted, isSelected, selectHandler }: Props) => {
    
    return (
        <div
            key={user.id}
            onClick={selectHandler}
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
                    @{user.path.split(sep).pop()}
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