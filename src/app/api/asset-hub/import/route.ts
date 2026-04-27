import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { ApiError, apiHandler } from '@/lib/api-errors'

interface ImportAsset {
    kind: 'character' | 'location' | 'prop' | 'voice'
    name: string
    folderName?: string
    profileData?: string
    summary?: string
    description?: string
    artStyle?: string
    appearances?: Array<{
        description: string
        artStyle?: string
    }>
    voiceType?: string
    voiceId?: string
    gender?: string
    language?: string
}

interface ImportRequestBody {
    mode: 'detect' | 'execute'
    assets: ImportAsset[]
    resolutions?: Record<number, 'skip' | 'overwrite'>
}

interface ConflictInfo {
    index: number
    name: string
    kind: string
    existingId: string
}

// ─── Conflict Detection ────────────────────────────────────────────

async function detectConflicts(
    assets: ImportAsset[],
    userId: string,
): Promise<Record<number, ConflictInfo>> {
    const conflicts: Record<number, ConflictInfo> = {}

    for (let i = 0; i < assets.length; i++) {
        const asset = assets[i]
        const name = asset.name.trim()
        if (!name) continue

        let existingId: string | null = null

        switch (asset.kind) {
            case 'character': {
                const existing = await prisma.globalCharacter.findFirst({
                    where: { userId, name },
                    select: { id: true },
                })
                if (existing) existingId = existing.id
                break
            }
            case 'location':
            case 'prop': {
                const existing = await prisma.globalLocation.findFirst({
                    where: { userId, name, assetKind: asset.kind },
                    select: { id: true },
                })
                if (existing) existingId = existing.id
                break
            }
            case 'voice': {
                const existing = await prisma.globalVoice.findFirst({
                    where: { userId, name },
                    select: { id: true },
                })
                if (existing) existingId = existing.id
                break
            }
        }

        if (existingId) {
            conflicts[i] = { index: i, name: asset.name, kind: asset.kind, existingId }
        }
    }

    return conflicts
}

// ─── Folder Resolution ─────────────────────────────────────────────

async function resolveFolderId(
    folderName: string | undefined,
    userId: string,
): Promise<string | null> {
    if (!folderName) return null
    const trimmed = folderName.trim()
    if (!trimmed) return null

    // Try to find existing folder
    const existing = await prisma.globalAssetFolder.findFirst({
        where: { userId, name: trimmed },
    })
    if (existing) return existing.id

    // Create new folder
    const created = await prisma.globalAssetFolder.create({
        data: { userId, name: trimmed },
    })
    return created.id
}

// ─── Execute Import ────────────────────────────────────────────────

