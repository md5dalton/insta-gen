import { ProcessingProfile } from "@/types/types"
import { Check } from "lucide-react"

interface Props {
    profile: ProcessingProfile
    onChangeHandler: () => void
    isChecked: boolean
    disabled?: boolean
}

export default ({
    profile,
    isChecked,
    onChangeHandler,
    disabled = false,
}: Props) => {
    const renditionSet = new Set(profile.renditions)

    return (
        <button
            key={profile.id}
            type="button"
            disabled={disabled}
            onClick={onChangeHandler}
            className={`flex items-start justify-between p-3 rounded-lg border bg-slate-900 text-left transition-all ${
                isChecked
                    ? "border-emerald-600"
                    : "border-slate-800"
            }`}
        >
            <div>
                <div className="text-sm font-semibold text-slate-400">
                    {profile.name}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                    {profile.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] font-medium px-1.5 py-1 rounded bg-slate-800 text-slate-400">
                        ✓ Thumbnail (Required)
                    </span>
                    {renditionSet.has("FEED_IMAGE") && (
                    <span className="text-[10px] font-medium px-1.5 py-1 rounded bg-slate-800 text-slate-400">
                            Feed Image
                        </span>
                    )}
                    {renditionSet.has("HLS") && (
                    <span className="text-[10px] font-medium px-1.5 py-1 rounded bg-slate-800 text-slate-400">
                            HLS Video
                        </span>
                    )}
                </div>
            </div>
            {isChecked && (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
        </button>
    )
}
