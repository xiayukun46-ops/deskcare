import { Icon } from '../shared/Icon'
import type { IconName } from '../shared/Icon'

interface QuickActionProps {
  label: string
  icon: string
  active: boolean
  onClick: () => void
}

export function QuickAction({ label, icon, active, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-200 ${
        active
          ? 'bg-primary-50 text-primary-600 shadow-sm'
          : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
      }`}
    >
      <Icon name={icon as IconName} size={18} />
      <span className="text-[12px] font-medium">{label}</span>
    </button>
  )
}
