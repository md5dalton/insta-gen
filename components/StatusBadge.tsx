/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { ProcessingStatus, VisibilityType, AssetStatus, AssetType } from "@/types/types"
import {
    CheckCircle2,
    AlertCircle,
    Clock,
    Loader2,
    Sparkles,
    Lock,
    Users,
    ShieldAlert,
    Ban,
    ArrowDownRight,
} from "lucide-react"

interface StatusBadgeProps {
    type: "processing" | "visibility" | "asset" | "deletion"
    value: string | null | undefined
    size?: "sm" | "md"
    inherited?: boolean
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    type,
    value,
    size = "md",
    inherited = false,
}) => {
    const textSize = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1"

    if (type === "processing") {
        const status = value as ProcessingStatus
        switch (status) {
            case "READY":
                return (
                    <span
                        className={`inline-flex items-center gap-1 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${textSize}`}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Ready
                    </span>
                )
            case "NEEDS_PROCESSING":
                return (
                    <span
                        className={`inline-flex items-center gap-1 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${textSize}`}
                    >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Needs Processing
                    </span>
                )
            case "PROCESSING":
                return (
                    <span
                        className={`inline-flex items-center gap-1 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${textSize}`}
                    >
                        <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
                        Processing
                    </span>
                )
            case "FAILED":
                return (
                    <span
                        className={`inline-flex items-center gap-1 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${textSize}`}
                    >
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        Failed
                    </span>
                )
            case "NEW":
            default:
                return (
                    <span
                        className={`inline-flex items-center gap-1 font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${textSize}`}
                    >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        New
                    </span>
                )
        }
    }

    if (type === "visibility") {
        const vis = value as VisibilityType
        switch (vis) {
            case "ALL_USERS":
                return (
                    <span
                        className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${textSize}`}
                    >
                        <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        All Users
                        {inherited && (
                            <span className="text-[10px] text-slate-400 font-normal">
                                (Inherited)
                            </span>
                        )}
                    </span>
                )
            case "RESTRICTED":
                return (
                    <span
                        className={`inline-flex items-center gap-1 font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${textSize}`}
                    >
                        <Lock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        Restricted
                        {inherited && (
                            <span className="text-[10px] text-indigo-400 font-normal">
                                (Inherited)
                            </span>
                        )}
                    </span>
                )
            case "PRIVATE":
                return (
                    <span
                        className={`inline-flex items-center gap-1 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${textSize}`}
                    >
                        <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        Private (Admin only)
                        {inherited && (
                            <span className="text-[10px] text-rose-400 font-normal">
                                (Inherited)
                            </span>
                        )}
                    </span>
                )
            case "INHERIT":
            default:
                return (
                    <span
                        className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${textSize}`}
                    >
                        <ArrowDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Inherited
                    </span>
                )
        }
    }

    if (type === "asset") {
        const status = value as AssetStatus
        switch (status) {
            case "READY":
                return (
                    <span
                        className={`inline-flex items-center gap-1 font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200 ${textSize}`}
                    >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        Ready
                    </span>
                )
            case "MISSING":
                return (
                    <span
                        className={`inline-flex items-center gap-1 font-medium rounded bg-amber-50 text-amber-700 border border-amber-200 ${textSize}`}
                    >
                        <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        Missing
                    </span>
                )
            case "PROCESSING":
                return (
                    <span
                        className={`inline-flex items-center gap-1 font-medium rounded bg-blue-50 text-blue-700 border border-blue-200 ${textSize}`}
                    >
                        <Loader2 className="w-3 h-3 text-blue-600 animate-spin shrink-0" />
                        Generating
                    </span>
                )
            case "FAILED":
                return (
                    <span
                        className={`inline-flex items-center gap-1 font-medium rounded bg-rose-50 text-rose-700 border border-rose-200 ${textSize}`}
                    >
                        <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                        Failed
                    </span>
                )
            default:
                return null
        }
    }

    if (type === "deletion") {
        const isDeleted = Boolean(value)
        if (isDeleted) {
            return (
                <span
                    className={`inline-flex items-center gap-1 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${textSize}`}
                >
                    <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    Marked Deleted
                </span>
            )
        }
        return (
            <span
                className={`inline-flex items-center gap-1 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${textSize}`}
            >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Active
            </span>
        )
    }

    return null
}
