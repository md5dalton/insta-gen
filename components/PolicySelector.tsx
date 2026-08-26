/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { ProcessingProfile } from "@/types/types"
import { Layers, Sparkles, Check } from "lucide-react"

interface PolicySelectorProps {
    profiles: ProcessingProfile[]
    value?: string | null
    onChange: (profileId: string | null) => void
    allowInherit?: boolean
    inheritedProfileName?: string
    disabled?: boolean
}

export const PolicySelector: React.FC<PolicySelectorProps> = ({
    profiles,
    value,
    onChange,
    allowInherit = true,
    inheritedProfileName = "System Default",
    disabled = false,
}) => {
    const selectedProfile = profiles.find((p) => p.id === value)

    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Processing Profile
            </label>

            <div className="grid grid-cols-1 gap-2">
                {allowInherit && (
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(null)}
                        className={`flex items-start justify-between p-3 rounded-lg border text-left transition-all ${
                            value === null || value === undefined
                                ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                                : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">
                                    Inherit from parent
                                </span>
                                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                    Effective: {inheritedProfileName}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Automatically uses the processing profile assigned to the parent
                                hierarchy level.
                            </p>
                        </div>
                        {(value === null || value === undefined) && (
                            <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        )}
                    </button>
                )}

                {profiles.map((profile) => {
                    const isSelected = value === profile.id
                    return (
                        <button
                            key={profile.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(profile.id)}
                            className={`flex items-start justify-between p-3 rounded-lg border text-left transition-all ${
                                isSelected
                                    ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-900">
                                        {profile.name}
                                    </span>
                                    {profile.isSystem && (
                                        <span className="text-[10px] uppercase font-bold text-slate-400 border border-slate-200 px-1.5 py-0.2 rounded">
                                            System
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {profile.description}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        ✓ Thumbnail (Required)
                                    </span>
                                    {profile.requiredRenditions.feedImage && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                            Feed Image
                                        </span>
                                    )}
                                    {profile.requiredRenditions.hls && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                            HLS Video
                                        </span>
                                    )}
                                    {profile.requiredRenditions.lowQuality && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                            Low Quality (720p/480p)
                                        </span>
                                    )}
                                </div>
                            </div>
                            {isSelected && (
                                <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
