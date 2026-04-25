/**
 * 主形象的 appearanceIndex 值。
 * 所有判断主/子形象的逻辑必须引用此常量，禁止硬编码数字。
 * 子形象的 appearanceIndex 从 PRIMARY_APPEARANCE_INDEX + 1 开始递增。
 */
export const PRIMARY_APPEARANCE_INDEX = 0

// 比例配置（nanobanana 支持的所有比例，按常用程度排序）
export const ASPECT_RATIO_CONFIGS: Record<string, { label: string; isVertical: boolean }> = {
  '16:9': { label: '16:9', isVertical: false },
  '9:16': { label: '9:16', isVertical: true },
  '1:1': { label: '1:1', isVertical: false },
  '3:2': { label: '3:2', isVertical: false },
  '2:3': { label: '2:3', isVertical: true },
  '4:3': { label: '4:3', isVertical: false },
  '3:4': { label: '3:4', isVertical: true },
  '5:4': { label: '5:4', isVertical: false },
  '4:5': { label: '4:5', isVertical: true },
  '21:9': { label: '21:9', isVertical: false },
}

// 配置页面使用的选项列表（从 ASPECT_RATIO_CONFIGS 派生）
export const VIDEO_RATIOS = Object.entries(ASPECT_RATIO_CONFIGS).map(([value, config]) => ({
  value,
  label: config.label
}))

// 获取比例配置
export function getAspectRatioConfig(ratio: string) {
  return ASPECT_RATIO_CONFIGS[ratio] || ASPECT_RATIO_CONFIGS['16:9']
}

