import {
    FolderTree,
} from "lucide-react"
import { HierarchyProvider } from "@/context/HierarchyContext"
import RootCollections from "@/components/collections/rootCollections"
import PolicyPane from "@/components/collections/Policy/PolicyPane"
import FeedbackToaster from "@/components/collections/Policy/FeedbackToaster"

export default () => (
    <HierarchyProvider>
        <div className="space-y-6 animate-in fade-in duration-300">
            <FeedbackToaster />

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Hierarchy & Collections
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Manage processing policies and access restrictions across Root Collections,
                    Collections, and Media Users.
                </p>
            </div>

            {/* Main Dual-Pane Browser */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Tree Explorer */}
                <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                    <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800/80">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <FolderTree className="w-4 h-4 text-indigo-400" />
                            Logical Hierarchy Tree
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                            Root → Col → User
                        </span>
                    </div>

                    <RootCollections />
                </div>
                <PolicyPane />
            </div>
        </div>
    </HierarchyProvider>
)