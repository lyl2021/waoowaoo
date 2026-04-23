/**
 * Google Veo 视频生成器
 * 
 * 支持两种模式（根据 provider config 的 baseUrl 判断）：
 * 1. baseUrl 未配置 / 非 bltcy 中转 → 官方 SDK 模式（@google/genai）
 * 2. baseUrl 为 https://api.bltcy.ai → 中转 REST API 模式
 *    - POST {baseUrl}/v2/videos/generations 提交任务
 *    - GET  {baseUrl}/v2/videos/generations/{task_id} 查询状态
 */

import { GoogleGenAI } from '@google/genai'
import { BaseVideoGenerator, VideoGenerateParams, GenerateResult } from '../base'
import { getProviderConfig } from '@/lib/api-config'
import { normalizeToBase64ForGeneration } from '@/lib/media/outbound-image'

interface GoogleVeoOptions {
    modelId?: string
    aspectRatio?: string
    resolution?: string
    duration?: number
    lastFrameImageUrl?: string
    enhancePrompt?: boolean
}

/** bltcy 中转 API 的 baseUrl */
const VEO_PROXY_BASE_URL = 'https://api.bltcy.ai'

/** 判断 baseUrl 是否为 bltcy 中转地址（baseUrl 可能带 /v1 等路径前缀） */
function isVeoProxyBaseUrl(baseUrl: string | undefined | null): boolean {
    if (!baseUrl) return false
    try {
        const url = new URL(baseUrl)
        return url.hostname.toLowerCase() === 'api.bltcy.ai'
    } catch {
        return false
    }
}

/** 中转 API 的模型名映射 */
const PROXY_MODEL_MAP: Record<string, string> = {
    'veo-3.1-generate-preview': 'veo3.1-pro',
    'veo-3.1-fast-generate-preview': 'veo3.1',
    'veo-3.0-generate-001': 'veo3-pro-frames',
    'veo-3.0-fast-generate-001': 'veo3-fast-frames',
    'veo-2.0-generate-001': 'veo2-fast-frames',
}

