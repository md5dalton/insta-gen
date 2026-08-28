import Dashboard from "@/components/Dashboard"
import { StatsProvider } from "@/context/StatsContext"
import { ReactNode } from "react"

export default ({ children }: { children: ReactNode }) => (
    <StatsProvider>
        <Dashboard>
            {children}
        </Dashboard>
    </StatsProvider>
)
