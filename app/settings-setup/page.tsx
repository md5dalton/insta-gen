"use client"

import { useMemo, useState } from "react"
import {
    AlertTriangle,
    ArrowRight,
    Check,
    CheckCircle2,
    Folder,
    FolderTree,
    HardDrive,
    RefreshCw,
    Server,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { PathValidationResult } from "@/types/types"

const PRESET_PATHS = [
    {
        path: "/mnt/media/library",
        label: "Standard Media Storage",
        description: "High-speed local NVMe mount for high throughput processing",
    },
    {
        path: "/var/data/media_vault",
        label: "Direct Host Volume",
        description: "Internal Linux filesystem partition",
    },
    {
        path: "/mnt/nfs/shared_library",
        label: "Network Attached Storage (NFS)",
        description: "Distributed cluster storage for multi-worker transcoding",
    },
    {
        path: "/mnt/s3_storage/bucket_assets",
        label: "Cloud Object Store (FUSE)",
        description: "Mounted cloud bucket for scalable asset archive",
    },
]

export default function MediaRootSetupPage() {
    const router = useRouter()
    const [pathInput, setPathInput] = useState("")
    const [validating, setValidating] = useState(false)
    const [validationResult, setValidationResult] = useState<PathValidationResult | null>(null)
    const [validationError, setValidationError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const handleValidate = async (targetPath = pathInput) => {
        setValidating(true)
        setValidationError(null)

        try {
            const res = await api.validateMediaRoot(targetPath)
            setValidationResult(res)

            if (!res || !res.valid) {
                setValidationError(res?.message || "Path validation failed")
                return
            }

            setValidationError(null)
        } catch (err: any) {
            setValidationError(err?.message || "Validation request failed")
            setValidationResult(null)
        } finally {
            setValidating(false)
        }
    }

    const submitMediaRoot = async (targetPath: string) => {
        const trimmed = targetPath.trim()
        if (!trimmed) {
            setSubmitError("MediaRoot storage path is required")
            return
        }

        if (!trimmed.startsWith("/")) {
            setSubmitError("Media root must be an absolute path.")
            return
        }

        setSubmitting(true)
        setSubmitError(null)

        try {
            await api.updateMediaRoot(trimmed)
            router.replace("/dashboard")
        } catch (err: any) {
            setSubmitError(err.message || "Failed to save media root configuration")
            setSubmitting(false)
        }
    }

    const handlePresetSelect = (presetPath: string) => {
        setPathInput(presetPath)
        handleValidate(presetPath)
    }

    const formatBytes = (bytes: number) => {
        if (!bytes) return "0 B"
        const sizes = ["B", "KB", "MB", "GB", "TB", "PB"]
        const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1)
        const value = bytes / 1024 ** unitIndex
        return `${value.toFixed(2)} ${sizes[unitIndex]}`
    }

    const currentValidationSummary = useMemo(() => {
        if (!validationResult) return null
        if (!validationResult.valid) return null
        return validationResult
    }, [validationResult])

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-cyan-500 selection:text-white">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-900/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-sky-900/15 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-4xl space-y-8">
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide uppercase">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        Step 2 of 2: Storage Infrastructure Setup
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
                        <HardDrive className="w-9 h-9 text-cyan-400" />
                        Configure Media Storage Root
                    </h1>

                    <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                        Specify the primary filesystem mount point where the system will recursively scan, index, and transcode assets across your storage hierarchy.
                    </p>
                </div>

                {submitError && (
                    <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-sm flex items-start gap-3 shadow-lg">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-red-200">Configuration Failed</p>
                            <p>{submitError}</p>
                        </div>
                    </div>
                )}

                <form
                    onSubmit={(event) => {
                        event.preventDefault()
                        void submitMediaRoot(pathInput)
                    }}
                    className="space-y-6"
                >
                    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="media-root-path-input" className="block text-sm font-semibold text-slate-200">
                                MediaRoot Base Directory Path
                            </label>
                            <p className="text-xs text-slate-400">
                                Absolute path on the host or network volume. Must have read and write permissions.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Folder className="h-5 w-5 text-cyan-400" />
                                    </div>
                                    <input
                                        id="media-root-path-input"
                                        type="text"
                                        value={pathInput}
                                        onChange={(event) => setPathInput(event.target.value)}
                                        placeholder="/mnt/media/library"
                                        required
                                        className="block w-full pl-11 pr-4 py-3 bg-slate-950/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-inner"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleValidate()}
                                    disabled={validating || pathInput.trim().length < 5}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-slate-700 font-medium text-sm transition-all disabled:opacity-50 disabled:pointer-events-none shrink-0"
                                >
                                    <RefreshCw className={`w-4 h-4 ${validating ? "animate-spin" : ""}`} />
                                    {validating ? "Testing Mount..." : "Validate Path"}
                                </button>
                            </div>
                        </div>

                        {validationError && (
                            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-amber-200">Validation Issue</p>
                                    <p>{validationError}</p>
                                </div>
                            </div>
                        )}

                        {currentValidationSummary && (
                            <div className="p-5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-slate-200 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                                        <span className="font-semibold text-white text-sm">Storage Mount Verified & Ready</span>
                                    </div>
                                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-500/20">
                                        {currentValidationSummary.latencyMs}ms I/O
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                                        <div className="text-slate-400">Storage Type</div>
                                        <div className="font-semibold text-slate-200 mt-1 truncate">
                                            {currentValidationSummary.storageType}
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                                        <div className="text-slate-400">Available Space</div>
                                        <div className="font-semibold text-emerald-400 mt-1">
                                            {formatBytes(currentValidationSummary.freeSpaceBytes)} / {formatBytes(currentValidationSummary.totalSpaceBytes)}
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                                        <div className="text-slate-400">Read / Write Access</div>
                                        <div className="font-semibold text-cyan-400 mt-1">
                                            {currentValidationSummary.readable && currentValidationSummary.writable
                                                ? "Full RW Granted"
                                                : "Restricted"}
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                                        <div className="text-slate-400">Detected Vaults</div>
                                        <div className="font-semibold text-indigo-300 mt-1">
                                            {currentValidationSummary.detectedRoots?.length || 3} Root Collections
                                        </div>
                                    </div>
                                </div>

                                {currentValidationSummary.detectedRoots && currentValidationSummary.detectedRoots.length > 0 && (
                                    <div className="pt-1 text-xs text-slate-400 flex items-center gap-2">
                                        <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Discovered directory vaults:</span>
                                        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                                            {currentValidationSummary.detectedRoots.map((root, index) => (
                                                <span
                                                    key={`${root}-${index}`}
                                                    className="bg-slate-800/80 px-2 py-0.5 rounded text-cyan-300 border border-slate-700/60"
                                                >
                                                    /{root}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3 pt-2">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Common Mount Point Presets
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {PRESET_PATHS.map((preset) => {
                                    const isSelected = pathInput === preset.path
                                    return (
                                        <button
                                            key={preset.path}
                                            type="button"
                                            onClick={() => handlePresetSelect(preset.path)}
                                            className={`p-3.5 rounded-xl text-left border transition-all flex items-start justify-between gap-3 ${
                                                isSelected
                                                    ? "bg-cyan-950/40 border-cyan-500/50 text-white shadow-sm ring-1 ring-cyan-500/30"
                                                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 text-slate-300"
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <div className="text-xs font-semibold flex items-center gap-2">
                                                    <Server
                                                        className={`w-3.5 h-3.5 ${
                                                            isSelected ? "text-cyan-400" : "text-slate-500"
                                                        }`}
                                                    />
                                                    <span className="text-slate-200">{preset.label}</span>
                                                </div>
                                                <div className="font-mono text-xs text-cyan-400/90">{preset.path}</div>
                                                <div className="text-[11px] text-slate-400">{preset.description}</div>
                                            </div>
                                            {isSelected && (
                                                <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Check className="w-3 h-3 stroke-3" />
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-linear-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-950/50 hover:shadow-cyan-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                                    <span>Initializing MediaRoot & Launching...</span>
                                </>
                            ) : (
                                <>
                                    <span>Save Configuration & Launch Dashboard</span>
                                    <ArrowRight className="w-4 h-4 stroke-2.5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
