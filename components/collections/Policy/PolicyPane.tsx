"use client"
import { useHierarchy } from "@/context/HierarchyContext"
import EntityHeader from "./EntityHeader"
import PolicyEditor from "./PolicyEditor"
import { CheckCircle2 } from "lucide-react"
import { PolicySelector } from "@/components/PolicySelector"
import ProcessingProfiles from "./PolicyEditor/ProcessingProfiles"

export default () => {

    const {
        selectedEntity,
        profiles,
        selectedProfileId,
        actionLoading,
        handleSaveConfiguration
    } = useHierarchy()

    const effectiveProfileName = selectedProfileId ? profiles.find((p) => p.id === selectedProfileId)?.name : "Inherit: System Default"

    return (
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            {selectedEntity ? (
                <>
                    <EntityHeader />
                    {/* Hierarchy Scope Statistics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                                Total Media
                            </span>
                            <span className="text-base font-bold text-white mt-0.5 block font-mono">
                                {selectedEntity.mediaCount}
                            </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                                Active Media
                            </span>
                            <span className="text-base font-bold text-emerald-400 mt-0.5 block font-mono">
                                {selectedEntity.activeMediaCount}
                            </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                                Effective Profile
                            </span>
                            <span className="text-xs font-bold text-indigo-300 mt-1 block truncate">
                                {effectiveProfileName}
                            </span>
                        </div>
                    </div>

                    {/* Processing Policy Configuration */}
                    <ProcessingProfiles />

                    {/* Access & Visibility Policy Configuration */}
                    <PolicyEditor />

                    {/* Save Button */}
                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={handleSaveConfiguration}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {actionLoading ? "Saving..." : "Save Configuration Changes"}
                        </button>
                    </div>
                </>
            ) : (
                <div className="py-20 text-center text-slate-500 text-xs">
                    Select an item from the hierarchy tree on the left to configure
                    policies.
                </div>
            )}
        </div>
    )
}