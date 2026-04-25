'use client'

/**
 * useCandidateSystem - 统一候选图片管理 Hook
 * 适用于 Panel、Character、Location 等所有需要候选图片选择的实体
 * 
 * 功能：
 * - 初始化候选图片列表
 * - 选择候选图片索引
 * - 获取当前显示图片
 * - 确认/取消选择
 * - 支持撤回（previousUrl）
 */

import { useState, useCallback } from 'react'

export interface CandidateState {
    originalUrl: string | null      // 当前确认的图片 URL
    candidates: string[]            // 候选图片列表
    selectedIndex: number           // 当前选中 (-1=原图, 0-N=候选)
    previousUrl: string | null      // 上一版本 URL（支持撤回）
    hasPendingCandidates: boolean  // 是否包含 PENDING 候选（用于区分“生成开始/进行中”）
    rawCandidatesCount: number     // 候选数组原始长度（包含 PENDING）
}

export function useCandidateSystem<TId extends string = string>() {
    const [states, setStates] = useState<Map<TId, CandidateState>>(new Map())

    type CandidateMeta = {
        hasPendingCandidates: boolean
        rawCandidatesCount: number
    }

    /**
     * 初始化某个实体的候选图片
     */
    const initCandidates = useCallback((
        id: TId,
        originalUrl: string | null,
        candidates: string[],
        previousUrl: string | null = null,
        meta?: CandidateMeta,
    ) => {
        setStates(prev => {
            const next = new Map(prev)
            next.set(id, {
                originalUrl,
                candidates: candidates.filter(c => c && !c.startsWith('PENDING:')), // 过滤 PENDING 任务
                selectedIndex: 0, // 默认选中第一张候选
                previousUrl,
                hasPendingCandidates: meta?.hasPendingCandidates ?? false,
                rawCandidatesCount: meta?.rawCandidatesCount ?? candidates.length,
            })
            return next
        })
    }, [])

    /**
     * 选择候选图片索引（本地状态更新）
     * @param index -1 表示选择原图，0-N 表示候选图
     */
    const selectCandidate = useCallback((id: TId, index: number) => {
        setStates(prev => {
            const current = prev.get(id)
            if (!current) return prev

            const maxIndex = current.candidates.length - 1
            const nextSelectedIndex = Math.max(-1, Math.min(index, maxIndex))
            if (current.selectedIndex === nextSelectedIndex) return prev

            const next = new Map(prev)
            next.set(id, { ...current, selectedIndex: nextSelectedIndex })
            return next
        })
    }, [])

    /**
     * 获取当前显示的图片 URL
     */
    const getDisplayImage = useCallback((id: TId, fallback: string | null = null): string | null => {
        const state = states.get(id)
        if (!state || state.candidates.length === 0) return fallback

        if (state.selectedIndex === -1) {
            return state.originalUrl || fallback
        }

        return state.candidates[state.selectedIndex] ?? fallback
    }, [states])

    /**
     * 获取确认数据（用于 API 调用）
     * @returns 选中的 URL，或 null 如果没有选中
     */
    const getConfirmData = useCallback((id: TId): { selectedUrl: string } | null => {
        const state = states.get(id)
        if (!state || state.candidates.length === 0) return null

        if (state.selectedIndex === -1) {
            // 选择原图
            if (!state.originalUrl) return null
            return { selectedUrl: state.originalUrl }
        }

        const selectedUrl = state.candidates[state.selectedIndex]
        if (!selectedUrl) return null
        return { selectedUrl }
    }, [states])

    /**
     * 清除候选状态
     */
    const clearCandidates = useCallback((id: TId) => {
        setStates(prev => {
            if (!prev.has(id)) return prev
            const next = new Map(prev)
            next.delete(id)
            return next
        })
    }, [])

    /**
     * 同步候选列表（尽量保留当前选中的候选 URL 对应索引）
     * - 主要用于候选列表增量更新时，避免 selectedIndex 被强制重置。
     */
    const syncCandidates = useCallback((
        id: TId,
        originalUrl: string | null,
        candidates: string[],
        previousUrl: string | null = null,
        meta?: CandidateMeta,
    ) => {
        setStates(prev => {
            const next = new Map(prev)
            const existing = next.get(id)

            const normalizedCandidates = candidates.filter(c => c && !c.startsWith('PENDING:'))
            const nextHasPendingCandidates = meta?.hasPendingCandidates ?? false
            const nextRawCandidatesCount = meta?.rawCandidatesCount ?? candidates.length

            if (!existing) {
                next.set(id, {
                    originalUrl,
                    candidates: normalizedCandidates,
                    selectedIndex: 0,
                    previousUrl,
                    hasPendingCandidates: nextHasPendingCandidates,
                    rawCandidatesCount: nextRawCandidatesCount,
                })
                return next
            }

            const urlChanged =
                (existing.originalUrl || null) !== (originalUrl || null) ||
                (existing.previousUrl || null) !== (previousUrl || null)

            // 重生成/撤回导致 URL 变化时，回到第一项（符合默认第一个的预期）
            if (urlChanged) {
                next.set(id, {
                    ...existing,
                    originalUrl,
                    candidates: normalizedCandidates,
                    selectedIndex: 0,
                    previousUrl,
                    hasPendingCandidates: nextHasPendingCandidates,
                    rawCandidatesCount: nextRawCandidatesCount,
                })
                return next
            }

            const currentSelectedIndex = existing.selectedIndex
            const currentSelectedUrl =
                currentSelectedIndex >= 0 && currentSelectedIndex < existing.candidates.length
                    ? existing.candidates[currentSelectedIndex]
                    : null

            let nextSelectedIndex = 0
            if (currentSelectedUrl) {
                const idx = normalizedCandidates.indexOf(currentSelectedUrl)
                if (idx >= 0) nextSelectedIndex = idx
            }

            next.set(id, {
                ...existing,
                originalUrl,
                candidates: normalizedCandidates,
                selectedIndex: nextSelectedIndex,
                previousUrl,
                hasPendingCandidates: nextHasPendingCandidates,
                rawCandidatesCount: nextRawCandidatesCount,
            })
            return next
        })
    }, [])

    /**
     * 检查是否有候选图片
     */
    const hasCandidates = useCallback((id: TId): boolean => {
        const state = states.get(id)
        return !!state && state.candidates.length > 0
    }, [states])

    /**
     * 检查是否可以撤回
     */
    const canUndo = useCallback((id: TId): boolean => {
        const state = states.get(id)
        return !!state?.previousUrl
    }, [states])

    /**
     * 获取候选状态（用于 UI 渲染）
     */
    const getCandidateState = useCallback((id: TId): CandidateState | null => {
        return states.get(id) ?? null
    }, [states])

    return {
        states,
        initCandidates,
        selectCandidate,
        syncCandidates,
        getDisplayImage,
        getConfirmData,
        clearCandidates,
        hasCandidates,
        canUndo,
        getCandidateState
    }
}
