import {
    Radio,
    Server,
} from "lucide-react"
import Profiles from "@/components/settings/Profiles"

export default () =>(
    <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
            <p className="text-sm text-slate-400 mt-1">
                Configure media root filesystem mount and processing profile rules.
            </p>
        </div>
        
        <Profiles />

        {/* System Engine Health */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
                    <Server className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-white">System Engine Telemetry</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Real-time status of backend processing services
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Media Ingestion</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Radio className="w-3 h-3 animate-pulse" /> Active
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                        Watching filesystem for new uploads
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Transcoder Pool</span>
                        <span className="text-emerald-400 font-bold">Ready (4 Workers)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                        FFmpeg transcode and HLS packagers
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Policy Engine</span>
                        <span className="text-emerald-400 font-bold">Deterministic</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Dynamic inheritance resolution</p>
                </div>
            </div>
        </div>
    </div>
)
