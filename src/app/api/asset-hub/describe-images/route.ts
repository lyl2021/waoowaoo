import { NextRequest } from 'next/server'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { executeAiVisionStep } from '@/lib/ai-runtime'
import { getUserModelConfig } from '@/lib/config-service'

/**
 * 通用图片描述提取
 * 使用视觉模型分析参考图，返回文字描述
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const imageUrls = Array.isArray(body.imageUrls)
    ? (body.imageUrls as string[]).map((u) => (typeof u === 'string' ? u.trim() : '')).filter(Boolean)
    : []
  if (imageUrls.length === 0) {
    throw new ApiError('INVALID_PARAMS')
  }

  const userConfig = await getUserModelConfig(session.user.id)
  const analysisModel = userConfig.analysisModel
  if (!analysisModel) {
    throw new ApiError('MISSING_CONFIG')
  }

  const type = body.type === 'prop' ? 'prop' : body.type === 'location' ? 'location' : null
  if (!type) {
    throw new ApiError('INVALID_PARAMS', { details: 'type must be "prop" or "location"' })
  }
  const prompt = type === 'prop'
    ? '请详细描述这张图片中的道具外观，包括主体结构、材质、颜色、表面处理、装饰细节。只写视觉信息，不写用途、剧情、背景。'
    : '请详细描述这张图片中的场景环境，包括空间结构、材质、颜色、光线来源和效果、前景/中景/背景层次。只写视觉信息，不写人物、剧情。'

  const completion = await executeAiVisionStep({
    userId: session.user.id,
    model: analysisModel,
    prompt,
    imageUrls: imageUrls.slice(0, 3),
    temperature: 0.3,
  })

  return Response.json({ description: completion.text })
})
