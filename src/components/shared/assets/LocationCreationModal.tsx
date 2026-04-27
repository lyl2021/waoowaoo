'use client'
import { logError as _ulogError } from '@/lib/logging/core'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DragEvent, MouseEvent } from 'react'
import { useTranslations } from 'next-intl'
import { AppIcon } from '@/components/ui/icons'
import { ART_STYLES, ART_STYLE_CATEGORIES } from '@/lib/constants'
import { shouldShowError } from '@/lib/error-utils'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import {
    useAiCreateProjectLocation,
    useAiDesignLocation,
    useCreateAssetHubLocation,
    useGenerateLocationImage,
    useCreateProjectLocation,
    useGenerateProjectLocationImage,
    useUploadAssetHubTempMedia,
    useUploadProjectTempMedia,
} from '@/lib/query/hooks'
import { useImageGenerationCount } from '@/lib/image-generation/use-image-generation-count'
import ImageGenerationInlineCountButton from '@/components/image-generation/ImageGenerationInlineCountButton'
import { getImageGenerationCountOptions } from '@/lib/image-generation/count'
import { StyleSelector } from '@/components/selectors/RatioStyleSelectors'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import CharacterCreationPreview from '@/components/shared/assets/character-creation/CharacterCreationPreview'
import type { LocationAvailableSlot } from '@/lib/location-available-slots'
import { apiFetch } from '@/lib/api-fetch'

export interface LocationCreationModalProps {
    mode: 'asset-hub' | 'project'
    // Asset Hub 模式使用
    folderId?: string | null
    folders?: Array<{ id: string; name: string }>
    // 项目模式使用
    projectId?: string
    onClose: () => void
    onSuccess: () => void
}

const SparklesIcon = ({ className }: { className?: string }) => (
    <AppIcon name="sparklesAlt" className={className} />
)

const PhotoIcon = ({ className }: { className?: string }) => (
    <AppIcon name="image" className={className} />
)

