import { ReactNode } from "react"
import { Users, Lock, ShieldAlert } from "lucide-react"
import { VisibilityType } from "@/prisma/generated/enums"
import { useHierarchy } from "@/context/HierarchyContext"
import Radio from "../../AccessPolicy/Radio"

interface Policy {
    type: VisibilityType
    title: string
    description: string
    icon: ReactNode

}
const policies: Policy[] = [
    {
        type: VisibilityType.ALL_USERS,
        title: "All Users",
        description: "Any authenticated application user can view.",
        icon: <Users className="w-4 h-4" />
    },
    {
        type: VisibilityType.RESTRICTED,
        title: "Restricted",
        description: "Only explicitly permitted users can access.",
        icon: <Lock className="w-4 h-4" />
    },
    {
        type: VisibilityType.PRIVATE,
        title: "Private",
        description: "Only the system administrator can access.",
        icon: <ShieldAlert className="w-4 h-4" />
    }
]

export default ({ disabled = false }: { disabled?: boolean }) => {
    const {
        selectedEntity,
        selectedVisibility,

        setSelectedVisibility,
    } = useHierarchy()

    return (
        <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Visibility Policy
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(selectedEntity?.type !== "ROOT_COLLECTION") && (
                    <Radio
                        changeHandler={() => setSelectedVisibility(null)}
                        description={`Inherited: ${"inheritedVisibility"}`}
                        title="Inherit"
                        disabled={disabled}
                        icon={<Users className="w-4 h-4" />}
                        isChecked={!selectedVisibility}
                    />
                )}
                {policies.map((policy) => (
                    <Radio
                        key={policy.type}
                        changeHandler={() => setSelectedVisibility(policy.type)}
                        description={policy.description}
                        title={policy.title}
                        disabled={disabled}
                        icon={policy.icon}
                        isChecked={selectedVisibility === policy.type}
                    />
                ))}
            </div>
        </div>
    )
}
