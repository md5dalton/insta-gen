import { MediaUser } from "@/types/types"
import User from "./User"

type Props = {
    users: MediaUser[]
    parentDeleted: boolean
    selectHandler: (user: MediaUser) => void
    selectedEntity: {
        id: string
        type: "root" | "collection" | "user"
    } | null
}
export default ({ users, parentDeleted, selectHandler, selectedEntity }: Props) => (
    <div className="pl-6 space-y-1 border-l border-slate-800/60 ml-3">
        {users.map((user) => {
            const isUserSelected =
                selectedEntity?.type ===
                    "user" &&
                selectedEntity?.id ===
                    user.id
            const isUserDeleted =
                Boolean(user.deletedAt) ||
                parentDeleted

            return (
                <User
                    key={user.id}
                    user={user}
                    selectHandler={() => selectHandler(user)}
                    isDeleted={isUserDeleted}
                    isSelected={isUserSelected}
                />
            )
        })}
    </div>
)