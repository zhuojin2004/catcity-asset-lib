import { Controller, Get, Post, Patch, Param, Query, Body, Req } from '@nestjs/common';
import type { Request } from 'express';

import { AssetsService } from './assets.service';
import type {
  Asset,
  AssetCategory,
  AssetListParams,
  AssetListResponse,
  AssetStats,
  CreateAssetDto,
  FilterOptions,
  GradeRating,
  PreviewStatus,
  ReviewAssetDto,
  ReviewStatus,
} from '@shared/api.interface';

@Controller('api/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  async getList(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('artStyle') artStyle?: string | string[],
    @Query('assetType') assetType?: string | string[],
    @Query('dramaArchetype') dramaArchetype?: string | string[],
    @Query('gradeRating') gradeRating?: string | string[],
    @Query('sourceChapter') sourceChapter?: string | string[],
    @Query('previewStatus') previewStatus?: string | string[],
    @Query('reviewStatus') reviewStatus?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<AssetListResponse> {
    const toArr = (v?: string | string[]): string[] | undefined => {
      if (!v) return undefined;
      return Array.isArray(v) ? v : [v];
    };

    const params: AssetListParams = {
      category: category as AssetCategory | '全部' | undefined,
      search,
      artStyle: toArr(artStyle),
      assetType: toArr(assetType),
      dramaArchetype: toArr(dramaArchetype),
      gradeRating: toArr(gradeRating) as GradeRating[] | undefined,
      sourceChapter: toArr(sourceChapter),
      previewStatus: toArr(previewStatus) as PreviewStatus[] | undefined,
      reviewStatus: reviewStatus as ReviewStatus | undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    };

    return this.assetsService.getList(params);
  }

  @Get('stats')
  async getStats(@Query('category') category?: string): Promise<AssetStats> {
    return this.assetsService.getStats(category);
  }

  @Get('filter-options')
  async getFilterOptions(): Promise<FilterOptions> {
    return this.assetsService.getFilterOptions();
  }

  @Get('my/submissions')
  async getMySubmissions(
    @Req() req: Request,
    @Query('status') status?: string,
  ): Promise<Asset[]> {
    const { userId } = req.userContext;
    return this.assetsService.getMySubmissions(userId, status as ReviewStatus | undefined);
  }

  @Get(':id')
  async getDetail(@Param('id') id: string): Promise<Asset> {
    return this.assetsService.getDetail(id);
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateAssetDto): Promise<Asset> {
    const { userId } = req.userContext;
    return this.assetsService.create(dto, userId);
  }

  @Patch(':id/review')
  async review(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ReviewAssetDto,
  ): Promise<Asset> {
    const { userId } = req.userContext;
    return this.assetsService.review(id, dto, userId);
  }

  @Post('batch-submit')
  async batchSubmit(
    @Req() req: Request,
    @Body() dto: { tableLink: string; category: AssetCategory; sourceProject: string },
  ): Promise<{ count: number }> {
    const { userId } = req.userContext;
    return this.assetsService.batchSubmit(userId, dto.category, dto.sourceProject, dto.tableLink);
  }
}
