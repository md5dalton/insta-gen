/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react"
import { api } from "../lib/api"
import {
    ShieldCheck,
    UserPlus,
    Lock,
    Download,
    Heart,
    Bookmark,
    Eye,
    Sliders,
    Shield,
    CheckCircle2,
    Mail,
    User,
    Info,
    X,
} from "lucide-react"
import { ProfileUser, UserCapability } from "@/types/types"

export const AccessPage: React.FC = () => {
    const [users, setUsers] = useState<ProfileUser[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<ProfileUser | null>(null)

    // Form states
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [role, setRole] = useState<"USER" | "ADMIN">("USER")
    const [capability, setCapability] = useState<UserCapability>("VIEW")
    const [formLoading, setFormLoading] = useState(false)

    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
        null
    )

    const showFeedback = (message: string, type: "success" | "error" = "success") => {
        setFeedback({ message, type })
        setTimeout(() => setFeedback(null), 4000)
    }

    const loadUsers = async () => {
        setLoading(true)
        try {
            const res = await api.getUsers()
            setUsers(res)
        } catch (err: any) {
            showFeedback(err.message || "Failed to load users", "error")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [])

    const openCreateModal = () => {
        setEditingUser(null)
        setName("")
        setEmail("")
        setRole("USER")
        setCapability("VIEW")
        setModalOpen(true)
    }

    const openEditModal = (u: ProfileUser) => {
        setEditingUser(u)
        setName(u.name)
        setEmail(u.email)
        setRole(u.role)
        setCapability(u.capability)
        setModalOpen(true)
    }

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormLoading(true)
        try {
            if (editingUser) {
                await api.updateUser(editingUser.id, { name, email, role, capability })
                showFeedback(`User ${name} updated successfully.`)
            } else {
                await api.createUser({ name, email, role, capability })
                showFeedback(`User ${name} created.`)
            }
            setModalOpen(false)
            loadUsers()
        } catch (err: any) {
            showFeedback(err.message || "Failed to save user", "error")
        } finally {
            setFormLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Feedback Toast */}
            {feedback && (
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
                        onClick={() => setFeedback(null)}
                        className="text-white/60 hover:text-white ml-3"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Access Control & Users
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Manage application users, capability profiles, and media visibility
                        restrictions.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    Add Application User
                </button>
            </div>

            {/* Capability Rule Explainer */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        Access Capability Architecture
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <div className="flex items-center gap-2 text-indigo-300 font-bold">
                            <Eye className="w-4 h-4" />
                            <span>VIEW (Includes Like & Save)</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-[11px]">
                            Users with <strong>VIEW</strong> automatically have permission to view
                            media, like posts, and bookmark to collections. Separate like/save
                            checkboxes are not required.
                        </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <div className="flex items-center gap-2 text-emerald-300 font-bold">
                            <Download className="w-4 h-4" />
                            <span>DOWNLOAD</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-[11px]">
                            Additionally permits exporting or downloading the full-resolution
                            original media file directly from the storage layer.
                        </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <div className="flex items-center gap-2 text-amber-300 font-bold">
                            <Shield className="w-4 h-4" />
                            <span>ADMIN</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-[11px]">
                            Global administrator. Automatically bypasses all media restriction
                            policies and private visibility constraints.
                        </p>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Application Users ({users.length})
                    </h2>
                    <span className="text-xs text-slate-500">
                        Configured members for access policies
                    </span>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-500 text-xs">
                        Loading application users...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Granted Capabilities</th>
                                    <th className="p-4">Created</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {users.map((u) => (
                                    <tr
                                        key={u.id}
                                        className="hover:bg-slate-900/50 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-200">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <span className="font-semibold text-slate-100">
                                                    {u.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-slate-400">{u.email}</td>
                                        <td className="p-4">
                                            {u.role === "ADMIN" ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800">
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300">
                                                    User
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5">
                                                {u.role === "ADMIN" ? (
                                                    <span className="text-indigo-400 font-semibold">
                                                        Full Access (Bypass All)
                                                    </span>
                                                ) : u.capability === "DOWNLOAD" ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                                                        <Download className="w-3 h-3" /> View +
                                                        Download
                                                    </span>
                                                ) : u.capability === "MANAGE" ? (
                                                    <span className="inline-flex items-center gap-1 text-purple-400 font-medium bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/80">
                                                        <Sliders className="w-3 h-3" /> Manage
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-slate-300 font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                                        <Eye className="w-3 h-3" /> View (Like/Save)
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(u)}
                                                className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* User Create / Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h3 className="text-base font-bold text-white">
                                {editingUser ? `Edit ${editingUser.name}` : "Add Application User"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-hidden focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-hidden focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                                    Role
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as any)}
                                    className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-hidden focus:border-indigo-500"
                                >
                                    <option value="USER">Regular User</option>
                                    <option value="ADMIN">System Administrator</option>
                                </select>
                            </div>

                            {role === "USER" && (
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                                        Granted Capabilities
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-800 bg-slate-900 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="cap"
                                                value="VIEW"
                                                checked={capability === "VIEW"}
                                                onChange={() => setCapability("VIEW")}
                                                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div>
                                                <span className="font-semibold text-slate-200 block">
                                                    VIEW
                                                </span>
                                                <span className="text-slate-400 text-[11px] block">
                                                    View media, like posts, and bookmark saves.
                                                </span>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-800 bg-slate-900 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="cap"
                                                value="DOWNLOAD"
                                                checked={capability === "DOWNLOAD"}
                                                onChange={() => setCapability("DOWNLOAD")}
                                                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div>
                                                <span className="font-semibold text-slate-200 block">
                                                    DOWNLOAD
                                                </span>
                                                <span className="text-slate-400 text-[11px] block">
                                                    View, like, save, plus download full-resolution
                                                    original media.
                                                </span>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-800 bg-slate-900 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="cap"
                                                value="MANAGE"
                                                checked={capability === "MANAGE"}
                                                onChange={() => setCapability("MANAGE")}
                                                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div>
                                                <span className="font-semibold text-slate-200 block">
                                                    MANAGE
                                                </span>
                                                <span className="text-slate-400 text-[11px] block">
                                                    Media management and tag administration
                                                    privileges.
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
                                >
                                    {formLoading ? "Saving..." : "Save User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
