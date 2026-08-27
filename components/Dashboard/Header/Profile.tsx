import { LogOut } from "lucide-react";

type Props = {
    logoutHandler: () => void,
    name: string
}

export default ({ name, logoutHandler }: Props) => (
    <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-300">
            <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center font-bold text-indigo-300 text-xs">
                {name.charAt(0)}
            </div>
            <div className="text-left">
                <span className="font-semibold block leading-tight text-slate-200">
                    {name}
                </span>
                <span className="text-[10px] text-indigo-400 font-mono block leading-tight">
                    Administrator
                </span>
            </div>
        </div>

        <button
            type="button"
            onClick={logoutHandler}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:text-rose-400 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Sign out of Admin Dashboard"
        >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
        </button>
    </div>
)