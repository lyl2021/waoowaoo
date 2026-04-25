'use client'
import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { AppIcon } from '@/components/ui/icons'

interface PanelCandidateData {
  candidates: string[]
  selectedIndex: number
}

interface ImageSectionCandidateModeProps {
  panelId: string
  imageUrl: string | null
  candidateData: PanelCandidateData
  onSelectCandidateIndex: (panelId: string, index: number) => void
  onConfirmCandidate: (panelId: string, imageUrl: string) => Promise<void>
  onCancelCandidate: (panelId: string) => void
  onPreviewImage?: (url: string) => void
}

export default function ImageSectionCandidateMode({
  panelId,
  imageUrl,
  candidateData,
  onSelectCandidateIndex,
  onConfirmCandidate,
  onCancelCandidate,
  onPreviewImage,
}: ImageSectionCandidateModeProps) {
  const t = useTranslations('storyboard')
  const [isConfirming, setIsConfirming] = useState(false)

  const validCandidates = candidateData.candidates.filter((url) => !url.startsWith('PENDING:'))
  if (validCandidates.length === 0) {
    return null
  }

  const safeSelectedIndex = Math.max(0, Math.min(candidateData.selectedIndex, validCandidates.length - 1))
  const selectedCandidateUrl = validCandidates[safeSelectedIndex]
  const confirmingState = isConfirming
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'process',
      resource: 'image',
      hasOutput: !!imageUrl,
    })
    : null

  return (
    <div className="w-full h-full relative">
      <MediaImageWithLoading
        src={selectedCandidateUrl}
        alt={t('image.candidateCount', { count: safeSelectedIndex + 1 })}
        containerClassName="h-full w-full"
        className="w-full h-full object-cover cursor-pointer"
        onClick={() => onPreviewImage?.(selectedCandidateUrl)}
        title={t('image.clickToPreview')}
        sizes="(max-width: 768px) 100vw, 33vw"
      />

      <div className="absolute bottom-2 left-2 right-2 glass-surface-soft border border-[var(--glass-stroke-base)] p-2 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {validCandidates.map((url, idx) => {
              const isSelected = idx === safeSelectedIndex
              return (
                <div key={url || idx} className="relative group/thumb">
                  <button
                    type="button"
                    onClick={() => onSelectCandidateIndex(panelId, idx)}
                    aria-pressed={isSelected}
                    className={`relative w-8 h-8 rounded border-2 overflow-hidden transition-all ${isSelected
                      ? 'border-[var(--glass-accent-from)] ring-2 ring-[var(--glass-accent-from)]/30 scale-105'
                      : 'border-[var(--glass-stroke-base)] hover:border-[var(--glass-stroke-focus)]'
                      }`}
                  >
                    <MediaImageWithLoading
                      src={url}
                      alt={t('image.candidateCount', { count: idx + 1 })}
                      containerClassName="h-full w-full"
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--glass-accent-from)] text-white shadow-sm">
                          <AppIcon name="check" className="h-3 w-3" />
                        </span>
                      </span>
                    )}
                  </button>
                  {onPreviewImage && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onPreviewImage(url)
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 glass-btn-base glass-btn-soft text-[var(--glass-text-primary)] rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                      title={t('image.enlargePreview')}
                    >
                      <AppIcon name="searchPlus" className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onCancelCandidate(panelId)}
              disabled={isConfirming}
              className="glass-btn-base glass-btn-secondary px-2 py-1 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消候选
            </button>
            <button
              type="button"
              onClick={async () => {
                _ulogInfo('[ImageSection] 🎯 确认按钮被点击')
                _ulogInfo('[ImageSection] panelId:', panelId)
                _ulogInfo('[ImageSection] 选中的图片索引:', safeSelectedIndex)
                _ulogInfo('[ImageSection] 选中的图片 URL:', selectedCandidateUrl)
                setIsConfirming(true)
                try {
                  await onConfirmCandidate(panelId, selectedCandidateUrl)
                  _ulogInfo('[ImageSection] ✅ 确认操作完成')
                } catch (error) {
                  _ulogError('[ImageSection] ❌ 确认操作失败:', error)
                  setIsConfirming(false)
                  _ulogInfo('[ImageSection] isConfirming 状态已重置为 false (失败重试)')
                }
              }}
              disabled={isConfirming}
              className="glass-btn-base glass-btn-primary flex items-center gap-1 rounded px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirming ? (
                <TaskStatusInline state={confirmingState} className="text-white [&>span]:text-white [&_svg]:text-white" />
              ) : (
                `${t('common.confirm')} ${safeSelectedIndex + 1}`
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-chip glass-chip-success absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs">
        {t('image.candidateCount', { count: safeSelectedIndex + 1 })}/{validCandidates.length}
        {candidateData.candidates.length > validCandidates.length &&
          ` (${t('image.candidateGenerating', { count: candidateData.candidates.length - validCandidates.length })})`}
      </div>
    </div>
  )
}
