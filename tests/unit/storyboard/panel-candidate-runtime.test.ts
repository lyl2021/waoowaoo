import { describe, it, expect } from 'vitest'
import type { NovelPromotionPanel } from '@/types/project'

import {
  ensurePanelCandidatesInitialized,
  getPanelCandidatesFromRuntime,
} from '@/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/storyboard/hooks/panel-candidate-runtime'

interface CandidateStateStub {
  id: string
  candidates: string[]
  selectedIndex: number
  originalUrl?: string | null
  previousUrl?: string | null
  hasPendingCandidates?: boolean
  rawCandidatesCount?: number
}

interface CandidateSystemStub {
  getCandidateState: (id: string) => CandidateStateStub | null
  clearCandidates: (id: string) => void
  initCandidates: (
    id: string,
    originalUrl: string | null,
    candidates: string[],
    previousUrl: string | null,
    meta?: { hasPendingCandidates: boolean; rawCandidatesCount: number },
  ) => void
  syncCandidates: (
    id: string,
    originalUrl: string | null,
    candidates: string[],
    previousUrl: string | null,
    meta?: { hasPendingCandidates: boolean; rawCandidatesCount: number },
  ) => void
}

interface PanelStub {
  id: string
  candidateImages: string
  imageUrl: string | null
  previousImageUrl: string | null
}

function createCandidateSystem(initial?: CandidateStateStub): {
  system: CandidateSystemStub
  states: Map<string, CandidateStateStub>
} {
  const states = new Map<string, CandidateStateStub>()
  if (initial) states.set(initial.id, initial)

  const system: CandidateSystemStub = {
    getCandidateState: (id: string) => states.get(id) ?? null,
    clearCandidates: (id: string) => {
      states.delete(id)
    },
    initCandidates: (
      id: string,
      originalUrl: string | null,
      candidates: string[],
      previousUrl: string | null,
      meta?: { hasPendingCandidates: boolean; rawCandidatesCount: number },
    ) => {
      states.set(id, {
        id,
        originalUrl,
        candidates,
        selectedIndex: 0,
        previousUrl,
        hasPendingCandidates: meta?.hasPendingCandidates ?? false,
        rawCandidatesCount: meta?.rawCandidatesCount ?? candidates.length,
      })
    },
    syncCandidates: (
      id: string,
      originalUrl: string | null,
      candidates: string[],
      previousUrl: string | null,
      meta?: { hasPendingCandidates: boolean; rawCandidatesCount: number },
    ) => {
      const existing = states.get(id)
      if (!existing) {
        states.set(id, {
          id,
          originalUrl,
          candidates,
          selectedIndex: 0,
          previousUrl,
          hasPendingCandidates: meta?.hasPendingCandidates ?? false,
          rawCandidatesCount: meta?.rawCandidatesCount ?? candidates.length,
        })
        return
      }

      const urlChanged =
        (existing.originalUrl || null) !== (originalUrl || null) ||
        (existing.previousUrl || null) !== (previousUrl || null)

      if (urlChanged) {
        states.set(id, {
          ...existing,
          originalUrl,
          candidates,
          selectedIndex: 0,
          previousUrl,
          hasPendingCandidates: meta?.hasPendingCandidates ?? false,
          rawCandidatesCount: meta?.rawCandidatesCount ?? candidates.length,
        })
        return
      }

      const selectedUrl =
        existing.selectedIndex >= 0 && existing.selectedIndex < existing.candidates.length
          ? existing.candidates[existing.selectedIndex]
          : null

      const nextSelectedIndex = selectedUrl ? Math.max(0, candidates.indexOf(selectedUrl)) : 0

      states.set(id, {
        ...existing,
        originalUrl,
        candidates,
        selectedIndex: nextSelectedIndex >= 0 ? nextSelectedIndex : 0,
        previousUrl,
        hasPendingCandidates: meta?.hasPendingCandidates ?? false,
        rawCandidatesCount: meta?.rawCandidatesCount ?? candidates.length,
      })
    },
  }

  return { system, states }
}

