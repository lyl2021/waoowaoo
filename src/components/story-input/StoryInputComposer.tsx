'use client'

import { useCallback, useEffect, useRef, type CompositionEvent, type ReactNode } from 'react'
import { RatioSelector, StylePresetSelector, StyleSelector } from '@/components/selectors/RatioStyleSelectors'
import { resolveTextareaTargetHeight } from '@/lib/ui/textarea-height'

interface StoryInputComposerOption {
  value: string
  label: string
  description?: string
  recommended?: boolean
}

interface StoryInputComposerStyleCategory {
  id: string
  name: string
}

interface StoryInputComposerStylePresetOption {
  value: string
  label: string
  description: string
}

interface StoryInputComposerProps {
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  minRows: number
  disabled?: boolean
  maxHeightViewportRatio?: number
  topRight?: ReactNode
  footer?: ReactNode
  secondaryActions?: ReactNode
  primaryAction?: ReactNode
  videoRatio?: string
  onVideoRatioChange?: (value: string) => void
  ratioOptions?: StoryInputComposerOption[]
  getRatioUsage?: (ratio: string) => string
  artStyle?: string
  onArtStyleChange?: (value: string) => void
  styleOptions?: StoryInputComposerOption[]
  styleCategories?: StoryInputComposerStyleCategory[]
  stylePresetValue?: string
  onStylePresetChange?: (value: string) => void
  stylePresetOptions?: readonly StoryInputComposerStylePresetOption[]
  onCompositionStart?: () => void
  onCompositionEnd?: (event: CompositionEvent<HTMLTextAreaElement>) => void
  textareaClassName?: string
  viewMode?: 'single' | 'split'
  expandToFill?: boolean
}

