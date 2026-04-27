'use client'

import { CapsuleNav, EpisodeSelector } from '@/components/ui/CapsuleNav'
import { SettingsModal, WorldContextModal } from '@/components/ui/ConfigModals'
import WorkspaceTopActions from './WorkspaceTopActions'
import type { NovelPromotionPanel } from '@/types/project'
import type { CapabilitySelections, ModelCapabilities } from '@/lib/model-config-contract'
import { resolveEpisodeStageArtifacts } from '@/lib/novel-promotion/stage-readiness'

interface EpisodeSummary {
  id: string
  name: string
  episodeNumber?: number
  description?: string | null
  clips?: unknown[]
  storyboards?: Array<{
    panels?: NovelPromotionPanel[] | null
  }>
}

interface UserModelOption {
  value: string
  label: string
  provider?: string
  providerName?: string
  capabilities?: ModelCapabilities
}

interface UserModelsPayload {
  llm: UserModelOption[]
  image: UserModelOption[]
  video: UserModelOption[]
  audio: UserModelOption[]
}

interface WorkspaceHeaderShellProps {
  isSettingsModalOpen: boolean
  isWorldContextModalOpen: boolean
  onCloseSettingsModal: () => void
  onCloseWorldContextModal: () => void
  availableModels?: UserModelsPayload
  modelsLoaded: boolean
  artStyle: string | null | undefined
  analysisModel: string | null | undefined
  characterModel: string | null | undefined
  locationModel: string | null | undefined
  storyboardModel: string | null | undefined
  editModel: string | null | undefined
  videoModel: string | null | undefined
  audioModel: string | null | undefined
  capabilityOverrides: CapabilitySelections
  videoRatio: string | null | undefined
  ttsRate: string | null | undefined
  onUpdateConfig: (key: string, value: unknown) => Promise<void>
  globalAssetText: string
  projectName: string
  episodes: EpisodeSummary[]
  currentEpisodeId?: string
  onEpisodeSelect?: (episodeId: string) => void
  onEpisodeCreate?: () => void
  onEpisodeRename?: (episodeId: string, newName: string) => void
  onEpisodeDelete?: (episodeId: string) => void
  capsuleNavItems: Array<{
    id: string
    icon: string
    label: string
    status: 'empty' | 'active' | 'processing' | 'ready'
    disabled?: boolean
    disabledLabel?: string
  }>
  currentStage: string
  onStageChange: (stage: string) => void
  projectId: string
  episodeId?: string
  onOpenAssetLibrary: () => void
  onOpenSettingsModal: () => void
  assetLibraryLabel: string
  settingsLabel: string
}

