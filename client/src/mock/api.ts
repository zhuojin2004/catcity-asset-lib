import type {
  Asset,
  AssetListParams,
  AssetListResponse,
  AssetStats,
  CreateAssetDto,
  FilterOptions,
  ReviewAssetDto,
  BatchSubmitDto,
} from '@shared/api.interface';

import { MOCK_ASSETS } from './data';

// 用一个可变副本，支持演示里的新增/审核操作
let store: Asset[] = [...MOCK_ASSETS];

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

const uniq = (arr: (string | undefined | null)[]): string[] =>
  [...new Set(arr.filter((x): x is string => !!x))].sort();

export async function getAssetList(params: AssetListParams): Promise<AssetListResponse> {
  await delay();
  let items = [...store];

  if (params.category && params.category !== '全部') {
    items = items.filter((a) => a.category === params.category);
  }
  if (params.search) {
    const q = params.search.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.assetDescription ?? '').toLowerCase().includes(q) ||
          (a.assetType ?? '').toLowerCase().includes(q),
      );
    }
  }
  if (params.artStyle?.length) items = items.filter((a) => params.artStyle!.includes(a.artStyle ?? ''));
  if (params.assetType?.length) items = items.filter((a) => params.assetType!.includes(a.assetType ?? ''));
  if (params.dramaArchetype?.length)
    items = items.filter((a) => params.dramaArchetype!.includes(a.dramaArchetype ?? ''));
  if (params.gradeRating?.length)
    items = items.filter((a) => params.gradeRating!.includes(a.gradeRating ?? ''));
  if (params.sourceChapter?.length)
    items = items.filter((a) => params.sourceChapter!.includes(a.sourceChapter ?? ''));
  if (params.previewStatus?.length)
    items = items.filter((a) => params.previewStatus!.includes(a.previewStatus));

  const total = items.length;
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 12;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return { items: paged, total, page, pageSize };
}

export async function getAssetStats(category?: string): Promise<AssetStats> {
  await delay();
  let items = store;
  if (category && category !== '全部') {
    items = items.filter((a) => a.category === category);
  }
  const fileCount = items.reduce((sum, a) => sum + (a.imageCount || 0), 0);
  const chapterCount = uniq(items.map((a) => a.sourceChapter)).length;
  return {
    totalCount: items.length,
    fileCount,
    chapterCount,
    lastSyncTime: new Date().toISOString(),
  };
}

export async function getFilterOptions(): Promise<FilterOptions> {
  await delay();
  return {
    categories: ['角色', '场景', '道具', '音色'],
    artStyles: uniq(store.map((a) => a.artStyle)),
    assetTypes: uniq(store.map((a) => a.assetType)),
    dramaArchetypes: uniq(store.map((a) => a.dramaArchetype)),
    gradeRatings: ['S', 'A', 'B', 'C', 'T'],
    sourceChapters: uniq(store.map((a) => a.sourceChapter)),
    previewStatuses: ['已生成', '缺图'],
  };
}

export async function getAssetDetail(id: string): Promise<Asset> {
  await delay();
  const found = store.find((a) => a.id === id);
  if (!found) throw new Error('资产不存在');
  return found;
}

export async function createAsset(dto: CreateAssetDto): Promise<Asset> {
  await delay();
  const now = new Date().toISOString();
  const asset: Asset = {
    id: `mock-${Date.now()}`,
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
    previewStatus: dto.imageUrls && dto.imageUrls.length > 0 ? '已生成' : '缺图',
    categoryPath: dto.categoryPath,
    imageCount: dto.imageUrls?.length ?? 0,
    assetDescription: dto.assetDescription,
    promptText: dto.promptText,
    imageUrls: dto.imageUrls ?? [],
    reviewStatus: '待审核',
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
    createdAt: now,
    updatedAt: now,
  };
  store = [asset, ...store];
  return asset;
}

export async function reviewAsset(id: string, dto: ReviewAssetDto): Promise<Asset> {
  await delay();
  const idx = store.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('资产不存在');
  store[idx] = {
    ...store[idx],
    reviewStatus: dto.status,
    reviewReason: dto.reason,
    updatedAt: new Date().toISOString(),
  };
  return store[idx];
}

export async function getMySubmissions(status?: string): Promise<Asset[]> {
  await delay();
  let items = store.filter((a) => a.reviewStatus === '待审核');
  if (status) items = items.filter((a) => a.reviewStatus === status);
  return items;
}

export async function batchSubmit(dto: BatchSubmitDto): Promise<{ count: number }> {
  await delay();
  // 静态演示：批量提交只做一个成功回执，不真正拉取外部表格
  return { count: 0 };
}
