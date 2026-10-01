import { AlertCircle } from "lucide-react"
import { useHierarchy } from "@/context/HierarchyContext"
import VisibilityPolicies from "./VisibilityPolicies"
import UsersList from "./Users"

export default () => {
    const {
        selectedVisibility
    } = useHierarchy()

    return (
        <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="space-y-4">
                <VisibilityPolicies />

                {/* User Permitted List for Restricted Visibility */}
                {selectedVisibility === "RESTRICTED" && (
                    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                    Permitted Application Users
                                </span>
                                <span className="text-xs text-slate-500">
                                    Grant VIEW (includes like & save) or DOWNLOAD capabilities.
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    // onClick={selectAllAllowed}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 underline"
                                >
                                    Select Permitted
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                    type="button"
                                    // onClick={clearAllowed}
                                    className="text-xs font-medium text-slate-500 hover:text-slate-700 underline"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Parent restriction explanation note */}
                        <div className="flex items-start gap-2 p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <strong>Inheritance Rule:</strong> A child sets specific access
                                rule, therefore will not overriden by a parent restriction (
                                <code className="font-mono text-[11px]">child ∩ parent</code>).
                                These rules are permissive not blocking.
                            </div>
                        </div>
                        <UsersList />
                    </div>
                )}
            </div>
        </div>
    )
}
