'use client'

import type { DragEvent, RefObject } from 'react'
import { useTranslations } from 'next-intl'
import { ART_STYLES, ART_STYLE_CATEGORIES } from '@/lib/constants'
import CharacterCreationPreview from './CharacterCreationPreview'
import { AppIcon } from '@/components/ui/icons'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { StyleSelector } from '@/components/selectors/RatioStyleSelectors'

type Mode = 'asset-hub' | 'project'

interface AvailableCharacter {
  id: string
  name: string
  appearances: unknown[]
}

interface CharacterCreationFormProps {
  mode: Mode
  createMode: 'reference' | 'description'
  setCreateMode: (mode: 'reference' | 'description') => void
  name: string
  setName: (value: string) => void
  description: string
  setDescription: (value: string) => void
  aiInstruction: string
  setAiInstruction: (value: string) => void
  artStyle: string
  setArtStyle: (value: string) => void
  referenceImagesBase64: string[]
  isSubAppearance: boolean
  setIsSubAppearance: (value: boolean) => void
  selectedCharacterId: string
  setSelectedCharacterId: (value: string) => void
  changeReason: string
  setChangeReason: (value: string) => void
  availableCharacters: AvailableCharacter[]
  fileInputRef: RefObject<HTMLInputElement | null>
  handleDrop: (event: DragEvent<HTMLDivElement>) => void
  handleFileSelect: (files: FileList) => void
  handleClearReference: (index?: number) => void
  handleExtractDescription: () => void
  handleAiDesign: () => void
  isAiDesigning: boolean
  isExtracting: boolean
  // 分组
  folders?: Array<{ id: string; name: string }>
  groupFolderId?: string | null
  onGroupFolderChange?: (id: string | null) => void
}

const SparklesIcon = ({ className }: { className?: string }) => (
  <AppIcon name="sparklesAlt" className={className} />
)

const PhotoIcon = ({ className }: { className?: string }) => (
  <AppIcon name="image" className={className} />
)

