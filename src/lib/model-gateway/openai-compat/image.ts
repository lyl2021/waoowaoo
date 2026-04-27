import type { GenerateResult } from '@/lib/generators/base'
import type { OpenAICompatImageRequest } from '../types'
import {
  createOpenAICompatClient,
  readStringOption,
  resolveOpenAICompatClientConfig,
  toUploadFile,
} from './common'

type OpenAIImageResponseFormat = 'url' | 'b64_json'
type OpenAIImageOutputFormat = 'png' | 'jpeg' | 'webp'
type OpenAIImageGenerateQuality = 'standard' | 'hd' | 'low' | 'medium' | 'high' | 'auto'
type OpenAIImageGenerateSize =
  | 'auto'
  | '1024x1024'
  | '1536x1024'
  | '1024x1536'
  | '256x256'
  | '512x512'
  | '1792x1024'
  | '1024x1792'
  // gpt-image-2 新增预设尺寸
  | '2048x2048'    // 2K 1:1
  | '2048x1152'    // 2K 16:9
  | '3840x2160'    // 4K 16:9
  | '2160x3840'    // 4K 9:16
  | '2880x2880'    // 4K 1:1

const OPENAI_IMAGE_OPTION_KEYS = new Set([
  'provider',
  'modelId',
  'modelKey',
  'size',
  'resolution',
  'quality',
  'responseFormat',
  'outputFormat',
])

function assertAllowedOptions(options: Record<string, unknown>) {
  for (const [key, value] of Object.entries(options)) {
    if (value === undefined) continue
    if (!OPENAI_IMAGE_OPTION_KEYS.has(key)) {
      throw new Error(`OPENAI_COMPAT_IMAGE_OPTION_UNSUPPORTED: ${key}`)
    }
  }
}

function normalizeResponseFormat(value: unknown): OpenAIImageResponseFormat {
  const normalized = readStringOption(value, 'responseFormat')
  if (!normalized) return 'b64_json'
  if (normalized === 'url' || normalized === 'b64_json') return normalized
  throw new Error(`OPENAI_COMPAT_IMAGE_OPTION_UNSUPPORTED: responseFormat=${normalized}`)
}

function normalizeOutputFormat(value: unknown): OpenAIImageOutputFormat | undefined {
  const normalized = readStringOption(value, 'outputFormat')
  if (!normalized) return undefined
  if (normalized === 'png' || normalized === 'jpeg' || normalized === 'webp') return normalized
  throw new Error(`OPENAI_COMPAT_IMAGE_OPTION_UNSUPPORTED: outputFormat=${normalized}`)
}

function normalizeGenerateQuality(value: unknown): OpenAIImageGenerateQuality | undefined {
  const normalized = readStringOption(value, 'quality')
  if (!normalized) return undefined
  if (
    normalized === 'standard'
    || normalized === 'hd'
    || normalized === 'low'
    || normalized === 'medium'
    || normalized === 'high'
    || normalized === 'auto'
  ) {
    return normalized
  }
  throw new Error(`OPENAI_COMPAT_IMAGE_OPTION_UNSUPPORTED: quality=${normalized}`)
}

function normalizeOpenAIImageSize(value: string | undefined): OpenAIImageGenerateSize | undefined {
  if (!value) return undefined
  if (
    value === 'auto'
    || value === '1024x1024'
    || value === '1536x1024'
    || value === '1024x1536'
    || value === '256x256'
    || value === '512x512'
    || value === '1792x1024'
    || value === '1024x1792'
    || value === '2048x2048'
    || value === '2048x1152'
    || value === '3840x2160'
    || value === '2160x3840'
    || value === '2880x2880'
  ) {
    return value
  }
  // gpt-image-2 自定义尺寸：两条边都是 16 的倍数、长短边比例 ≤ 3:1、总像素 ≤ 8,294,400
  if (/^\d{3,4}x\d{3,4}$/.test(value)) {
    const [wStr, hStr] = value.split('x')
    const w = parseInt(wStr!, 10)
    const h = parseInt(hStr!, 10)
    if (w % 16 === 0 && h % 16 === 0 && w / h <= 3 && h / w <= 3 && w * h >= 655360 && w * h <= 8294400) {
      return value as OpenAIImageGenerateSize
    }
  }
  throw new Error(`OPENAI_COMPAT_IMAGE_OPTION_UNSUPPORTED: size=${value}`)
}

/**
 * resolution token + aspectRatio → OpenAI size 字符串
 * gpt-image-2 支持 1K/2K/4K 三档分辨率 + 多种比例
 */
const RESOLUTION_SIZE_MAP: Record<string, Record<string, string>> = {
  '1K': {
    '1:1': '1024x1024',
    '3:2': '1536x1024',
    '2:3': '1024x1536',
    '16:9': '1536x864',
    '9:16': '864x1536',
  },
  '2K': {
    '1:1': '2048x2048',
    '3:2': '2048x1360',
    '2:3': '1360x2048',
    '16:9': '2048x1152',
    '9:16': '1152x2048',
  },
  '4K': {
    '1:1': '2880x2880',
    '3:2': '3520x2336',
    '2:3': '2336x3520',
    '16:9': '3840x2160',
    '9:16': '2160x3840',
  },
}

export function resolveSizeFromResolutionAndAspectRatio(
  resolution: string,
  aspectRatio?: string,
): string | undefined {
  const ratioMap = RESOLUTION_SIZE_MAP[resolution]
  if (!ratioMap) return undefined
  if (aspectRatio && ratioMap[aspectRatio]) return ratioMap[aspectRatio]
  // 兜底：返回该分辨率下第一个尺寸
  return Object.values(ratioMap)[0]
}