function dataUrlToInlineData(dataUrl: string): { mimeType: string; imageBytes: string } | null {
    const base64Start = dataUrl.indexOf(';base64,')
    if (base64Start === -1) return null
    const mimeType = dataUrl.substring(5, base64Start)
    const imageBytes = dataUrl.substring(base64Start + 8)
    return { mimeType, imageBytes }
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function extractOperationName(response: unknown): string | null {
    const obj = asRecord(response)
    if (!obj) return null
    if (typeof obj.name === 'string') return obj.name
    const operation = asRecord(obj.operation)
    if (operation && typeof operation.name === 'string') return operation.name
    if (typeof obj.operationName === 'string') return obj.operationName
    if (typeof obj.id === 'string') return obj.id
    return null
}

export class GoogleVeoVideoGenerator extends BaseVideoGenerator {
    private providerId: string

    constructor(providerId?: string) {
        super()
        this.providerId = providerId || 'google'
    }

    protected async doGenerate(params: VideoGenerateParams): Promise<GenerateResult> {
        const { userId, imageUrl, prompt = '', options = {} } = params

        const providerConfig = await getProviderConfig(userId, this.providerId)
        const { apiKey, baseUrl } = providerConfig

        const {
            modelId = 'veo-3.1-generate-preview',
            aspectRatio,
            resolution,
            duration,
            lastFrameImageUrl,
            enhancePrompt,
        } = options as GoogleVeoOptions

        const allowedOptionKeys = new Set([
            'provider',
            'modelId',
            'modelKey',
            'aspectRatio',
            'resolution',
            'duration',
            'lastFrameImageUrl',
            'enhancePrompt',
        ])
        for (const [key, value] of Object.entries(options)) {
            if (value === undefined) continue
            if (!allowedOptionKeys.has(key)) {
                throw new Error(`GOOGLE_VIDEO_OPTION_UNSUPPORTED: ${key}`)
            }
        }

        // ─── 中转 REST API 模式：baseUrl 为 https://api.bltcy.ai 时走中转 ───
        if (isVeoProxyBaseUrl(baseUrl)) {
            return await this.generateViaProxy(baseUrl!, apiKey, modelId, prompt, imageUrl, aspectRatio, lastFrameImageUrl, enhancePrompt)
        }

        // ─── 官方 SDK 模式：无 baseUrl 或其他 baseUrl 走 SDK ───
        return await this.generateViaSdk(apiKey, modelId, prompt, imageUrl, aspectRatio, resolution, duration, lastFrameImageUrl)
    }

    /**
     * 中转 REST API 提交
     */
    private async generateViaProxy(
        baseUrl: string,
        apiKey: string,
        modelId: string,
        prompt: string,
        imageUrl: string | undefined,
        aspectRatio: string | undefined,
        lastFrameImageUrl: string | undefined,
        enhancePrompt: boolean | undefined,
    ): Promise<GenerateResult> {
        // bltcy baseUrl 可能是 https://api.bltcy.ai/v1，需要去掉 /v1 等路径前缀
        // 正确的 API 端点是 https://api.bltcy.ai/v2/videos/generations
        const resolvedBaseUrl = baseUrl.replace(/\/+$/, '').replace(/\/v\d+$/, '')

        // 收集图片
        const images: string[] = []
        if (imageUrl) {
            const dataUrl = imageUrl.startsWith('data:') ? imageUrl : await normalizeToBase64ForGeneration(imageUrl)
            images.push(dataUrl)
        }
        if (lastFrameImageUrl) {
            if (!imageUrl) {
                throw new Error('Veo lastFrame requires image input')
            }
            const dataUrl = lastFrameImageUrl.startsWith('data:')
                ? lastFrameImageUrl
                : await normalizeToBase64ForGeneration(lastFrameImageUrl)
            images.push(dataUrl)
        }

        if (images.length === 0) {
            throw new Error('Veo 中转 API 需要至少一张图片')
        }

        const proxyModel = PROXY_MODEL_MAP[modelId] || modelId
        const body: Record<string, unknown> = {
            model: proxyModel,
            prompt,
            images,
        }
        if (aspectRatio) {
            body.aspect_ratio = aspectRatio
        }
        if (typeof enhancePrompt === 'boolean') {
            body.enhance_prompt = enhancePrompt
        }

        const endpoint = `${resolvedBaseUrl}/v2/videos/generations`
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const errorText = await response.text().catch(() => '')
            throw new Error(`Veo proxy API error: ${response.status} ${errorText.slice(0, 500)}`)
        }

        const data = await response.json() as Record<string, unknown>
        const taskId = typeof data.task_id === 'string' ? data.task_id.trim() : ''
        if (!taskId) {
            throw new Error(`Veo proxy API returned no task_id: ${JSON.stringify(data).slice(0, 500)}`)
        }

        // providerId 编码进 externalId，轮询时用同一个 provider 查 config
        // 使用 b64_ 前缀，与 parseExternalId 的 isProviderToken 判断逻辑一致
        const providerToken = this.providerId !== 'google'
            ? `:b64_${Buffer.from(this.providerId, 'utf8').toString('base64url')}`
            : ''

        return {
            success: true,
            async: true,
            requestId: taskId,
            externalId: `VEOPROXY:VIDEO${providerToken}:${taskId}`,
        }
    }

    /**
     * 官方 SDK 提交
     */
    private async generateViaSdk(
        apiKey: string,
        modelId: string,
        prompt: string,
        imageUrl: string | undefined,
        aspectRatio: string | undefined,
        resolution: string | undefined,
        duration: number | undefined,
        lastFrameImageUrl: string | undefined,
    ): Promise<GenerateResult> {
        const ai = new GoogleGenAI({ apiKey })

        const request: Record<string, unknown> = {
            model: modelId,
        }
        if (prompt.trim().length > 0) {
            request.prompt = prompt
        }
        const config: Record<string, unknown> = {}

        // Veo 图生视频时，不传 aspectRatio，由输入图片决定视频比例，避免比例不匹配产生黑边
        // 仅纯文生视频（无图片输入）时才设置 aspectRatio
        if (!imageUrl && aspectRatio) config.aspectRatio = aspectRatio

        // Veo 3.x: 1080p 和 4k 仅支持 8s 时长，不兼容时自动降级到 720p
        let effectiveResolution = resolution
        if (effectiveResolution && effectiveResolution !== '720p' && duration !== 8) {
            effectiveResolution = '720p'
        }
        if (effectiveResolution) config.resolution = effectiveResolution
        if (typeof duration === 'number') config.durationSeconds = duration

        let hasImageInput = false
        if (imageUrl) {
            const dataUrl = imageUrl.startsWith('data:') ? imageUrl : await normalizeToBase64ForGeneration(imageUrl)
            const inlineData = dataUrlToInlineData(dataUrl)
            if (inlineData) {
                request.image = inlineData
                hasImageInput = true
            }
        }

        if (lastFrameImageUrl) {
            if (!hasImageInput) {
                throw new Error('Veo lastFrame requires image input')
            }
            const dataUrl = lastFrameImageUrl.startsWith('data:')
                ? lastFrameImageUrl
                : await normalizeToBase64ForGeneration(lastFrameImageUrl)
            const inlineData = dataUrlToInlineData(dataUrl)
            if (!inlineData) {
                throw new Error('Veo lastFrame image is invalid')
            }
            config.lastFrame = inlineData
        }

        if (Object.keys(config).length > 0) {
            request.config = config
        }

        const response = await ai.models.generateVideos(
            request as unknown as Parameters<typeof ai.models.generateVideos>[0]
        )
        const operationName = extractOperationName(response)

        if (!operationName) {
            throw new Error('Veo 未返回 operation name')
        }

        return {
            success: true,
            async: true,
            requestId: operationName,
            externalId: `GOOGLE:VIDEO:${operationName}`
        }
    }
}
