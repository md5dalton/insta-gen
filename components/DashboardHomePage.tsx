/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { LibraryStats } from "@/types/types"
import {
    HardDrive,
    CheckCircle2,
    AlertTriangle,
    Cpu,
    Layers,
    Sparkles,
    ShieldAlert,
    Trash2,
    ArrowRight,
    FolderTree,
    Film,
    Clock,
    ExternalLink,
    ChevronRight,
} from "lucide-react"

interface DashboardHomePageProps {
    stats: LibraryStats | null
    onNavigate: (
        tab: "dashboard" | "media" | "processing" | "collections" | "access" | "settings"
    ) => void
    onSelectProcessingTab?: (tab: string) => void
}

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ stats, onNavigate }) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Page Title & Intro */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Media library overview and items requiring administrative attention.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => onNavigate("processing")}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                    >
                        <Cpu className="w-4 h-4" />
                        Review Processing
                    </button>
                </div>
            </div>

            {/* Media Root & Connectivity Banner */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="p-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
                            <HardDrive className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Media Root Filesystem
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-base font-mono font-bold text-white">
                                    {stats?.mediaRoot || "/mnt/media/library"}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Connected & Accessible
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Source of truth for media discovery and ingestion.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
                        <div className="text-xs space-y-1">
                            <div className="flex items-center gap-2 text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Directory exists</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Readable & Writable</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => onNavigate("settings")}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors ml-auto md:ml-0"
                        >
                            Change Path
                        </button>
                    </div>
                </div>
            </div>

            {/* Library High-Level Numbers */}
            <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Library Scope
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div
                        onClick={() => onNavigate("media")}
                        className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all cursor-pointer group shadow-lg"
                    >
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-medium uppercase tracking-wider">
                                Total Media
                            </span>
                            <Film className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white">
                            {stats?.totalMedia?.toLocaleString() || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Active files discovered across collections
                        </p>
                    </div>

                    <div
                        onClick={() => onNavigate("media")}
                        className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all cursor-pointer group shadow-lg"
                    >
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-medium uppercase tracking-wider">
                                Images
                            </span>
                            <span className="text-xs font-mono text-emerald-400 font-medium">
                                JPEG / PNG / WebP
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white">
                            {stats?.imageCount?.toLocaleString() || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Photos, posts, and artwork</p>
                    </div>

                    <div
                        onClick={() => onNavigate("media")}
                        className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all cursor-pointer group shadow-lg"
                    >
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-medium uppercase tracking-wider">
                                Videos
                            </span>
                            <span className="text-xs font-mono text-sky-400 font-medium">
                                MP4 / MOV / HLS
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-white">
                            {stats?.videoCount?.toLocaleString() || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Reels, clips, and stream ingest
                        </p>
                    </div>
                </div>
            </div>

            {/* Needs Attention Section (Primary Purpose of Home Dashboard) */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        What Needs My Attention?
                    </h2>
                    <span className="text-xs text-indigo-400 font-medium">
                        Operational Action Items
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* New Media Card */}
                    <div
                        onClick={() => onNavigate("processing")}
                        className="bg-slate-950 border border-slate-800 hover:border-purple-500/50 p-5 rounded-2xl transition-all cursor-pointer group relative overflow-hidden shadow-lg"
                    >
                        <div className="flex items-center justify-between text-purple-400 mb-2">
                            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-800/80">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-semibold text-purple-300">
                                Ingested
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-white mt-2">
                            {stats?.newMediaCount || 0}
                        </div>
                        <div className="text-xs font-semibold text-purple-200 mt-1">New Media</div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            Discovered from filesystem. Awaiting initial thumbnail generation.
                        </p>
                    </div>

                    {/* Need Processing Card */}
                    <div
                        onClick={() => onNavigate("processing")}
                        className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl transition-all cursor-pointer group relative overflow-hidden shadow-lg"
                    >
                        <div className="flex items-center justify-between text-amber-400 mb-2">
                            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/80">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-semibold text-amber-300">
                                Pending
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-white mt-2">
                            {stats?.needsProcessingCount || 0}
                        </div>
                        <div className="text-xs font-semibold text-amber-200 mt-1">
                            Need Processing
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            Missing required renditions defined by active processing policies.
                        </p>
                    </div>

                    {/* Processing Failures Card */}
                    <div
                        onClick={() => onNavigate("processing")}
                        className="bg-slate-950 border border-slate-800 hover:border-rose-500/50 p-5 rounded-2xl transition-all cursor-pointer group relative overflow-hidden shadow-lg"
                    >
                        <div className="flex items-center justify-between text-rose-400 mb-2">
                            <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/80">
                                <ShieldAlert className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-semibold text-rose-300">Errors</span>
                        </div>
                        <div className="text-2xl font-bold text-white mt-2">
                            {stats?.processingFailuresCount || 0}
                        </div>
                        <div className="text-xs font-semibold text-rose-200 mt-1">
                            Processing Failures
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            Transcodes or conversions that exited with errors. Ready for retry.
                        </p>
                    </div>

                    {/* Marked Deleted Card */}
                    <div
                        onClick={() => onNavigate("media")}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all cursor-pointer group relative overflow-hidden shadow-lg"
                    >
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                                <Trash2 className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400">
                                Soft-Deleted
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-white mt-2">
                            {stats?.markedDeletedCount || 0}
                        </div>
                        <div className="text-xs font-semibold text-slate-300 mt-1">
                            Marked Deleted
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            Soft-deleted records waiting for eventual filesystem cleanup.
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Action Hub & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Navigation Quicklinks */}
                <div className="lg:col-span-5 space-y-3">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Administrative Modules
                    </h2>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => onNavigate("processing")}
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-900 transition-colors text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Cpu className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-white block">
                                        Processing Engine
                                    </span>
                                    <span className="text-[11px] text-slate-400 block">
                                        Manage renditions, HLS, and feed profiles
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigate("collections")}
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-900 transition-colors text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <FolderTree className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-white block">
                                        Collections Hierarchy
                                    </span>
                                    <span className="text-[11px] text-slate-400 block">
                                        RootCollection → Collection → User policies
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigate("access")}
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-900 transition-colors text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-950 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-white block">
                                        Access & Users
                                    </span>
                                    <span className="text-[11px] text-slate-400 block">
                                        Manage VIEW, DOWNLOAD, and restrictions
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </button>
                    </div>
                </div>

                {/* Recent System Activity Feed */}
                <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Recent System Activity
                        </h2>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Real-time log
                        </span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 max-h-[300px] overflow-y-auto">
                        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((act) => {
                                const badgeColor =
                                    {
                                        DISCOVERY:
                                            "bg-purple-950 text-purple-400 border-purple-800",
                                        PROCESSED:
                                            "bg-emerald-950 text-emerald-400 border-emerald-800",
                                        FAILED: "bg-rose-950 text-rose-400 border-rose-800",
                                        POLICY_CHANGE:
                                            "bg-indigo-950 text-indigo-400 border-indigo-800",
                                        DELETED: "bg-slate-900 text-slate-400 border-slate-700",
                                        SETTINGS_UPDATE:
                                            "bg-cyan-950 text-cyan-400 border-cyan-800",
                                    }[act.type] || "bg-slate-900 text-slate-400 border-slate-800"

                                return (
                                    <div
                                        key={act.id}
                                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${badgeColor}`}
                                                >
                                                    {act.type.replace("_", " ")}
                                                </span>
                                                <span className="font-semibold text-slate-200">
                                                    {act.title}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                                {act.description}
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap shrink-0">
                                            {new Date(act.timestamp).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-center py-6 text-xs text-slate-500">
                                No recent activity logged
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
