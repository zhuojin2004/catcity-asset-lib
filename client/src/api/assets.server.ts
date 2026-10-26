import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

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

export async function getAssetList(params: AssetListParams): Promise<AssetListResponse> {
  try {
    const response = await axiosForBackend.get('/api/assets', { params });
    return response.data;
  } catch (error) {
    logger.error('获取资产列表失败', error);
    throw error;
  }
}

export async function getAssetStats(category?: string): Promise<AssetStats> {
  try {
    const response = await axiosForBackend.get('/api/assets/stats', { params: { category } });
    return response.data;
  } catch (error) {
    logger.error('获取资产统计失败', error);
    throw error;
  }
}

export async function getFilterOptions(): Promise<FilterOptions> {
  try {
    const response = await axiosForBackend.get('/api/assets/filter-options');
    return response.data;
  } catch (error) {
    logger.error('获取筛选选项失败', error);
    throw error;
  }
}

export async function getAssetDetail(id: string): Promise<Asset> {
  try {
    const response = await axiosForBackend.get(`/api/assets/${id}`);
    return response.data;
  } catch (error) {
    logger.error('获取资产详情失败', error);
    throw error;
  }
}

export async function createAsset(dto: CreateAssetDto): Promise<Asset> {
  try {
    const response = await axiosForBackend.post('/api/assets', dto);
    return response.data;
  } catch (error) {
    logger.error('创建资产失败', error);
    throw error;
  }
}

export async function reviewAsset(id: string, dto: ReviewAssetDto): Promise<Asset> {
  try {
    const response = await axiosForBackend.patch(`/api/assets/${id}/review`, dto);
    return response.data;
  } catch (error) {
    logger.error('审核资产失败', error);
    throw error;
  }
}

export async function getMySubmissions(status?: string): Promise<Asset[]> {
  try {
    const response = await axiosForBackend.get('/api/assets/my/submissions', { params: { status } });
    return response.data;
  } catch (error) {
    logger.error('获取我的提交失败', error);
    throw error;
  }
}

export async function batchSubmit(dto: BatchSubmitDto): Promise<{ count: number }> {
  try {
    const response = await axiosForBackend.post('/api/assets/batch-submit', dto);
    return response.data;
  } catch (error) {
    logger.error('批量提交失败', error);
    throw error;
  }
}
