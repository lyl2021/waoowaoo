'use client'
import { logError as _ulogError } from '@/lib/logging/core'
import { apiFetch } from '@/lib/api-fetch'
import JSZip from 'jszip'

import { useState } from 'react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { FolderDropdown } from './components/FolderDropdown'
import { AddAssetDropdown } from './components/AddAssetDropdown'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import Navbar from '@/components/Navbar'
import { AssetGrid } from './components/AssetGrid'
import { CharacterCreationModal, LocationCreationModal, PropCreationModal, CharacterEditModal, LocationEditModal, PropEditModal } from '@/components/shared/assets'
import { FolderModal } from './components/FolderModal'
import ImagePreviewModal from '@/components/ui/ImagePreviewModal'
import ImageEditModal from '@/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/assets/ImageEditModal'
import VoiceDesignDialog from './components/VoiceDesignDialog'
import VoiceCreationModal from './components/VoiceCreationModal'
import VoicePickerDialog from './components/VoicePickerDialog'
import {
    useAssets,
    useAssetActions,
    useRefreshAssets,
    useGlobalFolders,
    useSSE,
} from '@/lib/query/hooks'
import { queryKeys } from '@/lib/query/keys'
import { AppIcon } from '@/components/ui/icons'
import { Link } from '@/i18n/navigation'
import { useImageGenerationCount } from '@/lib/image-generation/use-image-generation-count'

