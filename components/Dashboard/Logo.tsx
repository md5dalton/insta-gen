import { HardDrive, Menu, X } from "lucide-react"

type Props = {
    menuHandler: () => void,
    isOpen: boolean
}

export default ({
    menuHandler,
    isOpen
}: Props) => (
    <div className="flex items-center gap-3">
        <button
            type="button"
            onClick={menuHandler}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
        >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-900/40">
                <HardDrive className="w-4 h-4" />
            </div>
            <div>
                <span className="text-sm font-bold text-white tracking-tight block leading-tight">
                    Insta Media Manager
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block leading-tight">
                    Admin Control Plane
                </span>
            </div>
        </div>
    </div>
)