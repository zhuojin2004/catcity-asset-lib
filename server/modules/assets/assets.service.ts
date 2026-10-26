import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, inArray, or, like, desc, count, sql } from 'drizzle-orm';

import { assets } from '../../database/schema';
import type {
  Asset,
  AssetCategory,
  AssetListParams,
  CreateAssetDto,
  FilterOptions,
  GradeRating,
  PreviewStatus,
  ReviewAssetDto,
  ReviewStatus,
} from '@shared/api.interface';

@Injectable()
export class AssetsService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getList(params: AssetListParams): Promise<{ items: Asset[]; total: number; page: number; pageSize: number }> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = this.buildConditions(params);

    const query = conditions.length > 0
      ? this.db.select().from(assets).where(and(...conditions))
      : this.db.select().from(assets);

    const countQuery = conditions.length > 0
      ? this.db.select({ count: count() }).from(assets).where(and(...conditions))
      : this.db.select({ count: count() }).from(assets);

    const [itemsResult, countResult] = await Promise.all([
      query.orderBy(desc(assets.createdAt)).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return {
      items: itemsResult.map(row => this.mapRow(row)),
      total: Number(countResult[0]?.count ?? 0),
      page,
      pageSize,
    };
  }

  async getStats(category?: string): Promise<{ totalCount: number; fileCount: number; chapterCount: number; lastSyncTime: string }> {
    const conditions = [eq(assets.reviewStatus, '已通过')];
    if (category && category !== '全部') {
      conditions.push(eq(assets.category, category));
    }

    const where = and(...conditions);

    const result = await this.db.select({
      totalCount: count(),
      imageCountSum: sql<number>`coalesce(sum(${assets.imageCount}), 0)`,
      chapterCount: sql<number>`count(distinct ${assets.sourceChapter})`,
      lastSyncTime: sql<string>`max(${assets.createdAt})`,
    }).from(assets).where(where);

    const row = result[0];
    const audioCountResult = await this.db
      .select({ count: count() })
      .from(assets)
      .where(and(
        ...conditions,
        eq(assets.category, '音色'),
        sql`${assets.audioUrl} IS NOT NULL`,
      ));

    const total = Number(row?.totalCount ?? 0);
    const imgCount = Number(row?.imageCountSum ?? 0);
    const audioCount = Number(audioCountResult[0]?.count ?? 0);

    return {
      totalCount: total,
      fileCount: imgCount + audioCount,
      chapterCount: Number(row?.chapterCount ?? 0),
      lastSyncTime: row?.lastSyncTime ? new Date(row.lastSyncTime).toISOString() : new Date().toISOString(),
    };
  }

  async getFilterOptions(): Promise<FilterOptions> {
    const rows = await this.db.select({
      category: assets.category,
      artStyle: assets.artStyle,
      assetType: assets.assetType,
      dramaArchetype: assets.dramaArchetype,
      gradeRating: assets.gradeRating,
      sourceChapter: assets.sourceChapter,
      previewStatus: assets.previewStatus,
    }).from(assets).where(eq(assets.reviewStatus, '已通过'));

    const uniq = <T>(arr: T[]): T[] => Array.from(new Set(arr.filter(Boolean)));

    return {
      categories: uniq(rows.map(r => r.category)),
      artStyles: uniq(rows.map(r => r.artStyle)),
      assetTypes: uniq(rows.map(r => r.assetType)),
      dramaArchetypes: uniq(rows.map(r => r.dramaArchetype)),
      gradeRatings: uniq(rows.map(r => r.gradeRating)),
      sourceChapters: uniq(rows.map(r => r.sourceChapter)),
      previewStatuses: uniq(rows.map(r => r.previewStatus)),
    };
  }

  async getDetail(id: string): Promise<Asset> {
    const rows = await this.db.select().from(assets).where(eq(assets.id, id)).limit(1);
    if (rows.length === 0) throw new NotFoundException('资产不存在');
    return this.mapRow(rows[0]);
  }

  async create(dto: CreateAssetDto, userId: string): Promise<Asset> {
    const now = new Date();
    const imageCount = dto.imageUrls?.length ?? 0;

    const rows = await this.db.insert(assets).values({
      name: dto.name,
      category: dto.category,
      assetSection: dto.assetSection,
      artStyle: dto.artStyle,
      assetType: dto.assetType,
      sourceChapter: dto.sourceChapter,
      sourceProject: dto.sourceProject,
      gradeRating: dto.gradeRating,
      appearanceGrade: dto.appearanceGrade,
      reuseRating: dto.reuseRating,
      suitableUse: dto.suitableUse,
      confidence: dto.confidence,
      previewStatus: dto.previewStatus ?? (imageCount > 0 ? '已生成' : '缺图'),
      categoryPath: dto.categoryPath,
      imageCount,
      assetDescription: dto.assetDescription,
      promptText: dto.promptText,
      imageUrls: dto.imageUrls ?? [],
      reviewStatus: '待审核',
      feishuRecordId: dto.feishuRecordId,
      ageGender: dto.ageGender,
      dramaArchetype: dto.dramaArchetype,
      personalityMotif: dto.personalityMotif,
      spaceLayout: dto.spaceLayout,
      lightTime: dto.lightTime,
      colorTone: dto.colorTone,
      fixedLandmark: dto.fixedLandmark,
      material: dto.material,
      functionBoundary: dto.functionBoundary,
      voiceGender: dto.voiceGender,
      voiceTrait: dto.voiceTrait,
      sampleDuration: dto.sampleDuration,
      audioUrl: dto.audioUrl,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return this.mapRow(rows[0]);
  }

  async review(id: string, dto: ReviewAssetDto, reviewerId: string): Promise<Asset> {
    if (dto.status === '已驳回' && !dto.reason) {
      throw new BadRequestException('驳回时必须填写原因');
    }

    const patch: Partial<typeof assets.$inferInsert> = {
      reviewStatus: dto.status,
      reviewReason: dto.reason,
      updatedAt: new Date(),
      updatedBy: reviewerId,
    };

    if (dto.status === '已通过') {
      patch.previewStatus = '已生成';
    }

    const rows = await this.db.update(assets).set(patch).where(eq(assets.id, id)).returning();
    if (rows.length === 0) throw new NotFoundException('资产不存在');
    return this.mapRow(rows[0]);
  }

  async getMySubmissions(userId: string, status?: ReviewStatus): Promise<Asset[]> {
    const conditions = [sql`(${assets.createdBy}).user_id = ${userId}`];
    if (status) {
      conditions.push(eq(assets.reviewStatus, status));
    }

    const rows = await this.db
      .select()
      .from(assets)
      .where(and(...conditions))
      .orderBy(desc(assets.createdAt));

    return rows.map(row => this.mapRow(row));
  }

  async batchSubmit(userId: string, category: AssetCategory, sourceProject: string, tableLink: string): Promise<{ count: number }> {
    const now = new Date();
    const batchId = `batch-${Date.now()}`;
    const sampleNames = [
      `批量导入-${sourceProject}-${category}-1`,
      `批量导入-${sourceProject}-${category}-2`,
      `批量导入-${sourceProject}-${category}-3`,
    ];

    let count = 0;
    for (const name of sampleNames) {
      const existing = await this.db.select({ id: assets.id }).from(assets)
        .where(and(eq(assets.name, name), eq(assets.category, category)))
        .limit(1);
      if (existing.length > 0) continue;

      await this.db.insert(assets).values({
        name,
        category,
        sourceProject,
        reviewStatus: '待审核',
        previewStatus: '缺图',
        imageCount: 0,
        imageUrls: [],
        feishuRecordId: batchId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    return { count };
  }

  private buildConditions(params: AssetListParams) {
    const conditions = [];

    conditions.push(eq(assets.reviewStatus, '已通过'));

    if (params.category && params.category !== '全部') {
      conditions.push(eq(assets.category, params.category));
    }
    if (params.search) {
      conditions.push(like(assets.name, `%${params.search}%`));
    }
    if (params.artStyle && params.artStyle.length > 0) {
      conditions.push(inArray(assets.artStyle, params.artStyle));
    }
    if (params.assetType && params.assetType.length > 0) {
      conditions.push(inArray(assets.assetType, params.assetType));
    }
    if (params.dramaArchetype && params.dramaArchetype.length > 0) {
      conditions.push(inArray(assets.dramaArchetype, params.dramaArchetype));
    }
    if (params.gradeRating && params.gradeRating.length > 0) {
      conditions.push(inArray(assets.gradeRating, params.gradeRating));
    }
    if (params.sourceChapter && params.sourceChapter.length > 0) {
      conditions.push(inArray(assets.sourceChapter, params.sourceChapter));
    }
    if (params.previewStatus && params.previewStatus.length > 0) {
      conditions.push(inArray(assets.previewStatus, params.previewStatus));
    }
    if (params.reviewStatus) {
      conditions.pop();
      conditions.push(eq(assets.reviewStatus, params.reviewStatus));
    }

    return conditions;
  }

  private mapRow(row: typeof assets.$inferSelect): Asset {
    return {
      id: row.id,
      name: row.name,
      category: row.category as Asset['category'],
      assetSection: row.assetSection ?? undefined,
      artStyle: row.artStyle ?? undefined,
      assetType: row.assetType ?? undefined,
      sourceChapter: row.sourceChapter ?? undefined,
      sourceProject: row.sourceProject ?? undefined,
      gradeRating: (row.gradeRating as GradeRating) ?? undefined,
      appearanceGrade: (row.appearanceGrade as GradeRating) ?? undefined,
      reuseRating: (row.reuseRating as Asset['reuseRating']) ?? undefined,
      suitableUse: row.suitableUse ?? undefined,
      confidence: (row.confidence as Asset['confidence']) ?? undefined,
      previewStatus: (row.previewStatus as PreviewStatus) ?? '缺图',
      categoryPath: row.categoryPath ?? undefined,
      imageCount: row.imageCount ?? 0,
      assetDescription: row.assetDescription ?? undefined,
      promptText: row.promptText ?? undefined,
      imageUrls: row.imageUrls ?? [],
      reviewStatus: row.reviewStatus as ReviewStatus,
      reviewReason: row.reviewReason ?? undefined,
      feishuRecordId: row.feishuRecordId ?? undefined,
      ageGender: row.ageGender ?? undefined,
      dramaArchetype: row.dramaArchetype ?? undefined,
      personalityMotif: row.personalityMotif ?? undefined,
      spaceLayout: row.spaceLayout ?? undefined,
      lightTime: row.lightTime ?? undefined,
      colorTone: row.colorTone ?? undefined,
      fixedLandmark: row.fixedLandmark ?? undefined,
      material: row.material ?? undefined,
      functionBoundary: row.functionBoundary ?? undefined,
      voiceGender: row.voiceGender ?? undefined,
      voiceTrait: row.voiceTrait ?? undefined,
      sampleDuration: row.sampleDuration ?? undefined,
      audioUrl: row.audioUrl ?? undefined,
      createdAt: row.createdAt.toISOString(),
      createdBy: row.createdBy ?? undefined,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
