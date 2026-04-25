'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { resolveOriginalImageUrl, toDisplayImageUrl } from '@/lib/media/image-url'
import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import { AppIcon } from '@/components/ui/icons'

interface ImagePreviewModalProps {
  imageUrl: string | null
  onClose: () => void
}

export default function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
  const t = useTranslations('common')

  useEffect(() => {
    // 禁用body滚动
    document.body.style.overflow = 'hidden'

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  if (!imageUrl) return null
  const displayImageUrl = toDisplayImageUrl(imageUrl)
  const originalImageUrl = resolveOriginalImageUrl(imageUrl) || displayImageUrl
  if (!displayImageUrl) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--glass-overlay)] backdrop-blur-sm"
      onClick={onClose}
      style={{ margin: 0, padding: 0 }}
    >
      <div className="relative max-w-[98vw] max-h-[98vh] p-1">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
        >
          <AppIcon name="close" className="w-6 h-6" />
        </button>
        {originalImageUrl && (
          <a
            href={originalImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-16 z-10 px-3 h-10 inline-flex items-center rounded-full bg-black/40 hover:bg-black/60 text-white text-sm transition-colors backdrop-blur-sm"
          >
            {t('viewOriginal')}
          </a>
        )}

        {/* 图片 */}
        <MediaImageWithLoading
          src={displayImageUrl}
          alt={t('preview')}
          containerClassName="max-w-full max-h-[98vh] rounded-3xl"
          className="max-w-full max-h-[98vh] object-contain rounded-3xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}
