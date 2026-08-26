import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Film,
  Cpu,
  FolderTree,
  ShieldCheck,
  Settings,
  HardDrive,
  LogOut,
  Menu,
  X,
  Radio,
  CheckCircle2,
} from "lucide-react"
import { LibraryStats } from "@/types/types"

interface LayoutProps {
  currentTab: "dashboard" | "media" | "processing" | "collections" | "access" | "settings"
  onSelectTab: (tab: "dashboard" | "media" | "processing" | "collections" | "access" | "settings") => void
  children: React.ReactNode
  stats?: LibraryStats | null
  onRefreshStats?: () => void
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
  stats,
  onRefreshStats,
}) => {
  const { admin, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      attention: (stats?.needsProcessingCount || 0) + (stats?.processingFailuresCount || 0) + (stats?.newMediaCount || 0),
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-900/40">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight block leading-tight">
                Media Manager
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block leading-tight">
                Admin Control Plane
              </span>
            </div>
          </div>
        </div>

        {/* Media Root Connectivity Indicator */}
        <div className="hidden sm:flex items-center gap-3 text-xs bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400 font-mono text-[11px]">Media Root:</span>
            <span className="font-mono text-slate-200 font-medium truncate max-w-[200px]">
              {stats?.mediaRoot || "/mnt/media/library"}
            </span>
          </span>
          <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
          </span>
        </div>

        {/* Admin Menu & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-300">
            <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center font-bold text-indigo-300 text-xs">
              {admin?.name?.charAt(0) || "A"}
            </div>
            <div className="text-left">
              <span className="font-semibold block leading-tight text-slate-200">{admin?.name}</span>
              <span className="text-[10px] text-indigo-400 font-mono block leading-tight">Administrator</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:text-rose-400 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Sign out of Admin Dashboard"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside
          className={`${
            mobileMenuOpen ? "block" : "hidden"
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
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? "text-white" : "text-slate-400"}>{item.icon}</span>
                    <div className="text-left">
                      <span className="block leading-tight">{item.label}</span>
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
                          isActive ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-400"
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-900">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
