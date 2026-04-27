'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AppIcon } from '@/components/ui/icons'

type StepStatus = 'empty' | 'active' | 'processing' | 'ready'

interface NavItemData {
    id: string
    icon: string
    label: string
    status: StepStatus
    href?: string  // 可选的链接地址
    disabled?: boolean  // 是否禁用（开发中）
    disabledLabel?: string  // 禁用时显示的提示文字
    count?: number  // 统计数（如分段数、镜头数）
}

interface CapsuleNavProps {
    items: NavItemData[]
    activeId: string
    onItemClick: (id: string) => void
    projectId?: string  // 用于构建链接
    episodeId?: string  // 用于构建链接
    className?: string  // 外部容器 className
    compact?: boolean   // 紧凑模式（类似 SegmentedControl 风格）
}

/**
 * NavItem - 胶囊导航单项
 * 支持左键点击切换、中键/Ctrl+点击在新标签页打开
 */
function NavItem({
    active,
    onClick,
    label,
    status,
    href,
    disabled,
    disabledLabel,
    count,
    compact
}: {
    active: boolean
    onClick: () => void
    label: string
    status: StepStatus
    href?: string
    disabled?: boolean
    disabledLabel?: string
    count?: number
    compact?: boolean
}) {
    const handleClick = (e: React.MouseEvent) => {
        if (disabled) return
        if (e.button === 1 || e.ctrlKey || e.metaKey) {
            if (href) {
                window.open(href, '_blank')
            }
            return
        }
        onClick()
    }

    const handleAuxClick = (e: React.MouseEvent) => {
        if (disabled) return
        if (e.button === 1 && href) {
            e.preventDefault()
            window.open(href, '_blank')
        }
    }

    return (
        <div className="relative group" data-nav-item>
            <button
                onClick={handleClick}
                onAuxClick={handleAuxClick}
                disabled={disabled}
                className={`
                    relative z-10 flex items-center justify-center gap-1 transition-colors duration-200
                    ${compact
                        ? 'px-3 py-1.5 text-[13px] rounded-[10px]'
                        : 'min-h-[52px] px-6 pt-3.5 pb-4'}
                    ${disabled
                        ? 'cursor-not-allowed'
                        : compact
                            ? active
                                ? 'text-[#1d1d1f] dark:text-white'
                                : 'text-[#86868b] hover:text-[#6e6e73]'
                            : active
                                ? 'text-[var(--glass-tone-info-fg)]'
                                : 'text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-primary)]'}
                    ${!disabled && 'cursor-pointer'}
                `}
            >
                {disabled ? (
                    <span className={`font-medium text-[var(--glass-text-tertiary)] opacity-80 ${compact ? 'text-[13px]' : 'text-base'}`}>
                        {label}{count !== undefined ? <span className="text-xs ml-1 opacity-60">[{count}]</span> : ''}
                    </span>
                ) : (
                    <span className={`font-semibold ${compact ? 'text-[13px]' : 'text-base'}`}>{label}{count !== undefined ? <span className="text-xs ml-1 text-[var(--glass-text-tertiary)]">[{count}]</span> : ''}</span>
                )}
                {/* 底部指示条 - 仅在非 compact 模式 */}
                {!compact && (
                    <span className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-300 ease-out
                        ${active
                            ? 'w-6 bg-gradient-to-r from-[var(--glass-accent-from)] to-[var(--glass-accent-to)] shadow-[0_2px_8px_var(--glass-accent-shadow-soft)]'
                            : 'w-0 bg-transparent'
                        }`}
                    />
                )}
                {status === 'ready' && !disabled && (
                    <span className={`rounded-full transition-colors
                        ${compact ? 'w-1 h-1 ml-0.5' : 'absolute top-2 right-2 w-1.5 h-1.5'}
                        ${active ? 'bg-[var(--glass-tone-info-fg)]' : 'bg-[var(--glass-tone-success-fg)]'}`}
                    />
                )}
                {status === 'processing' && !disabled && (
                    <span className={`rounded-full bg-[var(--glass-accent-from)] animate-pulse
                        ${compact ? 'w-1 h-1 ml-0.5' : 'absolute top-2 right-2 w-1.5 h-1.5'}`}
                    />
                )}
            </button>
            {disabled && disabledLabel && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    <div className="glass-surface-soft text-xs px-3 py-2 whitespace-nowrap text-[var(--glass-text-primary)]">
                        {disabledLabel}
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-[var(--glass-bg-surface-strong)] rotate-45 border-l border-t border-[var(--glass-stroke-base)]" />
                </div>
            )}
        </div>
    )
}


/**
 * CapsuleNav - 胶囊形态悬浮导航
 * compact 模式采用 SegmentedControl 风格的滑动 pill 指示器
 * 支持中键和Ctrl+点击在新标签页打开
 */
export function CapsuleNav({ items, activeId, onItemClick, projectId, episodeId, className, compact }: CapsuleNavProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

    // compact 模式：计算滑动 pill 指示器位置
    useEffect(() => {
        if (!compact || !containerRef.current) return
        const activeIndex = items.findIndex((item) => item.id === activeId)
        const buttons = containerRef.current.querySelectorAll<HTMLElement>('[data-nav-item]')
        const activeButton = buttons[activeIndex]
        if (activeButton) {
            setIndicator({ left: activeButton.offsetLeft, width: activeButton.offsetWidth })
        }
    }, [compact, activeId, items])

    // 构建每个导航项的链接地址
    const buildHref = (stageId: string): string | undefined => {
        if (!projectId) return undefined
        const params = new URLSearchParams()
        params.set('stage', stageId)
        if (episodeId) {
            params.set('episode', episodeId)
        }
        return `/workspace/${projectId}?${params.toString()}`
    }

    if (compact) {
        return (
            <nav className={className}>
                <div className="rounded-xl p-[3px] bg-[#e8e8ed] dark:bg-[#1c1c1e] inline-block">
                    <div ref={containerRef} className="relative inline-grid grid-flow-col auto-cols-[minmax(0,max-content)]">
                        {/* 滑动 pill 指示器 */}
                        <div
                            className="absolute top-0 bottom-0 rounded-[10px] bg-white dark:bg-[#3a3a3c] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                            style={{ left: indicator.left, width: indicator.width }}
                        />
                        {items.map((item) => (
                            <NavItem
                                key={item.id}
                                active={activeId === item.id}
                                onClick={() => onItemClick(item.id)}
                                label={item.label}
                                status={item.status}
                                href={buildHref(item.id)}
                                disabled={item.disabled}
                                disabledLabel={item.disabledLabel}
                                count={item.count}
                                compact
                            />
                        ))}
                    </div>
                </div>
            </nav>
        )
    }

    return (
        <nav className={className}>
            <div
                className="flex rounded-full px-2 py-1"
                style={{
                    background: 'rgba(255,255,255,0.55)',
                    backdropFilter: 'blur(24px) saturate(1.6)',
                    WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
                    border: '1px solid rgba(255,255,255,0.45)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.06), 0 1.5px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.7)',
                }}
            >
                {items.map((item) => (
                    <NavItem
                        key={item.id}
                        active={activeId === item.id}
                        onClick={() => onItemClick(item.id)}
                        label={item.label}
                        status={item.status}
                        href={buildHref(item.id)}
                        disabled={item.disabled}
                        disabledLabel={item.disabledLabel}
                        count={item.count}
                    />
                ))}
            </div>
        </nav>
    )
}

/**
 * EpisodeSelector - 剧集选择器
 */
interface Episode {
    id: string
    title: string
    episodeNumber?: number
    summary?: string
    status?: {
        story?: StepStatus
        script?: StepStatus
        visual?: StepStatus
    }
}

interface EpisodeSelectorProps {
    episodes: Episode[]
    currentId: string
    onSelect: (id: string) => void
    onAdd?: () => void
    onRename?: (id: string, newName: string) => void
    onDelete?: (id: string) => void
    projectName?: string  // 项目名称，显示在左上角
    className?: string    // 外部容器 className
}

export function EpisodeSelector({
    episodes,
    currentId,
    onSelect,
    onAdd,
    onRename,
    onDelete,
    projectName,
    className
}: EpisodeSelectorProps) {
    const t = useTranslations('common')
    const [isOpen, setIsOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const currentEp = episodes.find(e => e.id === currentId) || episodes[0]
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (!currentEp) return null

    return (
        <div className={`relative ${className || ''}`} ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="glass-btn-base glass-btn-secondary flex items-center gap-2 px-3 py-1.5 transition-all group"
                style={{ borderRadius: '1.5rem' }}
            >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--glass-bg-muted)]">
                    <AppIcon name="film" className="w-4 h-4 text-[var(--glass-text-primary)]" />
                </div>
                <div className="flex items-center text-left mr-1 gap-1.5">
                    {currentEp.episodeNumber != null && (
                        <span className="text-sm font-semibold text-[var(--glass-text-primary)] whitespace-nowrap">
                            {t('episode')}{currentEp.episodeNumber}
                        </span>
                    )}
                    <span className="text-sm text-[var(--glass-text-secondary)] truncate max-w-[140px]">
                        {currentEp.title}
                    </span>
                </div>
                <AppIcon name="chevronDown" className={`w-4 h-4 text-[var(--glass-text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="glass-surface-modal absolute left-0 top-full mt-2 origin-top-left p-2 animate-fadeIn z-50" style={{ minWidth: '18rem' }}>
                    {/* 新建剧集按钮 - 置于顶部 */}
                    {onAdd && (
                        <>
                            <button
                                onClick={() => { onAdd(); setIsOpen(false); }}
                                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-[var(--glass-tone-info-fg)] hover:bg-[var(--glass-tone-info-bg)] font-medium text-sm transition-colors"
                            >
                                <span className="text-lg leading-none">+</span> {t('newEpisode')}
                            </button>
                            <div className="h-px bg-[var(--glass-bg-muted)] my-2" />
                        </>
                    )}
                    <div className="max-h-[300px] overflow-y-auto app-scrollbar space-y-1">
                        {episodes.map(ep => {
                            // 编辑模式
                            if (editingId === ep.id) {
                                return (
                                    <div key={ep.id} className="flex items-center gap-2 p-3 rounded-xl bg-[var(--glass-tone-info-bg)] border border-[var(--glass-stroke-focus)]">
                                        <AppIcon name="film" className="w-4 h-4 text-[var(--glass-text-tertiary)] shrink-0" />
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && editingName.trim()) {
                                                    onRename?.(ep.id, editingName.trim())
                                                    setEditingId(null)
                                                } else if (e.key === 'Escape') {
                                                    setEditingId(null)
                                                }
                                            }}
                                            className="flex-1 px-2 py-1 text-sm border border-[var(--glass-stroke-focus)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--glass-focus-ring-strong)]"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => {
                                                if (editingName.trim()) {
                                                    onRename?.(ep.id, editingName.trim())
                                                }
                                                setEditingId(null)
                                            }}
                                            className="w-7 h-7 rounded-lg bg-[var(--glass-accent-from)] text-white hover:bg-[var(--glass-accent-to)] flex items-center justify-center"
                                        >
                                            <AppIcon name="check" className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="w-7 h-7 rounded-lg bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-surface-strong)] flex items-center justify-center"
                                        >
                                            <AppIcon name="close" className="w-4 h-4" />
                                        </button>
                                    </div>
                                )
                            }

                            // 删除确认模式
                            if (deletingId === ep.id) {
                                return (
                                    <div key={ep.id} className="flex items-center gap-2 p-3 rounded-xl bg-[var(--glass-tone-danger-bg)] border border-[var(--glass-tone-danger-fg)]/30">
                                        <div className="flex-1 text-sm font-medium text-[var(--glass-tone-danger-fg)] truncate">
                                            {t('deleteEpisode')}：{ep.title}
                                        </div>
                                        <button
                                            onClick={() => {
                                                onDelete?.(ep.id)
                                                setDeletingId(null)
                                                setIsOpen(false)
                                            }}
                                            className="px-2 py-1 rounded-lg bg-[var(--glass-tone-danger-fg)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
                                        >
                                            {t('deleteEpisodeConfirm')}
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(null)}
                                            className="w-7 h-7 rounded-lg bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-surface-strong)] flex items-center justify-center"
                                        >
                                            <AppIcon name="close" className="w-4 h-4" />
                                        </button>
                                    </div>
                                )
                            }

                            return (
                                <div
                                    key={ep.id}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${ep.id === currentId
                                        ? 'bg-[var(--glass-tone-info-bg)] border border-[var(--glass-stroke-focus)]'
                                        : 'hover:bg-[var(--glass-bg-muted)] border border-transparent'
                                        }`}
                                >
                                    <button
                                        onClick={() => { onSelect(ep.id); setIsOpen(false); }}
                                        className="flex-1 flex items-center gap-3 text-left"
                                    >
                                        <AppIcon name="film" className="w-4 h-4 text-[var(--glass-text-tertiary)] shrink-0" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                {ep.episodeNumber != null && (
                                                    <span className="text-xs font-bold text-[var(--glass-tone-info-fg)] bg-[var(--glass-tone-info-bg)] px-1.5 py-0.5 rounded-md shrink-0">
                                                        {t('episode')}{ep.episodeNumber}
                                                    </span>
                                                )}
                                                <div className="font-bold text-[var(--glass-text-primary)] text-sm truncate">{ep.title}</div>
                                            </div>
                                            {ep.summary && (
                                                <div className="text-xs text-[var(--glass-text-tertiary)] truncate">{ep.summary}</div>
                                            )}
                                        </div>
                                        {ep.id === currentId && (
                                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)]">
                                                <AppIcon name="checkDot" className="h-2.5 w-2.5" />
                                            </span>
                                        )}
                                    </button>
                                    {onRename && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setEditingId(ep.id)
                                                setEditingName(ep.title)
                                            }}
                                            className="w-7 h-7 rounded-lg hover:bg-[var(--glass-bg-surface-strong)] flex items-center justify-center text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)] transition-colors"
                                            title={t('editEpisodeName')}
                                        >
                                            <AppIcon name="edit" className="w-4 h-4" />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setDeletingId(ep.id)
                                            }}
                                            className="w-7 h-7 rounded-lg hover:bg-[var(--glass-tone-danger-bg)] flex items-center justify-center text-[var(--glass-text-tertiary)] hover:text-[var(--glass-tone-danger-fg)] transition-colors"
                                            title={t('deleteEpisode')}
                                        >
                                            <AppIcon name="trash" className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default CapsuleNav
