'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { AppIcon } from '@/components/ui/icons'

interface AddAssetDropdownProps {
    onAddCharacter: () => void
    onAddLocation: () => void
    onAddProp: () => void
    onAddVoice: () => void
    onImport: () => void
    onExport: () => void
    isExporting?: boolean
}

export function AddAssetDropdown({
    onAddCharacter,
    onAddLocation,
    onAddProp,
    onAddVoice,
    onImport,
    onExport,
    isExporting,
}: AddAssetDropdownProps) {
    const t = useTranslations('assetHub')
    const [open, setOpen] = useState(false)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return
        const rect = triggerRef.current.getBoundingClientRect()
        setMenuPos({
            top: rect.bottom + 6,
            right: window.innerWidth - rect.right,
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

    const handleSelect = (action: () => void) => {
        setOpen(false)
        action()
    }

    const menuItems = [
        { label: t('addCharacter'), icon: 'user' as const, action: onAddCharacter },
        { label: t('addLocation'), icon: 'mountain' as const, action: onAddLocation },
        { label: t('addProp'), icon: 'package' as const, action: onAddProp },
        { label: t('addVoice'), icon: 'audioWave' as const, action: onAddVoice },
    ]

    return (
        <>
            <button
                ref={triggerRef}
                onClick={() => setOpen((prev) => !prev)}
                className="glass-btn-base glass-btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
            >
                <AppIcon name="plus" className="w-4 h-4" />
                <span>{t('addAsset')}</span>
                <AppIcon
                    name="chevronDown"
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && menuPos && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[9999] min-w-[160px] py-1.5 rounded-xl bg-white dark:bg-[#2c2c2e] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--glass-stroke-base)] animate-in fade-in-0 zoom-in-95 duration-150"
                    style={{ top: menuPos.top, right: menuPos.right }}
                >
                    {menuItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => handleSelect(item.action)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--glass-text-primary)] hover:bg-[var(--glass-bg-muted)] transition-colors cursor-pointer"
                        >
                            <AppIcon name={item.icon} className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
                            <span>{item.label}</span>
                        </button>
                    ))}

                    {/* Separator */}
                    <div className="mx-3 my-1.5 h-px bg-[var(--glass-stroke-base)]" />

                    {/* Import */}
                    <button
                        onClick={() => handleSelect(onImport)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--glass-text-primary)] hover:bg-[var(--glass-bg-muted)] transition-colors cursor-pointer"
                    >
                        <AppIcon name="upload" className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
                        <span>{t('importAsset')}</span>
                    </button>

                    {/* Export */}
                    <button
                        onClick={() => handleSelect(onExport)}
                        disabled={isExporting}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--glass-text-primary)] hover:bg-[var(--glass-bg-muted)] transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <AppIcon name={isExporting ? 'refresh' : 'download'} className={`w-4 h-4 text-[var(--glass-text-tertiary)] ${isExporting ? 'animate-spin' : ''}`} />
                        <span>{isExporting ? t('downloading') : t('exportAsset')}</span>
                    </button>
                </div>,
                document.body,
            )}
        </>
    )
}
