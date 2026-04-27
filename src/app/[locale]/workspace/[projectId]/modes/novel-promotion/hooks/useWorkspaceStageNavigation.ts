'use client'

import type { StageArtifactReadiness } from '@/lib/novel-promotion/stage-readiness'
import type { Episode } from '../types'

interface CapsuleNavItem {
  id: string
  icon: string
  label: string
  status: 'empty' | 'active' | 'processing' | 'ready'
  disabled?: boolean
  disabledLabel?: string
  count?: number
}

interface UseWorkspaceStageNavigationParams {
  isAnyOperationRunning: boolean
  stageArtifacts: StageArtifactReadiness
  episode?: Episode | null
  t: (key: string) => string
}

function computeStageCounts(episode: Episode | null | undefined) {
  if (!episode) return { screenplays: 0, panels: 0, videos: 0 }

  const clips = episode.clips ?? []
  const storyboards = episode.storyboards ?? []

  return {
    screenplays: clips.filter((c) => c.screenplay && c.screenplay.trim().length > 0).length,
    panels: storyboards.reduce((sum, sb) => sum + (sb.panels?.length ?? 0), 0),
    videos: storyboards.reduce(
      (sum, sb) =>
        sum + (sb.panels?.filter((p) => (p.videoUrl?.trim()?.length ?? 0) > 0).length ?? 0),
      0,
    ),
  }
}

export function useWorkspaceStageNavigation({
  isAnyOperationRunning,
  stageArtifacts,
  episode,
  t,
}: UseWorkspaceStageNavigationParams): CapsuleNavItem[] {
  const getStageStatus = (stageId: string): 'empty' | 'active' | 'processing' | 'ready' => {
    if (isAnyOperationRunning) return 'processing'

    switch (stageId) {
      case 'config':
        return stageArtifacts.hasStory ? 'ready' : 'active'
      case 'assets':
        return stageArtifacts.hasScript ? 'ready' : 'empty'
      case 'storyboard':
        return stageArtifacts.hasStoryboard ? 'ready' : 'empty'
      case 'videos':
      case 'editor':
        return stageArtifacts.hasVideo ? 'ready' : 'empty'
      case 'voice':
        return stageArtifacts.hasVoice ? 'ready' : 'empty'
      default:
        return 'empty'
    }
  }

  const counts = computeStageCounts(episode)

  return [
    { id: 'config', icon: 'S', label: t('stages.story'), status: getStageStatus('config'), count: 1 },
    { id: 'script', icon: 'A', label: t('stages.script'), status: getStageStatus('assets'), count: counts.screenplays },
    { id: 'storyboard', icon: 'B', label: t('stages.storyboard'), status: getStageStatus('storyboard'), count: counts.panels },
    { id: 'videos', icon: 'V', label: t('stages.video'), status: getStageStatus('videos'), count: counts.videos },
    {
      id: 'editor',
      icon: 'E',
      label: t('stages.editor'),
      status: 'empty',
      disabled: true,
      disabledLabel: t('stages.editorComingSoon'),
    },
  ]
}
