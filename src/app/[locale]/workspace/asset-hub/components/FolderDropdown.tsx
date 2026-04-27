'use client'

import { useTranslations } from 'next-intl'
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AppIcon } from '@/components/ui/icons'

interface Group {
    id: string
    name: string
}

interface FolderDropdownProps {
    folders: Group[]
    selectedFolderId: string | null
    onSelectFolder: (folderId: string | null) => void
    onCreateFolder: () => void
    onEditFolder: (folder: Group) => void
    onDeleteFolder: (folderId: string) => void
    totalCount?: number
    defaultGroupCount?: number
    folderCounts?: Record<string, number>
}

export function FolderDropdown({
    folders,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onEditFolder,
    onDeleteFolder,
    totalCount,
    defaultGroupCount,
    folderCounts,
}: FolderDropdownProps) {
    const t = useTranslations('assetHub')
    const [open, setOpen] = useState(false)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)

    const getSelectedLabel = () => {
        if (selectedFolderId === null) {
            const total = totalCount ?? 0
            return `${t('allGroups')} [${total}]`
        }
        if (selectedFolderId === '__default__') {
            const count = defaultGroupCount ?? 0
            return `${t('defaultGroup')} [${count}]`
        }
        const folder = folders.find((f) => f.id === selectedFolderId)
        const count = folder ? (folderCounts?.[folder.id] ?? 0) : 0
        return folder ? `${folder.name} [${count}]` : `${t('allGroups')} [${totalCount ?? 0}]`
    }

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return
        const rect = triggerRef.current.getBoundingClientRect()
        setMenuPos({
            top: rect.bottom + 6,
            left: rect.left,
        })
    }, [])

    useEffect(() => {
        if (!open) return
        updatePosition()
        const handleClickOutside = (e: MouseEvent) => {
            if (
                triggerRef.current?.contains(e.target as Node) ||
                menuRef.current?.contains(e.target as Node)
            ) return
            setOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open, updatePosition])

    const handleSelect = (folderId: string | null) => {
        setOpen(false)
        onSelectFolder(folderId)
    }

    const isSelected = (folderId: string | null) => {
        return selectedFolderId === folderId
    }

    return (
        <>
            <button
                ref={triggerRef}
                onClick={() => setOpen((prev) => !prev)}
                className="glass-btn-base glass-btn-secondary px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 min-w-[140px]"
            >
                <AppIcon name="folder" className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
                <span className="truncate max-w-[120px]">
                    {getSelectedLabel()}
                </span>
                <AppIcon
                    name="chevronDown"
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && menuPos && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[9999] min-w-[200px] py-1.5 rounded-xl bg-white dark:bg-[#2c2c2e] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--glass-stroke-base)] animate-in fade-in-0 zoom-in-95 duration-150"
                    style={{ top: menuPos.top, left: menuPos.left }}
                >
                    {/* ── 全部分组 ── */}
                    <div
                        className={`flex items-center px-4 py-2.5 text-sm transition-colors cursor-pointer rounded-[10px] mx-1 ${isSelected(null) ? 'bg-[var(--glass-tone-info-bg)]' : 'hover:bg-[var(--glass-bg-muted)]'}`}
                    >
                        <button
                            onClick={() => handleSelect(null)}
                            className="flex-1 flex items-center gap-2 min-w-0 text-left text-[var(--glass-text-primary)]"
                        >
                            <AppIcon name="folder" className="w-4 h-4 flex-shrink-0" />
                            <span>{t('allGroups')}</span>
                            <span className="text-xs text-[var(--glass-text-tertiary)]">[{totalCount ?? 0}]</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setOpen(false)
                                onCreateFolder()
                            }}
                            className="glass-btn-base glass-btn-soft h-6 w-6 rounded flex items-center justify-center ml-auto shrink-0"
                            title={t('newGroup')}
                        >
                            <AppIcon name="plus" className="w-3 h-3" />
                        </button>
                    </div>

                    {/* ── 分割线 ── */}
                    <div className="mx-3 my-1 h-px bg-[var(--glass-stroke-base)]" />

                    {/* ── 默认分组 ── */}
                    <div
                        className={`flex items-center px-4 py-2.5 text-sm transition-colors cursor-pointer rounded-[10px] mx-1 ${isSelected('__default__') ? 'bg-[var(--glass-tone-info-bg)]' : 'hover:bg-[var(--glass-bg-muted)]'}`}
                    >
                        <button
                            onClick={() => handleSelect('__default__')}
                            className="flex-1 flex items-center gap-2 min-w-0 text-left text-[var(--glass-text-primary)]"
                        >
                            <AppIcon name="folder" className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{t('defaultGroup')}</span>
                            <span className="text-xs text-[var(--glass-text-tertiary)]">[{defaultGroupCount ?? 0}]</span>
                        </button>
                    </div>

                    {/* ── 自定义分组列表 ── */}
                    {folders.map((folder) => (
                        <div
                            key={folder.id}
                            className={`group flex items-center px-4 py-2.5 text-sm transition-colors cursor-pointer rounded-[10px] mx-1 ${isSelected(folder.id) ? 'bg-[var(--glass-tone-info-bg)]' : 'hover:bg-[var(--glass-bg-muted)]'}`}
                        >
                            <button
                                onClick={() => handleSelect(folder.id)}
                                className="flex-1 flex items-center gap-2 min-w-0 text-left text-[var(--glass-text-primary)]"
                            >
                                <AppIcon name="folder" className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{folder.name}</span>
                                <span className="text-xs text-[var(--glass-text-tertiary)]">[{folderCounts?.[folder.id] ?? 0}]</span>
                            </button>
                            <div className="hidden group-hover:flex items-center gap-0.5 ml-2 shrink-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpen(false)
                                        onEditFolder(folder)
                                    }}
                                    className="glass-btn-base glass-btn-soft h-6 w-6 rounded flex items-center justify-center"
                                    title={t('editGroup')}
                                >
                                    <AppIcon name="edit" className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpen(false)
                                        onDeleteFolder(folder.id)
                                    }}
                                    className="glass-btn-base glass-btn-tone-danger h-6 w-6 rounded flex items-center justify-center"
                                    title={t('deleteGroup')}
                                >
                                    <AppIcon name="trash" className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {folders.length === 0 && (
                        <div className="px-4 py-3 text-sm text-[var(--glass-text-tertiary)] text-center">
                            {t('noGroups')}
                        </div>
                    )}
                </div>,
                document.body,
            )}
        </>
    )
}