export function LocationCreationModal({
    mode,
    folderId,
    folders,
    projectId,
    onClose,
    onSuccess
}: LocationCreationModalProps) {
    const t = useTranslations('assetModal')
    const tHub = useTranslations('assetHub')
    const aiDesignAssetHubLocation = useAiDesignLocation()
    const createAssetHubLocation = useCreateAssetHubLocation()
    const generateAssetHubLocation = useGenerateLocationImage()
    const aiCreateProjectLocation = useAiCreateProjectLocation(projectId || '')
    const createProjectLocation = useCreateProjectLocation(projectId || '')
    const generateProjectLocation = useGenerateProjectLocationImage(projectId || '')
    const uploadAssetHubTemp = useUploadAssetHubTempMedia()
    const uploadProjectTemp = useUploadProjectTempMedia()
    const {
        count: locationGenerationCount,
        setCount: setLocationGenerationCount,
    } = useImageGenerationCount('location')

    // 创建模式
    const [createMode, setCreateMode] = useState<'reference' | 'description'>('description')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [referenceImagesBase64, setReferenceImagesBase64] = useState<string[]>([])

    // 表单字段
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [aiInstruction, setAiInstruction] = useState('')
    const [artStyle, setArtStyle] = useState('american-comic')
    const [availableSlots, setAvailableSlots] = useState<LocationAvailableSlot[]>([])

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isAiDesigning, setIsAiDesigning] = useState(false)
    const [isExtracting, setIsExtracting] = useState(false)
    const [groupFolderId, setGroupFolderId] = useState<string | null>(
        mode === 'asset-hub' ? (folderId ?? null) : null
    )
    const submittingState = isSubmitting
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: 'generate',
            resource: 'image',
            hasOutput: false,
        })
        : null

    const getErrorMessage = (error: unknown, fallback: string) => {
        if (error instanceof Error && error.message) {
            return error.message
        }
        return fallback
    }

    const getErrorStatus = (error: unknown): number | null => {
        if (typeof error === 'object' && error !== null) {
            const status = (error as { status?: unknown }).status
            if (typeof status === 'number') return status
        }
        return null
    }

    const handleFileSelect = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
        if (fileArray.length === 0) return

        const remaining = 5 - referenceImagesBase64.length
        const toAdd = fileArray.slice(0, remaining)

        for (const file of toAdd) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const base64 = e.target?.result as string
                setReferenceImagesBase64((prev) => {
                    if (prev.length >= 5) return prev
                    if (prev.includes(base64)) return prev
                    return [...prev, base64]
                })
            }
            reader.readAsDataURL(file)
        }
    }, [referenceImagesBase64.length])

    const uploadReferenceImages = useCallback(async () => {
        const uploadMutation = mode === 'asset-hub' ? uploadAssetHubTemp : uploadProjectTemp
        return Promise.all(
            referenceImagesBase64.map(async (base64) => {
                const data = await uploadMutation.mutateAsync({ imageBase64: base64 })
                if (!data.url) throw new Error(t('errors.uploadFailed'))
                return data.url
            }),
        )
    }, [mode, referenceImagesBase64, t, uploadAssetHubTemp, uploadProjectTemp])

    // ESC 键关闭
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSubmitting && !isAiDesigning) {
                onClose()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [onClose, isSubmitting, isAiDesigning])

    // 粘贴图片
    useEffect(() => {
        const handleGlobalPaste = (e: ClipboardEvent) => {
            if (createMode !== 'reference') return

            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

            const items = e.clipboardData?.items
            if (!items) return

            for (let i = 0; i < items.length; i++) {
                if (!items[i].type.startsWith('image/')) continue
                const file = items[i].getAsFile()
                if (!file) continue
                e.preventDefault()
                void handleFileSelect([file])
                break
            }
        }

        document.addEventListener('paste', handleGlobalPaste)
        return () => document.removeEventListener('paste', handleGlobalPaste)
    }, [createMode, handleFileSelect])

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.dataTransfer.files.length > 0) {
            void handleFileSelect(e.dataTransfer.files)
        }
    }

    const handleClearReference = (index?: number) => {
        if (typeof index === 'number') {
            setReferenceImagesBase64((prev) => prev.filter((_, i) => i !== index))
            return
        }
        setReferenceImagesBase64([])
    }

    // AI 设计描述
    const handleAiDesign = async () => {
        if (!aiInstruction.trim()) return

        try {
            setIsAiDesigning(true)
            const data = mode === 'asset-hub'
                ? await aiDesignAssetHubLocation.mutateAsync(aiInstruction)
                : await aiCreateProjectLocation.mutateAsync({ userInstruction: aiInstruction })
            setDescription(data.prompt || '')
            setAvailableSlots(Array.isArray(data.availableSlots) ? data.availableSlots : [])
            setAiInstruction('')
        } catch (error: unknown) {
            if (getErrorStatus(error) === 402) {
                alert(getErrorMessage(error, t('errors.insufficientBalance')))
            } else {
                _ulogError('AI设计失败:', error)
                if (shouldShowError(error)) {
                    alert(getErrorMessage(error, t('errors.aiDesignFailed')))
                }
            }
        } finally {
            setIsAiDesigning(false)
        }
    }

    // 提取参考图描述
    const handleExtractDescription = async () => {
        if (referenceImagesBase64.length === 0) return

        try {
            setIsExtracting(true)
            const referenceImageUrls = await uploadReferenceImages()
            const response = await apiFetch('/api/asset-hub/describe-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrls: referenceImageUrls, type: 'location' }),
            })
            if (!response.ok) {
                throw new Error(t('errors.extractDescriptionFailed'))
            }
            const data = await response.json() as { description?: string }
            if (data?.description) {
                setDescription(data.description)
            }
        } catch (error: unknown) {
            if (shouldShowError(error)) {
                alert(getErrorMessage(error, t('errors.extractDescriptionFailed')))
            }
        } finally {
            setIsExtracting(false)
        }
    }

    type CreatedLocationResponse = {
        location?: {
            id: string
        }
    }

    // 提交创建
    const handleSubmit = async () => {
        if (!name.trim() || !description.trim()) return

        try {
            setIsSubmitting(true)

            const body: {
                name: string
                description: string
                artStyle: string
                folderId?: string | null
            } = {
                name: name.trim(),
                description: description.trim(),
                artStyle
            }

            if (mode === 'asset-hub') {
                body.folderId = groupFolderId
            }

            if (mode === 'asset-hub') {
                await createAssetHubLocation.mutateAsync({
                    name: body.name,
                    summary: body.description,
                    artStyle: body.artStyle,
                    folderId: groupFolderId ?? null,
                    availableSlots,
                })
            } else {
                await createProjectLocation.mutateAsync({
                    name: body.name,
                    description: body.description,
                    artStyle: body.artStyle,
                    availableSlots,
                })
            }

            onSuccess()
            onClose()
        } catch (error: unknown) {
            if (getErrorStatus(error) === 402) {
                alert(getErrorMessage(error, t('errors.insufficientBalance')))
            } else if (shouldShowError(error)) {
                alert(getErrorMessage(error, t('errors.createFailed')))
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSubmitAndGenerate = async () => {
        let finalDescription = description.trim()

        // 参考图模式下描述为空时自动提取
        if (!finalDescription && referenceImagesBase64.length > 0) {
            try {
                setIsSubmitting(true)
                const referenceImageUrls = await uploadReferenceImages()
                const response = await apiFetch('/api/asset-hub/describe-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrls: referenceImageUrls, type: 'location' }),
                })
                if (response.ok) {
                    const data = await response.json() as { description?: string }
                    finalDescription = data?.description || ''
                    if (data?.description) setDescription(data.description)
                }
            } catch {
                // fall through to validation
            }
        }

        if (!name.trim() || !finalDescription) return

        try {
            setIsSubmitting(true)

            if (mode === 'asset-hub') {
                const result = await createAssetHubLocation.mutateAsync({
                    name: name.trim(),
                    summary: finalDescription,
                    artStyle,
                    folderId: groupFolderId ?? null,
                    count: locationGenerationCount,
                    availableSlots,
                }) as CreatedLocationResponse
                const createdLocationId = result.location?.id
                if (!createdLocationId) {
                    throw new Error(t('errors.createFailed'))
                }
                await generateAssetHubLocation.mutateAsync({
                    locationId: createdLocationId,
                    artStyle,
                    count: locationGenerationCount,
                })
            } else {
                const result = await createProjectLocation.mutateAsync({
                    name: name.trim(),
                    description: finalDescription,
                    artStyle,
                    count: locationGenerationCount,
                    availableSlots,
                }) as CreatedLocationResponse
                const createdLocationId = result.location?.id
                if (!createdLocationId) {
                    throw new Error(t('errors.createFailed'))
                }
                await generateProjectLocation.mutateAsync({
                    locationId: createdLocationId,
                    artStyle,
                    count: locationGenerationCount,
                })
            }

            onSuccess()
            onClose()
        } catch (error: unknown) {
            if (getErrorStatus(error) === 402) {
                alert(getErrorMessage(error, t('errors.insufficientBalance')))
            } else if (shouldShowError(error)) {
                alert(getErrorMessage(error, t('errors.createFailed')))
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    // 处理点击遮罩层关闭
    const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !isSubmitting && !isAiDesigning) {
            onClose()
        }
    }

    return (
        <div
            className="fixed inset-0 glass-overlay flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="glass-surface-modal max-w-lg w-full max-h-[85vh] flex flex-col">
                <div className="p-6 overflow-y-auto flex-1">
                    {/* 标题 */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                            {t('location.title')}
                        </h3>
                        <button
                            onClick={onClose}
                            className="glass-btn-base glass-btn-soft w-8 h-8 rounded-full flex items-center justify-center text-[var(--glass-text-tertiary)]"
                        >
                            <AppIcon name="close" className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-5">
                        {/* 场景名称 */}
                        <div className="space-y-2">
                            <label className="glass-field-label block">
                                {t('location.name')} <span className="text-[var(--glass-tone-danger-fg)]">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('location.namePlaceholder')}
                                className="glass-input-base w-full px-3 py-2 text-sm"
                            />
                        </div>

                        {/* 画面风格 + 分组并排 */}
                        <div className="flex gap-4 items-start">
                            <div className="flex-1 min-w-0 space-y-2">
                                <label className="glass-field-label block">
                                    {t('artStyle.title')}
                                </label>
                                <StyleSelector
                                    value={artStyle}
                                    onChange={setArtStyle}
                                    options={ART_STYLES.map(s => ({ value: s.value, label: s.label, description: s.description, category: s.category }))}
                                    categories={ART_STYLE_CATEGORIES}
                                />
                            </div>
                            {mode === 'asset-hub' && folders && (
                                <div className="w-48 shrink-0 space-y-2">
                                    <label className="glass-field-label block">{tHub('selectGroup')}</label>
                                    <select
                                        value={groupFolderId ?? '__default__'}
                                        onChange={(e) => setGroupFolderId(e.target.value === '__default__' ? null : e.target.value)}
                                        className="glass-input-base w-full px-3 py-2 text-sm"
                                    >
                                        <option value="__default__">{tHub('defaultGroup')}</option>
                                        {folders.map((g) => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* AI 设计 & 参考图卡片 */}
                        <div className="glass-surface-soft rounded-xl p-4 space-y-4 border border-[var(--glass-stroke-base)]">
                            <SegmentedControl
                                options={[
                                    { value: 'description', label: <><SparklesIcon className="w-4 h-4" /><span>{t('aiDesign.title')}</span></> },
                                    { value: 'reference', label: <><PhotoIcon className="w-4 h-4" /><span>{t('character.modeReference')}</span></> },
                                ]}
                                value={createMode}
                                onChange={(val) => setCreateMode(val as 'reference' | 'description')}
                            />

                            {createMode === 'description' && (
                                <div className="space-y-2">
                                    <textarea
                                        value={aiInstruction}
                                        onChange={(e) => setAiInstruction(e.target.value)}
                                        placeholder={t('aiDesign.placeholderLocation')}
                                        className="glass-textarea-base w-full min-h-[120px] px-3 py-2 text-sm resize-none"
                                        disabled={isAiDesigning}
                                    />
                                    <button
                                        onClick={handleAiDesign}
                                        disabled={isAiDesigning || !aiInstruction.trim()}
                                        className="glass-btn-base glass-btn-tone-info w-full px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        {isAiDesigning ? t('aiDesign.generating') : t('aiDesign.generate')}
                                    </button>
                                </div>
                            )}

                            {createMode === 'reference' && (
                                <div className="space-y-3">
                                    <CharacterCreationPreview
                                        referenceImagesBase64={referenceImagesBase64}
                                        fileInputRef={fileInputRef}
                                        onDrop={handleDrop}
                                        onFileSelect={handleFileSelect}
                                        onClearReference={handleClearReference}
                                    />
                                    <button
                                        onClick={handleExtractDescription}
                                        disabled={isExtracting || referenceImagesBase64.length === 0}
                                        className="glass-btn-base glass-btn-tone-info w-full px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        {isExtracting ? t('aiDesign.generating') : t('character.extractFirst')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 描述文本框 - 始终显示 */}
                        <div className="space-y-2">
                            <label className="glass-field-label block">
                                {t('location.description')} <span className="text-[var(--glass-tone-danger-fg)]">*</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder={t('location.descPlaceholder')}
                                className="glass-textarea-base w-full px-3 py-2 text-sm resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 固定底部按钮区 */}
                <div className="flex gap-3 justify-end p-4 border-t border-[var(--glass-stroke-base)] bg-[var(--glass-bg-surface-strong)] rounded-b-xl flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="glass-btn-base glass-btn-secondary px-4 py-2 rounded-lg text-sm"
                        disabled={isSubmitting}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !name.trim() || !description.trim()}
                        className="glass-btn-base glass-btn-secondary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <TaskStatusInline state={submittingState} className="text-white [&>span]:text-white [&_svg]:text-white" />
                        ) : (
                            <span>{mode === 'asset-hub' ? t('common.addOnlyToAssetHubLocation') : t('common.addOnlyLocation')}</span>
                        )}
                    </button>
                    <ImageGenerationInlineCountButton
                        prefix={<span>{t('common.addAndGeneratePrefix')}</span>}
                        suffix={<span>{t('common.generateCountSuffix')}</span>}
                        value={locationGenerationCount}
                        options={getImageGenerationCountOptions('location')}
                        onValueChange={setLocationGenerationCount}
                        onClick={handleSubmitAndGenerate}
                        actionDisabled={!name.trim() || (!description.trim() && referenceImagesBase64.length === 0)}
                        selectDisabled={isSubmitting}
                        ariaLabel={t('common.selectGenerateCount')}
                        className="glass-btn-base glass-btn-primary flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        selectClassName="appearance-none bg-transparent border-0 pl-0 pr-3 text-sm font-semibold text-current outline-none cursor-pointer leading-none transition-colors"
                    />
                </div>
            </div>
        </div>
    )
}
