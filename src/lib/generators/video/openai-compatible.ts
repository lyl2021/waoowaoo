import { BaseVideoGenerator, type GenerateResult, type VideoGenerateParams } from '../base'
import { generateVideoViaOpenAICompat } from '@/lib/model-gateway'
import { getProviderConfig } from '@/lib/api-config'
import { GoogleVeoVideoGenerator } from './google'

/** bltcy 中转 API 的 baseUrl */
const VEO_PROXY_BASE_URL = 'https://api.bltcy.ai'

function isVeoProxyBaseUrl(baseUrl: string | undefined | null): boolean {
  if (!baseUrl) return false
  try {
    const url = new URL(baseUrl)
    return url.hostname.toLowerCase() === 'api.bltcy.ai'
  } catch {
    return false
  }
}

export class OpenAICompatibleVideoGenerator extends BaseVideoGenerator {
  private readonly providerId?: string

  constructor(providerId?: string) {
    super()
    this.providerId = providerId
  }

  protected async doGenerate(params: VideoGenerateParams): Promise<GenerateResult> {
    const { userId, options = {} } = params

    // 当 provider 配置的 baseUrl 是 bltcy 中转时，委托给 GoogleVeoVideoGenerator
    // bltcy 中转 API 的请求/响应格式与 OpenAI 不兼容，需要走专用的 Veo 中转逻辑
    const config = await getProviderConfig(userId, this.providerId || 'openai-compatible')
    if (isVeoProxyBaseUrl(config.baseUrl)) {
      const veoGenerator = new GoogleVeoVideoGenerator(this.providerId)
      return await veoGenerator.generate(params)
    }

    return await generateVideoViaOpenAICompat({
      userId,
      providerId: this.providerId || 'openai-compatible',
      modelId: typeof options.modelId === 'string' ? options.modelId : undefined,
      imageUrl: params.imageUrl,
      prompt: params.prompt || '',
      options,
      profile: 'openai-compatible',
    })
  }
}
