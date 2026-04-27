import { NextRequest, NextResponse } from 'next/server'
import { getObjectBuffer } from '@/lib/storage'
import { getMediaObjectByPublicId } from '@/lib/media/service'

export const runtime = 'nodejs'

function buildEtag(media: { sha256?: string | null; id: string; updatedAt?: string | null }) {
  if (media.sha256) return `"${media.sha256}"`
  return `W/"media-${media.id}-${media.updatedAt || '0'}"`
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await context.params
  const media = await getMediaObjectByPublicId(publicId)

  if (!media) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 })
  }
  if (!media.storageKey) {
    return NextResponse.json({ error: 'Media storage key missing' }, { status: 500 })
  }

  const etag = buildEtag({
    id: media.id,
    sha256: media.sha256,
    updatedAt: media.updatedAt || null,
  })

  const ifNoneMatch = request.headers.get('if-none-match')
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }

  // 直接从存储获取文件流，避免签名 URL 中 Docker 内部地址暴露给浏览器
  let buffer: Buffer
  try {
    buffer = await getObjectBuffer(media.storageKey)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 502 })
  }

  const contentType = media.mimeType || 'application/octet-stream'
  const range = request.headers.get('range')

  // 处理 Range 请求（视频流等场景）
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : buffer.length - 1
    const chunk = buffer.subarray(start, end + 1)

    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Content-Range', `bytes ${start}-${end}/${buffer.length}`)
    headers.set('Content-Length', String(chunk.length))
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    headers.set('ETag', etag)

    return new Response(new Uint8Array(chunk), { status: 206, headers })
  }

  const headers = new Headers()
  headers.set('Content-Type', contentType)
  headers.set('Content-Length', String(buffer.length))
  headers.set('Accept-Ranges', 'bytes')
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('ETag', etag)

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers,
  })
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await context.params
  const media = await getMediaObjectByPublicId(publicId)
  if (!media) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 })
  }

  const etag = buildEtag({
    id: media.id,
    sha256: media.sha256,
    updatedAt: media.updatedAt || null,
  })

  const headers = new Headers()
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('ETag', etag)
  if (media.mimeType) headers.set('Content-Type', media.mimeType)
  if (media.sizeBytes != null) headers.set('Content-Length', String(media.sizeBytes))
  return new Response(null, { status: 200, headers })
}
