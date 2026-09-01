"use client"
import { useState, useEffect } from "react"
import { MediaItem, ProcessingProfile, ProfileUser } from "@/types/types"
import {
    Play,
    RotateCcw,
    Sparkles,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    ShieldAlert,
    Layers,
    CheckSquare,
    Square,
    Eye,
    Info,
} from "lucide-react"
import { api } from "@/lib/api"
import { StatusBadge } from "@/components/StatusBadge"
import { MediaPreview } from "@/components/MediaPreview"
import { MediaDetailModal } from "@/components/MediaDetailModal"

export default () => {
    const [activeTab, setActiveTab] = useState<
        "ALL" | "NEW" | "NEEDS_PROCESSING" | "PROCESSING" | "READY" | "FAILED"
    >("NEEDS_PROCESSING")
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [profiles, setProfiles] = useState<ProcessingProfile[]>([])
    const [users, setUsers] = useState<ProfileUser[]>([])
    const [inspectingMedia, setInspectingMedia] = useState<MediaItem | null>(null)
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
        null
    )

    const showFeedback = (message: string, type: "success" | "error" = "success") => {
        setFeedback({ message, type })
        setTimeout(() => setFeedback(null), 4000)
    }

    const loadData = async () => {
        setLoading(true)
        try {
            const [mediaRes, profRes, usersRes] = await Promise.all([
                api.getMediaList({
                    status: activeTab === "ALL" ? undefined : activeTab,
                    deletionStatus: "ACTIVE",
                    limit: 50,
                }),
                api.getProfiles(),
                api.getUsers(),
            ])
            setMediaItems(mediaRes.items)
            setProfiles(profRes)
            setUsers(usersRes)
        } catch (err: any) {
            showFeedback(err.message || "Failed to load processing media", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [activeTab])

    const toggleSelectAll = () => {
        if (selectedIds.length === mediaItems.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(mediaItems.map((m) => m.id))
        }
    }

    const toggleSelectItem = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((item) => item !== id))
        } else {
            setSelectedIds([...selectedIds, id])
        }
    }

    const handleProcessSingle = async (id: string) => {
        try {
            const res = await api.processMedia(id)
            showFeedback(`Processing triggered for ${res.media.name}`)
            loadData()
            if (inspectingMedia && inspectingMedia.id === id) {
                setInspectingMedia(res.media)
            }
        } catch (err: any) {
            showFeedback(err.message || "Processing failed", "error")
        }
    }

    const handleRetrySingle = async (id: string) => {
        try {
            const res = await api.retryMedia(id)
            showFeedback(`Retry succeeded for ${res.media.name}`)
            loadData()
            if (inspectingMedia && inspectingMedia.id === id) {
                setInspectingMedia(res.media)
            }
        } catch (err: any) {
            showFeedback(err.message || "Retry failed", "error")
        }
    }

    const handleBulkProcess = async () => {
        if (selectedIds.length === 0) return
        try {
            const res = await api.bulkMediaAction({
                action: "PROCESS",
                mediaIds: selectedIds,
            })
            showFeedback(
                `Processing completed for ${res.affectedCount} media items (${res.skippedCount} skipped).`
            )
            setSelectedIds([])
            loadData()
        } catch (err: any) {
            showFeedback(err.message || "Bulk processing failed", "error")
        }
    }

    const tabs = [
        {
            id: "NEEDS_PROCESSING" as const,
            label: "Needs Processing",
            icon: <AlertTriangle className="w-3.5 h-3.5" />,
        },
        { id: "NEW" as const, label: "New Ingested", icon: <Sparkles className="w-3.5 h-3.5" /> },
        {
            id: "FAILED" as const,
            label: "Failed Transcodes",
            icon: <ShieldAlert className="w-3.5 h-3.5" />,
        },
        {
            id: "PROCESSING" as const,
            label: "Active Jobs",
            icon: <Loader2 className="w-3.5 h-3.5" />,
        },
        { id: "READY" as const, label: "Ready", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
        { id: "ALL" as const, label: "All Items", icon: <Layers className="w-3.5 h-3.5" /> },
    ]

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Feedback Toast */}
            {feedback && (
                <div
                    className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xl ${
                        feedback.type === "success"
                            ? "bg-emerald-950 border border-emerald-800 text-emerald-200"
                            : "bg-rose-950 border border-rose-800 text-rose-200"
                    }`}
                >
                    <span>{feedback.message}</span>
                    <button
                        type="button"
                        onClick={() => setFeedback(null)}
                        className="text-white/60 hover:text-white ml-3"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Processing Engine
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Enforce rendition profiles, verify mandatory thumbnails, and resolve missing
                        assets.
                    </p>
                </div>

                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl shadow-lg">
                        <span className="text-xs text-slate-300">
                            <strong>{selectedIds.length}</strong> items selected
                        </span>
                        <button
                            type="button"
                            onClick={handleBulkProcess}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Start Processing Selected
                        </button>
                    </div>
                )}
            </div>

            {/* Policy Mandate Information Banner */}
            <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-indigo-200">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg shrink-0">
                    <Info className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-bold text-white">Deterministic Processing Model</h3>
                    <p className="text-indigo-300 leading-relaxed">
                        <strong>Thumbnails are mandatory for 100% of media items.</strong>{" "}
                        Additional renditions (Feed Image, HLS streams, Low-Quality fallbacks) are
                        derived from the effective processing profile ({" "}
                        <code className="font-mono text-[11px] text-white">
                            Media → User → Collection → Root Collection → Default
                        </code>
                        ). Media items lacking any required rendition automatically flag as{" "}
                        <em>Needs Processing</em>.
                    </p>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setActiveTab(tab.id)
                                setSelectedIds([])
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                isActive
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Processing List View */}
            <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleSelectAll}
                            className="flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                            {selectedIds.length === mediaItems.length && mediaItems.length > 0 ? (
                                <CheckSquare className="w-4 h-4 text-indigo-400" />
                            ) : (
                                <Square className="w-4 h-4 text-slate-500" />
                            )}
                            <span>Select All</span>
                        </button>
                        <span>•</span>
                        <span>{mediaItems.length} items in current view</span>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-16 text-center text-slate-400">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-xs">Evaluating effective processing policies...</p>
                    </div>
                ) : mediaItems.length === 0 ? (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-16 text-center text-slate-400 space-y-2">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                        <h3 className="text-sm font-semibold text-slate-200">
                            No media items in this state
                        </h3>
                        <p className="text-xs text-slate-500">
                            All items in the library meet their assigned processing profile
                            requirements.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {mediaItems.map((item) => {
                            const isSelected = selectedIds.includes(item.id)
                            const missingAssets = item.effectivePolicy?.missingAssets || []
                            const hasFailure = item.processingStatus === "FAILED"

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-slate-950 border rounded-2xl p-4 sm:p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg ${
                                        isSelected
                                            ? "border-indigo-500 ring-2 ring-indigo-500/40"
                                            : hasFailure
                                              ? "border-rose-900/60 bg-rose-950/10"
                                              : "border-slate-800 hover:border-slate-700"
                                    }`}
                                >
                                    {/* Left: Checkbox + Thumbnail + Meta */}
                                    <div className="flex items-start gap-3.5 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelectItem(item.id)}
                                            className="mt-2 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                        />

                                        <div
                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 cursor-pointer shadow-md"
                                            onClick={() => setInspectingMedia(item)}
                                        >
                                            <MediaPreview
                                                url={item.previewUrl || item.thumbnailUrl}
                                                type={item.type}
                                                name={item.name}
                                                duration={item.duration}
                                                aspectRatio="square"
                                            />
                                        </div>

                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    onClick={() => setInspectingMedia(item)}
                                                    className="font-mono text-xs font-bold text-slate-100 hover:text-indigo-400 cursor-pointer"
                                                >
                                                    {item.name}
                                                </span>
                                                <StatusBadge
                                                    type="processing"
                                                    value={item.processingStatus}
                                                    size="sm"
                                                />
                                            </div>

                                            <div className="text-[11px] text-slate-400">
                                                {item.rootCollectionName} → {item.collectionName} →
                                                @{item.userName}
                                            </div>

                                            {/* Effective Policy Banner */}
                                            <div className="flex items-center gap-2 text-[11px] pt-1">
                                                <span className="text-slate-400 font-medium">
                                                    Policy:
                                                </span>
                                                <span className="font-semibold text-indigo-300">
                                                    {item.effectivePolicy?.profile.name || "Direct"}
                                                </span>
                                                <span className="text-slate-500 text-[10px]">
                                                    ({item.effectivePolicy?.inheritedFrom.name})
                                                </span>
                                            </div>

                                            {/* Failure message */}
                                            {item.processingError && (
                                                <div className="mt-2 p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-[11px] text-rose-300 font-mono">
                                                    <strong>
                                                        Stage: {item.processingError.stage}
                                                    </strong>{" "}
                                                    — {item.processingError.message}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle: Rendition Checklist */}
                                    <div className="lg:w-72 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs space-y-2 shrink-0">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                            Required Renditions
                                        </span>

                                        <div className="space-y-1.5">
                                            {/* Thumbnail (Mandatory) */}
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-slate-300 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                    Thumbnail
                                                    <span className="text-[9px] text-emerald-400 bg-emerald-950 border border-emerald-800 px-1 rounded">
                                                        Mandatory
                                                    </span>
                                                </span>
                                                {item.assets.some(
                                                    (a) =>
                                                        a.type === "THUMBNAIL" &&
                                                        a.status === "READY"
                                                ) ? (
                                                    <span className="text-emerald-400 font-medium">
                                                        ✓ Ready
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-400 font-bold">
                                                        ✗ Missing
                                                    </span>
                                                )}
                                            </div>

                                            {/* Feed Image */}
                                            {item.effectivePolicy?.requiredAssets.includes(
                                                "FEED_IMAGE"
                                            ) && (
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-300 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                                        Feed Image
                                                    </span>
                                                    {item.assets.some(
                                                        (a) =>
                                                            a.type === "FEED_IMAGE" &&
                                                            a.status === "READY"
                                                    ) ? (
                                                        <span className="text-emerald-400 font-medium">
                                                            ✓ Ready
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-400 font-bold">
                                                            ✗ Missing
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* HLS */}
                                            {item.effectivePolicy?.requiredAssets.includes(
                                                "HLS"
                                            ) && (
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-300 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                                        HLS Stream
                                                    </span>
                                                    {item.assets.some(
                                                        (a) =>
                                                            a.type === "HLS" && a.status === "READY"
                                                    ) ? (
                                                        <span className="text-emerald-400 font-medium">
                                                            ✓ Ready
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-400 font-bold">
                                                            ✗ Missing
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Low Quality */}
                                            {item.effectivePolicy?.requiredAssets.includes(
                                                "LOW_QUALITY"
                                            ) && (
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-300 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                                        Low Quality (720p)
                                                    </span>
                                                    {item.assets.some(
                                                        (a) =>
                                                            a.type === "LOW_QUALITY" &&
                                                            a.status === "READY"
                                                    ) ? (
                                                        <span className="text-emerald-400 font-medium">
                                                            ✓ Ready
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-400 font-bold">
                                                            ✗ Missing
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                                        {hasFailure ? (
                                            <button
                                                type="button"
                                                onClick={() => handleRetrySingle(item.id)}
                                                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                Retry Job
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleProcessSingle(item.id)}
                                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                                            >
                                                <Play className="w-3.5 h-3.5 fill-current" />
                                                Start Processing
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => setInspectingMedia(item)}
                                            className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            Inspect Item
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Media Detail Drawer/Modal */}
            <MediaDetailModal
                media={inspectingMedia}
                isOpen={Boolean(inspectingMedia)}
                onClose={() => setInspectingMedia(null)}
                onProcess={handleProcessSingle}
                onRetry={handleRetrySingle}
                onDelete={async () => {}}
                onRestore={async () => {}}
                onUpdatePolicy={async (id, pid) => {
                    await api.updateMediaPolicy(id, pid)
                    loadData()
                }}
                onUpdateAccess={async (id, data) => {
                    await api.updateMediaAccess(id, data)
                    loadData()
                }}
                profiles={profiles}
                users={users}
            />
        </div>
    )
}
