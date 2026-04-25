import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logError as _ulogError } from '@/lib/logging/core'
import { useRef } from 'react'
import type { Character, Project } from '@/types/project'
import { queryKeys } from '../keys'
import type { ProjectAssetsData } from '../hooks/useProjectAssets'
import type { AssetSummary } from '@/lib/assets/contracts'
import { apiFetch } from '@/lib/api-fetch'
import {
    clearTaskTargetOverlay,
    upsertTaskTargetOverlay,
} from '../task-target-overlay'
import {
    invalidateQueryTemplates,
    requestJsonWithError,
    requestVoidWithError,
} from './mutation-shared'

function applyCharacterSelectionToAssetSummaries(
    assets: AssetSummary[],
    characterId: string,
    appearanceId: string,
    selectedIndex: number | null,
): AssetSummary[] {
    return assets.map((asset) => {
        if (asset.id !== characterId || asset.kind !== 'character') return asset
        return {
            ...asset,
            variants: asset.variants.map((variant) => {
                if (variant.id !== appearanceId) return variant
                return {
                    ...variant,
                    selectionState: {
                        selectedRenderIndex: selectedIndex,
                    },
                    renders: variant.renders.map((render, idx) => ({
                        ...render,
                        isSelected: idx === selectedIndex,
                    })),
                }
            }),
        }
    })
}

interface SelectProjectCharacterImageContext {
    previousAssets: ProjectAssetsData | undefined
    previousAssetSummaries: AssetSummary[] | undefined
    previousProject: Project | undefined
    targetKey: string
    requestId: number
}

interface DeleteProjectCharacterContext {
    previousAssets: ProjectAssetsData | undefined
    previousProject: Project | undefined
    previousAssetListSnapshots: Array<{
        queryKey: readonly unknown[]
        data: AssetSummary[] | undefined
    }>
}

function applyCharacterSelectionToCharacters(
    characters: Character[],
    characterId: string,
    appearanceId: string,
    selectedIndex: number | null,
): Character[] {
    return characters.map((character) => {
        if (character.id !== characterId) return character
        return {
            ...character,
            appearances: (character.appearances || []).map((appearance) => {
                if (appearance.id !== appearanceId) return appearance
                const selectedUrl =
                    selectedIndex !== null && selectedIndex >= 0
                        ? (appearance.imageUrls[selectedIndex] ?? null)
                        : null
                return {
                    ...appearance,
                    selectedIndex,
                    imageUrl: selectedUrl ?? appearance.imageUrl ?? null,
                }
            }),
        }
    })
}

function applyCharacterSelectionToAssets(
    previous: ProjectAssetsData | undefined,
    characterId: string,
    appearanceId: string,
    selectedIndex: number | null,
): ProjectAssetsData | undefined {
    if (!previous) return previous
    return {
        ...previous,
        characters: applyCharacterSelectionToCharacters(previous.characters || [], characterId, appearanceId, selectedIndex),
    }
}

function applyCharacterSelectionToProject(
    previous: Project | undefined,
    characterId: string,
    appearanceId: string,
    selectedIndex: number | null,
): Project | undefined {
    if (!previous?.novelPromotionData) return previous
    const currentCharacters = previous.novelPromotionData.characters || []
    return {
        ...previous,
        novelPromotionData: {
            ...previous.novelPromotionData,
            characters: applyCharacterSelectionToCharacters(currentCharacters, characterId, appearanceId, selectedIndex),
        },
    }
}

function removeCharacterFromAssets(
    previous: ProjectAssetsData | undefined,
    characterId: string,
): ProjectAssetsData | undefined {
    if (!previous) return previous
    return {
        ...previous,
        characters: (previous.characters || []).filter((character) => character.id !== characterId),
    }
}

function removeCharacterFromProject(
    previous: Project | undefined,
    characterId: string,
): Project | undefined {
    if (!previous?.novelPromotionData) return previous
    const currentCharacters = previous.novelPromotionData.characters || []
    return {
        ...previous,
        novelPromotionData: {
            ...previous.novelPromotionData,
            characters: currentCharacters.filter((character) => character.id !== characterId),
        },
    }
}

