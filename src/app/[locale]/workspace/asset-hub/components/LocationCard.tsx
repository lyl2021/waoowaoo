'use client'
import { resolveErrorDisplay } from '@/lib/errors/display'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  useGenerateLocationImage,
  useSelectLocationImage,
  useUndoLocationImage,
  useUploadLocationImage,
  useDeleteLocation
} from '@/lib/query/mutations'
import { useRefreshGlobalAssets } from '@/lib/query/hooks'
import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import TaskStatusOverlay from '@/components/task/TaskStatusOverlay'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import ImageGenerationInlineCountButton from '@/components/image-generation/ImageGenerationInlineCountButton'
import ImageGenerationSlotOverlay from '@/components/image-generation/ImageGenerationSlotOverlay'
import { getImageGenerationCountOptions } from '@/lib/image-generation/count'
import { useImageGenerationCount } from '@/lib/image-generation/use-image-generation-count'
import {
  countGeneratedImageSlots,
  resolveGroupedImageSlotPhase,
  resolveDisplayImageSlots,
} from '@/lib/image-generation/slot-state'
import { AppIcon } from '@/components/ui/icons'
import { ART_STYLES } from '@/lib/constants'

// 统一工具按钮样式：透明背景，默认灰色，悬停浅蓝背景+蓝色图标（与音色区域按钮一致）
const toolBtnClass = 'w-6 h-6 rounded-md flex items-center justify-center bg-transparent hover:bg-[var(--glass-tone-info-bg)] text-[var(--glass-text-tertiary)] hover:text-[var(--glass-tone-info-fg)] transition-all disabled:opacity-50 cursor-pointer'

// 标签样式：浅黄背景 / 长椭圆
const tagClass = 'shrink-0 text-[10px] px-3 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] leading-tight inline-flex items-center'

// 类型图标映射
const typeIconMap = {
  character: 'user' as const,
  location: 'mountain' as const,
  prop: 'package' as const,
}

interface LocationImage {
  id: string
  imageIndex: number
  description: string | null
  imageUrl: string | null
  previousImageUrl: string | null
  isSelected: boolean
  imageTaskRunning: boolean
  imageErrorMessage?: string | null
  lastError?: { code: string; message: string } | null
}

interface Location {
  id: string
  name: string
  summary: string | null
  artStyle?: string | null
  folderId: string | null
  images: LocationImage[]
}

interface LocationCardProps {
  location: Location
  assetType?: 'location' | 'prop'
  folderMap?: Record<string, string>
  onImageClick?: (url: string) => void
  onImageEdit?: (type: 'character' | 'location' | 'prop', id: string, name: string, imageIndex: number) => void
  onEdit?: (location: Location, imageIndex: number) => void
}

