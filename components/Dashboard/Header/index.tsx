import { ReactNode } from "react"
import { useAuth } from "@/context/AuthContext"
import { useSettings } from "@/context/SettingsContext"
import MediaRoot from "./MediaRoot"
import Profile from "./Profile"

type Props = {
    children: ReactNode
}

export default ({
    children
}: Props) => {
    const { user, logout } = useAuth()
    const { settings } = useSettings()

    return (
        <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
            {children}
            <MediaRoot name={settings.mediaRoot} />
            <Profile
                logoutHandler={() => logout()}
                name={user?.name || "NONE"}
            />
        </header>
    )
}
