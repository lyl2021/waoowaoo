'use client'
import { logInfo as _ulogInfo } from '@/lib/logging/core'
import { resolveErrorDisplay } from '@/lib/errors/display'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
    useGenerateCharacterImage,
    useSelectCharacterImage,
    useUndoCharacterImage,
    useUploadCharacterImage,
    useDeleteCharacter,
    useDeleteCharacterAppearance,
    useUploadCharacterVoice
} from '@/lib/query/mutations'
import { useRefreshGlobalAssets } from '@/lib/query/hooks'
import VoiceSettings from './VoiceSettings'
import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import TaskStatusOverlay from '@/components/task/TaskStatusOverlay'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import ImageGenerationInlineCountButton from '@/components/image-generation/ImageGenerationInlineCountButton'
import { PRIMARY_APPEARANCE_INDEX } from '@/lib/constants'
import { getImageGenerationCountOptions } from '@/lib/image-generation/count'
import { useImageGenerationCount } from '@/lib/image-generation/use-image-generation-count'
import { AppIcon } from '@/components/ui/icons'

// 统一工具按钮样式：透明背景，默认灰色，悬停浅蓝背景+蓝色图标（与音色区域按钮一致）
const toolBtnClass = 'w-6 h-6 rounded-md flex items-center justify-center bg-transparent hover:bg-[var(--glass-tone-info-bg)] text-[var(--glass-text-tertiary)] hover:text-[var(--glass-tone-info-fg)] transition-all disabled:opacity-50 cursor-pointer'

// 标签样式：浅黄背景 / 长椭圆
const tagClass = 'shrink-0 text-[10px] px-3 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] leading-tight inline-flex items-center'

interface Appearance {
    id: string
    appearanceIndex: number
    changeReason: string
    artStyle?: string | null
    description: string | null
    imageUrl: string | null
    imageUrls: string[]
    selectedIndex: number | null
    previousImageUrl: string | null
    previousImageUrls: string[]
    imageTaskRunning: boolean
    lastError?: { code: string; message: string } | null
}

interface Character {
    id: string
    name: string
    folderId: string | null
    customVoiceUrl: string | null
    appearances: Appearance[]
}

interface CharacterCardProps {
    character: Character
    assetType?: 'character' | 'location' | 'prop'
    folderMap?: Record<string, string>
    onImageClick?: (url: string) => void
    onImageEdit?: (type: 'character' | 'location', id: string, name: string, imageIndex: number, appearanceIndex?: number) => void
    onVoiceDesign?: (characterId: string, characterName: string) => void
    onEdit?: (character: Character, appearance: Appearance) => void
    onVoiceSelect?: (characterId: string) => void
}

// 类型图标映射
const typeIconMap = {
    character: 'user' as const,
    location: 'mountain' as const,
    prop: 'package' as const,
}

