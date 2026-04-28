/**
 * 角色档案数据结构
 * 用于两阶段角色生成系统
 */

export type RoleLevel = 'S' | 'A' | 'B' | 'C' | 'D'

export type CostumeTier = 1 | 2 | 3 | 4 | 5

export interface CharacterProfileData {
    /** 角色重要性层级 */
    role_level: RoleLevel

    /** 角色原型 (如: 霸道总裁, 心机婊) */
    archetype: string

    /** 性格标签 */
    personality_tags: string[]

    /** 时代背景 */
    era_period: string

    /** 社会阶层 */
    social_class: string

    /** 职业 (可选) */
    occupation?: string

    /** 服装华丽度 (1-5) */
    costume_tier: CostumeTier

    /** 建议色彩 */
    suggested_colors: string[]

    /** 主要辨识标志 (S/A级角色必须) */
    primary_identifier?: string

    /** 视觉关键词 */
    visual_keywords: string[]

    /** 性别 */
    gender: string

    /** 年龄段描述 */
    age_range: string

    // ---- 音色特征（可选，由 AI 角色分析生成） ----

    /** 音色性别（允许与视觉 gender 不同，如反串） */
    voice_gender?: string

    /** 音色年龄感，如"青年"、"中年"、"少年" */
    voice_age_group?: string

    /** 音色质感，如"低沉磁性"、"清脆明亮" */
    voice_tone?: string

    /** 默认语速倾向 */
    voice_speed?: string

    /** 默认情感风格，如"冷静克制"、"热情奔放" */
    voice_emotion_style?: string

    /** 口音/方言，默认"标准普通话" */
    voice_accent?: string

    /** 额外音色标签 */
    voice_traits?: string[]

    /** 组装好的 voicePrompt（<=500字符），可直接用于百炼 voice-design */
    voice_prompt?: string
}

/**
 * 从JSON字符串解析角色档案
 */
export function parseProfileData(profileDataJson: string | null): CharacterProfileData | null {
    if (!profileDataJson) return null
    try {
        return JSON.parse(profileDataJson) as CharacterProfileData
    } catch {
        return null
    }
}

/**
 * 将角色档案序列化为JSON字符串
 */
export function stringifyProfileData(profileData: CharacterProfileData): string {
    return JSON.stringify(profileData)
}

/**
 * 验证角色档案数据完整性
 */
export function validateProfileData(data: unknown): data is CharacterProfileData {
    if (!data || typeof data !== 'object') return false
    const candidate = data as Partial<CharacterProfileData>
    return !!(
        typeof candidate.role_level === 'string' &&
        ['S', 'A', 'B', 'C', 'D'].includes(candidate.role_level) &&
        typeof candidate.archetype === 'string' &&
        Array.isArray(candidate.personality_tags) &&
        typeof candidate.era_period === 'string' &&
        typeof candidate.social_class === 'string' &&
        typeof candidate.costume_tier === 'number' &&
        candidate.costume_tier >= 1 &&
        candidate.costume_tier <= 5 &&
        Array.isArray(candidate.suggested_colors) &&
        Array.isArray(candidate.visual_keywords) &&
        typeof candidate.gender === 'string' &&
        typeof candidate.age_range === 'string'
    )
}

const VOICE_PROMPT_MAX_LENGTH = 500

/**
 * 从角色档案中提取 voicePrompt（用于百炼 voice-design）
 * 返回 null 表示档案中未包含音色特征
 */
export function extractVoicePromptFromProfile(profile: CharacterProfileData): string | null {
    const prompt = typeof profile.voice_prompt === 'string' ? profile.voice_prompt.trim() : ''
    if (!prompt) return null
    return prompt.length > VOICE_PROMPT_MAX_LENGTH
        ? prompt.slice(0, VOICE_PROMPT_MAX_LENGTH)
        : prompt
}