export function useGenerateProjectCharacterImage(projectId: string) {
    const queryClient = useQueryClient()
    const invalidateProjectAssets = () =>
        invalidateQueryTemplates(queryClient, [queryKeys.projectAssets.all(projectId), queryKeys.assets.all('project', projectId)])

    return useMutation({
        mutationFn: async ({
            characterId,
            appearanceId,
            count,
        }: {
            characterId: string
            appearanceId: string
            count?: number
        }) => {
            return await requestJsonWithError(`/api/assets/${characterId}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scope: 'project',
                    kind: 'character',
                    projectId,
                    appearanceId,
                    count,
                })
            }, 'Failed to generate image')
        },
        onMutate: ({ appearanceId }) => {
            upsertTaskTargetOverlay(queryClient, {
                projectId,
                targetType: 'CharacterAppearance',
                targetId: appearanceId,
                intent: 'generate',
            })
        },
        onError: (_error, { appearanceId }) => {
            clearTaskTargetOverlay(queryClient, {
                projectId,
                targetType: 'CharacterAppearance',
                targetId: appearanceId,
            })
        },
        onSettled: invalidateProjectAssets,
    })
}

/**
 * 上传项目角色图片
 */

export function useUploadProjectCharacterImage(projectId: string) {
    const queryClient = useQueryClient()
    const invalidateProjectAssets = () =>
        invalidateQueryTemplates(queryClient, [queryKeys.projectAssets.all(projectId), queryKeys.assets.all('project', projectId)])

    return useMutation({
        mutationFn: async ({
            file, characterId, appearanceId, imageIndex, labelText
        }: {
            file: File
            characterId: string
            appearanceId: string
            imageIndex?: number
            labelText?: string
        }) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', 'character')
            formData.append('id', characterId)
            formData.append('appearanceId', appearanceId)
            if (imageIndex !== undefined) formData.append('imageIndex', imageIndex.toString())
            if (labelText) formData.append('labelText', labelText)

            return await requestJsonWithError(`/api/novel-promotion/${projectId}/upload-asset-image`, {
                method: 'POST',
                body: formData
            }, 'Failed to upload image')
        },
        onSuccess: invalidateProjectAssets,
    })
}

/**
 * 选择项目角色图片
 */

export function useSelectProjectCharacterImage(projectId: string) {
    const queryClient = useQueryClient()
    const latestRequestIdByTargetRef = useRef<Record<string, number>>({})
    const invalidateProjectAssets = () =>
        invalidateQueryTemplates(queryClient, [queryKeys.projectAssets.all(projectId), queryKeys.assets.all('project', projectId)])

    return useMutation({
        mutationFn: async ({
            characterId, appearanceId, imageIndex
        }: {
            characterId: string
            appearanceId: string
            imageIndex: number | null
            confirm?: boolean
        }) => {
            return await requestJsonWithError(`/api/assets/${characterId}/select-render`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scope: 'project',
                    kind: 'character',
                    projectId,
                    appearanceId,
                    imageIndex,
                })
            }, 'Failed to select image')
        },
        onMutate: async (variables): Promise<SelectProjectCharacterImageContext> => {
            const targetKey = `${variables.characterId}:${variables.appearanceId}`
            const requestId = (latestRequestIdByTargetRef.current[targetKey] ?? 0) + 1
            latestRequestIdByTargetRef.current[targetKey] = requestId

            console.log('[DEBUG mutation] onMutate character-select:', {
                targetKey,
                requestId,
                imageIndex: variables.imageIndex,
            })

            const assetsQueryKey = queryKeys.projectAssets.all(projectId)
            const projectQueryKey = queryKeys.projectData(projectId)
            const assetsListKey = queryKeys.assets.list({ scope: 'project', projectId })

            await queryClient.cancelQueries({ queryKey: assetsQueryKey })
            await queryClient.cancelQueries({ queryKey: projectQueryKey })

            const previousAssets = queryClient.getQueryData<ProjectAssetsData>(assetsQueryKey)
            const previousAssetSummaries = queryClient.getQueryData<AssetSummary[]>(assetsListKey)
            const previousProject = queryClient.getQueryData<Project>(projectQueryKey)

            queryClient.setQueryData<ProjectAssetsData | undefined>(assetsQueryKey, (previous) =>
                applyCharacterSelectionToAssets(previous, variables.characterId, variables.appearanceId, variables.imageIndex),
            )
            queryClient.setQueryData<Project | undefined>(projectQueryKey, (previous) =>
                applyCharacterSelectionToProject(previous, variables.characterId, variables.appearanceId, variables.imageIndex),
            )
            // 同步更新 useAssets hook 使用的缓存 key
            queryClient.setQueryData<AssetSummary[] | undefined>(assetsListKey, (previous) => {
                if (!previous) return previous
                return applyCharacterSelectionToAssetSummaries(previous, variables.characterId, variables.appearanceId, variables.imageIndex)
            })

            console.log('[DEBUG mutation] after setQueryData:', {
                assetsKey: assetsQueryKey,
                listKey: assetsListKey,
            })

            return {
                previousAssets,
                previousAssetSummaries,
                previousProject,
                targetKey,
                requestId,
            }
        },
        onError: (_error, _variables, context) => {
            if (!context) return
            const latestRequestId = latestRequestIdByTargetRef.current[context.targetKey]
            if (latestRequestId !== context.requestId) return
            queryClient.setQueryData(queryKeys.projectAssets.all(projectId), context.previousAssets)
            queryClient.setQueryData(queryKeys.projectData(projectId), context.previousProject)
            if (context.previousAssetSummaries) {
                queryClient.setQueryData(queryKeys.assets.list({ scope: 'project', projectId }), context.previousAssetSummaries)
            }
        },
        onSettled: (_data, _error, variables) => {
            if (variables.confirm) {
                void invalidateProjectAssets()
            }
        },
    })
}

/**
 * 撤回项目角色图片
 */

export function useUndoProjectCharacterImage(projectId: string) {
    const queryClient = useQueryClient()
    const invalidateProjectAssets = () =>
        invalidateQueryTemplates(queryClient, [queryKeys.projectAssets.all(projectId), queryKeys.assets.all('project', projectId)])

    return useMutation({
        mutationFn: async ({ characterId, appearanceId }: { characterId: string; appearanceId: string }) => {
            return await requestJsonWithError(`/api/assets/${characterId}/revert-render`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scope: 'project',
                    kind: 'character',
                    projectId,
                    appearanceId
                })
            }, 'Failed to undo image')
        },
        onSuccess: invalidateProjectAssets,
    })
}

/**
 * 删除项目角色
 */

export function useDeleteProjectCharacter(projectId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (characterId: string) => {
            await requestVoidWithError(
                `/api/novel-promotion/${projectId}/character?id=${encodeURIComponent(characterId)}`,
                { method: 'DELETE' },
                'Failed to delete character',
            )
        },
        onMutate: async (characterId): Promise<DeleteProjectCharacterContext> => {
            const assetsQueryKey = queryKeys.projectAssets.all(projectId)
            const projectQueryKey = queryKeys.projectData(projectId)
            const assetsParentKey = queryKeys.assets.all('project', projectId)

            await queryClient.cancelQueries({ queryKey: assetsQueryKey })
            await queryClient.cancelQueries({ queryKey: projectQueryKey })

            const previousAssets = queryClient.getQueryData<ProjectAssetsData>(assetsQueryKey)
            const previousProject = queryClient.getQueryData<Project>(projectQueryKey)
            const previousAssetListSnapshots = queryClient
                .getQueriesData<AssetSummary[]>({ queryKey: assetsParentKey, exact: false })
                .map(([queryKey, data]) => ({ queryKey, data }))

            queryClient.setQueryData<ProjectAssetsData | undefined>(assetsQueryKey, (previous) =>
                removeCharacterFromAssets(previous, characterId),
            )
            queryClient.setQueryData<Project | undefined>(projectQueryKey, (previous) =>
                removeCharacterFromProject(previous, characterId),
            )
            // 同步更新所有 assets.list 系列缓存
            queryClient.setQueriesData<AssetSummary[] | undefined>(
                { queryKey: assetsParentKey, exact: false },
                (previous) => previous?.filter((asset) => !(asset.kind === 'character' && asset.id === characterId)),
            )

            return {
                previousAssets,
                previousProject,
                previousAssetListSnapshots,
            }
        },
        onError: (_error, _characterId, context) => {
            if (!context) return
            queryClient.setQueryData(queryKeys.projectAssets.all(projectId), context.previousAssets)
            queryClient.setQueryData(queryKeys.projectData(projectId), context.previousProject)
            context.previousAssetListSnapshots.forEach((snapshot) => {
                queryClient.setQueryData(snapshot.queryKey, snapshot.data)
            })
        },
        onSettled: () => {
            invalidateQueryTemplates(queryClient, [
                queryKeys.projectAssets.all(projectId),
                queryKeys.assets.all('project', projectId),
            ])
        },
    })
}

/**
 * 删除项目角色形象
 */

export function useDeleteProjectAppearance(projectId: string) {
    const queryClient = useQueryClient()
    const invalidateProjectAssets = () =>
        invalidateQueryTemplates(queryClient, [queryKeys.projectAssets.all(projectId), queryKeys.assets.all('project', projectId)])

    return useMutation({
        mutationFn: async ({ characterId, appearanceId }: { characterId: string; appearanceId: string }) => {
            await requestVoidWithError(
                `/api/novel-promotion/${projectId}/character/appearance?characterId=${encodeURIComponent(characterId)}&appearanceId=${encodeURIComponent(appearanceId)}`,
                { method: 'DELETE' },
                'Failed to delete appearance',
            )
        },
        onSuccess: invalidateProjectAssets,
    })
}

/**
 * 更新项目角色名字
 */

export function useUpdateProjectCharacterName(projectId: string) {
    const queryClient = useQueryClient()
    const invalidateProjectAssets = () =>
        invalidateQueryTemplates(queryClient, [queryKeys.projectAssets.all(projectId), queryKeys.assets.all('project', projectId)])

    return useMutation({
        mutationFn: async ({ characterId, name }: { characterId: string; name: string }) => {
            const res = await requestJsonWithError(`/api/assets/${characterId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scope: 'project',
                    kind: 'character',
                    projectId,
                    name,
                })
            }, 'Failed to update character name')

            // 等待图片标签更新完成，确保 onSuccess invalidate 后前端能立即看到新标签
            try {
                await apiFetch(`/api/assets/${characterId}/update-label`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scope: 'project',
                        kind: 'character',
                        projectId,
                        newName: name
                    })
                })
            } catch (e) {
                _ulogError('更新图片标签失败:', e)
            }

            return res
        },
        onSuccess: invalidateProjectAssets,
    })
}
