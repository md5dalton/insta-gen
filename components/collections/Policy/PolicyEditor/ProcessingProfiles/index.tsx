import { useHierarchy } from "@/context/HierarchyContext"
import ProfileRadio from "./ProfileRadio"

export default () => {
    const {
        selectedEntity,
        profiles,
        selectedProfileId,
        setSelectedProfileId
    } = useHierarchy()

    return (
        <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Processing Profile
                </label>

                <div className="grid grid-cols-1 gap-2">
                    {(selectedEntity?.type !== "ROOT_COLLECTION") && (
                        <ProfileRadio
                            isChecked={!selectedProfileId}
                            onChangeHandler={() => setSelectedProfileId(null)}
                            profile={{
                                id: "default",
                                name: "Inherit from parent: System default",
                                description: "Automatically uses the processing profile assigned to the parent hierarchy level.",
                                renditions: [
                                    "THUMBNAIL"
                                ]
                            }}
                        />
                    )}

                    {profiles.map((profile) => (
                        <ProfileRadio
                            isChecked={selectedProfileId === profile.id}
                            onChangeHandler={() => setSelectedProfileId(profile.id)}
                            profile={profile}
                            key={profile.id}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
