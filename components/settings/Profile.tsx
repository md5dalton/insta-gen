import { ProcessingProfile } from "@/types/types"
import { Edit2 } from "lucide-react"

type Props = {
    profile: ProcessingProfile
    isSystemDefault: boolean
    editHandler: () => void
}

export default ({ isSystemDefault, profile, editHandler }: Props) => {

    return (
        <div
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3"
        >
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                        {profile.name}
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
                <p className="text-xs text-slate-400">{profile.description}</p>
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
                    {profile.requiredRenditions.feedImage && (
                        <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300">
                            Feed Image
                        </span>
                    )}
                    {profile.requiredRenditions.hls && (
                        <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300">
                            HLS Stream
                        </span>
                    )}
                    {profile.requiredRenditions.lowQuality && (
                        <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300">
                            Low Quality (720p)
                        </span>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-1">
                <button
                    type="button"
                    onClick={editHandler}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1"
                >
                    <Edit2 className="w-3 h-3" />
                    Edit Profile
                </button>
            </div>
        </div>
    )
}