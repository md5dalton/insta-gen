"use client"
import { api } from "@/lib/api"
import { ProcessingProfile } from "@/types/types"
import { Info, Layers, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import Toaster from "./Toaster"
import Modal from "./Modal"
import Profile from "./Profile"

export type Feedback = {
    type: "success" | "error"
    message: string
}

export default () => {
    const [profiles, setProfiles] = useState<ProcessingProfile[]>([])
    const [loading, setLoading] = useState(true)

    const [feedback, setFeedback] = useState<Feedback | null>(
        null
    )

    const showFeedback = (message: string, type: "success" | "error" = "success") => {
        setFeedback({ message, type })
        setTimeout(() => setFeedback(null), 4000)
    }

    // Profile modal
    const [profileModalOpen, setProfileModalOpen] = useState(false)
    const [editingProfile, setEditingProfile] = useState<ProcessingProfile | null>(null)
    const [profName, setProfName] = useState("")
    const [profDesc, setProfDesc] = useState("")
    const [feedImage, setFeedImage] = useState(true)
    const [hls, setHls] = useState(false)
    const [lowQuality, setLowQuality] = useState(false)
    const [profSaving, setProfSaving] = useState(false)

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


    const loadProfiles = async () => {
        setLoading(true)
        try {
            const profRes = await api.getProfiles()
            setProfiles(profRes)
        } catch (err: any) {
            showFeedback(err.message || "Failed to load profiles", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadProfiles()
    }, [])

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
            loadProfiles()
        } catch (err: any) {
            showFeedback(err.message || "Failed to save profile", "error")
        } finally {
            setProfSaving(false)
        }
    }

    return <>

        <Toaster
            feedback={feedback}
            onCloseHandler={() => setFeedback(null)}
        />
        <Modal
            isOpen={profileModalOpen}
            editingProfile={editingProfile}
            name={profName}
            description={profDesc}
            feedImage={feedImage}
            hls={hls}
            lowQuality={lowQuality}
            saving={profSaving}
            onClose={() => setProfileModalOpen(false)}
            onSubmit={handleSaveProfile}
            onNameChange={setProfName}
            onDescriptionChange={setProfDesc}
            onFeedImageChange={setFeedImage}
            onHlsChange={setHls}
            onLowQualityChange={setLowQuality}
        />

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
                    const isSystemDefault = p.id === "prof-default" || p.isSystem ? true : false

                    return (
                        <Profile
                            key={p.id}
                            profile={p}
                            isSystemDefault={isSystemDefault}
                            editHandler={() => openEditProfile(p)}
                        />
                    )
                })}
            </div>
        </div>
    </>
}