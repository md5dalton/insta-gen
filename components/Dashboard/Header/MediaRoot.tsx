import { CheckCircle2 } from "lucide-react";

export default ({ name }: { name: string }) => (
    <div className="hidden sm:flex items-center gap-3 text-xs bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full">
        <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400 font-mono text-[11px]">Media Root:</span>
            <span className="font-mono text-slate-200 font-medium truncate max-w-50">
                {name}
            </span>
        </span>
        <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
        </span>
    </div>
)