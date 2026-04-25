'use client'

import type { NovelPromotionPanel } from '@/types/project'
import { extractErrorMessage } from '@/lib/errors/extract'

export interface PanelCandidateData {
  candidates: string[]
  selectedIndex: number
}

interface CandidateStateLike {
  candidates: string[]
  selectedIndex: number
  originalUrl?: string | null
  previousUrl?: string | null
  hasPendingCandidates?: boolean
  rawCandidatesCount?: number
}

interface PanelCandidateSystemLike {
  getCandidateState: (id: string) => CandidateStateLike | null | undefined
  clearCandidates: (id: string) => void
  syncCandidates: (
    id: string,
    originalUrl: string | null,
    candidates: string[],
    previousUrl: string | null,
    meta?: { hasPendingCandidates: boolean; rawCandidatesCount: number },
  ) => void
  initCandidates: (
    id: string,
    originalUrl: string | null,
    candidates: string[],
    previousUrl: string | null,
    meta?: { hasPendingCandidates: boolean; rawCandidatesCount: number },
  ) => void
}

function sameStringArray(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false
  }
  return true
}

function parseCandidateImages(candidateImagesStr: string): string[] | null {
  try {
    const candidates = JSON.parse(candidateImagesStr)
    if (!Array.isArray(candidates) || candidates.length === 0) return null
    const normalized = candidates.filter((candidate: string) => typeof candidate === 'string' && !!candidate)
    return normalized.length > 0 ? normalized : null
  } catch {
    return null
  }
}

function clearIfExists(system: PanelCandidateSystemLike, panelId: string) {
  const state = system.getCandidateState(panelId)
  if (state) {
    system.clearCandidates(panelId)
  }
}

function isArrayPrefix(prefix: string[], full: string[]) {
  if (prefix.length > full.length) return false
  for (let index = 0; index < prefix.length; index += 1) {
    if (prefix[index] !== full[index]) return false
  }
  return true
}

export function ensurePanelCandidatesInitialized(
  panel: NovelPromotionPanel,
  candidateSystem: PanelCandidateSystemLike,
): boolean {
  const candidateImagesStr = panel.candidateImages
  if (!candidateImagesStr) {
    clearIfExists(candidateSystem, panel.id)
    return false
  }

  const candidates = parseCandidateImages(candidateImagesStr)
  if (!candidates) {
    clearIfExists(candidateSystem, panel.id)
    return false
  }

  const validCandidates = candidates.filter((candidate) => !candidate.startsWith('PENDING:'))
  if (validCandidates.length === 0) {
    clearIfExists(candidateSystem, panel.id)
    return true
  }

  const existingState = candidateSystem.getCandidateState(panel.id)

  const originalUrl = panel.imageUrl || null
  const previousUrl = panel.previousImageUrl || null
  const hasPendingCandidates = candidates.some((candidate) => candidate.startsWith('PENDING:'))
  const rawCandidatesCount = candidates.length

  const meta = { hasPendingCandidates, rawCandidatesCount }

  if (!existingState) {
    candidateSystem.initCandidates(panel.id, originalUrl, validCandidates, previousUrl, meta)
    return true
  }

  const existingOriginalUrl = existingState.originalUrl || null
  const existingPreviousUrl = existingState.previousUrl || null
  const urlChanged = existingOriginalUrl !== originalUrl || existingPreviousUrl !== previousUrl

  const existingHasPendingCandidates = existingState.hasPendingCandidates ?? false
  const isNewGenerationStart = !existingHasPendingCandidates && hasPendingCandidates

  // “生成开始”或“重生成/撤回”时：默认选中第一个
  if (urlChanged || isNewGenerationStart) {
    candidateSystem.initCandidates(panel.id, originalUrl, validCandidates, previousUrl, meta)
    return true
  }

  const candidatesChanged = !sameStringArray(existingState.candidates, validCandidates)
  const metaChanged =
    (existingState.hasPendingCandidates ?? false) !== hasPendingCandidates ||
    (existingState.rawCandidatesCount ?? existingState.candidates.length) !== rawCandidatesCount

  if (candidatesChanged) {
    // 增量候选（通常是追加）尽量保留当前选中项；只有候选被“完全替换”才重置为第一个
    if (isArrayPrefix(existingState.candidates, validCandidates)) {
      candidateSystem.syncCandidates(panel.id, originalUrl, validCandidates, previousUrl, meta)
    } else {
      candidateSystem.initCandidates(panel.id, originalUrl, validCandidates, previousUrl, meta)
    }
    return true
  }

  // 候选数组没变，但生成中/完成状态（PENDING）变化了：只同步元信息，避免 selectedIndex 被重置
  if (metaChanged) {
    candidateSystem.syncCandidates(panel.id, originalUrl, validCandidates, previousUrl, meta)
  }

  return true
}

export function getPanelCandidatesFromRuntime(
  panel: NovelPromotionPanel,
  candidateSystem: PanelCandidateSystemLike,
): PanelCandidateData | null {
  const localState = candidateSystem.getCandidateState(panel.id)
  if (localState && localState.candidates.length > 0) {
    return {
      candidates: localState.candidates,
      selectedIndex: localState.selectedIndex,
    }
  }

  const candidateImagesStr = panel.candidateImages
  if (!candidateImagesStr) return null

  const candidates = parseCandidateImages(candidateImagesStr)
  if (!candidates) return null

  const validCandidates = candidates.filter((candidate) => !candidate.startsWith('PENDING:'))
  if (validCandidates.length === 0) {
    return {
      candidates,
      selectedIndex: 0,
    }
  }

  return {
    candidates: validCandidates,
    selectedIndex: 0,
  }
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return extractErrorMessage(error, fallback)
}
