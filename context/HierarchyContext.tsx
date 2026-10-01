"use client"

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type FC,
    type ReactNode,
} from "react"
import { api } from "@/lib/api"
import type {
    ProcessingProfile,
    ProfileUser,
    VisibilityType,
} from "@/types/types"

export type EntityType = "ROOT_COLLECTION" | "COLLECTION" | "USER"

interface Entity {
    id: string
    path: string
    name: string
    effectiveProfile: string,
    effectiveVisibility: VisibilityType,
    effectiveAllowedUserIds: string[],
    isEffectivelyDeleted: boolean,
    mediaCount: number,
    activeMediaCount: number,
}

export interface RootCollection extends Entity {
    type: "ROOT_COLLECTION"
    collections: Collection[]
}
export interface Collection extends Entity {
    type: "COLLECTION"
    users: User[]
}
export interface User extends Entity {
    type: "USER"
}

interface HierarchyContextType {
    hierarchy: RootCollection[]
    profiles: ProcessingProfile[]
    users: ProfileUser[]

    loading: boolean
    
    selectedEntity: RootCollection | Collection | User | null
    selectedProfileId: string | null
    selectedVisibility: VisibilityType | null
    selectedAllowedUsers: string[]

    actionLoading: boolean
    expandedNodes: Record<string, boolean>
    confirmDeleteOpen: boolean
    feedback: { type: "success" | "error"; message: string } | null
    
    showFeedback: (message: string, type?: "success" | "error") => void
    loadHierarchy: () => Promise<void>
    toggleExpand: (nodeId: string) => void
    
    setSelectedProfileId: React.Dispatch<React.SetStateAction<string | null>>
    setSelectedVisibility: React.Dispatch<React.SetStateAction<VisibilityType | null>>
    setSelectedAllowedUsers: React.Dispatch<React.SetStateAction<string[]>>
    setConfirmDeleteOpen: React.Dispatch<React.SetStateAction<boolean>>
    
    selectEntity: (entity: RootCollection | Collection | User) => void
    toggleAllowedUser: (userId: string) => void

    handleSaveConfiguration: () => Promise<void>
    handleSoftDelete: () => Promise<void>
    handleRestore: () => Promise<void>
}


const HierarchyContext = createContext<HierarchyContextType | undefined>(undefined)