describe('panel-candidate-runtime', () => {
  it('initCandidates: first selection should default to index 0 when state is missing', () => {
    const { system, states } = createCandidateSystem()
    const panel = {
      id: 'p1',
      candidateImages: JSON.stringify(['PENDING:1', 'a.png']),
      imageUrl: null,
      previousImageUrl: null,
    } satisfies PanelStub

    ensurePanelCandidatesInitialized(panel as unknown as NovelPromotionPanel, system)

    const st = states.get('p1')
    expect(st).toBeTruthy()
    expect(st!.selectedIndex).toBe(0)
    expect(st!.candidates).toEqual(['a.png'])
    expect(st!.hasPendingCandidates).toBe(true)
  })

  it('generation start: pending transition should reset selection to first', () => {
    const { system, states } = createCandidateSystem({
      id: 'p1',
      originalUrl: null,
      previousUrl: null,
      candidates: ['a.png', 'b.png'],
      selectedIndex: 1, // selected 'b'
      hasPendingCandidates: false,
      rawCandidatesCount: 2,
    })

    const panel = {
      id: 'p1',
      candidateImages: JSON.stringify(['a.png', 'b.png', 'PENDING:2']),
      imageUrl: null,
      previousImageUrl: null,
    } satisfies PanelStub

    ensurePanelCandidatesInitialized(panel as unknown as NovelPromotionPanel, system)

    const st = states.get('p1')
    expect(st!.selectedIndex).toBe(0)
  })

  it('incremental candidates: keep selection when validCandidates are appended during generation', () => {
    const { system, states } = createCandidateSystem({
      id: 'p1',
      originalUrl: null,
      previousUrl: null,
      candidates: ['a.png', 'b.png'],
      selectedIndex: 1, // selected 'b'
      hasPendingCandidates: true,
      rawCandidatesCount: 3,
    })

    const panel = {
      id: 'p1',
      candidateImages: JSON.stringify(['a.png', 'b.png', 'c.png', 'PENDING:3']),
      imageUrl: null,
      previousImageUrl: null,
    } satisfies PanelStub

    ensurePanelCandidatesInitialized(panel as unknown as NovelPromotionPanel, system)

    const st = states.get('p1')
    expect(st!.candidates).toEqual(['a.png', 'b.png', 'c.png'])
    // selected url 'b.png' should stay selected at index 1
    expect(st!.selectedIndex).toBe(1)
  })

  it('url changed: should reset selection to first', () => {
    const { system, states } = createCandidateSystem({
      id: 'p1',
      originalUrl: null,
      previousUrl: null,
      candidates: ['a.png', 'b.png'],
      selectedIndex: 1,
      hasPendingCandidates: true,
      rawCandidatesCount: 3,
    })

    const panel = {
      id: 'p1',
      candidateImages: JSON.stringify(['a.png', 'b.png']),
      imageUrl: 'new-main.png',
      previousImageUrl: null,
    } satisfies PanelStub

    ensurePanelCandidatesInitialized(panel as unknown as NovelPromotionPanel, system)

    const st = states.get('p1')
    expect(st!.selectedIndex).toBe(0)
  })

  it('getPanelCandidatesFromRuntime should read selection from local state', () => {
    const { system } = createCandidateSystem()
    const panel = {
      id: 'p1',
      candidateImages: JSON.stringify(['a.png', 'b.png']),
      imageUrl: null,
      previousImageUrl: null,
    } satisfies PanelStub

    // First init
    ensurePanelCandidatesInitialized(panel as unknown as NovelPromotionPanel, system)
    // Mutate selection manually in our stub
    const st = system.getCandidateState('p1')
    st!.selectedIndex = 1

    const data = getPanelCandidatesFromRuntime(panel as unknown as NovelPromotionPanel, system)
    expect(data?.selectedIndex).toBe(1)
    expect(data?.candidates).toEqual(['a.png', 'b.png'])
  })
})

