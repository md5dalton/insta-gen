import { LibraryStats } from "@/types/types"
import {
    LayoutDashboard,
    Film,
    Cpu,
    FolderTree,
    ShieldCheck,
    Settings,
    Radio,
} from "lucide-react"

type Props = {
    isOpen: boolean
    stats?: LibraryStats | null
    currentTab: "dashboard" | "media" | "processing" | "collections" | "access" | "settings"
    onSelectTab: (
        tab: "dashboard" | "media" | "processing" | "collections" | "access" | "settings"
    ) => void
    closeMenu: () => void
}

export default ({ isOpen, stats, currentTab, onSelectTab, closeMenu }: Props) => {
    
    const navItems = [
        {
            id: "dashboard" as const,
            label: "Dashboard",
            icon: <LayoutDashboard className="w-4 h-4" />,
            description: "Overview & Attention",
        },
        {
            id: "media" as const,
            label: "Media",
            icon: <Film className="w-4 h-4" />,
            badge: stats?.totalMedia ? stats.totalMedia.toLocaleString() : undefined,
            description: "Catalog & Tags",
        },
        {
            id: "processing" as const,
            label: "Processing",
            icon: <Cpu className="w-4 h-4" />,
            attention:
                (stats?.needsProcessingCount || 0) +
                (stats?.processingFailuresCount || 0) +
                (stats?.newMediaCount || 0),
            description: "Renditions & Status",
        },
        {
            id: "collections" as const,
            label: "Collections",
            icon: <FolderTree className="w-4 h-4" />,
            description: "Hierarchy & Policies",
        },
        {
            id: "access" as const,
            label: "Access",
            icon: <ShieldCheck className="w-4 h-4" />,
            description: "Users & Visibility",
        },
        {
            id: "settings" as const,
            label: "Settings",
            icon: <Settings className="w-4 h-4" />,
            description: "Media Root & Profiles",
        },
    ]
    
    
    return (
        <aside
            className={`${
                isOpen ? "block" : "hidden"
            } md:block w-60 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 z-20`}
        >
            <div className="p-4 space-y-1.5">
                {navItems.map((item) => {
                    const isActive = currentTab === item.id
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                onSelectTab(item.id)
                                closeMenu()
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                isActive
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <span
                                    className={isActive ? "text-white" : "text-slate-400"}
                                >
                                    {item.icon}
                                </span>
                                <div className="text-left">
                                    <span className="block leading-tight">
                                        {item.label}
                                    </span>
                                    <span
                                        className={`text-[10px] block font-normal leading-tight ${
                                            isActive ? "text-indigo-200" : "text-slate-500"
                                        }`}
                                    >
                                        {item.description}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                {item.badge && (
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                                            isActive
                                                ? "bg-indigo-700 text-white"
                                                : "bg-slate-800 text-slate-400"
                                        }`}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                                {item.attention && item.attention > 0 ? (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                                        {item.attention}
                                    </span>
                                ) : null}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Sidebar Status Footer Card */}
            <div className="mt-auto p-4 border-t border-slate-800/80">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>Media Processor</span>
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                            <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                            Running
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>Filesystem Watcher</span>
                        <span className="text-emerald-400 font-semibold">Active</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}