import { logInfo as _ulogInfo, logWarn as _ulogWarn } from '@/lib/logging/core'
import { NextRequest } from 'next/server'
import { extractStorageKey, getSignedObjectUrl, toFetchableUrl } from '@/lib/storage'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

/**
 * 代理下载单个视频文件
 * 用于解决 COS 跨域下载问题
 */
export const GET = apiHandler(async (
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) => {
    const { projectId } = await context.params
    const { searchParams } = new URL(request.url)
    const videoKey = searchParams.get('key')

    if (!videoKey) {
        throw new ApiError('INVALID_PARAMS')
    }

    // 🔐 统一权限验证
    const authResult = await requireProjectAuthLight(projectId)
    if (isErrorResponse(authResult)) return authResult

    // 解析下载 URL：优先从签名 URL 中提取 storage key 再重新签名
    let fetchUrl: string
    const storageKey = extractStorageKey(videoKey)

    if (storageKey) {
        // 成功提取 storage key → 重新生成签名 URL（避免签名过期导致 403）
        fetchUrl = toFetchableUrl(await getSignedObjectUrl(storageKey, 3600))
    } else if (videoKey.startsWith('http://') || videoKey.startsWith('https://')) {
        // 无法提取 storage key 的外部 URL，直接 fetch
        fetchUrl = videoKey
    } else {
        // 纯 storage key
        fetchUrl = toFetchableUrl(await getSignedObjectUrl(videoKey, 3600))
    }

    _ulogInfo(`[视频代理] 下载: ${fetchUrl.substring(0, 100)}...`)

    const response = await fetch(fetchUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VideoProxy/1.0)',
        },
    })
    if (!response.ok) {
        _ulogWarn(`[视频代理] 下载失败: ${response.status} ${response.statusText} url=${fetchUrl.substring(0, 120)}`)
        throw new ApiError('EXTERNAL_ERROR')
    }

    // 获取内容类型和长度
    const contentType = response.headers.get('content-type') || 'video/mp4'
    const contentLength = response.headers.get('content-length')

    // 流式返回视频数据
    const headers: HeadersInit = {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
    }
    if (contentLength) {
        headers['Content-Length'] = contentLength
    }

    return new Response(response.body, { headers })
})
