'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useDeleteVoice } from '@/lib/query/mutations'
import { AppIcon } from '@/components/ui/icons'

// 标签样式：浅黄背景 / 长椭圆
const tagClass = 'shrink-0 text-[10px] px-3 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] leading-tight inline-flex items-center'

// 音色风格中文映射
const voiceTypeLabels: Record<string, string> = {
    'qwen-designed': 'AI设计音色',
    'custom': '自定义音色',
    'uploaded': '上传音色',
}

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

    // 音色风格中文标签
    const voiceTypeLabel = voiceTypeLabels[voice.voiceType]

    // 播放预览
    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation()
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

            {/* 信息区域 */}
            <div className="p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <AppIcon name="audioWave" className="w-4 h-4 text-[var(--glass-text-tertiary)] shrink-0" />
                        <h3 className="font-medium text-[var(--glass-text-primary)] text-sm truncate">{voice.name}</h3>
                        {voiceTypeLabel && (
                            <span className={tagClass}>{voiceTypeLabel}</span>
                        )}
                        {folderMap && (
                            <span className={tagClass}>
                                {voice.folderId ? folderMap[voice.folderId] : folderMap['']}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {!selectionMode && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true) }}
                                className="h-6 w-6 rounded-md flex items-center justify-center text-[var(--glass-tone-danger-fg)] opacity-0 group-hover:opacity-100 hover:bg-[var(--glass-tone-danger-bg)] transition-all"
                            >
                                <AppIcon name="trash" className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                {/* 试听音色按钮 - 单独一行 */}
                {voice.customVoiceUrl && (
                    <div className="mt-1.5">
                        <button
                            onClick={handlePlay}
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                                isPlaying
                                    ? 'bg-[var(--glass-tone-info-bg)] text-white'
                                    : 'bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] hover:brightness-90'
                            }`}
                        >
                            {isPlaying ? (
                                <>
                                    <AppIcon name="pause" className="w-2.5 h-2.5" />
                                    <span>{t('voiceSettings.pause')}</span>
                                </>
                            ) : (
                                <>
                                    <AppIcon name="play" className="w-2.5 h-2.5" />
                                    <span>{t('voiceSettings.preview')}</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
                <div className="mt-1 min-h-[3rem]">
                    <p className="text-xs text-[var(--glass-text-secondary)] line-clamp-3">
                        {voice.description || voice.voicePrompt || ''}
                    </p>
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
