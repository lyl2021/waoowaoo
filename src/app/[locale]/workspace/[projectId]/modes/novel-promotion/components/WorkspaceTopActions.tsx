'use client'

import { AppIcon } from '@/components/ui/icons'

interface WorkspaceTopActionsProps {
  onOpenAssetLibrary: () => void
  onOpenSettings: () => void
  assetLibraryLabel: string
  settingsLabel: string
  className?: string
}

export default function WorkspaceTopActions({
  onOpenAssetLibrary,
  onOpenSettings,
  assetLibraryLabel,
  settingsLabel,
  className,
}: WorkspaceTopActionsProps) {
  return (
    <div className={className}>
      <button
        onClick={onOpenAssetLibrary}
        className="glass-btn-base glass-btn-secondary flex items-center gap-2 px-3 py-1.5 rounded-3xl text-[var(--glass-text-primary)]"
        title="上传角色/场景设定，AI 将优先使用"
      >
        <AppIcon name="package" className="h-4 w-4" />
        <span className="font-semibold text-sm hidden md:inline tracking-[0.01em]">{assetLibraryLabel}</span>
      </button>
      <button
        onClick={onOpenSettings}
        className="glass-btn-base glass-btn-secondary flex items-center gap-2 px-3 py-1.5 rounded-3xl text-[var(--glass-text-primary)]"
      >
        <AppIcon name="settingsHexMinor" className="h-4 w-4" />
        <span className="font-semibold text-sm hidden md:inline tracking-[0.01em]">{settingsLabel}</span>
      </button>
    </div>
  )
}