export function LocationCard({ location, assetType = 'location', folderMap, onImageClick, onImageEdit, onEdit }: LocationCardProps) {
  // 🔥 使用 mutation hooks
  const generateImage = useGenerateLocationImage()
  const selectImage = useSelectLocationImage()
  const undoImage = useUndoLocationImage()
  const uploadImage = useUploadLocationImage()
  const deleteLocation = useDeleteLocation()
  const onRefresh = useRefreshGlobalAssets()

  const t = useTranslations('assetHub')
  const tAssets = useTranslations('assets')
  const countScope = assetType === 'prop' ? 'prop' : 'location'
  const { count: generationCount, setCount: setGenerationCount } = useImageGenerationCount(countScope)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false)
  const [pendingSelectedIndex, setPendingSelectedIndex] = useState<number | null | undefined>(undefined)
  const latestSelectRequestRef = useRef(0)

  // 解析图片
  const orderedImages = [...(location.images || [])].sort((left, right) => left.imageIndex - right.imageIndex)
  const imagesWithUrl = orderedImages.filter((img) => img.imageUrl)
  const generatedImageCount = countGeneratedImageSlots(orderedImages)
  const selectedImage = orderedImages.find((img) => img.isSelected)
  const serverSelectedIndex = selectedImage?.imageIndex ?? null
  const resolvedSelectedIndex: number | null = pendingSelectedIndex !== undefined ? pendingSelectedIndex : serverSelectedIndex
  const effectiveSelectedIndex = resolvedSelectedIndex
  const currentImageUrl = selectedImage?.imageUrl || imagesWithUrl[0]?.imageUrl || null
  const currentImageIndex = effectiveSelectedIndex ?? imagesWithUrl[0]?.imageIndex ?? 0
  const hasPreviousVersion = location.images?.some(img => img.previousImageUrl) || false

  // 同步：当服务端数据追上时清除 pending 状态
  useEffect(() => {
    if (pendingSelectedIndex !== undefined && serverSelectedIndex === pendingSelectedIndex) {
      setPendingSelectedIndex(undefined)
    }
  }, [serverSelectedIndex, pendingSelectedIndex])

  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url || url.trim() === '') return false
    if (url.startsWith('/')) return true
    if (url.startsWith('data:') || url.startsWith('blob:')) return true
    try { new URL(url); return true } catch { return false }
  }
  const displayImageUrl = isValidUrl(currentImageUrl) ? currentImageUrl : null
  const serverTaskRunning = (location.images || []).some((image) => image.imageTaskRunning)

  // 预加载图片到浏览器缓存，提升预览弹窗展开速度
  useEffect(() => {
    if (displayImageUrl) {
      const img = new window.Image()
      img.src = displayImageUrl
    }
  }, [displayImageUrl])
  const transientSubmitting = generateImage.isPending
  const isTaskRunning = serverTaskRunning || transientSubmitting
  const displaySelectionImages = resolveDisplayImageSlots(orderedImages, {
    hasRunningTask: isTaskRunning,
    requestedCount: generatedImageCount > 1 ? generatedImageCount : generationCount,
  })
  const displaySlotCount = displaySelectionImages.length
  const singleImageAspectClassName = generatedImageCount > 1 ? 'aspect-[3/2]' : 'aspect-square'
  const displayTaskPresentation = isTaskRunning
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: displayImageUrl ? 'process' : 'generate',
      resource: 'image',
      hasOutput: !!displayImageUrl,
    })
    : null
  // 取第一个有错误的 image 的 lastError
  const firstImageError = !isTaskRunning
    ? (location.images || []).find(img => img.lastError)?.lastError || null
    : null
  const taskErrorDisplay = firstImageError ? resolveErrorDisplay(firstImageError) : null
  const selectImageRunningState = selectImage.isPending
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'process',
      resource: 'image',
      hasOutput: !!displayImageUrl,
    })
    : null

  // 漫画风格中文标签
  const artStyleLabel = location.artStyle
    ? ART_STYLES.find(s => s.value === location.artStyle)?.label
    : null

  // 生成图片
  const handleGenerate = (count = generationCount) => {
    setShowRefreshConfirm(false)
    generateImage.mutate({
      locationId: location.id,
      artStyle: location.artStyle || undefined,
      count,
    }, {
      onError: (error) => alert(error.message || t('generateFailed'))
    })
  }

  // 刷新确认 - 触发
  const handleRefreshClick = () => {
    setShowRefreshConfirm(true)
  }

  // 选择图片（依赖 query 缓存乐观更新 + 本地 pending 状态）
  const handleSelectImage = (imageIndex: number | null) => {
    if (imageIndex === effectiveSelectedIndex) return
    setPendingSelectedIndex(imageIndex)
    const requestId = latestSelectRequestRef.current + 1
    latestSelectRequestRef.current = requestId
    selectImage.mutate({
      locationId: location.id,
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
    if (effectiveSelectedIndex === null) return
    const requestId = latestSelectRequestRef.current + 1
    latestSelectRequestRef.current = requestId
    selectImage.mutate({
      locationId: location.id,
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
    undoImage.mutate(location.id)
  }

  // 上传图片
  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    uploadImage.mutate(
      {
        file,
        locationId: location.id,
        labelText: location.name,
        imageIndex: currentImageIndex
      },
      {
        onError: (error) => alert(error.message || t('uploadFailed')),
        onSettled: () => {
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      }
    )
  }

  // 删除场景
  const handleDelete = () => {
    deleteLocation.mutate(location.id, {
      onSettled: () => {
        setShowDeleteConfirm(false)
        onRefresh()
      }
    })
  }

  // 类型图标
  const typeIconName: 'user' | 'mountain' | 'package' = typeIconMap[assetType] ?? 'image'
  const TypeIcon = () => (
    <AppIcon
      name={typeIconName}
      className="w-4 h-4 text-[var(--glass-text-tertiary)]"
    />
  )

  // 多图选择模式
  if (displaySlotCount > 1) {
    const selectionStatusText = isTaskRunning || generatedImageCount < displaySlotCount
      ? tAssets('image.generatedProgress', { generated: generatedImageCount, total: displaySlotCount })
      : effectiveSelectedIndex !== null
        ? tAssets('image.optionSelected', { number: effectiveSelectedIndex + 1 })
        : tAssets('image.selectFirst')

    return (
      <div className="col-span-full glass-surface p-4 relative">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />

        {/* 顶部：名字 + 操作 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <TypeIcon />
              <span className="text-sm font-semibold text-[var(--glass-text-primary)]">{location.name}</span>
              {artStyleLabel && (
                <span className={tagClass}>{artStyleLabel}</span>
              )}
            </div>
            {location.summary && (
              <div className="text-xs text-[var(--glass-text-secondary)] mb-1 line-clamp-2" title={location.summary}>
                {location.summary}
              </div>
            )}
          <div className="text-xs text-[var(--glass-text-tertiary)]">{selectionStatusText}</div>
        </div>
          <div className="flex items-center gap-1 ml-2">
            <ImageGenerationInlineCountButton
              prefix={isTaskRunning ? (
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
              options={getImageGenerationCountOptions('location')}
              onValueChange={setGenerationCount}
              onClick={() => handleRefreshClick()}
              disabled={isTaskRunning}
              showCountControl={false}
              ariaLabel={tAssets('image.regenCountPrefix')}
              className="inline-flex h-6 items-center justify-center gap-1 rounded-md px-1.5 hover:bg-[var(--glass-tone-info-bg)] transition-colors disabled:opacity-50"
            />
            {hasPreviousVersion && (
              <button onClick={handleUndo} className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-[var(--glass-tone-info-bg)] transition-colors" title={tAssets('image.undo')}>
                <AppIcon name="sparkles" className="w-4 h-4 text-[var(--glass-tone-info-fg)]" />
              </button>
            )}
            <button onClick={() => setShowDeleteConfirm(true)} className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-[var(--glass-tone-danger-bg)] transition-colors">
              <AppIcon name="trash" className="w-4 h-4 text-[var(--glass-tone-danger-fg)]" />
            </button>
          </div>
        </div>

        {/* 任务失败错误提示 */}
        {taskErrorDisplay && !isTaskRunning && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-[var(--glass-danger-ring)] text-[var(--glass-tone-danger-fg)]">
            <AppIcon name="alert" className="w-4 h-4 shrink-0" />
            <span className="text-xs line-clamp-2">{taskErrorDisplay.message}</span>
          </div>
        )}

        {/* 图片列表 */}
        <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {displaySelectionImages.map((img) => {
            const isThisSelected = effectiveSelectedIndex !== null && img.imageIndex === effectiveSelectedIndex
            const hasPendingEmptySlots = isTaskRunning && generatedImageCount < displaySlotCount
            const slotTaskRunning = hasPendingEmptySlots
              ? !img.imageUrl && isTaskRunning
              : !!img.imageTaskRunning
            const phase = resolveGroupedImageSlotPhase(
              { imageUrl: img.imageUrl },
              {
                isGroupRunning: isTaskRunning,
                isSlotRunning: slotTaskRunning,
                hasPendingEmptySlots,
              },
            )
            const imageError = resolveErrorDisplay(img.lastError || {
              code: img.imageErrorMessage || null,
              message: img.imageErrorMessage || null,
            })
            return (
              <div key={img.id} className="relative group/thumb">
                <div
                  onClick={() => {
                    if (img.imageUrl) {
                      onImageClick?.(img.imageUrl)
                    }
                  }}
                  className={`rounded-lg overflow-hidden border-2 transition-all ${img.imageUrl ? 'cursor-zoom-in' : 'cursor-default'} ${isThisSelected ? 'border-[var(--glass-stroke-success)] ring-2 ring-[var(--glass-success-ring)]' : 'border-[var(--glass-stroke-base)] hover:border-[var(--glass-stroke-focus)]'}`}
                >
                  {img.imageUrl ? (
                    <MediaImageWithLoading
                      src={img.imageUrl}
                      alt={`${location.name} ${img.imageIndex + 1}`}
                      containerClassName="w-full min-h-[88px]"
                      className="w-full h-auto object-contain"
                    />
                  ) : (
                    <div className="flex min-h-[88px] items-center justify-center bg-[var(--glass-bg-muted)]">
                      {imageError && !isTaskRunning ? (
                        <div className="flex flex-col items-center justify-center px-3 py-6 text-center">
                          <AppIcon name="alert" className="mb-2 h-6 w-6 text-[var(--glass-tone-danger-fg)]" />
                          <span className="text-xs font-medium text-[var(--glass-tone-danger-fg)]">{tAssets('common.generateFailed')}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 px-3 py-6 text-[var(--glass-text-tertiary)]">
                          <div className="h-12 w-12 animate-pulse rounded-xl bg-[var(--glass-bg-surface-strong)]" />
                          <span className="text-xs">{tAssets('image.generatingPlaceholder')}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {phase === 'generating' && (
                    <ImageGenerationSlotOverlay label={tAssets('image.generating')} />
                  )}
                  {phase === 'regenerating' && (
                    <ImageGenerationSlotOverlay label={tAssets('image.regenerating')} />
                  )}
                  <div className={`absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded ${isThisSelected ? 'glass-chip glass-chip-success' : 'glass-chip glass-chip-neutral'}`}>
                    {tAssets('image.optionNumber', { number: img.imageIndex + 1 })}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!img.imageUrl || phase === 'generating' || phase === 'regenerating') return
                    handleSelectImage(isThisSelected ? null : img.imageIndex)
                  }}
                  disabled={!img.imageUrl || phase === 'generating' || phase === 'regenerating'}
                  className={`absolute top-2 right-2 glass-btn-base h-7 w-7 rounded-full ${isThisSelected ? 'glass-btn-tone-success' : 'glass-btn-secondary'} disabled:opacity-50`}
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

        {/* 删除确认 */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 glass-overlay flex items-center justify-center z-20 rounded-xl">
            <div className="glass-surface-modal p-4 m-4">
              <p className="mb-4 text-sm text-[var(--glass-text-primary)]">
                {assetType === 'prop' ? t('confirmDeleteProp') : t('confirmDeleteLocation')}
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowDeleteConfirm(false)} className="glass-btn-base glass-btn-secondary px-3 py-1.5 rounded-lg text-sm">{t('cancel')}</button>
                <button onClick={handleDelete} disabled={deleteLocation.isPending} className="glass-btn-base glass-btn-danger px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed">{t('delete')}</button>
              </div>
            </div>
          </div>
        )}

        {/* 刷新确认 */}
        {showRefreshConfirm && (
          <div className="absolute inset-0 glass-overlay flex items-center justify-center z-20 rounded-xl">
            <div className="glass-surface-modal p-4 m-4">
              <p className="mb-4 text-sm text-[var(--glass-text-primary)]">{tAssets('image.confirmRefresh')}</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowRefreshConfirm(false)} className="glass-btn-base glass-btn-secondary px-3 py-1.5 rounded-lg text-sm">{t('cancel')}</button>
                <button onClick={() => handleGenerate(generatedImageCount)} disabled={isTaskRunning} className="glass-btn-base glass-btn-tone-info px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">{tAssets('image.refresh')}</button>
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

      {/* 图片区域 */}
      <div className={`relative bg-[var(--glass-bg-muted)] ${singleImageAspectClassName}`}>
        {displayImageUrl ? (
          <>
            <MediaImageWithLoading
              src={displayImageUrl}
              alt={location.name}
              containerClassName="h-full w-full"
              className="h-full w-full object-contain cursor-zoom-in"
              onClick={() => onImageClick?.(displayImageUrl)}
            />
            {/* 操作按钮 - 非生成时显示 */}
            {!isTaskRunning && (
              <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadImage.isPending} className={toolBtnClass}>
                  <AppIcon name="upload" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onImageEdit?.(assetType === 'prop' ? 'prop' : 'location', location.id, location.name, currentImageIndex)}
                  className={toolBtnClass}
                >
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
              options={getImageGenerationCountOptions('location')}
              onValueChange={setGenerationCount}
              onClick={() => handleGenerate(generationCount)}
              ariaLabel={tAssets('image.selectCount')}
              className="glass-btn-base glass-btn-primary flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg"
              selectClassName="appearance-none bg-transparent border-0 pl-0 pr-3 text-sm font-semibold text-current outline-none cursor-pointer leading-none transition-colors"
            />
          </div>
        )}
        {isTaskRunning && (
          <TaskStatusOverlay state={displayTaskPresentation} />
        )}
        {taskErrorDisplay && !isTaskRunning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--glass-danger-ring)] text-[var(--glass-tone-danger-fg)] p-3 gap-1">
            <AppIcon name="alert" className="w-6 h-6" />
            <span className="text-xs text-center font-medium line-clamp-3">{taskErrorDisplay.message}</span>
          </div>
        )}
      </div>

      {/* 信息区域 */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 min-w-0">
              {/* 类型图标 */}
              <TypeIcon />
              <h3 className="font-medium text-[var(--glass-text-primary)] text-sm truncate">{location.name}</h3>
              {folderMap && (
                <span className={tagClass}>
                  {location.folderId ? folderMap[location.folderId] : folderMap['']}
                </span>
              )}
              {artStyleLabel && (
                <span className={tagClass}>
                  {artStyleLabel}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* 编辑按钮 */}
            <button
              onClick={() => onEdit?.(location, currentImageIndex)}
              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-[var(--glass-tone-info-bg)] text-[var(--glass-text-tertiary)] hover:text-[var(--glass-tone-info-fg)] transition-all opacity-0 group-hover:opacity-100"
              title={tAssets('video.panelCard.editPrompt')}
            >
              <AppIcon name="edit" className="w-4 h-4" />
            </button>
            {/* 删除按钮 */}
            <button onClick={() => setShowDeleteConfirm(true)} className="h-6 w-6 rounded-md flex items-center justify-center text-[var(--glass-tone-danger-fg)] opacity-0 group-hover:opacity-100 hover:bg-[var(--glass-tone-danger-bg)] transition-all">
              <AppIcon name="trash" className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-1 min-h-[3rem]">
          <p className="text-xs text-[var(--glass-text-secondary)] line-clamp-3">{location.summary || ''}</p>
        </div>
      </div>

      {/* 删除确认 */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 glass-overlay flex items-center justify-center z-20">
          <div className="glass-surface-modal p-4 m-4">
            <p className="mb-4 text-sm text-[var(--glass-text-primary)]">
              {assetType === 'prop' ? t('confirmDeleteProp') : t('confirmDeleteLocation')}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="glass-btn-base glass-btn-secondary px-3 py-1.5 rounded-lg text-sm">{t('cancel')}</button>
              <button onClick={handleDelete} disabled={deleteLocation.isPending} className="glass-btn-base glass-btn-danger px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed">{t('delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 刷新确认 */}
      {showRefreshConfirm && (
        <div className="absolute inset-0 glass-overlay flex items-center justify-center z-20">
          <div className="glass-surface-modal p-4 m-4">
            <p className="mb-4 text-sm text-[var(--glass-text-primary)]">{tAssets('image.confirmRefresh')}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowRefreshConfirm(false)} className="glass-btn-base glass-btn-secondary px-3 py-1.5 rounded-lg text-sm">{t('cancel')}</button>
              <button onClick={() => handleGenerate()} disabled={isTaskRunning} className="glass-btn-base glass-btn-tone-info px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">{tAssets('image.refresh')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationCard
