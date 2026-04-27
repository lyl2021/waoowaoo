'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useCallback } from 'react'
import { AppIcon } from '@/components/ui/icons'

export interface ConflictItem {
    index: number
    name: string
    kind: string
    existingId: string
}

interface ImportConflictModalProps {
    conflicts: Record<number, ConflictItem>
    resolutions: Record<number, 'skip' | 'overwrite'>
    onResolve: (index: number, action: 'skip' | 'overwrite') => void
    onConfirm: () => void
    onCancel: () => void
    loading: boolean
}

const kindLabels: Record<string, string> = {
    character: '角色',
    location: '场景',
    prop: '道具',
    voice: '音色',
}

export function ImportConflictModal({
    conflicts,
    resolutions,
    onResolve,
    onConfirm,
    onCancel,
    loading,
}: ImportConflictModalProps) {
    const t = useTranslations('assetHub')

    const conflictList = useMemo(
        () => Object.values(conflicts).sort((a, b) => a.index - b.index),
        [conflicts],
    )

    const allResolved = useMemo(
        () => conflictList.every((c) => resolutions[c.index] !== undefined),
        [conflictList, resolutions],
    )

    const handleSelectAll = useCallback(
        (action: 'skip' | 'overwrite') => {
            for (const c of conflictList) {
                onResolve(c.index, action)
            }
        },
        [conflictList, onResolve],
    )

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-2xl border border-[var(--glass-stroke-base)] w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--glass-stroke-base)]">
                    <div className="flex items-center gap-2">
                        <AppIcon name="alert" className="w-5 h-5 text-[var(--glass-tone-warning-fg)]" />
                        <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                            {t('importConflictTitle')}
                        </h2>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="glass-btn-base glass-btn-soft h-8 w-8 rounded-lg flex items-center justify-center"
                    >
                        <AppIcon name="close" className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                    <p className="text-sm text-[var(--glass-text-secondary)] mb-3">
                        {t('importConflictHint', { count: conflictList.length })}
                    </p>

                    {/* Batch actions */}
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--glass-stroke-base)]">
                        <span className="text-xs text-[var(--glass-text-tertiary)] mr-1">{t('importBatchAction')}</span>
                        <button
                            onClick={() => handleSelectAll('skip')}
                            className="glass-btn-base glass-btn-secondary px-3 py-1.5 rounded-lg text-xs"
                        >
                            {t('importSkipAll')}
                        </button>
                        <button
                            onClick={() => handleSelectAll('overwrite')}
                            className="glass-btn-base glass-btn-secondary px-3 py-1.5 rounded-lg text-xs"
                        >
                            {t('importOverwriteAll')}
                        </button>
                    </div>

                    {/* Conflict list */}
                    {conflictList.map((c) => {
                        const resolution = resolutions[c.index]
                        return (
                            <div
                                key={c.index}
                                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[var(--glass-bg-muted)]"
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="text-xs text-[var(--glass-text-tertiary)] shrink-0 px-1.5 py-0.5 rounded bg-[var(--glass-bg-base)]">
                                        {kindLabels[c.kind] ?? c.kind}
                                    </span>
                                    <span className="text-sm text-[var(--glass-text-primary)] truncate">
                                        {c.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onResolve(c.index, 'skip')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            resolution === 'skip'
                                                ? 'bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)]'
                                                : 'glass-btn-base glass-btn-soft text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]'
                                        }`}
                                    >
                                        {t('importSkip')}
                                    </button>
                                    <button
                                        onClick={() => onResolve(c.index, 'overwrite')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            resolution === 'overwrite'
                                                ? 'bg-[var(--glass-tone-warning-bg)] text-[var(--glass-tone-warning-fg)]'
                                                : 'glass-btn-base glass-btn-soft text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]'
                                        }`}
                                    >
                                        {t('importOverwrite')}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--glass-stroke-base)]">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="glass-btn-base glass-btn-secondary px-4 py-2 rounded-lg text-sm"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!allResolved || loading}
                        className="glass-btn-base glass-btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? t('importing') : t('importConfirm')}
                    </button>
                </div>
            </div>
        </div>
    )
}
