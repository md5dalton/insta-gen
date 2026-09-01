import { useStats } from "@/context/StatsContext";
import { WatcherStatus } from "@/types/types";
import { useState, useEffect } from "react"
import { Play, RefreshCw, Square } from "lucide-react"
import { api } from "@/lib/api"
import Toaster from "./Toaster"

export default () => {

    const { stats } = useStats()

    const initialWatcher = stats?.watcherStatus || {
        running: false,
        mode: 'INOTIFY',
        status: 'ACTIVE',
        watchedPathsCount: 0,
        eventsProcessed: 0,
        latencyMs: 0
    };

    const [watcher, setWatcher] = useState<WatcherStatus>(initialWatcher)
    const [loadingAction, setLoadingAction] = useState(false);
    const [scanningNow, setScanningNow] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
    
    useEffect(() => {
        if (stats?.watcherStatus) {
            setWatcher(stats.watcherStatus);
        }
    }, [stats?.watcherStatus]);

    const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    const handleToggleWatcher = async () => {
        setLoadingAction(true);
        try {
            const res = await api.toggleWatcher();
            if (res.success && res.watcherStatus) {
                setWatcher(res.watcherStatus);
                showToast(
                    res.watcherStatus.running
                        ? 'Filesystem watcher started (inotify active on all nodes)'
                        : 'Filesystem watcher paused',
                    res.watcherStatus.running ? 'success' : 'info'
                );
            }
        } catch (err: any) {
            console.error('Failed to toggle watcher', err);
            showToast(err?.message || 'Failed to update watcher state', 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleManualScan = async () => {
        setScanningNow(true);
        try {
            const res = await api.triggerWatcherScan();
            if (res?.success) {
                showToast('Manual scan triggered', 'success');
            } else {
                showToast('Failed to trigger manual scan', 'error');
            }
        } catch (err: any) {
            console.error('Failed to trigger manual scan', err);
            showToast(err?.message || 'Failed to trigger manual scan', 'error');
        } finally {
            setTimeout(() => setScanningNow(false), 800);
        }
    };

    const isRunning = watcher.running;

    return (
        <div
            id="filesystem-watcher-control"
            className="relative flex flex-wrap items-center gap-2.5 p-2 bg-slate-950/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm"
        >
            {/* Status Badge & Live Metrics Indicator */}
            <div
                className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 cursor-pointer transition-all group"
                title="Click to view detailed Filesystem Watcher kernel telemetry"
            >
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        {isRunning ? (
                        <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </>
                        ) : (
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        )}
                    </span>

                    <div className="text-left">
                        <div className="flex items-center gap-1.5 leading-tight">
                            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-300">
                                FS Watcher
                            </span>
                            <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                isRunning
                                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                                    : 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                                }`}
                            >
                                {isRunning ? 'ACTIVE' : 'STOPPED'}
                            </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <span>{watcher.mode === 'INOTIFY' ? 'inotify' : 'polling'}</span>
                            <span>•</span>
                            <span>{watcher.watchedPathsCount} nodes</span>
                        </div>
                    </div>
                </div>
            </div>


            {/* Quick Manual Scan Trigger Button */}
            <button
                type="button"
                id="watcher-scan-trigger-btn"
                onClick={handleManualScan}
                disabled={scanningNow}
                className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-60"
                title="Trigger an immediate manual discovery scan cycle"
            >
                <RefreshCw className={`w-3.5 h-3.5 ${scanningNow ? 'animate-spin text-indigo-400' : ''}`} />
                <span className="hidden sm:inline text-[11px]">Scan</span>
            </button>

            {/* Start / Stop Toggle Button */}
            <button
                type="button"
                id="watcher-toggle-btn"
                onClick={handleToggleWatcher}
                disabled={loadingAction}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 ${
                isRunning
                    ? 'bg-slate-900 hover:bg-rose-950/60 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-700/80 shadow-slate-950/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-emerald-900/30'
                } disabled:opacity-60`}
            >
                {loadingAction ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : isRunning ? (
                <>
                    <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400/40" />
                    <span>Stop Watcher</span>
                </>
                ) : (
                <>
                    <Play className="w-3.5 h-3.5 text-white fill-white" />
                    <span>Start Watcher</span>
                </>
                )}
            </button>
            <Toaster toast={toastMessage} onClose={() => setToastMessage(null)} />
        </div>
    )
}