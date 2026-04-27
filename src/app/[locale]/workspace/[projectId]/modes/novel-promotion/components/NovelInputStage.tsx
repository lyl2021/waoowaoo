'use client'

/**
 * 小说推文模式 - 故事输入阶段 (Story View)
 * V3.3 UI: 极简专注编辑，按钮内嵌，支持单栏/双栏切换
 */

import { useTranslations } from 'next-intl'
import { useState, useRef, useEffect, useCallback } from 'react'
import '@/styles/animations.css'
import AiWriteModal from '@/components/home/AiWriteModal'
import LongTextDetectionPrompt from '@/components/story-input/LongTextDetectionPrompt'
import StoryInputComposer from '@/components/story-input/StoryInputComposer'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { AppIcon } from '@/components/ui/icons'
import { PROJECT_STORY_INPUT_MIN_ROWS } from '@/lib/ui/textarea-height'
import { apiFetch } from '@/lib/api-fetch'
import { expandHomeStory } from '@/lib/home/ai-story-expand'

/** 触发智能分集建议的字数阈值 */
const LONG_TEXT_THRESHOLD = 150

interface NovelInputStageProps {
  // 核心数据
  novelText: string
  // 回调函数
  onNovelTextChange: (value: string) => void
  onNext: () => void
  /** 触发智能分集流程（携带当前文本） */
  onSmartSplit?: (text: string) => void
  // 状态
  isSubmittingTask?: boolean
  isSwitchingStage?: boolean
  // 旁白开关
  enableNarration?: boolean
  onEnableNarrationChange?: (enabled: boolean) => void
}

