"use client"
import { useHierarchy } from "@/context/HierarchyContext"

export default () => {
    const {
        feedback,
    } = useHierarchy()

    return feedback && (
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
                // onClick={() => setFeedback(null)}
                className="text-white/60 hover:text-white ml-3"
            >
                ✕
            </button>
        </div>
    )
}