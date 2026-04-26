'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useDeleteVoice } from '@/lib/query/mutations'
import { AppIcon } from '@/components/ui/icons'

interface Voice {
    id: string
    name: string
    description: string | null
    voiceId: string | null
    voiceType: string
    customVoiceUrl: string | null
    voicePrompt: string | null
    gender: string | null
    language: string
    folderId: string | null
}

interface VoiceCardProps {
    voice: Voice
    folderMap?: Record<string, string>
    onSelect?: (voice: Voice) => void  // 选择模式时使用
    isSelected?: boolean  // 是否被选中
    selectionMode?: boolean  // 是否在选择模式
}

export function VoiceCard({ voice, folderMap, onSelect, isSelected = false, selectionMode = false }: VoiceCardProps) {
    // 🔥 使用 mutation hook
    const deleteVoice = useDeleteVoice()
    const t = useTranslations('assetHub')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // 播放预览
    const handlePlay = () => {
        if (!voice.customVoiceUrl) return

        if (isPlaying && audioRef.current) {
            audioRef.current.pause()
            setIsPlaying(false)
            return
        }

        const audio = new Audio(voice.customVoiceUrl)
        audioRef.current = audio
        audio.onended = () => setIsPlaying(false)
        audio.onerror = () => setIsPlaying(false)
        audio.play()
        setIsPlaying(true)
    }

    // 删除音色
    const handleDelete = () => {
        deleteVoice.mutate(voice.id, {
            onSettled: () => setShowDeleteConfirm(false)
        })
    }

    // 选择模式点击
    const handleCardClick = () => {
        if (selectionMode && onSelect) {
            onSelect(voice)
        }
    }

    return (
        <div
            onClick={handleCardClick}
            className={`glass-surface overflow-hidden relative group transition-all ${selectionMode ? 'cursor-pointer hover:ring-2 hover:ring-[var(--glass-focus-ring-strong)]' : ''
                } ${isSelected ? 'ring-2 ring-[var(--glass-stroke-focus)]' : ''}`}
        >
            {/* 选中标记 */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 glass-chip glass-chip-info rounded-full flex items-center justify-center z-10 p-0">
                    <AppIcon name="checkSolid" className="w-4 h-4 text-white" />
                </div>
            )}

            {/* 音色卡片：紧凑行布局 */}
            <div className="flex items-center gap-3 p-3">
                {/* 播放按钮 */}
                {voice.customVoiceUrl ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); handlePlay() }}
                        className={`w-10 h-10 rounded-full glass-btn-base flex items-center justify-center shrink-0 transition-all ${isPlaying
                            ? 'glass-btn-tone-info animate-pulse'
                            : 'glass-btn-secondary text-[var(--glass-tone-info-fg)]'
                            }`}
                    >
                        {isPlaying ? (
                            <AppIcon name="pause" className="w-5 h-5" />
                        ) : (
                            <AppIcon name="play" className="w-5 h-5" />
                        )}
                    </button>
                ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--glass-bg-muted)] flex items-center justify-center shrink-0">
                        <AppIcon name="play" className="w-5 h-5 text-[var(--glass-text-tertiary)]" />
                    </div>
                )}

                {/* 名称和描述 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="font-medium text-[var(--glass-text-primary)] text-sm truncate">{voice.name}</h3>
                        {folderMap && (
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-[var(--glass-bg-muted)] text-[var(--glass-text-tertiary)] leading-tight">
                                {folderMap[voice.folderId ?? ''] || ''}
                            </span>
                        )}
                    </div>
                        {!selectionMode && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true) }}
                                className="glass-btn-base glass-btn-soft h-6 w-6 rounded-md text-[var(--glass-tone-danger-fg)] flex items-center justify-center opacity-0 group-hover:opacity-100 shrink-0"
                            >
                                <AppIcon name="trash" className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {voice.description && (
                        <p className="mt-0.5 text-xs text-[var(--glass-text-secondary)] line-clamp-2">{voice.description}</p>
                    )}
                    {voice.voicePrompt && !voice.description && (
                        <p className="mt-0.5 text-xs text-[var(--glass-text-tertiary)] line-clamp-2 italic">{voice.voicePrompt}</p>
                    )}
                </div>
            </div>

            {/* 删除确认 */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 glass-overlay flex items-center justify-center z-20">
                    <div className="glass-surface-modal p-4 m-4" onClick={(e) => e.stopPropagation()}>
                        <p className="mb-4 text-sm text-[var(--glass-text-primary)]">{t('confirmDeleteVoice')}</p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowDeleteConfirm(false)} className="glass-btn-base glass-btn-secondary px-3 py-1.5 rounded-lg text-sm">{t('cancel')}</button>
                            <button onClick={handleDelete} className="glass-btn-base glass-btn-danger px-3 py-1.5 rounded-lg text-sm">{t('delete')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VoiceCard
