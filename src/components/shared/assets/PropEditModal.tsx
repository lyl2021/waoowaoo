'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AppIcon } from '@/components/ui/icons'
import { shouldShowError } from '@/lib/error-utils'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import {
  useAiModifyProjectPropDescription,
  useAiModifyPropDescription,
  useAssetActions,
} from '@/lib/query/hooks'
import { AiModifyDescriptionField } from './AiModifyDescriptionField'
import { ART_STYLES } from '@/lib/constants'

export interface PropEditModalProps {
  mode: 'asset-hub' | 'project'
  propId: string
  propName: string
  folderId?: string | null
  folders?: Array<{ id: string; name: string }>
  summary: string
  description: string
  artStyle?: string | null
  variantId?: string
  projectId?: string
  onClose: () => void
  onRefresh?: () => void
}

export function PropEditModal({
  mode,
  propId,
  propName,
  folderId,
  folders,
  summary,
  description,
  artStyle,
  variantId,
  projectId,
  onClose,
  onRefresh,
}: PropEditModalProps) {
  const t = useTranslations('assets')
  const tHub = useTranslations('assetHub')
  const actions = useAssetActions({
    scope: mode === 'asset-hub' ? 'global' : 'project',
    projectId,
    kind: 'prop',
  })
  const [editingName, setEditingName] = useState(propName)
  const [editingSummary, setEditingSummary] = useState(summary)
  const [editingDescription, setEditingDescription] = useState(description)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(folderId ?? null)
  const [editingArtStyle, setEditingArtStyle] = useState(artStyle ?? 'american-comic')
  const [aiModifyInstruction, setAiModifyInstruction] = useState('')
  const [isAiModifying, setIsAiModifying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const aiModifyingState = isAiModifying
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'modify',
      resource: 'image',
      hasOutput: true,
    })
    : null
  const savingState = isSaving
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'process',
      resource: 'text',
      hasOutput: false,
    })
    : null
  const aiModifyAssetHub = useAiModifyPropDescription()
  const aiModifyProject = useAiModifyProjectPropDescription(projectId ?? '')

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message
    return fallback
  }

  const persist = async () => {
    const payload: Record<string, unknown> = {
      name: editingName.trim(),
      summary: editingSummary.trim(),
    }
    const newFolderId = editingFolderId ?? null
    if (newFolderId !== (folderId ?? null)) {
      payload.folderId = newFolderId
    }
    const newArtStyle = editingArtStyle
    if (newArtStyle !== (artStyle ?? 'american-comic')) {
      payload.artStyle = newArtStyle
    }
    await actions.update(propId, payload)
    if (variantId) {
      await actions.updateVariant(propId, variantId, {
        description: editingDescription.trim(),
      })
    }
    onRefresh?.()
  }

  const handleAiModify = async () => {
    if (!aiModifyInstruction.trim()) return false

    try {
      setIsAiModifying(true)
      const data = mode === 'asset-hub'
        ? await aiModifyAssetHub.mutateAsync({
          propId,
          variantId,
          currentDescription: editingDescription,
          modifyInstruction: aiModifyInstruction,
        })
        : await aiModifyProject.mutateAsync({
          propId,
          variantId,
          currentDescription: editingDescription,
          modifyInstruction: aiModifyInstruction,
        })

      if (data?.modifiedDescription) {
        setEditingDescription(data.modifiedDescription)
        setAiModifyInstruction('')
        return true
      }
      return false
    } catch (error: unknown) {
      if (shouldShowError(error)) {
        alert(`${t('modal.modifyFailed')}: ${getErrorMessage(error, t('errors.failed'))}`)
      }
      return false
    } finally {
      setIsAiModifying(false)
    }
  }

  const handleSaveOnly = async () => {
    if (!editingName.trim() || !editingSummary.trim() || !editingDescription.trim()) return
    try {
      setIsSaving(true)
      await persist()
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAndGenerate = async () => {
    if (!editingName.trim() || !editingSummary.trim() || !editingDescription.trim()) return
    try {
      setIsSaving(true)
      await persist()
      await actions.generate({ id: propId })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 p-4">
      <div className="glass-surface-modal max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
              {t('modal.editProp')} - {propName}
            </h3>
            <button
              onClick={onClose}
              className="glass-btn-base glass-btn-soft w-9 h-9 rounded-full text-[var(--glass-text-tertiary)]"
            >
              <AppIcon name="close" className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="glass-field-label block">
              {t('prop.name')}
            </label>
            <input
              type="text"
              value={editingName}
              onChange={(event) => setEditingName(event.target.value)}
              className="glass-input-base w-full px-3 py-2"
              placeholder={t('modal.namePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <label className="glass-field-label block">
              {t('prop.summary')}
            </label>
            <textarea
              value={editingSummary}
              onChange={(event) => setEditingSummary(event.target.value)}
              className="glass-textarea-base h-28 w-full px-3 py-2 resize-none"
              placeholder={t('prop.summaryPlaceholder')}
            />
          </div>

          <AiModifyDescriptionField
            label={t('prop.description')}
            description={editingDescription}
            onDescriptionChange={setEditingDescription}
            descriptionPlaceholder={t('prop.descriptionPlaceholder')}
            aiInstruction={aiModifyInstruction}
            onAiInstructionChange={setAiModifyInstruction}
            aiInstructionPlaceholder={t('modal.modifyPlaceholderProp')}
            onAiModify={handleAiModify}
            isAiModifying={isAiModifying}
            aiModifyingState={aiModifyingState}
            actionLabel={t('modal.modifyDescription')}
            cancelLabel={t('common.cancel')}
          />

          {mode === 'asset-hub' && folders && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="glass-field-label block">{tHub('selectGroup')}</label>
                <select
                  value={editingFolderId ?? '__default__'}
                  onChange={(e) => setEditingFolderId(e.target.value === '__default__' ? null : e.target.value)}
                  className="glass-input-base w-full px-3 py-2 text-sm"
                >
                  <option value="__default__">{tHub('defaultGroup')}</option>
                  {folders.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="glass-field-label block">{t('artStyle')}</label>
                <select
                  value={editingArtStyle}
                  onChange={(e) => setEditingArtStyle(e.target.value)}
                  className="glass-input-base w-full px-3 py-2 text-sm"
                >
                  {ART_STYLES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end p-4 border-t border-[var(--glass-stroke-base)] bg-[var(--glass-bg-surface-strong)] rounded-b-lg flex-shrink-0">
          <button
            onClick={onClose}
            className="glass-btn-base glass-btn-secondary px-4 py-2 rounded-lg"
            disabled={isSaving}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => void handleSaveOnly()}
            disabled={isSaving || !editingName.trim() || !editingSummary.trim() || !editingDescription.trim()}
            className="glass-btn-base glass-btn-tone-info px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <TaskStatusInline state={savingState} className="text-white [&>span]:text-white [&_svg]:text-white" />
            ) : (
              t('modal.saveOnly')
            )}
          </button>
          <button
            onClick={() => void handleSaveAndGenerate()}
            disabled={isSaving || !editingName.trim() || !editingSummary.trim() || !editingDescription.trim()}
            className="glass-btn-base glass-btn-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('modal.saveAndGenerate')}
          </button>
        </div>
      </div>
    </div>
  )
}
