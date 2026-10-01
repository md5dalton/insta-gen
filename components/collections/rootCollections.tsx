"use client"
import { useHierarchy } from "@/context/HierarchyContext"
import RootCollectionComponent from "@/components/collections/rootCollection"

export default () => {
    const { hierarchy } = useHierarchy()

    return (
        <div className="space-y-1.5 max-h-150 overflow-y-auto pr-1">
            {hierarchy.map((root) => (
                <RootCollectionComponent
                    key={root.id}
                    root={root}
                />
            ))}
        </div>
    )
}