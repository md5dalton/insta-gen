/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { ProcessingProfile } from "@/types/types"
import { Layers, Sparkles, Check } from "lucide-react"
import { useHierarchy } from "@/context/HierarchyContext"

interface PolicySelectorProps {
    profiles: ProcessingProfile[]
    value?: string | null
    onChange: (profileId: string | null) => void
    allowInherit?: boolean
    inheritedProfileName?: string
    disabled?: boolean
}

export const PolicySelector = ({
    // profiles,
    // value,
    // onChange,
    // allowInherit = true,
    // inheritedProfileName = "System Default",
    disabled = false,
}) => {
    // const selectedProfile = profiles.find((p) => p.id === value)

    const {
        selectedEntity,
        profiles,
        selectedProfileId,
        actionLoading,
        handleSaveConfiguration,
        setSelectedProfileId
    } = useHierarchy()

    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Processing Profile
            </label>

            <div className="grid grid-cols-1 gap-2">
                {(selectedEntity?.type !== "ROOT_COLLECTION") && (
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedProfileId(null)}
                        className={`flex items-start justify-between p-3 rounded-lg border text-left transition-all ${
                            !selectedProfileId
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
                                    Effective: System default
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Automatically uses the processing profile assigned to the parent
                                hierarchy level.
                            </p>
                        </div>
                        {(!selectedProfileId) && (
                            <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        )}
                    </button>
                )}

                {profiles.map((profile) => {
                    const isSelected = selectedProfileId === profile.id
                    const renditionSet = new Set(profile.renditions)
                    return (
                        <button
                            key={profile.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => setSelectedProfileId(profile.id)}
                            className={`flex items-start justify-between p-3 rounded-lg border bg-slate-900 text-left transition-all ${
                                isSelected
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
                            {isSelected && (
                                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
