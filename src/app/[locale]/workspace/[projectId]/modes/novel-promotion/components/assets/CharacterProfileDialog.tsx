'use client'

/**
 * 角色档案编辑对话框
 * 允许用户编辑角色档案的各项属性
 */

import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { CharacterProfileData, RoleLevel, CostumeTier } from '@/types/character-profile'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { AppIcon } from '@/components/ui/icons'

interface CharacterProfileDialogProps {
    isOpen: boolean
    characterName: string
    profileData: CharacterProfileData
    onClose: () => void
    onSave: (profileData: CharacterProfileData) => void
    isSaving?: boolean
}

const ROLE_LEVELS: RoleLevel[] = ['S', 'A', 'B', 'C', 'D']
const COSTUME_TIERS: CostumeTier[] = [5, 4, 3, 2, 1]

export default function CharacterProfileDialog({
    isOpen,
    characterName,
    profileData,
    onClose,
    onSave,
    isSaving = false
}: CharacterProfileDialogProps) {
    const t = useTranslations('assets')
    const savingState = isSaving
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: 'build',
            resource: 'image',
            hasOutput: false,
        })
        : null
    const [formData, setFormData] = useState<CharacterProfileData>(profileData)
    const [newTag, setNewTag] = useState('')
    const [newColor, setNewColor] = useState('')
    const [newKeyword, setNewKeyword] = useState('')
    const [newVoiceTrait, setNewVoiceTrait] = useState('')

    useEffect(() => {
        setFormData(profileData)
    }, [profileData])

    if (!isOpen) return null

    const handleSubmit = () => {
        onSave(formData)
    }

    const addTag = () => {
        if (newTag.trim() && !formData.personality_tags.includes(newTag.trim())) {
            setFormData({ ...formData, personality_tags: [...formData.personality_tags, newTag.trim()] })
            setNewTag('')
        }
    }

    const removeTag = (index: number) => {
        setFormData({
            ...formData,
            personality_tags: formData.personality_tags.filter((_, i) => i !== index)
        })
    }

    const addColor = () => {
        if (newColor.trim() && !formData.suggested_colors.includes(newColor.trim())) {
            setFormData({ ...formData, suggested_colors: [...formData.suggested_colors, newColor.trim()] })
            setNewColor('')
        }
    }

    const removeColor = (index: number) => {
        setFormData({
            ...formData,
            suggested_colors: formData.suggested_colors.filter((_, i) => i !== index)
        })
    }

    const addKeyword = () => {
        if (newKeyword.trim() && !formData.visual_keywords.includes(newKeyword.trim())) {
            setFormData({ ...formData, visual_keywords: [...formData.visual_keywords, newKeyword.trim()] })
            setNewKeyword('')
        }
    }

    const removeKeyword = (index: number) => {
        setFormData({
            ...formData,
            visual_keywords: formData.visual_keywords.filter((_, i) => i !== index)
        })
    }

    const addVoiceTrait = () => {
        const traits = formData.voice_traits ?? []
        if (newVoiceTrait.trim() && !traits.includes(newVoiceTrait.trim())) {
            setFormData({ ...formData, voice_traits: [...traits, newVoiceTrait.trim()] })
            setNewVoiceTrait('')
        }
    }

    const removeVoiceTrait = (index: number) => {
        setFormData({
            ...formData,
            voice_traits: (formData.voice_traits ?? []).filter((_, i) => i !== index)
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--glass-overlay)]" onClick={onClose}>
            <div
                className="bg-[var(--glass-bg-surface)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col m-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 头部 */}
                <div className="bg-[var(--glass-bg-surface)] border-b border-[var(--glass-stroke-base)] px-6 py-4 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-semibold text-[var(--glass-text-primary)]">{t('characterProfile.editDialogTitle', { name: characterName })}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--glass-bg-muted)] rounded-lg transition-colors"
                    >
                        <AppIcon name="close" className="w-5 h-5" />
                    </button>
                </div>

                {/* 表单内容 */}
                <div className="p-6 space-y-4 overflow-y-auto app-scrollbar flex-1 min-h-0">
                    {/* 角色层级 */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">{t('characterProfile.importanceLevel')}</label>
                        <select
                            value={formData.role_level}
                            onChange={(e) => setFormData({ ...formData, role_level: e.target.value as RoleLevel })}
                            className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)]"
                        >
                            {ROLE_LEVELS.map((level) => (
                                <option key={level} value={level}>
                                    {t(`characterProfile.importance.${level}` as never)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 角色原型 */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">{t('characterProfile.characterArchetype')}</label>
                        <input
                            type="text"
                            value={formData.archetype}
                            onChange={(e) => setFormData({ ...formData, archetype: e.target.value })}
                            placeholder={t('characterProfile.archetypePlaceholder')}
                            className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)]"
                        />
                    </div>

                    {/* 性格标签 */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">{t('characterProfile.personalityTags')}</label>
                        <div className="flex gap-2 mb-2">
                            {formData.personality_tags.map((tag, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] rounded-lg text-sm">
                                    {tag}
                                    <button onClick={() => removeTag(i)} className="inline-flex h-4 w-4 items-center justify-center hover:text-[var(--glass-text-primary)]">
                                        <AppIcon name="closeSm" className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                placeholder={t('characterProfile.addTagPlaceholder')}
                                className="flex-1 px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg"
                            />
                            <button onClick={addTag} className="px-4 py-2 bg-[var(--glass-accent-from)] text-white rounded-lg hover:bg-[var(--glass-accent-to)]">
                                {t("common.add")}
                            </button>
                        </div>
                    </div>

                    {/* 服装华丽度 */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">{t('characterProfile.costumeLevelLabel')}</label>
                        <select
                            value={formData.costume_tier}
                            onChange={(e) => setFormData({ ...formData, costume_tier: Number(e.target.value) as CostumeTier })}
                            className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)]"
                        >
                            {COSTUME_TIERS.map((tier) => (
                                <option key={tier} value={tier}>
                                    {t(`characterProfile.costumeLevel.${tier}` as never)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 建议色彩 */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">{t('characterProfile.suggestedColors')}</label>
                        <div className="flex gap-2 mb-2 flex-wrap">
                            {formData.suggested_colors.map((color, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)] rounded-lg text-sm">
                                    {color}
                                    <button onClick={() => removeColor(i)} className="inline-flex h-4 w-4 items-center justify-center hover:text-[var(--glass-text-primary)]">
                                        <AppIcon name="closeSm" className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                                placeholder={t('characterProfile.colorPlaceholder')}
                                className="flex-1 px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg"
                            />
                            <button onClick={addColor} className="px-4 py-2 bg-[var(--glass-accent-from)] text-white rounded-lg hover:bg-[var(--glass-accent-to)]">
                                {t("common.add")}
                            </button>
                        </div>
                    </div>

                    {/* 辨识标志 */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">
                            {t('characterProfile.primaryMarker')} <span className="text-xs text-[var(--glass-text-tertiary)]">{t('characterProfile.markerNote')}</span>
                        </label>
                        <input
                            type="text"
                            value={formData.primary_identifier || ''}
                            onChange={(e) => setFormData({ ...formData, primary_identifier: e.target.value })}
                            placeholder={t('characterProfile.markingsPlaceholder')}
                            className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)]"
                        />
                    </div>

                    {/* 视觉关键词 */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">{t('characterProfile.visualKeywords')}</label>
                        <div className="flex gap-2 mb-2 flex-wrap">
                            {formData.visual_keywords.map((keyword, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] rounded-lg text-sm">
                                    {keyword}
                                    <button onClick={() => removeKeyword(i)} className="inline-flex h-4 w-4 items-center justify-center hover:text-[var(--glass-text-primary)]">
                                        <AppIcon name="closeSm" className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                                placeholder={t('characterProfile.keywordsPlaceholder')}
                                className="flex-1 px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg"
                            />
                            <button onClick={addKeyword} className="px-4 py-2 bg-[var(--glass-accent-from)] text-white rounded-lg hover:bg-[var(--glass-accent-to)]">
                                {t("common.add")}
                            </button>
                        </div>
                    </div>

                    {/* 音色特征 */}
                    <div className="border-t border-[var(--glass-stroke-base)] pt-4">
                        <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-sm font-semibold text-[var(--glass-text-primary)]">{t('characterProfile.voiceSection')}</span>
                            <span className="text-xs text-[var(--glass-text-tertiary)]">{t('characterProfile.voiceSectionNote')}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* 声音性别 */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">{t('characterProfile.voiceGender')}</label>
                                <input
                                    type="text"
                                    value={formData.voice_gender ?? ''}
                                    onChange={(e) => setFormData({ ...formData, voice_gender: e.target.value || undefined })}
                                    placeholder={t('characterProfile.voiceGenderPlaceholder')}
                                    className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm"
                                />
                            </div>
                            {/* 声音年龄段 */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">{t('characterProfile.voiceAgeGroup')}</label>
                                <input
                                    type="text"
                                    value={formData.voice_age_group ?? ''}
                                    onChange={(e) => setFormData({ ...formData, voice_age_group: e.target.value || undefined })}
                                    placeholder={t('characterProfile.voiceAgeGroupPlaceholder')}
                                    className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm"
                                />
                            </div>
                            {/* 音色 */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">{t('characterProfile.voiceTone')}</label>
                                <input
                                    type="text"
                                    value={formData.voice_tone ?? ''}
                                    onChange={(e) => setFormData({ ...formData, voice_tone: e.target.value || undefined })}
                                    placeholder={t('characterProfile.voiceTonePlaceholder')}
                                    className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm"
                                />
                            </div>
                            {/* 语速 */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">{t('characterProfile.voiceSpeed')}</label>
                                <input
                                    type="text"
                                    value={formData.voice_speed ?? ''}
                                    onChange={(e) => setFormData({ ...formData, voice_speed: e.target.value || undefined })}
                                    placeholder={t('characterProfile.voiceSpeedPlaceholder')}
                                    className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm"
                                />
                            </div>
                            {/* 情感风格 */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">{t('characterProfile.voiceEmotionStyle')}</label>
                                <input
                                    type="text"
                                    value={formData.voice_emotion_style ?? ''}
                                    onChange={(e) => setFormData({ ...formData, voice_emotion_style: e.target.value || undefined })}
                                    placeholder={t('characterProfile.voiceEmotionStylePlaceholder')}
                                    className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm"
                                />
                            </div>
                            {/* 口音/方言 */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">{t('characterProfile.voiceAccent')}</label>
                                <input
                                    type="text"
                                    value={formData.voice_accent ?? ''}
                                    onChange={(e) => setFormData({ ...formData, voice_accent: e.target.value || undefined })}
                                    placeholder={t('characterProfile.voiceAccentPlaceholder')}
                                    className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm"
                                />
                            </div>
                        </div>

                        {/* 声音特征标签 */}
                        <div className="mt-3">
                            <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">{t('characterProfile.voiceTraits')}</label>
                            <div className="flex gap-2 mb-2 flex-wrap">
                                {(formData.voice_traits ?? []).map((trait, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] rounded-lg text-sm">
                                        {trait}
                                        <button onClick={() => removeVoiceTrait(i)} className="inline-flex h-4 w-4 items-center justify-center hover:text-[var(--glass-text-primary)]">
                                            <AppIcon name="closeSm" className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newVoiceTrait}
                                    onChange={(e) => setNewVoiceTrait(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVoiceTrait())}
                                    placeholder={t('characterProfile.addVoiceTraitPlaceholder')}
                                    className="flex-1 px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm"
                                />
                                <button onClick={addVoiceTrait} className="px-4 py-2 bg-[var(--glass-accent-from)] text-white rounded-lg hover:bg-[var(--glass-accent-to)] text-sm">
                                    {t("common.add")}
                                </button>
                            </div>
                        </div>

                        {/* voicePrompt */}
                        <div className="mt-3">
                            <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">
                                {t('characterProfile.voicePrompt')}
                                <span className="ml-1 text-[var(--glass-text-tertiary)] font-normal">{t('characterProfile.voicePromptHint')}</span>
                            </label>
                            <textarea
                                value={formData.voice_prompt ?? ''}
                                onChange={(e) => setFormData({ ...formData, voice_prompt: e.target.value || undefined })}
                                placeholder={t('characterProfile.voicePromptPlaceholder')}
                                maxLength={500}
                                rows={3}
                                className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm resize-none"
                            />
                            <div className="text-right text-xs text-[var(--glass-text-tertiary)]">
                                {(formData.voice_prompt ?? '').length}/500
                            </div>
                        </div>
                    </div>
                </div>

                {/* 底部按钮 */}
                <div className="bg-[var(--glass-bg-surface)] border-t border-[var(--glass-stroke-base)] px-6 py-4 flex gap-3 justify-end shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2 border border-[var(--glass-stroke-strong)] rounded-lg hover:bg-[var(--glass-bg-muted)] transition-colors disabled:opacity-50"
                    >
                        {t("common.cancel")}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2 bg-[var(--glass-accent-from)] text-white rounded-lg hover:bg-[var(--glass-accent-to)] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving && <TaskStatusInline state={savingState} className="text-white [&>span]:sr-only [&_svg]:text-white" />}
                        {t('characterProfile.confirmAndGenerate')}
                    </button>
                </div>
            </div>
        </div>
    )
}
