import { useHierarchy } from "@/context/HierarchyContext"

export default ({ disabled = false }: { disabled?: boolean }) => {
    const {
        selectedEntity,
        users,

        toggleAllowedUser,
    } = useHierarchy()

    return (
        <div className="divide-y divide-slate-200 bg-white rounded-md border border-slate-200 overflow-hidden max-h-56 overflow-y-auto">
            {users.map((user) => {
                const isChecked = selectedEntity?.effectiveAllowedUserIds.includes(user.id)
                
                const isAdmin = user.role === "ADMIN"

                return (
                    <label
                        key={user.id}
                        className={`flex items-center justify-between p-2.5 text-xs hover:bg-slate-50 cursor-pointer`}
                    >
                        <div className="flex items-center gap-2.5">
                            <input
                                type="checkbox"
                                disabled={disabled || isAdmin}
                                checked={isAdmin || isChecked}
                                onChange={() => toggleAllowedUser(user.id)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <div>
                                <span className="font-semibold text-slate-900">
                                    {user.name}
                                </span>
                                <span className="text-slate-400 ml-2 font-mono text-[11px]">
                                    user.email
                                </span>
                                {isAdmin && (
                                    <span className="ml-2 text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                        Admin (Full Bypass)
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {user.capability === "DOWNLOAD"
                                    ? "View + Download"
                                    : user.capability === "MANAGE"
                                        ? "Manage"
                                        : "View (Like/Save)"}
                            </span>
                            {/* {isBlockedByParent && (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    Blocked by Parent
                                </span>
                            )} */}
                        </div>
                    </label>
                )
            })}
        </div>
    )
}
