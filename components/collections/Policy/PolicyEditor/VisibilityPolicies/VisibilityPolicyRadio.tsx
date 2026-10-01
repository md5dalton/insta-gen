import { ReactNode } from "react"

interface Props {
    disabled: boolean
    isChecked: boolean
    description: string
    title: string
    icon: ReactNode
    changeHandler: () => void

}

export default ({ disabled, changeHandler, isChecked, title, description, icon }: Props) => {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={changeHandler}
            className={`flex items-start cursor-pointer gap-3 p-3 rounded-lg border bg-slate-900 text-left transition-all hover:bg-slate-800 ${
                isChecked
                    ? "border-emerald-600"
                    : "border-slate-800"
            }`}
        >
            <div className="p-1.5 rounded bg-emerald-600/10 text-emerald-600 mt-0.5">
                {icon}
            </div>
            <div className="flex-1">
                <span className="text-sm font-semibold text-slate-400 block">
                    {title}
                </span>
                <span className="text-xs text-slate-500 block">
                    {description}
                </span>
            </div>
        </button>
    )
}