export function CharacterCard({ character, assetType = 'character', folderMap, onImageClick, onImageEdit, onVoiceDesign, onEdit, onVoiceSelect }: CharacterCardProps) {
    // 🔥 使用 mutation hooks
    const generateImage = useGenerateCharacterImage()
    const selectImage = useSelectCharacterImage()
    const undoImage = useUndoCharacterImage()
    const uploadImage = useUploadCharacterImage()
    const deleteCharacter = useDeleteCharacter()
    const deleteAppearance = useDeleteCharacterAppearance()
    const uploadVoice = useUploadCharacterVoice()
    const onRefresh = useRefreshGlobalAssets()

    const t = useTranslations('assetHub')
    const tAssets = useTranslations('assets')
    const { count: generationCount, setCount: setGenerationCount } = useImageGenerationCount('character')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const voiceInputRef = useRef<HTMLInputElement>(null)

    const [activeAppearance, setActiveAppearance] = useState(0)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showDeleteMenu, setShowDeleteMenu] = useState(false)
    const [showRefreshConfirm, setShowRefreshConfirm] = useState(false)
    const latestSelectRequestRef = useRef(0)
    const [pendingSelectedIndex, setPendingSelectedIndex] = useState<number | null | undefined>(undefined)

    // 计算属性
    const appearance = character.appearances[activeAppearance] || character.appearances[0]
    const isPrimaryAppearance = appearance?.appearanceIndex === PRIMARY_APPEARANCE_INDEX
    const appearanceCount = character.appearances.length

    // URL 验证函数
    const isValidUrl = (url: string | null | undefined): boolean => {
        if (!url || url.trim() === '') return false
        if (url.startsWith('/')) return true
        if (url.startsWith('data:') || url.startsWith('blob:')) return true
        try { new URL(url); return true } catch { return false }
    }

    const imageUrls = appearance?.imageUrls || []
    const generatedImageCount = imageUrls.filter(u => isValidUrl(u)).length
    const hasMultipleImages = generatedImageCount > 1
    const serverSelectedIndex: number | null = appearance?.selectedIndex ?? null
    const resolvedSelectedIndex: number | null = pendingSelectedIndex !== undefined ? pendingSelectedIndex : serverSelectedIndex
    // 多图时默认选中方案1，避免需要先点击才出现确认按钮
    const effectiveSelectedIndex: number | null = hasMultipleImages && resolvedSelectedIndex === null ? 0 : resolvedSelectedIndex

    // 同步：当服务端数据追上时清除 pending 状态
    useEffect(() => {
        if (pendingSelectedIndex !== undefined && serverSelectedIndex === pendingSelectedIndex) {
            setPendingSelectedIndex(undefined)
        }
    }, [serverSelectedIndex, pendingSelectedIndex])
    const currentImageUrl = appearance?.imageUrl || (effectiveSelectedIndex !== null ? imageUrls[effectiveSelectedIndex] : null) || imageUrls.find(u => u) || null
    const hasPreviousVersion = !!(appearance?.previousImageUrl || (appearance?.previousImageUrls && appearance.previousImageUrls.length > 0))

    const displayImageUrl = isValidUrl(currentImageUrl) ? currentImageUrl : null
    const serverTaskRunning = !!appearance?.imageTaskRunning
    const transientSubmitting = generateImage.isPending
    const isAppearanceTaskRunning = serverTaskRunning || transientSubmitting
    const taskErrorDisplay = !isAppearanceTaskRunning && appearance?.lastError
        ? resolveErrorDisplay(appearance.lastError)
        : null
    const displayTaskPresentation = isAppearanceTaskRunning
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: displayImageUrl ? 'process' : 'generate',
            resource: 'image',
            hasOutput: !!displayImageUrl,
        })
        : null
    const selectImageRunningState = selectImage.isPending
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: 'process',
            resource: 'image',
            hasOutput: !!displayImageUrl,
        })
        : null

    // 生成图片
    const handleGenerate = (count = generationCount) => {
        setShowRefreshConfirm(false)
        generateImage.mutate(
            {
                characterId: character.id,
                appearanceIndex: appearance.appearanceIndex,
                artStyle: appearance.artStyle || undefined,
                count,
            },
            { onError: (error) => alert(error.message || t('generateFailed')) }
        )
    }

    // 选择图片（依赖 query 缓存乐观更新）
    const handleSelectImage = (imageIndex: number | null) => {
        if (imageIndex === effectiveSelectedIndex) return
        setPendingSelectedIndex(imageIndex)
        const requestId = latestSelectRequestRef.current + 1
        latestSelectRequestRef.current = requestId
        selectImage.mutate({
            characterId: character.id,
            appearanceIndex: appearance.appearanceIndex,
            imageIndex,
            confirm: false
        }, {
            onError: (error) => {
                if (latestSelectRequestRef.current !== requestId) return
                alert(error.message || t('selectFailed'))
            }
        })
    }

    // 确认选择
    const handleConfirmSelection = () => {
        const requestId = latestSelectRequestRef.current + 1
        latestSelectRequestRef.current = requestId
        selectImage.mutate({
            characterId: character.id,
            appearanceIndex: appearance.appearanceIndex,
            imageIndex: effectiveSelectedIndex,
            confirm: true
        }, {
            onError: (error) => {
                if (latestSelectRequestRef.current !== requestId) return
                alert(error.message || t('selectFailed'))
            }
        })
    }

    // 撤回
    const handleUndo = () => {
        undoImage.mutate({ characterId: character.id, appearanceIndex: appearance.appearanceIndex })
    }

    // 上传图片
    const handleUpload = () => {
        const file = fileInputRef.current?.files?.[0]
        if (!file) return

        uploadImage.mutate(
            {
                file,
                characterId: character.id,
                appearanceIndex: appearance.appearanceIndex,
                labelText: `${character.name} - ${appearance.changeReason}`,
                imageIndex: effectiveSelectedIndex ?? undefined
            },
            {
                onError: (error) => alert(error.message || t('uploadFailed')),
                onSettled: () => {
                    if (fileInputRef.current) fileInputRef.current.value = ''
                }
            }
        )
    }

    // 删除角色
    const handleDelete = () => {
        deleteCharacter.mutate(character.id, {
            onSettled: () => {
                setShowDeleteConfirm(false)
                onRefresh()
            }
        })
    }

    // 删除子形象
    const handleDeleteAppearance = () => {
        deleteAppearance.mutate(
            { characterId: character.id, appearanceIndex: appearance.appearanceIndex },
            {
                onSuccess: () => setActiveAppearance(0),
                onSettled: () => setShowDeleteMenu(false)
            }
        )
    }

    // 上传音色
    const handleUploadVoice = () => {
        const file = voiceInputRef.current?.files?.[0]
        if (!file) return

        uploadVoice.mutate(
            { file, characterId: character.id },
            {
                onSettled: () => {
                    if (voiceInputRef.current) voiceInputRef.current.value = ''
                }
            }
        )
    }

    // 刷新确认 - 触发
    const handleRefreshClick = () => {
        setShowRefreshConfirm(true)
    }

    // 类型图标
    const typeIconName: 'user' | 'mountain' | 'package' = typeIconMap[assetType] ?? 'user'
    const TypeIcon = () => (
        <AppIcon
            name={typeIconName}
            className="w-4 h-4 text-[var(--glass-text-tertiary)]"
        />
    )

    // 多图选择模式
    if (hasMultipleImages) {
        return (
            <div className="col-span-full glass-surface p-4 relative">
                {/* 隐藏输入 */}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <input ref={voiceInputRef} type="file" accept="audio/*" onChange={handleUploadVoice} className="hidden" />

                {/* 顶部：名字 + 操作 */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <TypeIcon />
                        <span className="text-sm font-semibold text-[var(--glass-text-primary)]">{character.name}</span>
                        <span className="glass-chip glass-chip-neutral px-2 py-0.5 text-xs">{appearance.changeReason}</span>
                        {isPrimaryAppearance ? (
                            <span className="glass-chip glass-chip-success px-2 py-0.5 text-xs">{tAssets('character.primary')}</span>
                        ) : (
                            <span className="glass-chip glass-chip-info px-2 py-0.5 text-xs">{tAssets('character.secondary')}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <ImageGenerationInlineCountButton
                            prefix={isAppearanceTaskRunning ? (
                                <>
                                    <TaskStatusInline state={displayTaskPresentation} className="[&_span]:sr-only [&_svg]:text-[var(--glass-tone-info-fg)]" />
                                    <span className="text-[10px] font-medium text-[var(--glass-tone-info-fg)]">{tAssets('image.regenCountPrefix')}</span>
                                </>
                            ) : (
                                <>
                                    <AppIcon name="refresh" className="w-4 h-4 text-[var(--glass-tone-info-fg)]" />
                                    <span className="text-[10px] font-medium text-[var(--glass-tone-info-fg)]">{tAssets('image.regenCountPrefix')}</span>
                                </>
                            )}
                            value={generationCount}
                            options={getImageGenerationCountOptions('character')}
                            onValueChange={setGenerationCount}
                            onClick={() => handleRefreshClick()}
                            disabled={isAppearanceTaskRunning}
                            showCountControl={false}
                            ariaLabel={tAssets('image.regenCountPrefix')}
                            className="inline-flex h-6 items-center justify-center gap-1 rounded-md px-1.5 hover:bg-[var(--glass-tone-info-bg)] transition-colors disabled:opacity-50"
                        />
                        {hasPreviousVersion && (
                            <button onClick={handleUndo} className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-[var(--glass-tone-info-bg)] transition-colors" title={tAssets('image.undo')}>
                                <AppIcon name="sparkles" className="w-4 h-4 text-[var(--glass-tone-info-fg)]" />
                            </button>
                        )}
                        <button onClick={(e) => {
                            e.stopPropagation()
                            _ulogInfo('[CharacterCard] 多图模式 - 删除按钮点击, characterId:', character.id, 'appearanceCount:', appearanceCount, 'showDeleteMenu:', showDeleteMenu)
                            if (appearanceCount <= 1) {
                                setShowDeleteConfirm(true)
                                return
                            }
                            setShowDeleteMenu(!showDeleteMenu)
                        }} className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-[var(--glass-tone-danger-bg)] transition-colors">
                            <AppIcon name="trash" className="w-4 h-4 text-[var(--glass-tone-danger-fg)]" />
                        </button>
                    </div>
                </div>

                {/* 任务失败错误提示 */}
                {taskErrorDisplay && !isAppearanceTaskRunning && (
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-[var(--glass-danger-ring)] text-[var(--glass-tone-danger-fg)]">
                        <AppIcon name="alert" className="w-4 h-4 shrink-0" />
                        <span className="text-xs line-clamp-2">{taskErrorDisplay.message}</span>
                    </div>
                )}

                {/* 图片列表 */}
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {imageUrls.map((url, index) => {
                        if (!isValidUrl(url)) return null
                        const validUrl = url as string
                        const isSelected = effectiveSelectedIndex === index
                        return (
                            <div key={index} className="relative group/thumb">
                                <div
                                    onClick={() => onImageClick?.(validUrl)}
                                    className={`rounded-lg overflow-hidden border-2 cursor-zoom-in transition-all ${isSelected ? 'border-[var(--glass-stroke-success)] ring-2 ring-[var(--glass-success-ring)]' : 'border-[var(--glass-stroke-base)] hover:border-[var(--glass-stroke-focus)]'}`}
                                >
                                    <MediaImageWithLoading
                                        src={validUrl}
                                        alt={`${character.name} ${index + 1}`}
                                        containerClassName="w-full min-h-[96px]"
                                        className="w-full h-auto object-contain"
                                    />
                                    <div className={`absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded ${isSelected ? 'glass-chip glass-chip-success' : 'glass-chip glass-chip-neutral'}`}>
                                        {tAssets('image.optionNumber', { number: index + 1 })}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleSelectImage(isSelected ? null : index) }}
                                    className={`absolute top-2 right-2 glass-btn-base w-7 h-7 rounded-full flex items-center justify-center ${isSelected ? 'glass-btn-tone-success' : 'glass-btn-secondary'}`}
                                >
                                    <AppIcon name="check" className="w-4 h-4" />
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* 确认按钮 */}
                {effectiveSelectedIndex !== null && (
                    <div className="mt-4 flex justify-end">
                        <button onClick={handleConfirmSelection} disabled={selectImage.isPending} className="glass-btn-base glass-btn-tone-success px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                            {selectImage.isPending ? (
                                <TaskStatusInline state={selectImageRunningState} className="text-white [&>span]:sr-only [&_svg]:text-white" />
                            ) : (
                                <AppIcon name="check" className="w-4 h-4" />
                            )}
                            {tAssets('image.confirmOption', { number: effectiveSelectedIndex + 1 })}
                        </button>
                    </div>
                )}

                {/* 音色设置 */}
                <VoiceSettings
                    characterId={character.id}
                    characterName={character.name}
                    customVoiceUrl={character.customVoiceUrl}
                    onVoiceDesign={onVoiceDesign}
                    onVoiceSelect={onVoiceSelect}
                />

                {/* 删除菜单 */}
                {showDeleteMenu && appearanceCount > 1 && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowDeleteMenu(false)} />
                        <div className="absolute right-4 top-12 z-20 glass-surface-modal py-1 min-w-[120px]">
                            <button onClick={handleDeleteAppearance} className="glass-btn-base glass-btn-soft w-full justify-start rounded-none px-3 py-1.5 text-left text-xs">{tAssets('image.deleteThis')}</button>
                            <button onClick={() => { setShowDeleteMenu(false); setShowDeleteConfirm(true) }} className="glass-btn-base glass-btn-soft w-full justify-start rounded-none px-3 py-1.5 text-left text-xs text-[var(--glass-tone-danger-fg)]">{tAssets('character.deleteWhole')}</button>
                        </div>
                    </>
                )}

                {/* 删除确认对话框 - 多图模式也需要 */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50">
                        <div className="glass-surface-modal p-4 m-4 max-w-sm">
                            <p className="mb-4 text-sm text-[var(--glass-text-primary)]">{t('confirmDeleteCharacter')}</p>
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setShowDeleteConfirm(false)} className="glass-btn-base glass-btn-secondary px-3 py-1.5 rounded-lg text-sm">{t('cancel')}</button>
                                <button onClick={handleDelete} disabled={deleteCharacter.isPending} className="glass-btn-base glass-btn-danger px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed">{t('delete')}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 刷新确认对话框 */}
                {showRefreshConfirm && (
                    <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50">
                        <div className="glass-surface-modal p-4 m-4 max-w-sm">
                            <p className="mb-4 text-sm text-[var(--glass-text-primary)]">{tAssets('image.confirmRefresh')}</p>
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setShowRefreshConfirm(false)} className="glass-btn-base glass-btn-secondary px-3 py-1.5 rounded-lg text-sm">{t('cancel')}</button>
                                <button onClick={() => handleGenerate(generatedImageCount)} disabled={isAppearanceTaskRunning} className="glass-btn-base glass-btn-tone-info px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">{tAssets('image.refresh')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // 单图模式
    return (
        <div className="glass-surface overflow-hidden relative group">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            <input ref={voiceInputRef} type="file" accept="audio/*" onChange={handleUploadVoice} className="hidden" />

            {/* 图片区域 */}
            <div className="relative aspect-square bg-[var(--glass-bg-muted)]">
                {displayImageUrl ? (
                    <>
                        <MediaImageWithLoading
                            src={displayImageUrl}
                            alt={character.name}
                            containerClassName="h-full w-full"
                            className="h-full w-full object-contain cursor-zoom-in"
                            onClick={() => onImageClick?.(displayImageUrl)}
                        />
                        {/* 操作按钮 - 非生成时显示 */}
                        {!isAppearanceTaskRunning && (
                            <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => fileInputRef.current?.click()} disabled={uploadImage.isPending} className={toolBtnClass}>
                                    <AppIcon name="upload" className="w-4 h-4" />
                                </button>
                                <button onClick={() => onImageEdit?.('character', character.id, character.name, effectiveSelectedIndex ?? 0, appearance.appearanceIndex)} className={toolBtnClass}>
                                    <AppIcon name="imageEdit" className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleRefreshClick()} className={toolBtnClass}>
                                    <AppIcon name="refresh" className="w-4 h-4" />
                                </button>
                                {hasPreviousVersion && (
                                    <button onClick={handleUndo} className={toolBtnClass}>
                                        <AppIcon name="sparkles" className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center px-4 py-6 text-[var(--glass-text-tertiary)]">
                        <AppIcon name="image" className="w-12 h-12 mb-3" />
                        <ImageGenerationInlineCountButton
                            prefix={<span>{tAssets('image.generateCountPrefix')}</span>}
                            suffix={<span>{tAssets('image.generateCountSuffix')}</span>}
                            value={generationCount}
                            options={getImageGenerationCountOptions('character')}
                            onValueChange={setGenerationCount}
                            onClick={() => handleGenerate(generationCount)}
                            ariaLabel={tAssets('image.selectCount')}
                            className="glass-btn-base glass-btn-primary flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg"
                            selectClassName="appearance-none bg-transparent border-0 pl-0 pr-3 text-sm font-semibold text-current outline-none cursor-pointer leading-none transition-colors"
                        />
                    </div>
                )}
                {isAppearanceTaskRunning && (
                    <TaskStatusOverlay state={displayTaskPresentation} />
                )}
                {taskErrorDisplay && !isAppearanceTaskRunning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--glass-danger-ring)] text-[var(--glass-tone-danger-fg)] p-3 gap-1">
                        <AppIcon name="alert" className="w-6 h-6" />
                        <span className="text-xs text-center font-medium line-clamp-3">{taskErrorDisplay.message}</span>
                    </div>
                )}
            </div>

            {/* 信息区域 */}
            <div className="p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {/* 类型图标 */}
                        <TypeIcon />
                        <h3 className="font-medium text-[var(--glass-text-primary)] text-sm truncate">{character.name}</h3>
                        {folderMap && character.folderId && (
                            <span className={tagClass}>
                                {folderMap[character.folderId]}
                            </span>
                        )}
                        {appearance?.artStyle && (
                            <span className={tagClass}>
                                {appearance.artStyle}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {/* 编辑按钮 */}
                        <button
                            onClick={() => onEdit?.(character, appearance)}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-[var(--glass-tone-info-bg)] text-[var(--glass-text-tertiary)] hover:text-[var(--glass-tone-info-fg)] transition-all opacity-0 group-hover:opacity-100"
                            title={tAssets('video.panelCard.editPrompt')}
                        >
                            <AppIcon name="edit" className="w-4 h-4" />
                        </button>
                        {/* 删除按钮 */}
                        <button onClick={() => appearanceCount <= 1 ? setShowDeleteConfirm(true) : setShowDeleteMenu(!showDeleteMenu)} className="h-6 w-6 rounded-md flex items-center justify-center text-[var(--glass-tone-danger-fg)] opacity-0 group-hover:opacity-100 hover:bg-[var(--glass-tone-danger-bg)] transition-all">
                            <AppIcon name="trash" className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 形象切换 */}
                {appearanceCount > 1 && (
                    <div className="flex gap-1 mt-2 overflow-x-auto">
                        {character.appearances.map((app, index) => (
                            <button key={app.id} onClick={() => setActiveAppearance(index)} className={`glass-btn-base px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${index === activeAppearance ? 'glass-btn-primary' : 'glass-btn-soft text-[var(--glass-text-secondary)]'}`}>
                                {app.changeReason || `形象 ${app.appearanceIndex}`}
                            </button>
                        ))}
                    </div>
                )}

                <div className="mt-2 min-h-[3rem]">
                    <p className="text-xs text-[var(--glass-text-secondary)] line-clamp-3">{appearance?.description || ''}</p>
                </div>

                {/* 音色设置 */}
                <VoiceSettings
                    characterId={character.id}
                    characterName={character.name}
                    customVoiceUrl={character.customVoiceUrl}
                    onVoiceDesign={onVoiceDesign}
                    onVoiceSelect={onVoiceSelect}
                />
            </div>

            {/* 删除确认 */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 glass-overlay flex items-center justify-center z-20">
                    <div className="glass-surface-modal p-4 m-4">
                        <p className="mb-4 text-sm text-[var(--glass-text-primary)]">{t('confirmDeleteCharacter')}</p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowDeleteConfirm(false)} className="glass-btn-base glass-btn-secondary px-3 py-1.5 rounded-lg text-sm">{t('cancel')}</button>
                            <button onClick={handleDelete} className="glass-btn-base glass-btn-danger px-3 py-1.5 rounded-lg text-sm">{t('delete')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 删除菜单 */}
            {showDeleteMenu && appearanceCount > 1 && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDeleteMenu(false)} />
                    <div className="absolute right-3 top-auto bottom-16 z-20 glass-surface-modal py-1 min-w-[120px]">
                        <button onClick={handleDeleteAppearance} className="glass-btn-base glass-btn-soft w-full justify-start rounded-none px-3 py-1.5 text-left text-xs">{tAssets('image.deleteThis')}</button>
                        <button onClick={() => { setShowDeleteMenu(false); setShowDeleteConfirm(true) }} className="glass-btn-base glass-btn-soft w-full justify-start rounded-none px-3 py-1.5 text-left text-xs text-[var(--glass-tone-danger-fg)]">{tAssets('character.deleteWhole')}</button>
                    </div>
                </>
            )}

            {/* 刷新确认对话框 */}
            {showRefreshConfirm && (
                <div className="absolute inset-0 glass-overlay flex items-center justify-center z-20">
                    <div className="glass-surface-modal p-4 m-4">
                        <p className="mb-4 text-sm text-[var(--glass-text-primary)]">{tAssets('image.confirmRefresh')}</p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowRefreshConfirm(false)} className="glass-btn-base glass-btn-secondary px-3 py-1.5 rounded-lg text-sm">{t('cancel')}</button>
                            <button onClick={() => handleGenerate()} className="glass-btn-base glass-btn-tone-info px-3 py-1.5 rounded-lg text-sm">{tAssets('image.refresh')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
