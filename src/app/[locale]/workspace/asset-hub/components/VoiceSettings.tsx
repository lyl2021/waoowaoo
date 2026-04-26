'use client'

/**
 * 音色设置组件 - 从 CharacterCard 提取
 * 支持上传自定义音频和 AI 声音设计
 *
 * 重新设计：紧凑行布局，左侧状态指示 + 右侧操作图标（hover显示）
 * 有音色时：蓝色播放按钮 + "试听音色" 文字
 * 无音色时：淡黄色圆点 + "配音音色(无音色)"文字
 */

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { shouldShowError } from '@/lib/error-utils'
import { useUploadCharacterVoice } from '@/lib/query/mutations'
import { AppIcon } from '@/components/ui/icons'

interface VoiceSettingsProps {
    characterId: string
    characterName: string
    customVoiceUrl: string | null | undefined
    projectId?: string  // 可选，Asset Hub 不需要
    onVoiceChange?: (characterId: string, customVoiceUrl?: string) => void
    onVoiceDesign?: (characterId: string, characterName: string) => void
    onVoiceSelect?: (characterId: string) => void  // 从音色库选择
}

export default function VoiceSettings({
    characterId,
    characterName,
    customVoiceUrl,
    projectId,
    onVoiceChange,
    onVoiceDesign,
    onVoiceSelect,
}: VoiceSettingsProps) {
    const t = useTranslations('assetHub')
    // 🔥 使用 mutation hook
    const uploadVoice = useUploadCharacterVoice()
    void projectId
    const voiceFileInputRef = useRef<HTMLInputElement>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPreviewingVoice, setIsPreviewingVoice] = useState(false)
    type UploadedVoiceResult = { audioUrl?: string }

    const hasCustomVoice = !!customVoiceUrl

    // 预览音色（播放/暂停自定义音频）
    const handlePreviewVoice = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!customVoiceUrl) return

        // 如果正在播放，点击则暂停
        if (isPreviewingVoice && audioRef.current) {
            audioRef.current.pause()
            setIsPreviewingVoice(false)
            return
        }

        try {
            if (audioRef.current) {
                audioRef.current.pause()
            }
            const audio = new Audio(customVoiceUrl)
            audioRef.current = audio
            audio.play()
            audio.onended = () => setIsPreviewingVoice(false)
            audio.onerror = () => setIsPreviewingVoice(false)
            setIsPreviewingVoice(true)
        } catch (error: unknown) {
            if (shouldShowError(error)) {
                const message = error instanceof Error ? error.message : String(error)
                alert(t('voiceSettings.previewFailed', { error: message }))
            }
            setIsPreviewingVoice(false)
        }
    }

    // 上传自定义音频
    const handleUploadVoice = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        uploadVoice.mutate(
            { file, characterId },
            {
                onSuccess: (data) => {
                    const result = (data || {}) as UploadedVoiceResult
                    onVoiceChange?.(characterId, result.audioUrl)
                },
                onError: (error) => {
                    if (shouldShowError(error)) {
                        alert(t('voiceSettings.uploadFailed', { error: error.message }))
                    }
                },
                onSettled: () => {
                    if (voiceFileInputRef.current) {
                        voiceFileInputRef.current.value = ''
                    }
                }
            }
        )
    }

    const handleUploadClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        voiceFileInputRef.current?.click()
    }

    const handleDesignClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onVoiceDesign?.(characterId, characterName)
    }

    const handleSelectClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onVoiceSelect?.(characterId)
    }

    // 右侧操作图标（hover 时显示）- 固定尺寸撑开位置
    const actionIcons = (
        <div className="flex items-center gap-1">
            {/* 上传音频 */}
            <button
                onClick={handleUploadClick}
                disabled={uploadVoice.isPending}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[var(--glass-tone-info-bg)] text-[var(--glass-text-tertiary)] hover:text-[var(--glass-tone-info-fg)] transition-all disabled:opacity-50"
                title={hasCustomVoice ? t('voiceSettings.uploaded') : t('voiceSettings.uploadAudio')}
            >
                <AppIcon name="upload" className="w-3.5 h-3.5" />
            </button>

            {/* AI 声音设计 */}
            {onVoiceDesign && (
                <button
                    onClick={handleDesignClick}
                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[var(--glass-tone-info-bg)] text-[var(--glass-text-tertiary)] hover:text-[var(--glass-tone-info-fg)] transition-all"
                    title={t('voiceSettings.aiDesign')}
                >
                    <AppIcon name="bolt" className="w-3.5 h-3.5" />
                </button>
            )}

            {/* 从音色库选择 */}
            {onVoiceSelect && (
                <button
                    onClick={handleSelectClick}
                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[var(--glass-tone-info-bg)] text-[var(--glass-text-tertiary)] hover:text-[var(--glass-tone-info-fg)] transition-all"
                    title={t('voiceSettings.voiceLibrary')}
                >
                    <AppIcon name="folderCards" className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    )

    return (
        <>
            {/* 隐藏的音频文件输入 */}
            <input
                ref={voiceFileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleUploadVoice}
                className="hidden"
            />

            <div className="mt-2 flex items-center justify-between group/voice">
                {/* 左侧：状态指示器 */}
                <div className="flex items-center gap-2 min-w-0">
                    {hasCustomVoice ? (
                        /* 有音色：播放按钮（内嵌文字） */
                        <>
                            <button
                                onClick={handlePreviewVoice}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                    isPreviewingVoice
                                        ? 'bg-[var(--glass-tone-info-bg)] text-white'
                                        : 'bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] hover:brightness-90'
                                }`}
                                title={isPreviewingVoice ? t('voiceSettings.pause') : t('voiceSettings.preview')}
                            >
                                {isPreviewingVoice ? (
                                    <>
                                        <AppIcon name="pause" className="w-3 h-3" />
                                        <span>{t('voiceSettings.pause')}</span>
                                    </>
                                ) : (
                                    <>
                                        <AppIcon name="play" className="w-3 h-3" />
                                        <span>{t('voiceSettings.preview')}</span>
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        /* 无音色：淡黄色圆点 + 文字 */
                        <>
                            <div className="w-2 h-2 rounded-full bg-[#fcd34d] shrink-0" />
                            <span className="text-xs text-[#b45309]/70 whitespace-nowrap">
                                配音音色{`(无音色)`}
                            </span>
                        </>
                    )}
                </div>

                {/* 右侧：操作图标（hover 显示） */}
                <div className="opacity-0 group-hover/voice:opacity-100 transition-opacity">
                    {actionIcons}
                </div>
            </div>
        </>
    )
}
