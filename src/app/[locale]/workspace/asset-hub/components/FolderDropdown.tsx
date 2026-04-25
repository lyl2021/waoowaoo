'use client'

import { useTranslations } from 'next-intl'
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AppIcon } from '@/components/ui/icons'

interface Folder {
    id: string
    name: string
}

interface FolderDropdownProps {
    folders: Folder[]
    selectedFolderId: string | null
    onSelectFolder: (folderId: string | null) => void
    onCreateFolder: () => void
    onEditFolder: (folder: Folder) => void
    onDeleteFolder: (folderId: string) => void
}

export function FolderDropdown({
    folders,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onEditFolder,
    onDeleteFolder,
}: FolderDropdownProps) {
    const t = useTranslations('assetHub')
    const [open, setOpen] = useState(false)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)

    const selectedFolder = selectedFolderId
        ? folders.find((f) => f.id === selectedFolderId)
        : null

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

    return (
        <>
            <button
                ref={triggerRef}
                onClick={() => setOpen((prev) => !prev)}
                className="glass-btn-base glass-btn-secondary px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 min-w-[140px]"
            >
                <AppIcon name="folder" className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
                <span className="truncate max-w-[120px]">
                    {selectedFolder ? selectedFolder.name : t('allAssets')}
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
                    {/* 全部资产 */}
                    <button
                        onClick={() => handleSelect(null)}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer ${selectedFolderId === null
                            ? 'text-[var(--glass-tone-info-fg)] bg-[var(--glass-tone-info-bg)]'
                            : 'text-[var(--glass-text-primary)] hover:bg-[var(--glass-bg-muted)]'
                            }`}
                    >
                        <AppIcon name="folder" className="w-4 h-4" />
                        <span>{t('allAssets')}</span>
                        {selectedFolderId === null && (
                            <AppIcon name="check" className="w-4 h-4 ml-auto text-[var(--glass-tone-info-fg)]" />
                        )}
                    </button>

                    {folders.length > 0 && (
                        <div className="mx-3 my-1 h-px bg-[var(--glass-stroke-base)]" />
                    )}

                    {/* 文件夹列表 */}
                    {folders.map((folder) => (
                        <div
                            key={folder.id}
                            className="group flex items-center px-4 py-2.5 text-sm transition-colors cursor-pointer hover:bg-[var(--glass-bg-muted)]"
                        >
                            <button
                                onClick={() => handleSelect(folder.id)}
                                className={`flex-1 flex items-center gap-2.5 min-w-0 text-left ${selectedFolderId === folder.id
                                    ? 'text-[var(--glass-tone-info-fg)]'
                                    : 'text-[var(--glass-text-primary)]'
                                    }`}
                            >
                                <AppIcon name="folder" className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{folder.name}</span>
                                {selectedFolderId === folder.id && (
                                    <AppIcon name="check" className="w-4 h-4 ml-auto text-[var(--glass-tone-info-fg)]" />
                                )}
                            </button>
                            <div className="hidden group-hover:flex items-center gap-0.5 ml-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpen(false)
                                        onEditFolder(folder)
                                    }}
                                    className="glass-btn-base glass-btn-soft h-6 w-6 rounded flex items-center justify-center"
                                    title={t('editFolder')}
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
                                    title={t('deleteFolder')}
                                >
                                    <AppIcon name="trash" className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}

                    <div className="mx-3 my-1 h-px bg-[var(--glass-stroke-base)]" />

                    {/* 新建文件夹 */}
                    <button
                        onClick={() => {
                            setOpen(false)
                            onCreateFolder()
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--glass-text-primary)] hover:bg-[var(--glass-bg-muted)] transition-colors cursor-pointer"
                    >
                        <AppIcon name="plus" className="w-4 h-4 text-[var(--glass-tone-info-fg)]" />
                        <span>{t('newFolder')}</span>
                    </button>
                </div>,
                document.body,
            )}
        </>
    )
}
