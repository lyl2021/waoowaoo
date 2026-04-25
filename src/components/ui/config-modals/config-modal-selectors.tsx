'use client'

/**
 * 项目配置弹窗专用选择器
 * 卡片边框风格：选中时蓝色描边 + 淡色背景 + 加粗文字
 */
import { useEffect, useRef, useState } from 'react'
import { AppIcon } from '@/components/ui/icons'

interface RatioSelectorProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}

interface StyleOption {
  value: string
  label: string
  description?: string
  category?: string
}

interface StyleCategory {
  id: string
  name: string
}

// 风格分类颜色
const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'waoo': { bg: 'bg-orange-500/20', text: 'text-orange-500', label: 'Waoo' },
  '3d': { bg: 'bg-blue-500/20', text: 'text-blue-500', label: '3D' },
  '2d': { bg: 'bg-green-500/20', text: 'text-green-500', label: '2D' },
  'real': { bg: 'bg-amber-500/20', text: 'text-amber-500', label: '真' },
  'stop_motion': { bg: 'bg-purple-500/20', text: 'text-purple-500', label: '定' },
}

interface StyleSelectorProps {
  value: string
  onChange: (value: string) => void
  options: StyleOption[]
  categories?: StyleCategory[]
}

/** 线框比例预览块 */
function RatioShape({ ratio, selected, size = 26 }: { ratio: string; selected: boolean; size?: number }) {
  const [w, h] = ratio.split(':').map(Number)
  const max = Math.max(w, h)
  return (
    <div
      className={`rounded-md border-2 transition-colors ${
        selected ? 'border-[var(--glass-accent-from)]' : 'border-[var(--glass-stroke-strong)]'
      }`}
      style={{
        width: Math.min(size, size * (w / max)),
        height: Math.min(size, size * (h / max)),
      }}
    />
  )
}

export function RatioSelector({ value, onChange, options }: RatioSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-input-base h-11 px-3 flex items-center justify-between gap-2 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <RatioShape ratio={value} size={18} selected />
          <span className="text-sm text-[var(--glass-text-primary)] font-medium">
            {selectedOption?.label || value}
          </span>
        </div>
        <AppIcon name="chevronDown" className={`w-4 h-4 text-[var(--glass-text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="glass-surface-modal absolute z-50 mt-1 left-0 right-0 p-3 max-h-60 overflow-y-auto app-scrollbar"
          style={{ minWidth: '300px' }}
        >
          <div className="grid grid-cols-5 gap-2">
            {options.map((option) => {
              const isSelected = value === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-[var(--glass-accent-from)] bg-[var(--glass-accent-from)]/5 shadow-sm'
                      : 'border-[var(--glass-stroke-soft)] hover:border-[var(--glass-stroke-strong)]'
                  }`}
                >
                  <RatioShape ratio={option.value} size={28} selected={isSelected} />
                  <span className={`text-xs ${isSelected ? 'font-semibold text-[var(--glass-accent-from)]' : 'text-[var(--glass-text-secondary)]'}`}>
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function StyleSelector({ value, onChange, options, categories }: StyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredStyle, setHoveredStyle] = useState<StyleOption | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((option) => option.value === value) || options[0]
  const previewOption = hoveredStyle || selectedOption

  // 获取选项所属分类
  const getOptionCategory = (option: StyleOption): string => {
    if (option.category && categories?.some(c => c.id === option.category)) {
      return option.category
    }
    const parts = option.value.split('_')
    if (parts.length > 1 && categories?.some(c => c.id === parts[0])) {
      return parts[0]
    }
    return 'waoo'
  }

  // 获取分类信息
  const getCategoryInfo = (categoryId: string) => {
    return CATEGORY_COLORS[categoryId] || CATEGORY_COLORS['waoo']
  }

  // 预览风格的分类
  const previewCategory = getOptionCategory(previewOption || selectedOption)
  const previewCategoryInfo = getCategoryInfo(previewCategory)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-input-base h-11 px-3 flex items-center justify-between gap-2 cursor-pointer transition-colors"
      >
        <span className="text-sm text-[var(--glass-text-primary)] font-medium">{selectedOption.label}</span>
        <AppIcon name="chevronDown" className={`w-4 h-4 text-[var(--glass-text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="glass-surface-modal absolute z-50 mt-1 left-0 overflow-hidden" style={{ width: 520, maxHeight: 400 }}>
          <div className="flex h-[360px]">
            {/* 左侧：风格列表 */}
            <div className="w-[240px] border-r border-[var(--glass-stroke-soft)] overflow-y-auto app-scrollbar">
              <div className="p-2">
                {categories?.map((category) => {
                  const categoryInfo = getCategoryInfo(category.id)
                  const categoryOptions = options.filter(opt => getOptionCategory(opt) === category.id)
                  return (
                    <div key={category.id} className="mb-3 last:mb-0">
                      {/* 分类标题 */}
                      <div className="px-2 py-1.5 text-xs font-medium text-[var(--glass-text-tertiary)] border-b border-[var(--glass-stroke-soft)]/50 mb-2">
                        {category.name}
                      </div>
                      {/* 风格列表 */}
                      <div className="space-y-0.5">
                        {categoryOptions.map((option) => {
                          const isSelected = value === option.value
                          const optCategoryInfo = getCategoryInfo(getOptionCategory(option))
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                onChange(option.value)
                                setIsOpen(false)
                              }}
                              onMouseEnter={() => setHoveredStyle(option)}
                              onMouseLeave={() => setHoveredStyle(null)}
                              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                                isSelected
                                  ? 'bg-[var(--glass-accent-from)]/10'
                                  : 'hover:bg-[var(--glass-bg-tertiary)]'
                              }`}
                            >
                              {/* 分类色块标识 */}
                              <span className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${optCategoryInfo.bg} ${optCategoryInfo.text}`}>
                                {optCategoryInfo.label}
                              </span>
                              {/* 名称 */}
                              <span className={`flex-1 text-left text-sm truncate ${isSelected ? 'font-medium text-[var(--glass-accent-from)]' : 'text-[var(--glass-text-primary)]'}`}>
                                {option.label}
                              </span>
                              {/* 选中标记 */}
                              {isSelected && (
                                <AppIcon name="check" className="h-4 w-4 shrink-0 text-[var(--glass-accent-from)]" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 右侧：预览信息 */}
            <div className="flex-1 p-4 flex flex-col">
              {/* 预览卡片 */}
              <div className={`flex-1 flex flex-col items-center justify-center rounded-xl mb-3 ${previewCategoryInfo.bg}`}>
                <div className={`text-2xl font-bold mb-1 ${previewCategoryInfo.text}`}>{previewOption?.label}</div>
                <div className="text-xs opacity-70">{previewCategoryInfo.label} · {previewOption?.value}</div>
              </div>
              {/* 风格描述 */}
              <div className="text-center">
                <div className="font-medium text-sm mb-1">{previewOption?.label}</div>
                <div className="text-xs text-[var(--glass-text-tertiary)] line-clamp-2">
                  {previewOption?.description || '暂无描述'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