async function executeImport(
    assets: ImportAsset[],
    resolutions: Record<number, 'skip' | 'overwrite'>,
    conflicts: Record<number, ConflictInfo>,
    userId: string,
): Promise<{ created: number; updated: number; skipped: number }> {
    let created = 0
    let updated = 0
    let skipped = 0

    for (let i = 0; i < assets.length; i++) {
        const asset = assets[i]
        const name = asset.name.trim()
        if (!name) {
            skipped++
            continue
        }

        const resolution = conflicts[i]
            ? (resolutions[i] ?? 'skip')
            : null

        if (resolution === 'skip') {
            skipped++
            continue
        }

        const folderId = await resolveFolderId(asset.folderName, userId)

        if (resolution === 'overwrite' && conflicts[i]) {
            // ── Update existing asset ──
            const existingId = conflicts[i].existingId

            switch (asset.kind) {
                case 'character': {
                    await prisma.globalCharacter.update({
                        where: { id: existingId },
                        data: {
                            folderId,
                            profileData: asset.profileData ?? null,
                        },
                    })
                    break
                }
                case 'location':
                case 'prop': {
                    await prisma.globalLocation.update({
                        where: { id: existingId },
                        data: {
                            folderId,
                            summary: asset.summary ?? null,
                            artStyle: asset.artStyle ?? null,
                        },
                    })
                    break
                }
                case 'voice': {
                    await prisma.globalVoice.update({
                        where: { id: existingId },
                        data: {
                            folderId,
                            description: asset.description ?? null,
                            gender: asset.gender ?? null,
                            language: asset.language ?? 'zh',
                        },
                    })
                    break
                }
            }
            updated++
        } else {
            // ── Create new asset ──
            switch (asset.kind) {
                case 'character': {
                    const character = await prisma.globalCharacter.create({
                        data: {
                            userId,
                            folderId,
                            name,
                            profileData: asset.profileData ?? null,
                        },
                    })
                    // Create default appearance
                    const appearances = asset.appearances && asset.appearances.length > 0
                        ? asset.appearances
                        : [{ description: `${name} 的角色设定` }]

                    for (let ai = 0; ai < appearances.length; ai++) {
                        await prisma.globalCharacterAppearance.create({
                            data: {
                                characterId: character.id,
                                appearanceIndex: ai,
                                changeReason: ai === 0 ? '初始形象' : `形象 ${ai}`,
                                description: appearances[ai].description,
                                descriptions: JSON.stringify([appearances[ai].description]),
                                artStyle: appearances[ai].artStyle ?? null,
                                imageUrls: '[]',
                                previousImageUrls: '[]',
                            },
                        })
                    }
                    break
                }
                case 'location':
                case 'prop': {
                    const location = await prisma.globalLocation.create({
                        data: {
                            userId,
                            folderId,
                            name,
                            assetKind: asset.kind,
                            summary: asset.summary ?? null,
                            artStyle: asset.artStyle ?? null,
                        },
                    })
                    // Create default image slot
                    await prisma.globalLocationImage.create({
                        data: {
                            locationId: location.id,
                            imageIndex: 0,
                            description: asset.summary ?? name,
                            availableSlots: '[]',
                        },
                    })
                    break
                }
                case 'voice': {
                    await prisma.globalVoice.create({
                        data: {
                            userId,
                            folderId,
                            name,
                            description: asset.description ?? null,
                            voiceType: asset.voiceType ?? 'qwen-designed',
                            voiceId: asset.voiceId ?? null,
                            gender: asset.gender ?? null,
                            language: asset.language ?? 'zh',
                        },
                    })
                    break
                }
            }
            created++
        }
    }

    return { created, updated, skipped }
}

// ─── POST Handler ──────────────────────────────────────────────────

export const POST = apiHandler(async (request: NextRequest) => {
    const authResult = await requireUserAuth()
    if (isErrorResponse(authResult)) return authResult
    const { session } = authResult

    const body = await request.json() as ImportRequestBody
    const { mode, assets, resolutions } = body

    if (!Array.isArray(assets) || assets.length === 0) {
        throw new ApiError('INVALID_PARAMS', { details: 'assets array is required' })
    }

    // Validate assets
    for (const asset of assets) {
        if (!asset.name || !asset.name.trim()) {
            throw new ApiError('INVALID_PARAMS', { details: 'Each asset must have a name' })
        }
        if (!['character', 'location', 'prop', 'voice'].includes(asset.kind)) {
            throw new ApiError('INVALID_PARAMS', {
                details: `Invalid kind "${asset.kind}". Must be one of: character, location, prop, voice`,
            })
        }
    }

    if (mode === 'detect') {
        const conflicts = await detectConflicts(assets, session.user.id)
        return NextResponse.json({
            mode: 'detect',
            total: assets.length,
            conflictCount: Object.keys(conflicts).length,
            conflicts,
        })
    }

    if (mode === 'execute') {
        const conflicts = await detectConflicts(assets, session.user.id)
        const result = await executeImport(assets, resolutions ?? {}, conflicts, session.user.id)
        return NextResponse.json({
            mode: 'execute',
            total: assets.length,
            ...result,
        })
    }

    throw new ApiError('INVALID_PARAMS', { details: 'mode must be "detect" or "execute"' })
})