export default function CharacterCreationForm({
  mode,
  createMode,
  setCreateMode,
  name,
  setName,
  description,
  setDescription,
  aiInstruction,
  setAiInstruction,
  artStyle,
  setArtStyle,
  referenceImagesBase64,
  isSubAppearance,
  setIsSubAppearance,
  selectedCharacterId,
  setSelectedCharacterId,
  changeReason,
  setChangeReason,
  availableCharacters,
  fileInputRef,
  handleDrop,
  handleFileSelect,
  handleClearReference,
  handleExtractDescription,
  handleAiDesign,
  isAiDesigning,
  isExtracting,
  folders,
  groupFolderId,
  onGroupFolderChange,
}: CharacterCreationFormProps) {
  const t = useTranslations('assetModal')
  const tHub = useTranslations('assetHub')

  return (
    <div className="space-y-5">
      {/* 子形象 */}
      {mode === 'project' && availableCharacters.length > 0 && (
        <div className="flex items-start gap-3 p-3 glass-surface-soft rounded-lg border border-[var(--glass-stroke-base)]">
          <input
            type="checkbox"
            id="isSubAppearance"
            checked={isSubAppearance}
            onChange={(e) => setIsSubAppearance(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[var(--glass-stroke-base)] text-[var(--glass-tone-info-fg)]"
          />
          <label htmlFor="isSubAppearance" className="flex-1 text-sm cursor-pointer">
            <span className="font-medium text-[var(--glass-text-primary)]">{t('character.isSubAppearance')}</span>
            <p className="text-xs text-[var(--glass-text-secondary)] mt-0.5">{t('character.isSubAppearanceHint')}</p>
          </label>
        </div>
      )}

      {isSubAppearance && (
        <div className="space-y-2">
          <label className="glass-field-label block">
            {t('character.selectMainCharacter')} <span className="text-[var(--glass-tone-danger-fg)]">*</span>
          </label>
          <select
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
            className="glass-select-base w-full px-3 py-2 text-sm"
          >
            <option value="">{t('character.selectCharacterPlaceholder')}</option>
            {availableCharacters.map((char) => (
              <option key={char.id} value={char.id}>
                {char.name} ({t('character.appearancesCount', { count: char.appearances.length })})
              </option>
            ))}
          </select>
        </div>
      )}

      {isSubAppearance && (
        <div className="space-y-2">
          <label className="glass-field-label block">
            {t('character.changeReason')} <span className="text-[var(--glass-tone-danger-fg)]">*</span>
          </label>
          <input
            type="text"
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder={t('character.changeReasonPlaceholder')}
            className="glass-input-base w-full px-3 py-2 text-sm"
          />
        </div>
      )}

      {!isSubAppearance && (
        <div className="space-y-2">
          <label className="glass-field-label block">
            {t('character.name')} <span className="text-[var(--glass-tone-danger-fg)]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('character.namePlaceholder')}
            className="glass-input-base w-full px-3 py-2 text-sm"
          />
        </div>
      )}

      {/* 画面风格 + 分组并排 */}
      {!isSubAppearance && (
        <div className="flex gap-4 items-start">
          <div className="flex-1 min-w-0 space-y-2">
            <label className="glass-field-label block">
              {t('artStyle.title')}
            </label>
            <StyleSelector
              value={artStyle}
              onChange={setArtStyle}
              options={ART_STYLES.map(s => ({ value: s.value, label: s.label, description: s.description, category: s.category }))}
              categories={ART_STYLE_CATEGORIES}
            />
          </div>
          {mode === 'asset-hub' && folders && onGroupFolderChange && (
            <div className="w-48 shrink-0 space-y-2">
              <label className="glass-field-label block">{tHub('selectGroup')}</label>
              <select
                value={groupFolderId ?? '__default__'}
                onChange={(e) => onGroupFolderChange(e.target.value === '__default__' ? null : e.target.value)}
                className="glass-input-base w-full px-3 py-2 text-sm"
              >
                <option value="__default__">{tHub('defaultGroup')}</option>
                {folders.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* AI 设计 & 参考图卡片 */}
      {!isSubAppearance && (
        <div className="glass-surface-soft rounded-xl p-4 space-y-4 border border-[var(--glass-stroke-base)]">
          {/* 模式切换 - 放在卡片头部 */}
          <SegmentedControl
            options={[
              { value: 'description', label: <><SparklesIcon className="w-4 h-4" /><span>{t('aiDesign.title')}</span></> },
              { value: 'reference', label: <><PhotoIcon className="w-4 h-4" /><span>{t('character.modeReference')}</span></> },
            ]}
            value={createMode}
            onChange={(val) => setCreateMode(val as 'reference' | 'description')}
          />

          {/* 描述模式内容 */}
          {createMode === 'description' && (
            <div className="space-y-2">
              <textarea
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder={t('aiDesign.placeholder')}
                className="glass-textarea-base w-full min-h-[120px] px-3 py-2 text-sm resize-none"
                disabled={isAiDesigning}
              />
              <button
                onClick={handleAiDesign}
                disabled={isAiDesigning || !aiInstruction.trim()}
                className="glass-btn-base glass-btn-tone-info w-full px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isAiDesigning ? t('aiDesign.generating') : t('aiDesign.generate')}
              </button>
            </div>
          )}

          {/* 参考图设计内容 */}
          {createMode === 'reference' && (
            <div className="space-y-3">
              <CharacterCreationPreview
                referenceImagesBase64={referenceImagesBase64}
                fileInputRef={fileInputRef}
                onDrop={handleDrop}
                onFileSelect={handleFileSelect}
                onClearReference={handleClearReference}
              />
              <button
                onClick={handleExtractDescription}
                disabled={isExtracting || referenceImagesBase64.length === 0}
                className="glass-btn-base glass-btn-tone-info w-full px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isExtracting ? t('aiDesign.generating') : t('character.extractFirst')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 描述文本框 - 始终显示 */}
      <div className="space-y-2">
        <label className="glass-field-label block">
          {isSubAppearance ? t('character.modifyDescription') : t('character.description')} <span className="text-[var(--glass-tone-danger-fg)]">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder={isSubAppearance
            ? t('character.modifyDescriptionPlaceholder')
            : t('character.descPlaceholder')}
          className="glass-textarea-base w-full px-3 py-2 text-sm resize-none"
        />
      </div>
    </div>
  )
}