export default function StoryInputComposer({
  value,
  onValueChange,
  placeholder,
  minRows,
  disabled = false,
  maxHeightViewportRatio = 0.5,
  topRight,
  footer,
  secondaryActions,
  primaryAction,
  videoRatio,
  onVideoRatioChange,
  ratioOptions,
  getRatioUsage,
  artStyle,
  onArtStyleChange,
  styleOptions,
  styleCategories,
  stylePresetValue,
  onStylePresetChange,
  stylePresetOptions,
  onCompositionStart,
  onCompositionEnd,
  textareaClassName,
  viewMode = 'single',
  expandToFill = false,
}: StoryInputComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textareaMinHeightRef = useRef<number | null>(null)
  const splitIndexRef = useRef(0)

  const autoResizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el || typeof window === 'undefined') return

    const maxHeight = window.innerHeight * maxHeightViewportRatio
    const oldHeight = el.offsetHeight
    const oldScrollTop = el.scrollTop

    if (textareaMinHeightRef.current === null && oldHeight > 0) {
      textareaMinHeightRef.current = oldHeight
    }

    const minHeight = textareaMinHeightRef.current ?? oldHeight

    el.style.transition = 'none'
    el.style.height = 'auto'
    const scrollHeight = el.scrollHeight
    const targetHeight = resolveTextareaTargetHeight({
      minHeight,
      maxHeight,
      scrollHeight,
    })
    el.style.height = `${oldHeight}px`
    el.scrollTop = oldScrollTop

    requestAnimationFrame(() => {
      el.scrollTop = oldScrollTop
      el.style.transition = 'height 200ms ease-out'
      el.style.height = `${targetHeight}px`
      el.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden'
    })
  }, [maxHeightViewportRatio])

  useEffect(() => {
    if (!expandToFill) {
      autoResizeTextarea()
    }
  }, [value, autoResizeTextarea, expandToFill])

  // 进入 split 模式时计算文本分割点
  useEffect(() => {
    if (viewMode === 'split') {
      const mid = Math.floor(value.length / 2)
      const beforeNewline = value.lastIndexOf('\n', mid)
      const afterNewline = value.indexOf('\n', mid)
      let splitIndex = mid
      const beforeDist = beforeNewline !== -1 ? mid - beforeNewline : Infinity
      const afterDist = afterNewline !== -1 ? afterNewline - mid : Infinity
      if (beforeDist <= afterDist && beforeDist < 200) {
        splitIndex = beforeNewline + 1
      } else if (afterDist < beforeDist && afterDist < 200) {
        splitIndex = afterNewline + 1
      }
      splitIndexRef.current = splitIndex
    }
  }, [viewMode])

  return (
    <div className={`relative w-full glass-surface-elevated rounded-2xl${expandToFill ? ' flex-1 flex flex-col min-h-0' : ''}`}>
      {/* 顶部：选择器工具栏（有选项时才渲染） */}
      {ratioOptions && ratioOptions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto px-5 pt-4 pb-2 border-b border-[var(--glass-stroke-soft)]/50">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-[118px] flex-shrink-0">
              <RatioSelector
                value={videoRatio ?? ''}
                onChange={onVideoRatioChange ?? (() => {})}
                options={ratioOptions}
                getUsage={getRatioUsage}
              />
            </div>
            <div className="w-[132px] flex-shrink-0">
              <StyleSelector
                value={artStyle ?? ''}
                onChange={onArtStyleChange ?? (() => {})}
                options={styleOptions ?? []}
                categories={styleCategories}
              />
            </div>
            {stylePresetOptions && stylePresetOptions.length > 0 ? (
              <div className="w-[152px] flex-shrink-0">
                <StylePresetSelector
                  value={stylePresetValue ?? ''}
                  onChange={onStylePresetChange ?? (() => {})}
                  options={stylePresetOptions}
                />
              </div>
            ) : null}
          </div>
          {topRight && (
            <div className="flex items-center flex-shrink-0">
              {topRight}
            </div>
          )}
        </div>
      )}

      {/* 中间：输入区域 */}
      {viewMode === 'split' ? (
        <div className={`flex ${expandToFill ? 'flex-1 min-h-0' : 'min-h-[200px]'}`}>
          <div className={`flex-1 min-w-0 border-r border-[var(--glass-stroke-soft)]/50 ${expandToFill ? 'flex flex-col min-h-0' : ''}`}>
            <textarea
              value={value.slice(0, splitIndexRef.current)}
              onChange={(e) => {
                onValueChange(e.target.value + value.slice(splitIndexRef.current))
              }}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              placeholder={placeholder}
              rows={minRows}
              disabled={disabled}
              className={`w-full resize-none border-none bg-transparent text-base text-[var(--glass-text-primary)] outline-none placeholder:text-[var(--glass-text-tertiary)] app-scrollbar p-5${expandToFill ? ' flex-1 overflow-y-auto' : ''}`}
            />
          </div>
          <div className={`flex-1 min-w-0 ${expandToFill ? 'flex flex-col min-h-0' : ''}`}>
            <textarea
              value={value.slice(splitIndexRef.current)}
              onChange={(e) => {
                onValueChange(value.slice(0, splitIndexRef.current) + e.target.value)
              }}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              placeholder={placeholder}
              rows={minRows}
              disabled={disabled}
              className={`w-full resize-none border-none bg-transparent text-base text-[var(--glass-text-primary)] outline-none placeholder:text-[var(--glass-text-tertiary)] app-scrollbar p-5${expandToFill ? ' flex-1 overflow-y-auto' : ''}`}
            />
          </div>
        </div>
      ) : expandToFill ? (
        <div className="flex-1 flex flex-col min-h-0 p-5">
          <textarea
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            placeholder={placeholder}
            rows={minRows}
            disabled={disabled}
            className={`w-full resize-none border-none bg-transparent text-base text-[var(--glass-text-primary)] outline-none placeholder:text-[var(--glass-text-tertiary)] app-scrollbar flex-1 overflow-y-auto ${textareaClassName ?? ''}`}
          />
        </div>
      ) : (
        <div className="p-5">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            placeholder={placeholder}
            rows={minRows}
            disabled={disabled}
            className={`w-full resize-none border-none bg-transparent text-base text-[var(--glass-text-primary)] outline-none placeholder:text-[var(--glass-text-tertiary)] app-scrollbar ${textareaClassName ?? ''}`}
          />
        </div>
      )}

      {/* 底部：操作按钮 */}
      {(secondaryActions || primaryAction) && (
        <div className="flex items-center justify-end gap-2 px-5 pt-3 pb-4 border-t border-[var(--glass-stroke-soft)]/50">
          {secondaryActions}
          {primaryAction}
        </div>
      )}

      {footer && (
        <div className="px-6 pb-4">
          {footer}
        </div>
      )}
    </div>
  )
}