export default function AssetHubPage() {
    const t = useTranslations('assetHub')
    const queryClient = useQueryClient()
    const { count: characterGenerationCount } = useImageGenerationCount('character')
    const { count: locationGenerationCount } = useImageGenerationCount('location')

    // 分组选择状态 (null = 全部, '__default__' = 默认分组, uuid = 自定义分组)
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)

    // 使用 React Query 获取数据
    const { data: folders = [], isLoading: foldersLoading } = useGlobalFolders()
    const { data: assets = [], isLoading: assetsLoading } = useAssets({
        scope: 'global',
        folderId: selectedFolderId,
    })
    const characterActions = useAssetActions({ scope: 'global', kind: 'character' })
    const locationActions = useAssetActions({ scope: 'global', kind: 'location' })
    const propActions = useAssetActions({ scope: 'global', kind: 'prop' })
    const refreshAssets = useRefreshAssets({ scope: 'global' })

    const loading = foldersLoading || assetsLoading
    useSSE({ projectId: 'global-asset-hub', enabled: true })

    // 弹窗状态
    const [showAddCharacter, setShowAddCharacter] = useState(false)
    const [showAddLocation, setShowAddLocation] = useState(false)
    const [showAddProp, setShowAddProp] = useState(false)
    const [showFolderModal, setShowFolderModal] = useState(false)
    const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [imageEditModal, setImageEditModal] = useState<{
        type: 'character' | 'location' | 'prop'
        id: string
        name: string
        imageIndex: number
        appearanceIndex?: number
    } | null>(null)

    const [voiceDesignCharacter, setVoiceDesignCharacter] = useState<{
        id: string
        name: string
        hasExistingVoice: boolean
    } | null>(null)

    // 音色库弹窗状态
    const [showAddVoice, setShowAddVoice] = useState(false)
    const [voicePickerCharacterId, setVoicePickerCharacterId] = useState<string | null>(null)
    const [isDownloading, setIsDownloading] = useState(false)
    const [filter, setFilter] = useState<'all' | 'character' | 'location' | 'prop' | 'voice'>('all')


    // 编辑角色弹窗状态
    const [characterEditModal, setCharacterEditModal] = useState<{
        characterId: string
        characterName: string
        folderId: string | null
        appearanceId: string
        appearanceIndex: number
        changeReason: string
        artStyle: string | null
        description: string
    } | null>(null)

    // 编辑场景弹窗状态
    const [locationEditModal, setLocationEditModal] = useState<{
        locationId: string
        locationName: string
        folderId: string | null
        summary: string
        imageIndex: number
        artStyle: string | null
        description: string
    } | null>(null)
    const [propEditModal, setPropEditModal] = useState<{
        propId: string
        propName: string
        folderId: string | null
        summary: string
        description: string
        artStyle: string | null
        variantId?: string
    } | null>(null)

    // 创建文件夹
    const handleCreateFolder = async (name: string) => {
        try {
            const res = await apiFetch('/api/asset-hub/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
            if (res.ok) {
                queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.folders() })
                setShowFolderModal(false)
            }
        } catch (error) {
            _ulogError('创建文件夹失败:', error)
        }
    }

    // 更新文件夹
    const handleUpdateFolder = async (folderId: string, name: string) => {
        try {
            const res = await apiFetch(`/api/asset-hub/folders/${folderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
            if (res.ok) {
                queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.folders() })
                setEditingFolder(null)
                setShowFolderModal(false)
            }
        } catch (error) {
            _ulogError('更新文件夹失败:', error)
        }
    }

    // 删除文件夹
    const handleDeleteFolder = async (folderId: string) => {
        if (!confirm(t('confirmDeleteGroup'))) return

        try {
            const res = await apiFetch(`/api/asset-hub/folders/${folderId}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                if (selectedFolderId === folderId) {
                    setSelectedFolderId(null)
                }
                queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.all() })
            }
        } catch (error) {
            _ulogError('删除文件夹失败:', error)
        }
    }

    // 打开图片编辑弹窗
    const handleOpenImageEdit = (type: 'character' | 'location' | 'prop', id: string, name: string, imageIndex: number, appearanceIndex?: number) => {
        setImageEditModal({ type, id, name, imageIndex, appearanceIndex })
    }

    // 处理图片编辑确认 - 使用 mutation
    const handleImageEdit = async (modifyPrompt: string, extraImageUrls?: string[]) => {
        if (!imageEditModal) return

        const { type, id, imageIndex, appearanceIndex } = imageEditModal
        setImageEditModal(null)

        if (type === 'character' && appearanceIndex !== undefined) {
            void characterActions.modifyRender({
                id,
                appearanceIndex,
                imageIndex,
                modifyPrompt,
                extraImageUrls
            }).catch(() => {
                alert(t('editFailed'))
            })
        } else if (type === 'location') {
            void locationActions.modifyRender({
                id,
                imageIndex,
                modifyPrompt,
                extraImageUrls
            }).catch(() => {
                alert(t('editFailed'))
            })
        } else if (type === 'prop') {
            void propActions.modifyRender({
                id,
                imageIndex,
                modifyPrompt,
                extraImageUrls,
            }).catch(() => {
                alert(t('editFailed'))
            })
        }
    }

    // 打开 AI 声音设计对话框
    const handleOpenVoiceDesign = (characterId: string, characterName: string) => {
        const character = assets.find((asset) => asset.kind === 'character' && asset.id === characterId)
        setVoiceDesignCharacter({
            id: characterId,
            name: characterName,
            hasExistingVoice: character?.kind === 'character' ? !!character.voice.customVoiceUrl : false,
        })
    }

    // 保存 AI 设计的声音
    const handleVoiceDesignSave = async (voiceId: string, audioBase64: string) => {
        if (!voiceDesignCharacter) return

        try {
            const res = await apiFetch('/api/asset-hub/character-voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    characterId: voiceDesignCharacter.id,
                    voiceId,
                    audioBase64
                })
            })

            if (res.ok) {
                alert(t('voiceDesignSaved', { name: voiceDesignCharacter.name }))
                queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.characters() })
                refreshAssets()
            } else {
                const data = await res.json()
                alert(
                    typeof data.error === 'string'
                        ? t('saveVoiceFailedDetail', { error: data.error })
                        : t('saveVoiceFailed'),
                )
            }
        } catch (error) {
            _ulogError('保存声音失败:', error)
            alert(t('saveVoiceFailed'))
        }
    }

    // 打开角色编辑弹窗
    const handleOpenCharacterEdit = (character: unknown, appearance: unknown) => {
        const typedCharacter = character as {
            id: string
            name: string
            folderId: string | null
            appearances: Array<{
                id: string
                appearanceIndex: number
                changeReason: string
                description: string | null
            }>
        }
        const typedAppearance = appearance as {
            id: string
            appearanceIndex: number
            changeReason: string
            artStyle?: string | null
            description: string | null
        }
        setCharacterEditModal({
            characterId: typedCharacter.id,
            characterName: typedCharacter.name,
            folderId: typedCharacter.folderId,
            appearanceId: typedAppearance.id,
            appearanceIndex: typedAppearance.appearanceIndex,
            changeReason: typedAppearance.changeReason || t('appearanceLabel', { index: typedAppearance.appearanceIndex }),
            artStyle: typedAppearance.artStyle || null,
            description: typedAppearance.description || ''
        })
    }

    // 打开场景编辑弹窗
    const handleOpenLocationEdit = (location: unknown, imageIndex: number) => {
        const typedLocation = location as {
            id: string
            name: string
            folderId: string | null
            summary: string | null
            artStyle: string | null
            images: Array<{ imageIndex: number; description: string | null }>
        }
        const image = typedLocation.images.find(img => img.imageIndex === imageIndex)
        setLocationEditModal({
            locationId: typedLocation.id,
            locationName: typedLocation.name,
            folderId: typedLocation.folderId,
            summary: typedLocation.summary || '',
            imageIndex: imageIndex,
            artStyle: typedLocation.artStyle || null,
            description: image?.description || typedLocation.summary || ''
        })
    }

    const handleOpenPropEdit = (prop: unknown, imageIndex: number) => {
        const typedProp = prop as {
            id: string
            name: string
            folderId: string | null
            summary: string | null
            artStyle?: string | null
            images: Array<{ id: string; imageIndex: number; description: string | null }>
        }
        const variant = typedProp.images.find((image) => image.imageIndex === imageIndex)
        setPropEditModal({
            propId: typedProp.id,
            propName: typedProp.name,
            folderId: typedProp.folderId,
            summary: typedProp.summary || '',
            description: variant?.description || typedProp.summary || '',
            artStyle: typedProp.artStyle || null,
            variantId: variant?.id,
        })
    }

    // 角色编辑后触发生成
    const handleCharacterEditGenerate = async () => {
        if (!characterEditModal) return

        try {
            await characterActions.generate({
                id: characterEditModal.characterId,
                appearanceIndex: characterEditModal.appearanceIndex,
                artStyle: characterEditModal.artStyle || undefined,
                count: characterGenerationCount,
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.characters() })
        } catch (error) {
            _ulogError('触发生成失败:', error)
        }
    }

    // 场景编辑后触发生成
    const handleLocationEditGenerate = async () => {
        if (!locationEditModal) return

        try {
            await locationActions.generate({
                id: locationEditModal.locationId,
                artStyle: locationEditModal.artStyle || undefined,
                count: locationGenerationCount,
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.locations() })
        } catch (error) {
            _ulogError('触发生成失败:', error)
        }
    }

    // 从音色库选择后绑定到角色
    const handleVoiceSelect = async (voice: { id: string; customVoiceUrl: string | null }) => {
        if (!voicePickerCharacterId) return

        try {
            await characterActions.bindVoice({
                characterId: voicePickerCharacterId,
                globalVoiceId: voice.id,
                customVoiceUrl: voice.customVoiceUrl,
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.characters() })
            setVoicePickerCharacterId(null)
        } catch (error) {
            _ulogError('绑定音色失败:', error)
            alert(t('bindVoiceFailed'))
        }
    }

    // 打包下载所有图片资产
    const handleDownloadAll = async () => {
        // 收集所有有效图片
        const imageEntries: Array<{ filename: string; url: string }> = []

        // 角色图片：每个角色每个外貌的当前选中图
        for (const asset of assets) {
            if (asset.kind !== 'character') continue
            for (const variant of asset.variants) {
                const selectedRender = variant.renders.find((render) => render.isSelected) ?? variant.renders[0]
                const url = selectedRender?.imageUrl
                if (!url) continue
                const safeName = asset.name.replace(/[/\\:*?"<>|]/g, '_')
                const filename = variant.index === 0
                    ? `characters/${safeName}.jpg`
                    : `characters/${safeName}_appearance${variant.index}.jpg`
                imageEntries.push({ filename, url })
            }
        }

        // 场景图片：每个场景的选中图
        for (const asset of assets) {
            if (asset.kind !== 'location') continue
            for (const variant of asset.variants) {
                const render = variant.renders[0]
                const url = render?.imageUrl
                if (!url) continue
                const safeName = asset.name.replace(/[/\\:*?"<>|]/g, '_')
                const filename = asset.variants.length <= 1
                    ? `locations/${safeName}.jpg`
                    : `locations/${safeName}_${variant.index + 1}.jpg`
                imageEntries.push({ filename, url })
            }
        }

        for (const asset of assets) {
            if (asset.kind !== 'prop') continue
            for (const variant of asset.variants) {
                const render = variant.renders[0]
                const url = render?.imageUrl
                if (!url) continue
                const safeName = asset.name.replace(/[/\\:*?"<>|]/g, '_')
                const filename = asset.variants.length <= 1
                    ? `props/${safeName}.jpg`
                    : `props/${safeName}_${variant.index + 1}.jpg`
                imageEntries.push({ filename, url })
            }
        }

        if (imageEntries.length === 0) {
            alert(t('downloadEmpty'))
            return
        }

        setIsDownloading(true)
        try {
            const zip = new JSZip()
            // 并发 fetch 所有图片
            await Promise.all(
                imageEntries.map(async ({ filename, url }) => {
                    try {
                        const response = await fetch(url)
                        if (!response.ok) return
                        const blob = await response.blob()
                        zip.file(filename, blob)
                    } catch {
                        // 单张图片失败不阻断整个流程
                    }
                })
            )
            const content = await zip.generateAsync({ type: 'blob' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(content)
            link.download = `asset-hub_${new Date().toISOString().slice(0, 10)}.zip`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(link.href)
        } catch (error) {
            _ulogError('打包下载失败:', error)
            alert(t('downloadFailed'))
        } finally {
            setIsDownloading(false)
        }
    }

    const totalCount = assets.length
    const characterCount = assets.filter(a => a.kind === 'character').length
    const locationCount = assets.filter(a => a.kind === 'location').length
    const propCount = assets.filter(a => a.kind === 'prop').length
    const voiceCount = assets.filter(a => a.kind === 'voice').length

    // Build folderMap for card tags
    const folderMap = Object.fromEntries(
        folders.map(f => [f.id, f.name])
    )
    // Also map null folderId to default group name
    folderMap[''] = t('defaultGroup')

    // Calculate per-group counts for FolderDropdown
    const defaultGroupCount = assets.filter(a => a.folderId === null || a.folderId === undefined).length
    const folderCounts = folders.reduce<Record<string, number>>((acc, f) => {
        acc[f.id] = assets.filter(a => a.folderId === f.id).length
        return acc
    }, {})

    const tabs = [
        { value: 'all', label: `${t('allAssets')} [${totalCount}]` },
        { value: 'character', label: `${t('characters')} [${characterCount}]` },
        { value: 'location', label: `${t('locations')} [${locationCount}]` },
        { value: 'prop', label: `${t('props')} [${propCount}]` },
        { value: 'voice', label: `${t('voices')} [${voiceCount}]` },
    ]

    return (
        <div className="glass-page h-screen flex flex-col">
            <Navbar />

            {/* 固定头部：标题 + 工具栏 */}
            <div className="shrink-0 px-4 sm:px-6 lg:px-6 pt-6 pb-4 border-b border-[var(--glass-stroke-base)]">
                <div className="flex items-start justify-between gap-6">
                    {/* 左侧：标题 */}
                    <div className="flex items-start gap-4 min-w-0">
                        <h1 className="text-2xl font-bold text-[var(--glass-text-primary)] whitespace-nowrap">{t('title')}</h1>
                        <div>
                            <p className="text-sm text-[var(--glass-text-secondary)]">{t('description')}</p>
                            <p className="text-xs text-[var(--glass-text-tertiary)] mt-1 flex items-center gap-1">
                                <AppIcon name="info" className="w-3.5 h-3.5" />
                                {t('modelHint')}
                                <Link href={{ pathname: '/profile' }} className="text-[var(--glass-tone-info-fg)] hover:underline">{t('modelHintLink')}</Link>
                                {t('modelHintSuffix')}
                            </p>
                        </div>
                    </div>

                    {/* 右侧：工具栏（文件夹 + 筛选 + 下载 + 新建） */}
                    <div className="flex items-center gap-3 shrink-0">
                        <FolderDropdown
                            folders={folders}
                            selectedFolderId={selectedFolderId}
                            totalCount={totalCount}
                            defaultGroupCount={defaultGroupCount}
                            folderCounts={folderCounts}
                            onSelectFolder={setSelectedFolderId}
                            onCreateFolder={() => {
                                setEditingFolder(null)
                                setShowFolderModal(true)
                            }}
                            onEditFolder={(folder) => {
                                setEditingFolder(folder)
                                setShowFolderModal(true)
                            }}
                            onDeleteFolder={handleDeleteFolder}
                        />
                        <SegmentedControl
                            options={tabs}
                            value={filter}
                            onChange={(val) => setFilter(val as 'all' | 'character' | 'location' | 'prop' | 'voice')}
                            layout="compact"
                            className="min-w-max"
                        />
                        {assets.length > 0 && (
                            <button
                                onClick={handleDownloadAll}
                                disabled={isDownloading}
                                title={t('downloadAllTitle')}
                                className="glass-btn-base glass-btn-secondary px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <AppIcon name={isDownloading ? 'refresh' : 'download'} className={`w-4 h-4 ${isDownloading ? 'animate-spin' : ''}`} />
                                <span>{isDownloading ? t('downloading') : t('downloadAll')}</span>
                            </button>
                        )}
                        <AddAssetDropdown
                            onAddCharacter={() => setShowAddCharacter(true)}
                            onAddLocation={() => setShowAddLocation(true)}
                            onAddProp={() => setShowAddProp(true)}
                            onAddVoice={() => setShowAddVoice(true)}
                        />
                    </div>
                </div>
            </div>

            {/* 可滚动卡片区域 */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-6 pt-4 pb-6">
                <AssetGrid
                    assets={assets}
                    loading={loading}
                    filter={filter}
                    folderMap={folderMap}
                    onAddCharacter={() => setShowAddCharacter(true)}
                    onAddLocation={() => setShowAddLocation(true)}
                    onAddProp={() => setShowAddProp(true)}
                    onAddVoice={() => setShowAddVoice(true)}
                    onImageClick={setPreviewImage}
                    onImageEdit={handleOpenImageEdit}
                    onVoiceDesign={handleOpenVoiceDesign}
                    onCharacterEdit={handleOpenCharacterEdit}
                    onLocationEdit={handleOpenLocationEdit}
                    onPropEdit={handleOpenPropEdit}
                    onVoiceSelect={(characterId) => setVoicePickerCharacterId(characterId)}
                />
            </div>

            {/* 新建角色弹窗 */}
            {showAddCharacter && (
                <CharacterCreationModal
                    mode="asset-hub"
                    folderId={selectedFolderId}
                    folders={folders}
                    onClose={() => setShowAddCharacter(false)}
                    onSuccess={() => {
                        setShowAddCharacter(false)
                        queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.characters() })
                        refreshAssets()
                    }}
                />
            )}

            {/* 新建场景弹窗 */}
            {showAddLocation && (
                <LocationCreationModal
                    mode="asset-hub"
                    folderId={selectedFolderId}
                    folders={folders}
                    onClose={() => setShowAddLocation(false)}
                    onSuccess={() => {
                        setShowAddLocation(false)
                        queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.locations() })
                        refreshAssets()
                    }}
                />
            )}

            {showAddProp && (
                <PropCreationModal
                    mode="asset-hub"
                    folderId={selectedFolderId}
                    folders={folders}
                    onClose={() => setShowAddProp(false)}
                    onSuccess={() => {
                        setShowAddProp(false)
                        refreshAssets()
                    }}
                />
            )}

            {/* 文件夹编辑弹窗 */}
            {showFolderModal && (
                <FolderModal
                    group={editingFolder}
                    onClose={() => {
                        setShowFolderModal(false)
                        setEditingFolder(null)
                    }}
                    onSave={(name) => {
                        if (editingFolder) {
                            handleUpdateFolder(editingFolder.id, name)
                        } else {
                            handleCreateFolder(name)
                        }
                    }}
                />
            )}

            {/* 图片预览弹窗 */}
            {previewImage && (
                <ImagePreviewModal
                    imageUrl={previewImage}
                    onClose={() => setPreviewImage(null)}
                />
            )}

            {/* 图片编辑弹窗 */}
            {imageEditModal && (
                <ImageEditModal
                    type={imageEditModal.type}
                    name={imageEditModal.name}
                    onClose={() => setImageEditModal(null)}
                    onConfirm={handleImageEdit}
                />
            )}

            {/* AI 声音设计对话框 */}
            {voiceDesignCharacter && (
                <VoiceDesignDialog
                    isOpen={!!voiceDesignCharacter}
                    speaker={voiceDesignCharacter.name}
                    hasExistingVoice={voiceDesignCharacter.hasExistingVoice}
                    onClose={() => setVoiceDesignCharacter(null)}
                    onSave={handleVoiceDesignSave}
                />
            )}

            {/* 角色编辑弹窗 */}
            {characterEditModal && (
                <CharacterEditModal
                    mode="asset-hub"
                    characterId={characterEditModal.characterId}
                    characterName={characterEditModal.characterName}
                    folderId={characterEditModal.folderId}
                    folders={folders}
                    appearanceId={characterEditModal.appearanceId}
                    appearanceIndex={characterEditModal.appearanceIndex}
                    changeReason={characterEditModal.changeReason}
                    description={characterEditModal.description}
                    artStyle={characterEditModal.artStyle}
                    onClose={() => setCharacterEditModal(null)}
                    onSave={handleCharacterEditGenerate}
                    onRefresh={refreshAssets}
                />
            )}

            {/* 场景编辑弹窗 */}
            {locationEditModal && (
                <LocationEditModal
                    mode="asset-hub"
                    locationId={locationEditModal.locationId}
                    locationName={locationEditModal.locationName}
                    folderId={locationEditModal.folderId}
                    folders={folders}
                    summary={locationEditModal.summary}
                    imageIndex={locationEditModal.imageIndex}
                    description={locationEditModal.description}
                    artStyle={locationEditModal.artStyle}
                    onClose={() => setLocationEditModal(null)}
                    onSave={handleLocationEditGenerate}
                    onRefresh={refreshAssets}
                />
            )}

            {propEditModal && (
                <PropEditModal
                    mode="asset-hub"
                    propId={propEditModal.propId}
                    propName={propEditModal.propName}
                    folderId={propEditModal.folderId}
                    folders={folders}
                    summary={propEditModal.summary}
                    description={propEditModal.description}
                    artStyle={propEditModal.artStyle}
                    variantId={propEditModal.variantId}
                    onClose={() => setPropEditModal(null)}
                    onRefresh={refreshAssets}
                />
            )}

            {/* 新建音色弹窗 */}
            {showAddVoice && (
                <VoiceCreationModal
                    isOpen={showAddVoice}
                    folderId={selectedFolderId}
                    folders={folders}
                    onClose={() => setShowAddVoice(false)}
                    onSuccess={() => {
                        setShowAddVoice(false)
                        queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.voices() })
                        refreshAssets()
                    }}
                />
            )}

            {/* 从音色库选择弹窗 */}
            {voicePickerCharacterId && (
                <VoicePickerDialog
                    isOpen={!!voicePickerCharacterId}
                    onClose={() => setVoicePickerCharacterId(null)}
                    onSelect={handleVoiceSelect}
                />
            )}
        </div>
    )
}