export const ANALYSIS_MODELS = [
  { value: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'google/gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash-Lite' },
  { value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' }
]

export const IMAGE_MODELS = [
  { value: 'doubao-seedream-4-5-251128', label: 'Seedream 4.5' },
  { value: 'doubao-seedream-4-0-250828', label: 'Seedream 4.0' }
]

// 图像模型选项（ 生成完整图片）
export const IMAGE_MODEL_OPTIONS = [
  { value: 'banana', label: 'Banana Pro (FAL)' },
  { value: 'banana-2', label: 'Banana 2 (FAL)' },
  { value: 'gemini-3-pro-image-preview', label: 'Banana (Google)' },
  { value: 'gemini-3-pro-image-preview-batch', label: 'Banana (Google Batch) 省50%' },
  { value: 'doubao-seedream-4-0-250828', label: 'Seedream 4.0' },
  { value: 'doubao-seedream-4-5-251128', label: 'Seedream 4.5' },
  { value: 'imagen-4.0-generate-001', label: 'Imagen 4.0 (Google)' },
  { value: 'imagen-4.0-ultra-generate-001', label: 'Imagen 4.0 Ultra' },
  { value: 'imagen-4.0-fast-generate-001', label: 'Imagen 4.0 Fast' }
]

// Banana 模型分辨率选项（仅用于九宫格分镜图，单张生成固定2K）
export const BANANA_RESOLUTION_OPTIONS = [
  { value: '2K', label: '2K (推荐，快速)' },
  { value: '4K', label: '4K (高清，较慢)' }
]

// 支持分辨率选择的 Banana 模型
export const BANANA_MODELS = ['banana', 'banana-2', 'gemini-3-pro-image-preview', 'gemini-3-pro-image-preview-batch']

export const VIDEO_MODELS = [
  { value: 'doubao-seedance-2-0-260128', label: 'Seedance 2.0' },
  { value: 'doubao-seedance-2-0-fast-260128', label: 'Seedance 2.0 Fast' },
  { value: 'doubao-seedance-1-0-pro-fast-251015', label: 'Seedance 1.0 Pro Fast' },
  { value: 'doubao-seedance-1-0-pro-fast-251015-batch', label: 'Seedance 1.0 Pro Fast (批量) 省50%' },
  { value: 'doubao-seedance-1-0-lite-i2v-250428', label: 'Seedance 1.0 Lite' },
  { value: 'doubao-seedance-1-0-lite-i2v-250428-batch', label: 'Seedance 1.0 Lite (批量) 省50%' },
  { value: 'doubao-seedance-1-5-pro-251215', label: 'Seedance 1.5 Pro' },
  { value: 'doubao-seedance-1-5-pro-251215-batch', label: 'Seedance 1.5 Pro (批量) 省50%' },
  { value: 'doubao-seedance-1-0-pro-250528', label: 'Seedance 1.0 Pro' },
  { value: 'doubao-seedance-1-0-pro-250528-batch', label: 'Seedance 1.0 Pro (批量) 省50%' },
  { value: 'fal-wan25', label: 'Wan 2.6' },
  { value: 'fal-veo31', label: 'Veo 3.1 Fast' },
  { value: 'fal-sora2', label: 'Sora 2' },
  { value: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video', label: 'Kling 2.5 Turbo Pro' },
  { value: 'fal-ai/kling-video/v3/standard/image-to-video', label: 'Kling 3 Standard' },
  { value: 'fal-ai/kling-video/v3/pro/image-to-video', label: 'Kling 3 Pro' }
]

// SeeDream 批量模型列表（使用 GPU 空闲时间，成本降低50%）
export const SEEDANCE_BATCH_MODELS = [
  'doubao-seedance-1-5-pro-251215-batch',
  'doubao-seedance-1-0-pro-250528-batch',
  'doubao-seedance-1-0-pro-fast-251015-batch',
  'doubao-seedance-1-0-lite-i2v-250428-batch',
]

// 支持生成音频的模型
export const AUDIO_SUPPORTED_MODELS = [
  'doubao-seedance-2-0-260128',
  'doubao-seedance-2-0-fast-260128',
  'doubao-seedance-1-5-pro-251215',
  'doubao-seedance-1-5-pro-251215-batch',
]

// 首尾帧视频模型（能力权威来源是 standards/capabilities；此常量仅作静态兜底展示）
export const FIRST_LAST_FRAME_MODELS = [
  { value: 'doubao-seedance-2-0-260128', label: 'Seedance 2.0 (首尾帧)' },
  { value: 'doubao-seedance-2-0-fast-260128', label: 'Seedance 2.0 Fast (首尾帧)' },
  { value: 'doubao-seedance-1-5-pro-251215', label: 'Seedance 1.5 Pro (首尾帧)' },
  { value: 'doubao-seedance-1-5-pro-251215-batch', label: 'Seedance 1.5 Pro (首尾帧/批量) 省50%' },
  { value: 'doubao-seedance-1-0-pro-250528', label: 'Seedance 1.0 Pro (首尾帧)' },
  { value: 'doubao-seedance-1-0-pro-250528-batch', label: 'Seedance 1.0 Pro (首尾帧/批量) 省50%' },
  { value: 'doubao-seedance-1-0-lite-i2v-250428', label: 'Seedance 1.0 Lite (首尾帧)' },
  { value: 'doubao-seedance-1-0-lite-i2v-250428-batch', label: 'Seedance 1.0 Lite (首尾帧/批量) 省50%' },
  { value: 'veo-3.1-generate-preview', label: 'Veo 3.1 (首尾帧)' },
  { value: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1 Fast (首尾帧)' }
]

export const VIDEO_RESOLUTIONS = [
  { value: '480p', label: '480p' },
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p' }
]

export const TTS_RATES = [
  { value: '+0%', label: '正常速度 (1.0x)' },
  { value: '+20%', label: '轻微加速 (1.2x)' },
  { value: '+50%', label: '加速 (1.5x)' },
  { value: '+100%', label: '快速 (2.0x)' }
]

export const TTS_VOICES = [
  { value: 'zh-CN-YunxiNeural', label: '云希 (男声)', preview: '男' },
  { value: 'zh-CN-XiaoxiaoNeural', label: '晓晓 (女声)', preview: '女' },
  { value: 'zh-CN-YunyangNeural', label: '云扬 (男声)', preview: '男' },
  { value: 'zh-CN-XiaoyiNeural', label: '晓伊 (女声)', preview: '女' }
]

// 风格分类
export type ArtStyleCategory = 'waoo' | '3d' | '2d' | 'real' | 'stop_motion'

// 风格分类名称
export const ART_STYLE_CATEGORIES: { id: ArtStyleCategory; name: string }[] = [
  { id: 'waoo', name: 'Waoo风格' },
  { id: '3d', name: '3D风格' },
  { id: '2d', name: '2D动画' },
  { id: 'real', name: '真人风格' },
  { id: 'stop_motion', name: '定格动画' }
]

export const ART_STYLES = [
  // ============================================================
  // Waoo风格 (4) - 保留原有风格
  // ============================================================
  {
    value: 'american-comic',
    label: '漫画风',
    category: 'waoo',
    description: '日式动漫风格',
    preview: '漫',
    promptZh: '日式动漫风格',
    promptEn: 'Japanese anime style'
  },
  {
    value: 'chinese-comic',
    label: '精致国漫',
    category: 'waoo',
    description: '现代高质量漫画风格，动漫风格，细节丰富精致，线条锐利干净，质感饱满，超清，干净的画面风格，2D风格，动漫风格。',
    preview: '国',
    promptZh: '现代高质量漫画风格，动漫风格，细节丰富精致，线条锐利干净，质感饱满，超清，干净的画面风格，2D风格，动漫风格。',
    promptEn: 'Modern premium Chinese comic style, rich details, clean sharp line art, full texture, ultra-clear 2D anime aesthetics.'
  },
  {
    value: 'japanese-anime',
    label: '日系动漫风',
    category: 'waoo',
    description: '现代日系动漫风格，赛璐璐上色，清晰干净的线条，视觉小说CG感',
    preview: '日',
    promptZh: '现代日系动漫风格，赛璐璐上色，清晰干净的线条，视觉小说CG感。高质量2D风格',
    promptEn: 'Modern Japanese anime style, cel shading, clean line art, visual-novel CG look, high-quality 2D style.'
  },
  {
    value: 'realistic',
    label: '真人风格',
    category: 'waoo',
    description: '真实电影级画面质感，真实现实场景，色彩饱满通透',
    preview: '实',
    promptZh: '真实电影级画面质感，真实现实场景，色彩饱满通透，画面干净精致，真实感',
    promptEn: 'Realistic cinematic look, real-world scene fidelity, rich transparent colors, clean and refined image quality.'
  },

  // ============================================================
  // 3D风格 (9)
  // ============================================================
  {
    value: '3d_xuanhuan',
    label: '3D玄幻',
    category: '3d',
    description: '中国风玄幻，仙侠，虚幻引擎渲染，光效华丽',
    preview: '玄',
    promptZh: '最佳质量，精美杰作，8K，高细节。虚幻引擎5风格。仙侠角色渲染，光效华丽，瓷器般皮肤质感，细腻传统服饰刺绣，飘动长袍。仙气缭绕，灵力光效，华丽特效。',
    promptEn: 'best quality, masterpiece, 8k, high detailed, stunning stylized 3D Chinese animation character render, Unreal Engine 5 style, cinematic lighting soft volumetric fog, smooth porcelain skin texture, intricate traditional Chinese fabric details fine embroidery flowing robes, ethereal atmosphere glowing spiritual energy'
  },
  {
    value: '3d_american',
    label: '3D美式',
    category: '3d',
    description: '迪士尼/皮克斯风格，美式3D动画，色彩鲜艳，角色可爱',
    preview: '美',
    promptZh: '最佳质量，精美杰作，8K，高细节。皮克斯风格3D动画。圆润饱满造型，大眼睛。次表面散射皮肤质感。鲜艳色彩，暖色调光照。',
    promptEn: 'best quality, masterpiece, 8k high detailed, Disney Pixar style 3D animation, expressive character design large eyes, subsurface scattering skin, vibrant colors warm lighting, cute 3D render cgsociety detailed background soft edges'
  },
  {
    value: '3d_q_version',
    label: '3DQ版',
    category: '3d',
    description: '盲盒/潮玩风格，Q版三维，C4D渲染，软光',
    preview: 'Q',
    promptZh: '最佳质量，精美杰作，8K，高细节。泡泡玛特盲盒风格。大头小身比例，OC渲染。哑光塑料材质质感。软光工作室打光，轮廓光。',
    promptEn: 'best quality masterpiece 8k high detailed, Pop Mart blind box style, chibi 3D rendering, Oc render, soft studio lighting rim light, plastic material smooth texture, cute super deformed clean background c4d render'
  },
  {
    value: '3d_realistic',
    label: '3D写实',
    category: '3d',
    description: '超写实3D，电影级光照，8K分辨率，纹理细节丰富',
    preview: '写',
    promptZh: '最佳质量，精美杰作，8K，高细节。照片级写实3D渲染。皮肤毛孔可见，高清纹理与微小瑕疵。虚幻引擎5，电影级光照，光线追踪。',
    promptEn: 'best quality masterpiece 8k high detailed, photorealistic 3D render, hyperrealistic details, Unreal Engine 5, cinematic lighting ray tracing, highly detailed texture pores imperfections, sharp focus depth of field'
  },
  {
    value: '3d_block',
    label: '3D块面',
    category: '3d',
    description: '低多边形，Low Poly，几何块面，简约风格',
    preview: '块',
    promptZh: '最佳质量，精美杰作，8K。低多边形艺术风格。极简3D。锐利边缘，几何形状。平面着色，简洁配色。',
    promptEn: 'best quality masterpiece 8k, low poly art style, minimalist 3D, sharp edges geometric shapes, flat shading simple colors, polygon art clean composition'
  },
  {
    value: '3d_voxel',
    label: '3D方块世界',
    category: '3d',
    description: '我的世界风格，体素艺术，方块感',
    preview: 'V',
    promptZh: '最佳质量，精美杰作，8K。我的世界风格体素艺术。立方体积木。等轴测视角（isometric view）。',
    promptEn: 'best quality masterpiece 8k, Minecraft style voxel art, cubic blocks, 8-bit 3d, lego style, sharp focus vibrant colors, isometric view'
  },
  {
    value: '3d_mobile',
    label: '3D手游',
    category: '3d',
    description: '3D手游风格，Unity渲染，风格化3D',
    preview: '游',
    promptZh: '最佳质量，精美杰作，8K，高细节。Unity引擎手游风格。风格化3D角色。Unity引擎，游戏资产质感，干净纹理，鲜艳美学。',
    promptEn: 'best quality masterpiece 8k high detailed, unity engine mobile game style, stylized 3D character, cel shaded 3d, clean textures vibrant aesthetic, game asset polished'
  },
  {
    value: '3d_render_2d',
    label: '3D渲染2D',
    category: '3d',
    description: '三渲二，卡通渲染，原神风格',
    preview: '三',
    promptZh: '最佳质量，精美杰作，8K，高细节。原神风格。三渲二卡通渲染。动漫风格3D渲染。干净线条，鲜艳动漫色彩。2.5D。',
    promptEn: 'best quality masterpiece 8k high detailed, Genshin Impact style, cel shaded 3D, anime style 3D rendering, clean lines vibrant anime colors, 2.5d toon shading'
  },
  {
    value: 'jp_3d_render_2d',
    label: '日式3D渲染2D',
    category: '3d',
    description: '日式三渲二，罪恶装备风格，鲜艳动漫色',
    preview: '罪',
    promptZh: '最佳质量，精美杰作，8K，高细节。罪恶装备风格(Guilty Gear)。日式动漫3D渲染。动态摄像机角度。硬边光影。鲜艳色彩。',
    promptEn: 'best quality masterpiece 8k high detailed, Guilty Gear Strive style, Japanese anime 3D render, dynamic camera angles, sharp cel shading, vibrant colors detailed character design'
  },

  // ============================================================
  // 2D动画 (29)
  // ============================================================
  {
    value: '2d_animation',
    label: '2D动画',
    category: '2d',
    description: '标准日式2D动画风格',
    preview: '动',
    promptZh: '最佳质量，精美杰作，8K，高细节。标准日式动漫风格。干净线稿，平涂色彩。动漫角色设计。鲜艳，大眼睛。',
    promptEn: 'best quality masterpiece 8k high detailed, standard Japanese anime style, clean lineart flat color, anime character design, vibrant detailed eyes'
  },
  {
    value: '2d_movie',
    label: '2D电影',
    category: '2d',
    description: '动画电影质感，新海诚风格，背景细致',
    preview: '映',
    promptZh: '最佳质量，精美杰作，8K，高细节。新海诚风格。令人惊叹的电影光照。高度细致背景，云朵，星空。情感氛围。日系动画电影剧照。',
    promptEn: 'best quality masterpiece 8k high detailed, Makoto Shinkai style, breathtaking cinematic lighting, highly detailed background clouds starry sky, sentimental atmosphere, anime movie still high budget animation'
  },
  {
    value: '2d_fantasy',
    label: '2D奇幻动画',
    category: '2d',
    description: '奇幻动画，魔法世界，梦幻色彩',
    preview: '幻',
    promptZh: '最佳质量，精美杰作，8K，高细节。奇幻动漫风格。魔法氛围，发光粒子。精致铠甲与长袍。充满活力的神秘色彩。魔法世界，梦幻感。',
    promptEn: 'best quality masterpiece 8k high detailed, fantasy anime style, magical atmosphere glowing particles, intricate armor and robes, vibrant mystical colors, world of magic dreamy'
  },
  {
    value: '2d_retro',
    label: '2D复古动画',
    category: '2d',
    description: '90年代复古动画，赛璐璐风格，低保真',
    preview: '复',
    promptZh: '最佳质量，精美杰作，8K。90年代复古动漫风格。赛璐璐动画美学。复古VHS效果，低保真音。美少女战士风格。',
    promptEn: 'best quality masterpiece 8k, 90s retro anime style, cel animation aesthetic, vintage VHS effect lo-fi, Sailor Moon style, matte painting background nostalgic'
  },
  {
    value: '2d_american',
    label: '2D美式动画',
    category: '2d',
    description: '美式卡通，Cartoon Network风格，线条粗犷',
    preview: '卡',
    promptZh: '最佳质量，精美杰作，8K。Cartoon Network风格。粗黑轮廓线。夸张表情。美式卡通美学。平涂色彩，充满活力。',
    promptEn: 'best quality masterpiece 8k, Cartoon Network style, bold thick outlines, exaggerated expressions, western cartoon aesthetic, flat colors energetic'
  },
  {
    value: '2d_ghibli',
    label: '2D吉卜力动画',
    category: '2d',
    description: '吉卜力风格，宫崎骏，水彩背景，自然清新',
    preview: '宫',
    promptZh: '最佳质量，精美杰作，8K，高细节。宫崎骏风格。吉卜力工作室。水彩手绘背景。平和自然氛围。柔美色彩，迷人角色。',
    promptEn: 'best quality masterpiece 8k high detailed, Studio Ghibli style, Hayao Miyazaki, hand painted watercolor background, peaceful nature atmosphere, soft colors charming characters'
  },
  {
    value: '2d_retro_girl',
    label: '2D复古少女',
    category: '2d',
    description: '80年代少女漫风格，星星眼，粉嫩配色',
    preview: '少',
    promptZh: '最佳质量，精美杰作，8K。80年代少女漫画风格。闪闪亮的大眼睛。粉彩色调，花朵与气泡。复古时尚。梦幻，浪漫。',
    promptEn: 'best quality masterpiece 8k, 80s shoujo manga style, sparkly big eyes, pastel colors flowers and bubbles, retro fashion, dreamy romantic'
  },
  {
    value: '2d_korean',
    label: '2D韩式动画',
    category: '2d',
    description: '韩漫/条漫风格，Webtoon，上色细致',
    preview: '韩',
    promptZh: '最佳质量，精美杰作，8K，高细节。高端Webtoon条漫风格。锐利帅气五官。细致数字上色，发光眼睛。现代时尚。',
    promptEn: 'best quality masterpiece 8k high detailed, premium Webtoon style, sharp handsome facial features, detailed digital coloring glowing eyes, modern fashion, manhwa aesthetic'
  },
  {
    value: '2d_shonen',
    label: '2D热血动画',
    category: '2d',
    description: '热血少年漫，动态姿势，速度线，高对比度',
    preview: '热',
    promptZh: '最佳质量，精美杰作，8K，高细节。少年动漫风格。动感高冲击姿势。速度线，动感效果线。高对比度阴影。力量感，充满能量。',
    promptEn: 'best quality masterpiece 8k high detailed, Shonen anime style, dynamic high-impact pose, intense action lines speed lines, high contrast shading, powerful energetic'
  },
  {
    value: '2d_akira',
    label: '2D鸟山明',
    category: '2d',
    description: '鸟山明/龙珠风格',
    preview: '龙',
    promptZh: '最佳质量，精美杰作，8K。鸟山明艺术风格。龙珠Z风格。肌肉线条。锐利棱角眼睛。复古少年漫风格。标志性的。',
    promptEn: 'best quality masterpiece 8k, Akira Toriyama art style, Dragon Ball Z style, muscular definition, sharp angular eyes, retro shonen iconic'
  },
  {
    value: '2d_doraemon',
    label: '2D哆啦A梦',
    category: '2d',
    description: '哆啦A梦/藤子F不二雄风格',
    preview: '蓝',
    promptZh: '最佳质量，精美杰作，8K。哆啦A梦风格。藤子F不二雄。简单圆润角色设计。稚拙可爱。明快色彩，干净线条。',
    promptEn: 'best quality masterpiece 8k, Doraemon style, Fujiko F Fujio, simple round character design, childlike and cute, bright colors clean lines'
  },
  {
    value: '2d_fujimoto',
    label: '2D藤本树',
    category: '2d',
    description: '藤本树/电锯人风格，线条潦草，电影感构图',
    preview: '链',
    promptZh: '最佳质量，精美杰作，8K。藤本树风格。电锯人漫画风格。潦草松散线条。电影化构图。原始情感。独特的。',
    promptEn: 'best quality masterpiece 8k, Tatsuki Fujimoto style, sketchy loose lines, cinematic movie composition, raw emotion, chainsaw man manga style unique'
  },
  {
    value: '2d_mob',
    label: '2D灵能百分百',
    category: '2d',
    description: '灵能百分百风格，都市怪谈，迷幻配色',
    preview: '超',
    promptZh: '最佳质量，精美杰作，8K。灵能百分百风格。ONE老师风格。迷幻色彩。扭曲透视。都市奇幻，超自然。',
    promptEn: 'best quality masterpiece 8k, Mob Psycho 100 style, ONE style, psychedelic colors, warped perspective, urban fantasy supernatural'
  },
  {
    value: '2d_jojo',
    label: '2D JOJO风',
    category: '2d',
    description: 'JOJO风格，荒木飞吕彦，荒木线，重阴影',
    preview: 'JO',
    promptZh: '最佳质量，精美杰作，8K。JOJO的奇妙冒险风格。荒木飞吕彦画风。厚重阴影，粗犷线条。华丽姿势，肌肉感。',
    promptEn: "best quality masterpiece 8k, Jojo's Bizarre Adventure style, Araki Hirohiko artstyle, heavy shading harsh lines, fabulous pose muscular, menacing text detailed"
  },
  {
    value: '2d_detective',
    label: '2D日式侦探',
    category: '2d',
    description: '名侦探柯南/青山刚昌风格',
    preview: '侦',
    promptZh: '最佳质量，精美杰作，8K。名侦探柯南风格。青山刚昌。独特的锐利鼻和耳朵。推理悬疑氛围。90年代动漫美学。',
    promptEn: 'best quality masterpiece 8k, Detective Conan style, Gosho Aoyama, distinctive sharp nose and ears, mystery atmosphere, 90s anime aesthetic'
  },
  {
    value: '2d_slamdunk',
    label: '2D灌篮高手',
    category: '2d',
    description: '灌篮高手/井上雄彦风格，写实比例',
    preview: '篮',
    promptZh: '最佳质量，精美杰作，8K，高细节。灌篮高手风格。井上雄彦。写实身体比例。细致肌肉与汗水。激烈运动氛围。',
    promptEn: 'best quality masterpiece 8k high detailed, Slam Dunk style, Takehiko Inoue, realistic body proportions, detailed muscle and sweat, intense sports atmosphere 90s anime'
  },
  {
    value: '2d_astroboy',
    label: '2D手冢治虫',
    category: '2d',
    description: '手冢治虫/阿童木风格，经典圆润线条',
    preview: '虫',
    promptZh: '最佳质量，精美杰作，8K。手冢治虫风格。阿童木美学。大而富有表现力的眼睛，圆润特征。黑白或复古色彩。标志性的。',
    promptEn: 'best quality masterpiece 8k, Osamu Tezuka style, classic Astro Boy aesthetic, large expressive eyes rounded features, black and white or vintage color iconic'
  },
  {
    value: '2d_deathnote',
    label: '2D死亡笔记',
    category: '2d',
    description: '死亡笔记/小畑健风格，哥特，暗黑氛围',
    preview: '死',
    promptZh: '最佳质量，精美杰作，8K，高细节。死亡笔记风格。小畑健。哥特暗黑氛围。精致交叉排线，锐利五官。',
    promptEn: 'best quality masterpiece 8k high detailed, Death Note style, Takeshi Obata, gothic dark atmosphere, intricate cross-hatching sharp features, serious mystery'
  },
  {
    value: '2d_thick_line',
    label: '2D粗线条',
    category: '2d',
    description: '粗轮廓线，涂鸦风格，街头艺术',
    preview: '涂',
    promptZh: '最佳质量，精美杰作，8K。涂鸦艺术风格。粗黑轮廓线。城市街头艺术。充满活力的对比色彩。',
    promptEn: 'best quality masterpiece 8k, Graffiti art style, bold thick black outlines, urban street art, vibrant contrast colors, stylized cool'
  },
  {
    value: '2d_rubberhose',
    label: '2D橡皮管动画',
    category: '2d',
    description: '橡皮管动画，30年代卡通，茶杯头风格',
    preview: '管',
    promptZh: '最佳质量，精美杰作，8K。1930年代橡皮管动画风格。茶杯头风格。复古迪士尼风格。摇摆四肢，饼状眼睛。',
    promptEn: 'best quality masterpiece 8k, 1930s rubber hose animation, Cuphead style, vintage Disney style, swinging limbs pie eyes, black and white film grain'
  },
  {
    value: '2d_q_version',
    label: '2DQ版',
    category: '2d',
    description: 'Q版2D，可爱风',
    preview: '甜',
    promptZh: '最佳质量，精美杰作，8K。Q版可爱风格。超级变形角色。柔和粉彩色调。简单阴影。',
    promptEn: 'best quality masterpiece 8k, kawaii chibi style, super deformed characters, soft pastel colors, simple shading, cute adorable'
  },
  {
    value: '2d_pixel',
    label: '2D像素',
    category: '2d',
    description: '像素艺术，8-bit/16-bit游戏风格',
    preview: '像',
    promptZh: '最佳质量，精美杰作，8K。像素艺术风格。16位游戏精灵。复古游戏美学。色彩像素，干净清晰。',
    promptEn: 'best quality masterpiece 8k, pixel art style, 16-bit game sprite, retro gaming aesthetic, dithering, clean pixels colorful'
  },
  {
    value: '2d_gongbi',
    label: '2D工笔风',
    category: '2d',
    description: '中国工笔画风格，细腻笔触',
    preview: '工',
    promptZh: '最佳质量，精美杰作，8K，高细节。中国工笔画风格。细腻笔触。优雅传统艺术。水墨画背景。',
    promptEn: 'best quality masterpiece 8k high detailed, Chinese Gongbi painting style, meticulous brushwork, elegant traditional art, ink wash painting background, delicate cultural'
  },
  {
    value: '2d_stick',
    label: '2D简笔画',
    category: '2d',
    description: '简笔画，涂鸦，极简手绘',
    preview: '简',
    promptZh: '最佳质量，精美杰作，8K。极简火柴人风格。手绘涂鸦。素描本美学。简单线条，白色背景。',
    promptEn: 'best quality masterpiece 8k, minimalist stick figure style, hand drawn doodle, sketchbook aesthetic, simple lines white background cute'
  },
  {
    value: '2d_watercolor',
    label: '2D水彩',
    category: '2d',
    description: '水彩画风格，湿画法，艺术感',
    preview: '彩',
    promptZh: '最佳质量，精美杰作，8K，高细节。水彩画风格。湿画法技巧。柔和边缘，艺术笔触。水渍扩散效果。纸张纹理。梦幻插画感。',
    promptEn: 'best quality masterpiece 8k high detailed, watercolor painting style, wet on wet technique, soft edges artistic strokes, paper texture, dreamy illustration'
  },
  {
    value: '2d_simple_line',
    label: '2D简单线条',
    category: '2d',
    description: '简单线条，线稿，白底',
    preview: '线',
    promptZh: '最佳质量，精美杰作，8K。极简线条艺术。干净连续线条。矢量风格。无阴影无填充纯线条。',
    promptEn: 'best quality masterpiece 8k, minimalist line art, clean continuous line, vector style, black lines on white, elegant simple'
  },
  {
    value: '2d_comic',
    label: '2D美式漫画',
    category: '2d',
    description: '美式漫画，半调网点，漫威/DC风格',
    preview: '漫',
    promptZh: '最佳质量，精美杰作，8K，高细节。美式漫画风格。漫威/DC漫画风格。半调网点，排线。对话框。动态动作。鲜艳墨水。',
    promptEn: 'best quality masterpiece 8k high detailed, American comic book style, Marvel DC comic style, halftone dots hatching, dynamic action speech bubbles, vibrant ink'
  },
  {
    value: '2d_shoujo',
    label: '2D少女漫画',
    category: '2d',
    description: '传统少女漫画，细腻线条，花朵背景',
    preview: '花',
    promptZh: '最佳质量，精美杰作，8K，高细节。传统少女漫画风格。细腻线条。花朵背景，网纸色调。情感表达。美丽，浪漫。',
    promptEn: 'best quality masterpiece 8k high detailed, classic Shoujo manga style, delicate thin lines, flowery background screentones, emotional expression, beautiful romantic'
  },
  {
    value: '2d_horror',
    label: '2D诡异惊悚',
    category: '2d',
    description: '伊藤润二风格，恐怖漫画，螺旋，怪诞',
    preview: '恐',
    promptZh: '最佳质量，精美杰作，8K，高细节。伊藤润二恐怖漫画风格。怪诞艺术风格。重墨黑色，螺旋。诡异氛围。身体恐怖，噩梦感。',
    promptEn: 'best quality masterpiece 8k high detailed, Junji Ito horror manga, grotesque art style, heavy black ink spirals, creepy atmosphere, body horror nightmare'
  },

  // ============================================================
  // 真人风格 (5)
  // ============================================================
  {
    value: 'real_movie',
    label: '真人电影',
    category: 'real',
    description: '电影剧照，胶片感，电影调色',
    preview: '影',
    promptZh: '最佳质量，精美杰作，8K，高细节。电影剧照。35mm胶片颗粒。戏剧性电影光照。电影调色。照片级真实感，景深。',
    promptEn: 'best quality masterpiece 8k high detailed, cinematic movie still, 35mm film grain, dramatic movie lighting, color graded, photorealistic depth of field'
  },
  {
    value: 'real_costume',
    label: '真人古装',
    category: 'real',
    description: '古装剧风格，汉服，古风摄影',
    preview: '古',
    promptZh: '最佳质量，精美杰作，8K，高细节。中国古装剧风格。汉服传统服饰。精致刺绣。优雅古风场景。照片真实感，电影光照。',
    promptEn: 'best quality masterpiece 8k high detailed, Chinese period drama style, Hanfu traditional costume, exquisite embroidery, elegant ancient setting, photorealistic cinematic lighting'
  },
  {
    value: 'real_hk_retro',
    label: '真人复古港片',
    category: 'real',
    description: '港风复古，王家卫风格，霓虹灯，90年代电影',
    preview: '港',
    promptZh: '最佳质量，精美杰作，8K，高细节。90年代港片风格。王家卫美学。霓虹灯，高对比度。动态模糊，胶片颗粒。梦幻，忧郁。',
    promptEn: 'best quality masterpiece 8k high detailed, 90s Hong Kong movie style, Wong Kar-wai aesthetic, neon lights high contrast, motion blur film grain, dreamy moody'
  },
  {
    value: 'real_wuxia',
    label: '真人复古武侠',
    category: 'real',
    description: '复古武侠片，邵氏电影风格',
    preview: '武',
    promptZh: '最佳质量，精美杰作，8K，高细节。邵氏武侠风格。复古功夫电影。武侠姿势。复古胶片美学。照片真实感，电影感。',
    promptEn: 'best quality masterpiece 8k high detailed, Shaw Brothers Wuxia style, vintage kung fu movie, martial arts pose, retro film aesthetic, photorealistic cinematic'
  },
  {
    value: 'real_bloom',
    label: '真实光晕',
    category: 'real',
    description: '唯美光晕，逆光，梦幻光效',
    preview: '光',
    promptZh: '最佳质量，精美杰作，8K，高细节。梦幻柔焦摄影。强烈光晕，镜头光晕。逆光拍摄。圣洁光效。照片真实感，天使般。',
    promptEn: 'best quality masterpiece 8k high detailed, dreamy soft focus photography, strong bloom lens flare, backlit by sun, ethereal lighting, photorealistic angelic'
  },

  // ============================================================
  // 定格动画 (5)
  // ============================================================
  {
    value: 'stop_motion',
    label: '定格动画',
    category: 'stop_motion',
    description: '定格动画总称，微缩场景摆拍',
    preview: '定',
    promptZh: '最佳质量，精美杰作，8K，高细节。定格动画风格。微缩场景摆拍。实物材质，手工道具。逐帧动画质感。',
    promptEn: 'best quality masterpiece 8k high detailed, stop motion animation style, miniatures scene staging, real object materials, handmade props, frame by frame look tactile studio lighting'
  },
  {
    value: 'figure_stop_motion',
    label: '手办定格动画',
    category: 'stop_motion',
    description: '手办质感，PVC材质，玩具摄影',
    preview: '办',
    promptZh: '最佳质量，精美杰作，8K，高细节。PVC手办摄影。玩具摄影。塑料材质质感，次表面散射。微距摄影，景深。',
    promptEn: 'best quality masterpiece 8k high detailed, PVC action figure photography, toy photography, plastic texture sub-surface scattering, macro photography depth of field, realistic toy'
  },
  {
    value: 'clay_stop_motion',
    label: '粘土定格动画',
    category: 'stop_motion',
    description: '粘土质感，橡皮泥，哑光硬质粘土表面',
    preview: '粘',
    promptZh: '最佳质量，精美杰作，8K，高细节。阿德曼定格动画风格。哑光橡皮泥材质。干燥硬质粘土表面，非毛绒非织物。手工感，指纹细节。',
    promptEn: 'best quality masterpiece 8k high detailed, Aardman style claymation, matte rubbery clay material, dry hard clay surface, non-fluffy non-fabric, visible fingerprints and imperfections handmade cute'
  },
  {
    value: 'lego_stop_motion',
    label: '积木定格动画',
    category: 'stop_motion',
    description: '乐高积木风格，塑料质感',
    preview: '乐',
    promptZh: '最佳质量，精美杰作，8K，高细节。乐高定格动画。塑料积木纹理。建筑玩具美学。微距镜头。',
    promptEn: 'best quality masterpiece 8k high detailed, Lego stop motion, plastic brick texture, construction toy aesthetic, macro lens, toy world vibrant'
  },
  {
    value: 'felt_stop_motion',
    label: '毛绒定格动画',
    category: 'stop_motion',
    description: '羊毛毡质感，毛绒材质，软萌',
    preview: '绒',
    promptZh: '最佳质量，精美杰作，8K，高细节。针毡动画风格。羊毛纤维纹理。毛绒绒触感，柔软织物材质。手工缝制感。温暖氛围。',
    promptEn: 'best quality masterpiece 8k high detailed, needle felting animation, wool fiber texture, fluffy fuzzy, soft fabric material, handmade craft, warm atmosphere cute'
  }
]

export type ArtStyleValue = (typeof ART_STYLES)[number]['value']

export function isArtStyleValue(value: unknown): value is ArtStyleValue {
  return typeof value === 'string' && ART_STYLES.some((style) => style.value === value)
}

/**
 * 🔥 实时从 ART_STYLES 常量获取风格 prompt
 * 这是获取风格 prompt 的唯一正确方式，确保始终使用最新的常量定义
 * 
 * @param artStyle - 风格标识符，如 'realistic', 'american-comic' 等
 * @returns 对应的风格 prompt，如果找不到则返回空字符串
 */
export function getArtStylePrompt(
  artStyle: string | null | undefined,
  locale: 'zh' | 'en',
): string {
  if (!artStyle) return ''
  const style = ART_STYLES.find(s => s.value === artStyle)
  if (!style) return ''
  return locale === 'en' ? style.promptEn : style.promptZh
}

// 角色形象生成的系统后缀（始终添加到提示词末尾，不显示给用户）
// 升级版：专业角色设定图，十字分割布局
// 左侧1/4：正面特写+表情表 | 右侧3/4：旋转视图+动作姿态
export const CHARACTER_PROMPT_SUFFIX = '角色设定图，画面分为左右两大区域：【左侧区域】占约1/4宽度，上半部分（约3/4高度）为角色正面特写（完整正脸，展示五官细节、眼型、唇型、辨识标记）；下半部分（约1/4高度）为表情表（Expression Sheet），展示4种情绪面部特写：喜、怒、哀、惊，告诉AI五官在不同情绪下如何变形；【右侧区域】占约3/4宽度，上半部分（约2/3高度）为高质量角色多视图旋转图（Turnaround），从左到右依次为：正面全身（front view）、3/4侧面全身（3/4 side view）、侧面全身（side view）、背面全身（back view），四个视角人物大小一致、高度一致、服饰细节一致；下半部分（约1/3高度）为动作姿态参考（2-3个动作姿势横向均匀排列，人物之间保持充足间距避免覆盖重叠，与上方旋转视图4个视角的间距保持一致，展示服装在坐姿、跑动时的褶皱变化）。pure solid white background, isolated character on white background, absolutely no background scenery, character sheet, multiple views, turnaround, expression sheet, uniform character size across all views, no text, no words, no watermarks。'

// 道具图片生成的系统后缀（固定白底三视图资产图）
export const PROP_PROMPT_SUFFIX = '道具设定图，画面分为左右两个区域：【左侧区域】占约1/3宽度，是道具主体的主视图特写；【右侧区域】占约2/3宽度，是同一道具的三视图横向排列（从左到右依次为：正面、侧面、背面），三视图高度一致。纯白色背景，主体居中完整展示，无人物、无手部、无桌面陈设、无环境背景、无其他元素。'

// 场景图片生成的系统后缀（已禁用四视图，直接生成单张场景图）
export const LOCATION_PROMPT_SUFFIX = ''

// 角色资产图生成比例
export const CHARACTER_ASSET_IMAGE_RATIO = '3:2'
export const CHARACTER_IMAGE_RATIO = CHARACTER_ASSET_IMAGE_RATIO
// 角色图片尺寸（用于Seedream API）
export const CHARACTER_IMAGE_SIZE = '3840x2160'  // 16:9 横版 4K
// 角色图片尺寸（用于Banana API）
export const CHARACTER_IMAGE_BANANA_RATIO = CHARACTER_ASSET_IMAGE_RATIO

// 道具图片生成比例（与角色资产图保持一致）
export const PROP_IMAGE_RATIO = CHARACTER_ASSET_IMAGE_RATIO

// 场景图片生成比例
export const LOCATION_IMAGE_RATIO = '1:1'
// 场景图片尺寸（用于Seedream API）
export const LOCATION_IMAGE_SIZE = '4096x4096'
// 场景图片尺寸（用于Banana API）
export const LOCATION_IMAGE_BANANA_RATIO = LOCATION_IMAGE_RATIO

// 从提示词中移除角色系统后缀（用于显示给用户）
export function removeCharacterPromptSuffix(prompt: string): string {
  if (!prompt) return ''
  return prompt.replace(CHARACTER_PROMPT_SUFFIX, '').trim()
}

// 添加角色系统后缀到提示词（用于生成图片）
export function addCharacterPromptSuffix(prompt: string): string {
  if (!prompt) return CHARACTER_PROMPT_SUFFIX
  const cleanPrompt = removeCharacterPromptSuffix(prompt)
  return `${cleanPrompt}${cleanPrompt ? '，' : ''}${CHARACTER_PROMPT_SUFFIX}`
}

export function removePropPromptSuffix(prompt: string): string {
  if (!prompt) return ''
  return prompt.replace(PROP_PROMPT_SUFFIX, '').replace(/，$/, '').trim()
}

export function addPropPromptSuffix(prompt: string): string {
  if (!prompt) return PROP_PROMPT_SUFFIX
  const cleanPrompt = removePropPromptSuffix(prompt)
  return `${cleanPrompt}${cleanPrompt ? '，' : ''}${PROP_PROMPT_SUFFIX}`
}

// 从提示词中移除场景系统后缀（用于显示给用户）
export function removeLocationPromptSuffix(prompt: string): string {
  if (!prompt) return ''
  return prompt.replace(LOCATION_PROMPT_SUFFIX, '').replace(/，$/, '').trim()
}

// 添加场景系统后缀到提示词（用于生成图片）
export function addLocationPromptSuffix(prompt: string): string {
  // 后缀为空时直接返回原提示词
  if (!LOCATION_PROMPT_SUFFIX) return prompt || ''
  if (!prompt) return LOCATION_PROMPT_SUFFIX
  const cleanPrompt = removeLocationPromptSuffix(prompt)
  return `${cleanPrompt}${cleanPrompt ? '，' : ''}${LOCATION_PROMPT_SUFFIX}`
}

/**
 * 构建角色介绍字符串（用于发送给 AI，帮助理解"我"和称呼对应的角色）
 * @param characters - 角色列表，需要包含 name 和 introduction 字段
 * @returns 格式化的角色介绍字符串
 */
export function buildCharactersIntroduction(characters: Array<{ name: string; introduction?: string | null }>): string {
  if (!characters || characters.length === 0) return '暂无角色介绍'

  const introductions = characters
    .filter(c => c.introduction && c.introduction.trim())
    .map(c => `- ${c.name}：${c.introduction}`)

  if (introductions.length === 0) return '暂无角色介绍'

  return introductions.join('\n')
}
