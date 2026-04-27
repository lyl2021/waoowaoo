'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAssetActions, useUploadAssetHubTempMedia, useUploadProjectTempMedia, useAiDesignProp } from '@/lib/query/hooks'
import { useImageGenerationCount } from '@/lib/image-generation/use-image-generation-count'
import { shouldShowError } from '@/lib/error-utils'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { apiFetch } from '@/lib/api-fetch'

type Mode = 'asset-hub' | 'project'

interface UsePropCreationSubmitParams {
  mode: Mode
  folderId?: string | null
  projectId?: string
  name: string
  description: string
  aiInstruction: string
  artStyle: string
  referenceImagesBase64: string[]
  setDescription: (value: string) => void
  setAiInstruction: (value: string) => void
  onSuccess: () => void
  onClose: () => void
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function usePropCreationSubmit({
  mode,
  folderId,
  projectId,
  name,
  description,
  aiInstruction,
  artStyle,
  referenceImagesBase64,
  setDescription,
  setAiInstruction,
  onSuccess,
  onClose,
}: UsePropCreationSubmitParams) {
  const t = useTranslations('assetModal')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAiDesigning, setIsAiDesigning] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)

  const actions = useAssetActions({
    scope: mode === 'asset-hub' ? 'global' : 'project',
    projectId,
    kind: 'prop',
  })
  const uploadAssetHubTemp = useUploadAssetHubTempMedia()
  const uploadProjectTemp = useUploadProjectTempMedia()
  const aiDesignProp = useAiDesignProp()
  const {
    count,
    setCount,
  } = useImageGenerationCount('prop')

  const uploadReferenceImages = useCallback(async () => {
    const uploadMutation = mode === 'asset-hub' ? uploadAssetHubTemp : uploadProjectTemp
    return Promise.all(
      referenceImagesBase64.map(async (base64) => {
        const data = await uploadMutation.mutateAsync({ imageBase64: base64 })
        if (!data.url) throw new Error(t('errors.uploadFailed'))
        return data.url
      }),
    )
  }, [mode, referenceImagesBase64, t, uploadAssetHubTemp, uploadProjectTemp])

  const handleExtractDescription = useCallback(async () => {
    if (referenceImagesBase64.length === 0) return

    try {
      setIsExtracting(true)
      const referenceImageUrls = await uploadReferenceImages()
      const response = await apiFetch('/api/asset-hub/describe-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls: referenceImageUrls, type: 'prop' }),
      })
      if (!response.ok) {
        throw new Error(t('errors.extractDescriptionFailed'))
      }
      const data = await response.json() as { description?: string }
      if (data?.description) {
        setDescription(data.description)
      }
    } catch (error: unknown) {
      if (shouldShowError(error)) {
        alert(getErrorMessage(error, t('errors.extractDescriptionFailed')))
      }
    } finally {
      setIsExtracting(false)
    }
  }, [referenceImagesBase64, uploadReferenceImages, t, setDescription])

  const handleAiDesign = useCallback(async () => {
    if (!aiInstruction.trim()) return

    try {
      setIsAiDesigning(true)
      const result = await aiDesignProp.mutateAsync(aiInstruction)

      if (result?.prompt) {
        setDescription(result.prompt)
        setAiInstruction('')
      }
    } catch (error: unknown) {
      if (shouldShowError(error)) {
        alert(getErrorMessage(error, t('errors.aiDesignFailed')))
      }
    } finally {
      setIsAiDesigning(false)
    }
  }, [aiDesignProp, aiInstruction, setDescription, setAiInstruction, t])

  const handleSubmit = useCallback(async (generateAfterCreate: boolean) => {
    let finalDescription = description.trim()

    // 参考图模式下描述为空时自动提取
    if (!finalDescription && referenceImagesBase64.length > 0) {
      try {
        const referenceImageUrls = await uploadReferenceImages()
        const response = await apiFetch('/api/asset-hub/describe-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrls: referenceImageUrls, type: 'prop' }),
        })
        if (response.ok) {
          const data = await response.json() as { description?: string }
          finalDescription = data?.description || ''
        }
      } catch {
        // fall through to validation
      }
    }

    if (!name.trim() || !finalDescription) return

    try {
      setIsSubmitting(true)
      const result = await actions.create({
        name: name.trim(),
        description: finalDescription,
        folderId: mode === 'asset-hub' ? folderId : undefined,
        artStyle,
      }) as { assetId?: string }

      if (generateAfterCreate) {
        if (!result.assetId) {
          throw new Error('Missing assetId from create response')
        }
        await actions.generate({
          id: result.assetId,
          artStyle,
          count,
        })
      }

      onSuccess()
      onClose()
    } catch (error: unknown) {
      if (shouldShowError(error)) {
        alert(getErrorMessage(error, t('errors.createFailed')))
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [actions, artStyle, count, description, folderId, mode, name, onClose, onSuccess, referenceImagesBase64, t, uploadReferenceImages])

  const submittingState = isSubmitting
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'generate',
      resource: 'image',
      hasOutput: false,
    })
    : null

  const aiDesigningState = isAiDesigning
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'generate',
      resource: 'image',
      hasOutput: false,
    })
    : null

  const extractingState = isExtracting
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'generate',
      resource: 'image',
      hasOutput: false,
    })
    : null

  return {
    isSubmitting,
    isAiDesigning,
    isExtracting,
    count,
    setCount,
    submittingState,
    aiDesigningState,
    extractingState,
    handleExtractDescription,
    handleAiDesign,
    handleSubmit,
  }
}
