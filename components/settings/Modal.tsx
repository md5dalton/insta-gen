import { ProcessingProfile } from "@/types/types"
import { X } from "lucide-react"

type ModalProps = {
    isOpen: boolean
    editingProfile: ProcessingProfile | null
    name: string
    description: string
    feedImage: boolean
    hls: boolean
    lowQuality: boolean
    saving: boolean
    onClose: () => void
    onSubmit: (e: React.FormEvent) => void
    onNameChange: (value: string) => void
    onDescriptionChange: (value: string) => void
    onFeedImageChange: (value: boolean) => void
    onHlsChange: (value: boolean) => void
    onLowQualityChange: (value: boolean) => void
}

export default ({
    isOpen,
    editingProfile,
    name,
    description,
    feedImage,
    hls,
    lowQuality,
    saving,
    onClose,
    onSubmit,
    onNameChange,
    onDescriptionChange,
    onFeedImageChange,
    onHlsChange,
    onLowQualityChange,
}: ModalProps) => {
    return isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-base font-bold text-white">
                        {editingProfile ? `Edit ${editingProfile.name}` : "Create Processing Profile"}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4 text-xs">
                    <div>
                        <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                            Profile Name
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Ultra HD Video & HLS"
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
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
                            value={description}
                            onChange={(e) => onDescriptionChange(e.target.value)}
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
                                    onChange={(e) => onFeedImageChange(e.target.checked)}
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
                                    onChange={(e) => onHlsChange(e.target.checked)}
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
                                    onChange={(e) => onLowQualityChange(e.target.checked)}
                                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
                        >
                            {saving ? "Saving Profile..." : "Save Profile"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}