export default function NovelInputStage({
  novelText,
  onNovelTextChange,
  onNext,
  onSmartSplit,
  isSubmittingTask = false,
  isSwitchingStage = false,
  enableNarration = false,
  onEnableNarrationChange,
}: NovelInputStageProps) {
  const t = useTranslations('novelPromotion')
  const homeT = useTranslations('home')

  // ── IME 组合输入处理 ──
  const isComposingRef = useRef(false)
  const [localText, setLocalText] = useState(novelText)
  const [aiWriteOpen, setAiWriteOpen] = useState(false)
  const [aiWriteLoading, setAiWriteLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'single' | 'split'>('single')

  // 当父组件的 novelText 变化（非本地编辑触发）时，同步到本地 state
  useEffect(() => {
    if (!isComposingRef.current) {
      setLocalText(novelText)
    }
  }, [novelText])

  const handleCompositionStart = () => {
    isComposingRef.current = true
  }

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false
    onNovelTextChange(e.currentTarget.value)
  }

  const hasContent = localText.trim().length > 0
  const [showLongTextPrompt, setShowLongTextPrompt] = useState(false)

  /** 点击"开始创作"时，先检测文本长度 */
  const handleStartClick = useCallback(() => {
    const textLength = localText.trim().length
    if (textLength > LONG_TEXT_THRESHOLD && onSmartSplit) {
      setShowLongTextPrompt(true)
    } else {
      onNext()
    }
  }, [localText, onNext, onSmartSplit])

  const handleAiWriteStart = useCallback(async (prompt: string) => {
    if (aiWriteLoading) return
    setAiWriteLoading(true)
    try {
      const result = await expandHomeStory({
        apiFetch,
        prompt,
      })

      setLocalText(result.expandedText)
      onNovelTextChange(result.expandedText)
      setAiWriteOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed'
      window.alert(message)
    } finally {
      setAiWriteLoading(false)
    }
  }, [aiWriteLoading, onNovelTextChange])

  const handleToggleViewMode = () => {
    setViewMode((v) => (v === 'single' ? 'split' : 'single'))
  }

  const stageSwitchingState = isSwitchingStage
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'generate',
      resource: 'text',
      hasOutput: false,
    })
    : null

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">

      {/* 主输入区域 - 填满剩余空间 */}
      <div className="relative flex-1 flex flex-col min-h-0">
        <StoryInputComposer
          value={localText}
          onValueChange={(value) => {
            setLocalText(value)
            if (!isComposingRef.current) {
              onNovelTextChange(value)
            }
          }}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={`请输入您的剧本或小说内容...\n\nAI 将根据您的文本智能分析：\n• 自动识别场景切换\n• 提取角色对话和动作\n• 生成分镜脚本\n\n例如：\n清晨，阳光透过窗帘洒进房间。小明揉着惺忪的睡眼从床上坐起，看了一眼床头的闹钟——已经八点了！他猛地跳下床，手忙脚乱地开始穿衣服...`}
          minRows={PROJECT_STORY_INPUT_MIN_ROWS}
          expandToFill
          disabled={isSubmittingTask || isSwitchingStage}
          textareaClassName="px-0 pt-0 pb-3 align-top"
          viewMode={viewMode}
          secondaryActions={
            <div className="flex items-center gap-1">
              {/* 单栏/双栏切换 */}
              <button
                onClick={handleToggleViewMode}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'split'
                    ? 'text-[var(--glass-tone-info-fg)] bg-[var(--glass-tone-info-bg)]'
                    : 'text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)]'
                }`}
                title={viewMode === 'split' ? '单栏展示' : '双栏展示'}
              >
                <AppIcon name="file" className="w-4 h-4" />
                {viewMode === 'split' && (
                  <span className="font-medium">双栏</span>
                )}
              </button>

              {/* AI 帮我写 */}
              <button
                onClick={() => setAiWriteOpen(true)}
                disabled={isSubmittingTask || isSwitchingStage}
                className="glass-btn-base flex h-8 items-center gap-1 border border-[var(--glass-stroke-strong)] px-2.5 text-xs transition-all hover:border-[var(--glass-tone-info-fg)]/40"
              >
                <AppIcon name="sparkles" className="w-3.5 h-3.5 text-[#7c3aed]" />
                <span
                  className="font-medium text-xs"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {homeT('aiWrite.trigger')}
                </span>
              </button>
            </div>
          }
          primaryAction={
            <button
              onClick={handleStartClick}
              disabled={!hasContent || isSubmittingTask || isSwitchingStage}
              className="glass-btn-base glass-btn-primary h-8 px-3 text-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSwitchingStage ? (
                <TaskStatusInline state={stageSwitchingState} className="text-white [&>span]:text-white [&_svg]:text-white" />
              ) : (
                <>
                  <span>{t("smartImport.manualCreate.button")}</span>
                  <AppIcon name="arrowRight" className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          }
        />
      </div>

      <AiWriteModal
        open={aiWriteOpen}
        loading={aiWriteLoading}
        onClose={() => setAiWriteOpen(false)}
        onStart={(prompt) => void handleAiWriteStart(prompt)}
        t={(key: string) => homeT(`aiWrite.${key}`)}
      />

      {/* 旁白开关 */}
      {onEnableNarrationChange && (
        <div className="glass-surface p-6">
          <div className="glass-surface-soft flex items-center justify-between p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] font-semibold text-sm">VO</span>
              <div>
                <div className="font-medium text-[var(--glass-text-primary)]">{t("storyInput.narration.title")}</div>
                <div className="text-xs text-[var(--glass-text-tertiary)]">{t("storyInput.narration.description")}</div>
              </div>
            </div>
            <button
              onClick={() => onEnableNarrationChange(!enableNarration)}
              className={`relative w-14 h-8 rounded-full transition-colors ${enableNarration
                ? 'bg-[var(--glass-accent-from)]'
                : 'bg-[var(--glass-stroke-strong)]'
                }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-[var(--glass-bg-surface)] rounded-full shadow-sm transition-transform ${enableNarration ? 'translate-x-6' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
        </div>
      )}

      <LongTextDetectionPrompt
        open={showLongTextPrompt}
        copy={{
          title: t('storyInput.longTextDetection.title'),
          description: t('storyInput.longTextDetection.description', {
            count: localText.trim().length.toLocaleString(),
          }),
          strongRecommend: t('storyInput.longTextDetection.strongRecommend'),
          smartSplitLabel: t('storyInput.longTextDetection.smartSplit'),
          smartSplitBadge: t('storyInput.longTextDetection.smartSplitRecommend'),
          continueLabel: t('storyInput.longTextDetection.continueAnyway'),
          continueHint: t('storyInput.longTextDetection.singleEpisodeWarning'),
        }}
        onClose={() => setShowLongTextPrompt(false)}
        onSmartSplit={() => {
          setShowLongTextPrompt(false)
          onSmartSplit?.(localText)
        }}
        onContinue={() => {
          setShowLongTextPrompt(false)
          onNext()
        }}
      />
    </div>
  )
}
