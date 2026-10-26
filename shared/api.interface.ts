export type AssetCategory = '角色' | '场景' | '道具' | '音色';

export type ReviewStatus = '待审核' | '已通过' | '已驳回';

export type GradeRating = 'S' | 'A' | 'B' | 'C' | 'T';

export type PreviewStatus = '已生成' | '缺图';

export type ConfidenceLevel = '高' | '中' | '低';

export type ReuseRating = '极高' | '高' | '中' | '低';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  assetSection?: string;
  artStyle?: string;
  assetType?: string;
  sourceChapter?: string;
  sourceProject?: string;
  gradeRating?: GradeRating;
  appearanceGrade?: GradeRating;
  reuseRating?: ReuseRating;
  suitableUse?: string;
  confidence?: ConfidenceLevel;
  previewStatus: PreviewStatus;
  categoryPath?: string;
  imageCount: number;
  assetDescription?: string;
  promptText?: string;
  imageUrls: string[];
  reviewStatus: ReviewStatus;
  reviewReason?: string;
  feishuRecordId?: string;
  ageGender?: string;
  dramaArchetype?: string;
  personalityMotif?: string;
  spaceLayout?: string;
  lightTime?: string;
  colorTone?: string;
  fixedLandmark?: string;
  material?: string;
  functionBoundary?: string;
  voiceGender?: string;
  voiceTrait?: string;
  sampleDuration?: string;
  audioUrl?: string;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
}

export interface AssetListParams {
  category?: AssetCategory | '全部';
  search?: string;
  artStyle?: string[];
  assetType?: string[];
  dramaArchetype?: string[];
  gradeRating?: GradeRating[];
  sourceChapter?: string[];
  previewStatus?: PreviewStatus[];
  reviewStatus?: ReviewStatus;
  page?: number;
  pageSize?: number;
}

export interface AssetListResponse {
  items: Asset[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AssetStats {
  totalCount: number;
  fileCount: number;
  chapterCount: number;
  lastSyncTime: string;
}

export interface CreateAssetDto {
  name: string;
  category: AssetCategory;
  assetSection?: string;
  artStyle?: string;
  assetType?: string;
  sourceChapter?: string;
  sourceProject?: string;
  gradeRating?: GradeRating;
  appearanceGrade?: GradeRating;
  reuseRating?: ReuseRating;
  suitableUse?: string;
  confidence?: ConfidenceLevel;
  previewStatus?: PreviewStatus;
  categoryPath?: string;
  assetDescription?: string;
  promptText?: string;
  imageUrls?: string[];
  feishuRecordId?: string;
  ageGender?: string;
  dramaArchetype?: string;
  personalityMotif?: string;
  spaceLayout?: string;
  lightTime?: string;
  colorTone?: string;
  fixedLandmark?: string;
  material?: string;
  functionBoundary?: string;
  voiceGender?: string;
  voiceTrait?: string;
  sampleDuration?: string;
  audioUrl?: string;
}

export interface ReviewAssetDto {
  status: '已通过' | '已驳回';
  reason?: string;
}

export interface FilterOptions {
  categories: string[];
  artStyles: string[];
  assetTypes: string[];
  dramaArchetypes: string[];
  gradeRatings: string[];
  sourceChapters: string[];
  previewStatuses: string[];
}

export interface BatchSubmitDto {
  tableLink: string;
  category: AssetCategory;
  sourceProject: string;
}
