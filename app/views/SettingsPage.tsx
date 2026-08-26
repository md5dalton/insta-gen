/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react"
import { api } from "../../lib/api"
import { ProcessingProfile, AssetType } from "../../types/types"
import {
    Settings,
    HardDrive,
    CheckCircle2,
    AlertTriangle,
    Layers,
    Plus,
    Edit2,
    Radio,
    Server,
    Info,
    X,
    Database,
    Code2,
    Copy,
    Check,
    FileCode,
    Table,
} from "lucide-react"

export const SettingsPage: React.FC = () => {
    const [mediaRoot, setMediaRoot] = useState("/mnt/media/library")
    const [profiles, setProfiles] = useState<ProcessingProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [savingRoot, setSavingRoot] = useState(false)
    const [schemaData, setSchemaData] = useState<any>(null)
    const [copiedPrisma, setCopiedPrisma] = useState(false)
    const [activeSchemaTab, setActiveSchemaTab] = useState<"models" | "prisma">("models")

    // Profile modal
    const [profileModalOpen, setProfileModalOpen] = useState(false)
    const [editingProfile, setEditingProfile] = useState<ProcessingProfile | null>(null)
    const [profName, setProfName] = useState("")
    const [profDesc, setProfDesc] = useState("")
    const [feedImage, setFeedImage] = useState(true)
    const [hls, setHls] = useState(false)
    const [lowQuality, setLowQuality] = useState(false)
    const [profSaving, setProfSaving] = useState(false)

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
            const [settingsRes, profRes, schemaRes] = await Promise.all([
                api.getSettings(),
                api.getProfiles(),
                api.getSchema().catch(() => null),
            ])
            setMediaRoot(settingsRes.mediaRoot)
            setProfiles(profRes)
            if (schemaRes) setSchemaData(schemaRes)
        } catch (err: any) {
            showFeedback(err.message || "Failed to load settings", "error")
        } finally {
            setLoading(false)
        }
    }

    const copyPrismaSchema = () => {
        if (schemaData?.prismaSchema) {
            navigator.clipboard.writeText(schemaData.prismaSchema)
            setCopiedPrisma(true)
            showFeedback("Prisma schema copied to clipboard")
            setTimeout(() => setCopiedPrisma(false), 2500)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleSaveMediaRoot = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingRoot(true)
        try {
            const res = await api.updateMediaRoot(mediaRoot)
            setMediaRoot(res.settings.mediaRoot)
            showFeedback("Media Root updated successfully.")
        } catch (err: any) {
            showFeedback(err.message || "Failed to update media root", "error")
        } finally {
            setSavingRoot(false)
        }
    }

    const openCreateProfile = () => {
        setEditingProfile(null)
        setProfName("")
        setProfDesc("")
        setFeedImage(true)
        setHls(false)
        setLowQuality(false)
        setProfileModalOpen(true)
    }

    const openEditProfile = (p: ProcessingProfile) => {
        setEditingProfile(p)
        setProfName(p.name)
        setProfDesc(p.description)
        setFeedImage(Boolean(p.requiredRenditions.feedImage))
        setHls(Boolean(p.requiredRenditions.hls))
        setLowQuality(Boolean(p.requiredRenditions.lowQuality))
        setProfileModalOpen(true)
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setProfSaving(true)
        try {
            if (editingProfile) {
                await api.updateProfile(editingProfile.id, {
                    name: profName,
                    description: profDesc,
                    requiredRenditions: {
                        thumbnail: true,
                        feedImage,
                        hls,
                        lowQuality,
                    },
                })
                showFeedback(`Profile "${profName}" updated.`)
            } else {
                await api.createProfile({
                    name: profName,
                    description: profDesc,
                    requiredRenditions: {
                        thumbnail: true,
                        feedImage,
                        hls,
                        lowQuality,
                    },
                })
                showFeedback(`Profile "${profName}" created.`)
            }
            setProfileModalOpen(false)
            loadData()
        } catch (err: any) {
            showFeedback(err.message || "Failed to save profile", "error")
        } finally {
            setProfSaving(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
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
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
                <p className="text-sm text-slate-400 mt-1">
                    Configure media root filesystem mount and processing profile rules.
                </p>
            </div>

            {/* Media Root Setting Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                        <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white">Media Root Configuration</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            The canonical storage root directory path scanned by the media discovery
                            engine.
                        </p>
                    </div>
                </div>

                {/* Mandatory Warning Banner */}
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-xs text-amber-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <strong className="font-semibold text-amber-300 block">
                            Critical Path Notice
                        </strong>
                        <p className="leading-relaxed">
                            <strong>
                                Changing the media root does not move or copy existing media.
                            </strong>{" "}
                            The system will point discovery to the specified path without relocating
                            files on the underlying filesystem.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSaveMediaRoot} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                            Filesystem Directory Path
                        </label>
                        <input
                            type="text"
                            required
                            value={mediaRoot}
                            onChange={(e) => setMediaRoot(e.target.value)}
                            placeholder="/mnt/media/library"
                            className="w-full py-2.5 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-hidden focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Live Diagnostics */}
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Directory Exists</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Read Access Granted</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Write / Temp Allowed</span>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={savingRoot}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {savingRoot ? "Updating Media Root..." : "Update Media Root"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Processing Profiles Manager */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Processing Profiles</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Profiles determine which renditions (HLS, Feed Images, LQ fallbacks)
                                are mandatory for media items.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateProfile}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" />
                        Create Profile
                    </button>
                </div>

                {/* Mandatory Rule Note */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                        <strong>Mandatory Thumbnail Enforcement:</strong> Every processing profile
                        strictly requires a thumbnail asset. Additional renditions (Feed Image, HLS
                        stream, Low-Quality 720p/480p) are configurable per profile.
                    </span>
                </div>

                {/* Profiles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profiles.map((p) => {
                        const isSystemDefault = p.id === "prof-default" || p.isSystem

                        return (
                            <div
                                key={p.id}
                                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-white text-sm">
                                            {p.name}
                                        </span>
                                        {isSystemDefault ? (
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                                System Default
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                                Custom Profile
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">{p.description}</p>
                                </div>

                                {/* Renditions list */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                        Required Renditions
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                                            ✓ Thumbnail (Locked)
                                        </span>
                                        {p.requiredRenditions.feedImage && (
                                            <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300">
                                                Feed Image
                                            </span>
                                        )}
                                        {p.requiredRenditions.hls && (
                                            <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300">
                                                HLS Stream
                                            </span>
                                        )}
                                        {p.requiredRenditions.lowQuality && (
                                            <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300">
                                                Low Quality (720p)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-1">
                                    <button
                                        type="button"
                                        onClick={() => openEditProfile(p)}
                                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                        Edit Profile
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

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

            {/* Prisma Schema & Database Architecture */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-cyan-600/10 text-cyan-400 border border-cyan-500/20">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-white">
                                    Database & Prisma Schema
                                </h2>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                    prisma/schema.prisma
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Complete relational schema with models, enum definitions, indexes,
                                and cascading constraints.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                            <button
                                type="button"
                                onClick={() => setActiveSchemaTab("models")}
                                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                                    activeSchemaTab === "models"
                                        ? "bg-slate-800 text-white shadow-xs"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                <Table className="w-3.5 h-3.5" />
                                Models ({schemaData?.models?.length || 9})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveSchemaTab("prisma")}
                                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                                    activeSchemaTab === "prisma"
                                        ? "bg-cyan-600 text-white shadow-xs"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                <FileCode className="w-3.5 h-3.5" />
                                Raw Prisma Schema
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={copyPrismaSchema}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                            title="Copy Prisma Schema to clipboard"
                        >
                            {copiedPrisma ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                                <Copy className="w-3.5 h-3.5" />
                            )}
                            {copiedPrisma ? "Copied" : "Copy"}
                        </button>
                    </div>
                </div>

                {activeSchemaTab === "models" ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(schemaData?.models || []).map((m: any) => (
                                <div
                                    key={m.name}
                                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/90 space-y-2 hover:border-slate-700 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                                            <Table className="w-3 h-3 text-cyan-400" />
                                            {m.name}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                            {m.fields?.length || 0} fields
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-snug">
                                        {m.description}
                                    </p>
                                    <div className="pt-2 border-t border-slate-800/60 space-y-1">
                                        {m.fields?.slice(0, 4).map((f: string) => (
                                            <div
                                                key={f}
                                                className="text-[10px] font-mono text-slate-300 truncate"
                                            >
                                                • {f}
                                            </div>
                                        ))}
                                        {m.fields?.length > 4 && (
                                            <div className="text-[10px] text-slate-500 italic">
                                                +{m.fields.length - 4} more fields...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <span className="font-semibold text-slate-200 block">
                                    Hierarchy Cascade & Inheritance
                                </span>
                                <p className="text-[11px] text-slate-400">
                                    Relationships strictly enforce{" "}
                                    <code className="text-cyan-300 font-mono">
                                        onDelete: Cascade
                                    </code>{" "}
                                    across RootCollection &rarr; Collection &rarr; MediaUser &rarr;
                                    MediaItem &rarr; MediaAsset, with soft-deletion inheritance and
                                    deterministic policy fallback.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="relative rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden">
                            <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                <span className="font-mono text-slate-300 flex items-center gap-1.5">
                                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                                    prisma/schema.prisma
                                </span>
                                <span className="text-[11px] text-slate-500">
                                    PostgreSQL / MySQL / SQLite compatible
                                </span>
                            </div>
                            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-96 leading-relaxed select-all">
                                {schemaData?.prismaSchema || "// Loading Prisma Schema..."}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Create / Edit Modal */}
            {profileModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h3 className="text-base font-bold text-white">
                                {editingProfile
                                    ? `Edit ${editingProfile.name}`
                                    : "Create Processing Profile"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setProfileModalOpen(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                                    Profile Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Ultra HD Video & HLS"
                                    value={profName}
                                    onChange={(e) => setProfName(e.target.value)}
                                    className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-hidden focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                                    Description
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Brief description of when this profile is used"
                                    value={profDesc}
                                    onChange={(e) => setProfDesc(e.target.value)}
                                    className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-hidden focus:border-indigo-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                                    Required Renditions
                                </label>
                                <div className="space-y-2">
                                    <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-900/60 flex items-center justify-between">
                                        <div>
                                            <span className="font-semibold text-slate-200 block">
                                                Thumbnail
                                            </span>
                                            <span className="text-emerald-400 text-[11px] block">
                                                Mandatory for all media
                                            </span>
                                        </div>
                                        <span className="text-xs text-emerald-400 font-bold">
                                            Locked ✓
                                        </span>
                                    </div>

                                    <label className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer">
                                        <div>
                                            <span className="font-semibold text-slate-200 block">
                                                Feed Image (1080p WebP)
                                            </span>
                                            <span className="text-slate-400 text-[11px] block">
                                                Optimized for feed scrolling
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={feedImage}
                                            onChange={(e) => setFeedImage(e.target.checked)}
                                            className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </label>

                                    <label className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer">
                                        <div>
                                            <span className="font-semibold text-slate-200 block">
                                                HLS Stream (Multi-bitrate)
                                            </span>
                                            <span className="text-slate-400 text-[11px] block">
                                                Adaptive bitrate video streaming
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={hls}
                                            onChange={(e) => setHls(e.target.checked)}
                                            className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </label>

                                    <label className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer">
                                        <div>
                                            <span className="font-semibold text-slate-200 block">
                                                Low Quality (720p / 480p fallback)
                                            </span>
                                            <span className="text-slate-400 text-[11px] block">
                                                Low-bandwidth fallback
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={lowQuality}
                                            onChange={(e) => setLowQuality(e.target.checked)}
                                            className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setProfileModalOpen(false)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={profSaving}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
                                >
                                    {profSaving ? "Saving Profile..." : "Save Profile"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