export const HierarchyProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [hierarchy, setHierarchy] = useState<RootCollection[]>([])
    const [profiles, setProfiles] = useState<ProcessingProfile[]>([])
    const [users, setUsers] = useState<ProfileUser[]>([])
    const [loading, setLoading] = useState(true)

    const [selectedEntity, setSelectedEntity] = useState<RootCollection | Collection | User | null>(null)

    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
    const [selectedVisibility, setSelectedVisibility] = useState<VisibilityType | null>(null)
    const [selectedAllowedUsers, setSelectedAllowedUsers] = useState<string[]>([])

    const [actionLoading, setActionLoading] = useState(false)
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
        "root-1": true,
        "root-2": true,
        "col-1": true,
    })
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
        null
    )

    const selectEntity = useCallback(
        (entity: RootCollection | Collection | User) => {
            setSelectedEntity(entity)
            setSelectedProfileId(entity.effectiveProfile)
            setSelectedVisibility(entity.effectiveVisibility)
            setSelectedAllowedUsers(entity.effectiveAllowedUserIds)
        },
        []
    )
    const toggleAllowedUser = (userId: string) => {
        setSelectedAllowedUsers(prevItems => 
            prevItems.includes(userId)
                ? prevItems.filter(item => item !== userId) // Remove
                : [...prevItems, userId] // Add
            );
    }

    const showFeedback = useCallback((message: string, type: "success" | "error" = "success") => {
        setFeedback({ message, type })
        window.setTimeout(() => setFeedback(null), 4000)
    }, [])

    const loadHierarchy = useCallback(async () => {
        setLoading(true)
        try {
            const [hierRes, profRes, usersRes] = await Promise.all([
                api.getHierarchy(),
                api.getProfiles(),
                api.getUsers(),
            ])

            setHierarchy(hierRes)
            setProfiles(profRes)
            setUsers(usersRes)

            setSelectedEntity((current) => {
                if (current || hierRes.length === 0) return current

                return hierRes[0]
            })
        } catch (err: any) {
            showFeedback(err?.message || "Failed to load hierarchy data", "error")
        } finally {
            setLoading(false)
        }
    }, [showFeedback])

    useEffect(() => {
        void loadHierarchy()
    }, [loadHierarchy])

    const toggleExpand = useCallback((nodeId: string) => {
        setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }))
    }, [])

    const handleSaveConfiguration = useCallback(async () => {
        if (!selectedEntity) return

        setActionLoading(true)
        try {
            await api.updateHierarchyEntity(selectedEntity.type, selectedEntity.id, {
                processingProfileId: selectedProfileId,
                visibility: selectedVisibility,
                allowedUserIds: selectedAllowedUsers,
            })

            showFeedback(
                `Configuration updated for "${selectedEntity.name}"`
            )
            await loadHierarchy()
        } catch (err: any) {
            showFeedback(err?.message || "Failed to save configuration", "error")
        } finally {
            setActionLoading(false)
        }
    }, [loadHierarchy, selectedAllowedUsers, selectedEntity, selectedProfileId, selectedVisibility, showFeedback])

    const handleSoftDelete = useCallback(async () => {
        if (!selectedEntity) return

        setActionLoading(true)
        try {
            await api.updateHierarchyEntity(selectedEntity.type, selectedEntity.id, {
                action: "delete",
            })

            showFeedback(
                `"${selectedEntity.name}" marked as soft-deleted.`
            )
            setConfirmDeleteOpen(false)
            await loadHierarchy()
        } catch (err: any) {
            showFeedback(err?.message || "Failed to soft delete", "error")
        } finally {
            setActionLoading(false)
        }
    }, [loadHierarchy, selectedEntity, showFeedback])

    const handleRestore = useCallback(async () => {
        if (!selectedEntity) return

        setActionLoading(true)
        try {
            await api.updateHierarchyEntity(selectedEntity.type, selectedEntity.id, {
                action: "restore",
            })

            showFeedback(
                `"${selectedEntity.name}" restored.`
            )
            await loadHierarchy()
        } catch (err: any) {
            showFeedback(err?.message || "Failed to restore", "error")
        } finally {
            setActionLoading(false)
        }
    }, [loadHierarchy, selectedEntity, showFeedback])

    const value = useMemo<HierarchyContextType>(
        () => ({
            hierarchy,
            profiles,
            users,

            loading,
            
            selectedEntity,
            selectedProfileId,
            selectedVisibility,
            selectedAllowedUsers,

            actionLoading,
            expandedNodes,
            confirmDeleteOpen,
            feedback,

            showFeedback,
            loadHierarchy,
            toggleExpand,

            setSelectedProfileId,
            setSelectedVisibility,
            setSelectedAllowedUsers,
            setConfirmDeleteOpen,

            selectEntity,
            toggleAllowedUser,
            
            handleSaveConfiguration,
            handleSoftDelete,
            handleRestore,
        }),
        [
            actionLoading,
            confirmDeleteOpen,
            expandedNodes,
            feedback,
            handleRestore,
            handleSaveConfiguration,
            handleSoftDelete,
            hierarchy,
            loadHierarchy,
            loading,
            profiles,
            selectedAllowedUsers,
            selectedEntity,
            selectedProfileId,
            selectedVisibility,
            showFeedback,
            toggleExpand,
            users,
        ]
    )

    return <HierarchyContext.Provider value={value}>{children}</HierarchyContext.Provider>
}

export const useHierarchy = () => {
    const context = useContext(HierarchyContext)
    if (!context) {
        throw new Error("useHierarchy must be used within a HierarchyProvider")
    }
    return context
}