function resolveRawSize(options: Record<string, unknown>): string | undefined {
  const size = readStringOption(options.size, 'size')
  const resolution = readStringOption(options.resolution, 'resolution')
  if (size && resolution && size !== resolution) {
    throw new Error('OPENAI_COMPAT_IMAGE_OPTION_CONFLICT: size and resolution must match')
  }
  // 如果传了 resolution token（如 4K），结合 aspectRatio 转换为具体 size
  if (resolution && !size && RESOLUTION_SIZE_MAP[resolution]) {
    const aspectRatio = readStringOption(options.aspectRatio, 'aspectRatio')
    const mapped = resolveSizeFromResolutionAndAspectRatio(resolution, aspectRatio)
    if (mapped) return mapped
  }
  return size || resolution
}

function resolveModelId(modelId: string | undefined, options: Record<string, unknown>): string {
  const optionModelId = readStringOption(options.modelId, 'modelId')
  const selected = (modelId || optionModelId || '').trim()
  if (selected) return selected
  return 'gpt-image-1'
}

function toMimeFromOutputFormat(outputFormat: string | undefined): string {
  if (outputFormat === 'jpeg' || outputFormat === 'jpg') return 'image/jpeg'
  if (outputFormat === 'webp') return 'image/webp'
  return 'image/png'
}

interface ImagePayloads {
  /** 第一张图的 base64（向后兼容） */
  b64Json: string | null
  /** 第一张图的 URL（向后兼容） */
  url: string | null
  /** 所有图的 URL 列表（接口返回多张时有值） */
  urls: string[]
}

function readAllImagePayloads(response: unknown): ImagePayloads {
  if (typeof response !== 'object' || response === null) {
    return { b64Json: null, url: null, urls: [] }
  }
  const data = (response as { data?: unknown }).data
  if (!Array.isArray(data) || data.length === 0) {
    return { b64Json: null, url: null, urls: [] }
  }

  const urls: string[] = []
  let firstB64: string | null = null

  for (const item of data) {
    if (typeof item !== 'object' || item === null) continue
    const rawUrl = (item as { url?: unknown }).url
    const rawB64 = (item as { b64_json?: unknown }).b64_json
    if (typeof rawUrl === 'string' && rawUrl.trim()) {
      urls.push(rawUrl.trim())
    }
    if (firstB64 === null && typeof rawB64 === 'string' && rawB64.trim()) {
      firstB64 = rawB64.trim()
    }
  }

  return {
    b64Json: firstB64,
    url: urls[0] ?? null,
    urls,
  }
}

export async function generateImageViaOpenAICompat(request: OpenAICompatImageRequest): Promise<GenerateResult> {
  const {
    userId,
    providerId,
    modelId,
    prompt,
    referenceImages = [],
    options = {},
  } = request

  assertAllowedOptions(options)
  const config = await resolveOpenAICompatClientConfig(userId, providerId)
  const client = createOpenAICompatClient(config)

  const normalizedModelId = resolveModelId(modelId, options)
  const responseFormat = normalizeResponseFormat(options.responseFormat)
  const outputFormat = normalizeOutputFormat(options.outputFormat)
  const quality = normalizeGenerateQuality(options.quality)
  const rawSize = resolveRawSize(options)
  const size = normalizeOpenAIImageSize(rawSize)

  if (referenceImages.length > 0) {
    const response = await client.images.edit({
      model: normalizedModelId,
      prompt,
      image: await Promise.all(referenceImages.map((image, index) => toUploadFile(image, index))),
      response_format: responseFormat,
      ...(outputFormat ? { output_format: outputFormat } : {}),
      ...(quality ? { quality } : {}),
      ...(size ? { size } : {}),
    } as unknown as Parameters<typeof client.images.edit>[0])

    const imagePayload = readAllImagePayloads(response)
    const imageBase64 = imagePayload.b64Json
    if (typeof imageBase64 === 'string' && imageBase64.trim().length > 0) {
      const mimeType = toMimeFromOutputFormat(outputFormat)
      return {
        success: true,
        imageBase64,
        imageUrl: `data:${mimeType};base64,${imageBase64}`,
      }
    }
    const imageUrl = imagePayload.url
    if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
      return {
        success: true,
        imageUrl,
        ...(imagePayload.urls.length > 1 ? { imageUrls: imagePayload.urls } : {}),
      }
    }
    throw new Error('OPENAI_COMPAT_IMAGE_EMPTY_RESPONSE: no image data returned')
  }

  const response = await client.images.generate({
    model: normalizedModelId,
    prompt,
    response_format: responseFormat,
    ...(outputFormat ? { output_format: outputFormat } : {}),
    ...(quality ? { quality } : {}),
    ...(size ? { size } : {}),
  } as unknown as Parameters<typeof client.images.generate>[0])

  const imagePayload = readAllImagePayloads(response)
  const imageBase64 = imagePayload.b64Json
  if (typeof imageBase64 === 'string' && imageBase64.trim().length > 0) {
    const mimeType = toMimeFromOutputFormat(outputFormat)
    return {
      success: true,
      imageBase64,
      imageUrl: `data:${mimeType};base64,${imageBase64}`,
    }
  }
  const imageUrl = imagePayload.url
  if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
    return {
      success: true,
      imageUrl,
      ...(imagePayload.urls.length > 1 ? { imageUrls: imagePayload.urls } : {}),
    }
  }
  throw new Error('OPENAI_COMPAT_IMAGE_EMPTY_RESPONSE: no image data returned')
}