export default function WorkspaceHeaderShell({
  isSettingsModalOpen,
  isWorldContextModalOpen,
  onCloseSettingsModal,
  onCloseWorldContextModal,
  availableModels,
  modelsLoaded,
  artStyle,
  analysisModel,
  characterModel,
  locationModel,
  storyboardModel,
  editModel,
  videoModel,
  audioModel,
  capabilityOverrides,
  videoRatio,
  ttsRate,
  onUpdateConfig,
  globalAssetText,
  projectName,
  episodes,
  currentEpisodeId,
  onEpisodeSelect,
  onEpisodeCreate,
  onEpisodeRename,
  onEpisodeDelete,
  capsuleNavItems,
  currentStage,
  onStageChange,
  projectId,
  episodeId,
  onOpenAssetLibrary,
  onOpenSettingsModal,
  assetLibraryLabel,
  settingsLabel,
}: WorkspaceHeaderShellProps) {
  return (
    <>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={onCloseSettingsModal}
        availableModels={availableModels}
        modelsLoaded={modelsLoaded}
        artStyle={artStyle ?? undefined}
        analysisModel={analysisModel ?? undefined}
        characterModel={characterModel ?? undefined}
        locationModel={locationModel ?? undefined}
        imageModel={storyboardModel ?? undefined}
        editModel={editModel ?? undefined}
        videoModel={videoModel ?? undefined}
        audioModel={audioModel ?? undefined}
        videoRatio={videoRatio ?? undefined}
        capabilityOverrides={capabilityOverrides}
        ttsRate={ttsRate ?? undefined}
        onArtStyleChange={(value) => { onUpdateConfig('artStyle', value) }}
        onAnalysisModelChange={(value) => { onUpdateConfig('analysisModel', value) }}
        onCharacterModelChange={(value) => { onUpdateConfig('characterModel', value) }}
        onLocationModelChange={(value) => { onUpdateConfig('locationModel', value) }}
        onImageModelChange={(value) => { onUpdateConfig('storyboardModel', value) }}
        onEditModelChange={(value) => { onUpdateConfig('editModel', value) }}
        onVideoModelChange={(value) => { onUpdateConfig('videoModel', value) }}
        onAudioModelChange={(value) => { onUpdateConfig('audioModel', value) }}
        onVideoRatioChange={(value) => { onUpdateConfig('videoRatio', value) }}
        onCapabilityOverridesChange={(value) => { onUpdateConfig('capabilityOverrides', value) }}
        onTTSRateChange={(value) => { onUpdateConfig('ttsRate', value) }}
      />

      <WorldContextModal
        isOpen={isWorldContextModalOpen}
        onClose={onCloseWorldContextModal}
        text={globalAssetText}
        onChange={(value) => { onUpdateConfig('globalAssetText', value) }}
      />

      {/* 统一 Header - 全宽布局（负边距抵消 page.tsx 的 padding） */}
      <header
        className="shrink-0 relative z-30 border-b border-[var(--glass-stroke-base)] -mx-4 sm:-mx-6 lg:-mx-10"
        style={{
          background: 'rgba(255,255,255,0.80)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
        }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          {/* 左侧：两行标题（与工作区首页字体一致） */}
          <div className="flex flex-col min-w-0 shrink-0">
            <span className="text-xl font-bold text-[var(--glass-text-primary)]">我的项目</span>
            <span className="text-sm text-[var(--glass-text-secondary)]">《{projectName}》</span>
          </div>

          {/* 右侧：剧集选择 + 阶段导航（紧凑模式）+ 操作按钮 */}
          <div className="flex items-center gap-3">
            {episodes.length > 0 && currentEpisodeId && (() => {
              const getNum = (name: string) => { const m = name.match(/\d+/); return m ? parseInt(m[0], 10) : Infinity }
              // 倒序排列（最新在前）
              const sorted = [...episodes].sort((a, b) => {
                const d = getNum(a.name) - getNum(b.name)
                return d !== 0 ? d : a.name.localeCompare(b.name, 'zh')
              }).reverse()
              return (
                <EpisodeSelector
                  projectName={projectName}
                  episodes={sorted.map((ep) => {
                    const stageArtifacts = resolveEpisodeStageArtifacts({
                      novelText: null,
                      clips: ep.clips || [],
                      storyboards: ep.storyboards || [],
                      voiceLines: [],
                    })
                    return {
                      id: ep.id,
                      title: ep.name,
                      episodeNumber: ep.episodeNumber,
                      summary: ep.description ?? undefined,
                      status: {
                        script: stageArtifacts.hasScript ? 'ready' as const : 'empty' as const,
                        visual: stageArtifacts.hasVideo ? 'ready' as const : 'empty' as const,
                      },
                    }
                  })}
                  currentId={currentEpisodeId}
                  onSelect={(id) => onEpisodeSelect?.(id)}
                  onAdd={onEpisodeCreate}
                  onRename={(id, newName) => onEpisodeRename?.(id, newName)}
                  onDelete={onEpisodeDelete}
                />
              )
            })()}
            <CapsuleNav
              items={capsuleNavItems}
              activeId={currentStage}
              onItemClick={onStageChange}
              projectId={projectId}
              episodeId={episodeId}
              compact
            />
            <WorkspaceTopActions
              onOpenAssetLibrary={onOpenAssetLibrary}
              onOpenSettings={onOpenSettingsModal}
              assetLibraryLabel={assetLibraryLabel}
              settingsLabel={settingsLabel}
              className="flex items-center gap-3"
            />
          </div>
        </div>
      </header>
    </>
  )
}
