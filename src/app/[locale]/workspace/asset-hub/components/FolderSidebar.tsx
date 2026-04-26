'use client'

import { useTranslations } from 'next-intl'
import { AppIcon } from '@/components/ui/icons'

interface Group {
    id: string
    name: string
}

interface FolderSidebarProps {
    folders: Group[]
    selectedFolderId: string | null
    onSelectFolder: (folderId: string | null) => void
    onCreateFolder: () => void
    onEditFolder: (folder: Group) => void
    onDeleteFolder: (folderId: string) => void
}

// 内联 SVG 图标
const FolderIcon = ({ className }: { className?: string }) => (
    <AppIcon name="folder" className={className} />
)

const PlusIcon = ({ className }: { className?: string }) => (
    <AppIcon name="plus" className={className} />
)

const PencilIcon = ({ className }: { className?: string }) => (
    <AppIcon name="edit" className={className} />
)

const TrashIcon = ({ className }: { className?: string }) => (
    <AppIcon name="trash" className={className} />
)

export function FolderSidebar({
    folders,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onEditFolder,
    onDeleteFolder
}: FolderSidebarProps) {
    const t = useTranslations('assetHub')

    // selectedFolderId === null → "全部分组" (All Groups, no filter)
    // selectedFolderId === '__default__' → "默认分组" (Default Group, null folderId)
    // selectedFolderId === folder.id → specific group

    return (
        <div className="w-48 flex-shrink-0">
            <div className="glass-surface p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-[var(--glass-text-secondary)]">{t('groups')}</h3>
                    <button
                        onClick={onCreateFolder}
                        className="glass-btn-base glass-btn-primary h-6 w-6 rounded-full flex items-center justify-center"
                        title={t('newGroup')}
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-1">
                    {/* 全部分组 */}
                    <button
                        onClick={() => onSelectFolder(null)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${selectedFolderId === null
                                ? 'bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)]'
                                : 'text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)]'
                            }`}
                    >
                        <FolderIcon className="w-4 h-4" />
                        <span className="truncate">{t('allGroups')}</span>
                    </button>

                    {/* 默认分组 */}
                    <button
                        onClick={() => onSelectFolder('__default__')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${selectedFolderId === '__default__'
                                ? 'bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)]'
                                : 'text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)]'
                            }`}
                    >
                        <FolderIcon className="w-4 h-4" />
                        <span className="truncate">{t('defaultGroup')}</span>
                    </button>

                    {/* 分隔线 */}
                    {folders.length > 0 && (
                        <div className="my-1 h-px bg-[var(--glass-stroke-base)]" />
                    )}

                    {/* 分组列表 */}
                    {folders.map((folder) => (
                        <div
                            key={folder.id}
                            className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${selectedFolderId === folder.id
                                    ? 'bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)]'
                                    : 'text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)]'
                                }`}
                        >
                            <button
                                onClick={() => onSelectFolder(folder.id)}
                                className="flex-1 flex items-center gap-2 text-left text-sm min-w-0"
                            >
                                <FolderIcon className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{folder.name}</span>
                            </button>

                            {/* 操作按钮 */}
                            <div className="hidden group-hover:flex items-center gap-0.5">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onEditFolder(folder)
                                    }}
                                    className="glass-btn-base glass-btn-soft h-5 w-5 rounded flex items-center justify-center"
                                    title={t('editGroup')}
                                >
                                    <PencilIcon className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDeleteFolder(folder.id)
                                    }}
                                    className="glass-btn-base glass-btn-tone-danger h-5 w-5 rounded flex items-center justify-center"
                                    title={t('deleteGroup')}
                                >
                                    <TrashIcon className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {folders.length === 0 && (
                        <div className="text-xs text-[var(--glass-text-tertiary)] text-center py-4">
                            {t('noGroups')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
