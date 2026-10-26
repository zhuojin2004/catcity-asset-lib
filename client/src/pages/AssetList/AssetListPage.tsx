import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Upload, ChevronDown, Check, Image as ImageIcon } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';

import { Image } from '@client/src/components/ui/image';
import {
  getAssetList,
  getAssetStats,
  getFilterOptions,
} from '@client/src/api/assets';
import type {
  Asset,
  AssetCategory,
  AssetStats,
  FilterOptions,
  GradeRating,
  PreviewStatus,
} from '@shared/api.interface';

const CATEGORIES: Array<'全部' | AssetCategory> = ['全部', '角色', '场景', '道具', '音色'];

interface FilterState {
  categories: string[];
  artStyles: string[];
  assetTypes: string[];
  dramaArchetypes: string[];
  gradeRatings: string[];
  sourceChapters: string[];
  previewStatuses: string[];
}

const EMPTY_FILTERS: FilterState = {
  categories: [],
  artStyles: [],
  assetTypes: [],
  dramaArchetypes: [],
  gradeRatings: [],
  sourceChapters: [],
  previewStatuses: [],
};

const AssetListPage = () => {
  const [activeCategory, setActiveCategory] = useState<'全部' | AssetCategory>('全部');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [items, setItems] = useState<Asset[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState<Record<string, string>>({});

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const filterContainerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭筛选下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        filterContainerRef.current &&
        !filterContainerRef.current.contains(e.target as Node)
      ) {
        setOpenFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // 获取筛选选项
  useEffect(() => {
    let mounted = true;
    const fetchOptions = async () => {
      try {
        const data = await getFilterOptions();
        if (mounted) setFilterOptions(data);
      } catch (error) {
        logger.error('获取筛选选项失败', error);
      }
    };
    fetchOptions();
    return () => {
      mounted = false;
    };
  }, []);

  // 获取统计数据
  useEffect(() => {
    let mounted = true;
    setLoadingStats(true);
    const fetchStats = async () => {
      try {
        const data = await getAssetStats(
          activeCategory === '全部' ? undefined : activeCategory,
        );
        if (mounted) setStats(data);
      } catch (error) {
        logger.error('获取统计数据失败', error);
      } finally {
        if (mounted) setLoadingStats(false);
      }
    };
    fetchStats();
    return () => {
      mounted = false;
    };
  }, [activeCategory]);

  // 获取列表数据
  useEffect(() => {
    let mounted = true;
    setLoadingList(true);
    const fetchList = async () => {
      try {
        const data = await getAssetList({
          category: activeCategory,
          search: debouncedSearch || undefined,
          artStyle: filters.artStyles.length > 0 ? filters.artStyles : undefined,
          assetType: filters.assetTypes.length > 0 ? filters.assetTypes : undefined,
          dramaArchetype:
            filters.dramaArchetypes.length > 0 ? filters.dramaArchetypes : undefined,
          gradeRating:
            filters.gradeRatings.length > 0
              ? (filters.gradeRatings as GradeRating[])
              : undefined,
          sourceChapter:
            filters.sourceChapters.length > 0 ? filters.sourceChapters : undefined,
          previewStatus:
            filters.previewStatuses.length > 0
              ? (filters.previewStatuses as PreviewStatus[])
              : undefined,
          page,
          pageSize,
        });
        if (mounted) {
          setItems(data.items);
          setTotal(data.total);
        }
      } catch (error) {
        logger.error('获取资产列表失败', error);
      } finally {
        if (mounted) setLoadingList(false);
      }
    };
    fetchList();
    return () => {
      mounted = false;
    };
  }, [activeCategory, debouncedSearch, filters, page, pageSize]);

  const handleCategoryChange = useCallback((cat: '全部' | AssetCategory) => {
    setActiveCategory(cat);
    setPage(1);
  }, []);

  const toggleFilterItem = useCallback(
    (filterKey: keyof FilterState, value: string) => {
      setFilters((prev) => {
        const current = prev[filterKey];
        const next = current.includes(value)
          ? current.filter((v: string) => v !== value)
          : [...current, value];
        return { ...prev, [filterKey]: next };
      });
      setPage(1);
    },
    [],
  );

  const filterDefs = useMemo(
    () => [
      { key: 'categories' as const, label: '资产品类', optionsKey: 'categories' as const },
      { key: 'artStyles' as const, label: '美术风格', optionsKey: 'artStyles' as const },
      { key: 'assetTypes' as const, label: '资产类型', optionsKey: 'assetTypes' as const },
      {
        key: 'dramaArchetypes' as const,
        label: '戏剧原型',
        optionsKey: 'dramaArchetypes' as const,
      },
      {
        key: 'gradeRatings' as const,
        label: '等级评定',
        optionsKey: 'gradeRatings' as const,
      },
      {
        key: 'sourceChapters' as const,
        label: '来源篇章',
        optionsKey: 'sourceChapters' as const,
      },
      {
        key: 'previewStatuses' as const,
        label: '预览状态',
        optionsKey: 'previewStatuses' as const,
      },
    ],
    [],
  );

  const getOptions = (optionsKey: keyof FilterOptions): string[] => {
    if (!filterOptions) return [];
    return filterOptions[optionsKey] ?? [];
  };

  const getFilteredOptions = (filterKey: string, optionsKey: keyof FilterOptions): string[] => {
    const all = getOptions(optionsKey);
    const q = filterSearch[filterKey]?.toLowerCase() ?? '';
    if (!q) return all;
    return all.filter((opt) => opt.toLowerCase().includes(q));
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* 顶部栏 */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">猫城纪行·全品类资产库</h1>
        <div className="relative w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索资产名..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Upload className="w-4 h-4" />
          上传资产
        </Link>
      </div>

      {/* 品类 Tab */}
      <div className="flex items-center gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 数字看板 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="资产总数"
          value={stats?.totalCount ?? 0}
          loading={loadingStats}
          suffix="条"
        />
        <StatCard
          label="文件总数"
          value={stats?.fileCount ?? 0}
          loading={loadingStats}
          suffix="个"
          hint="图片 + 音频"
        />
        <StatCard
          label="来源篇章数"
          value={stats?.chapterCount ?? 0}
          loading={loadingStats}
          suffix="篇"
        />
        <StatCard
          label="最近同步时间"
          value={stats?.lastSyncTime ?? ''}
          loading={loadingStats}
          isText
        />
      </div>

      {/* 七维筛选区 */}
      <div className="bg-card border border-border rounded-xl p-4" ref={filterContainerRef}>
        <div className="flex items-center gap-3 flex-wrap">
          {filterDefs.map((def) => {
            const selectedCount = filters[def.key].length;
            const isOpen = openFilter === def.key;
            return (
              <div key={def.key} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilter(isOpen ? null : def.key)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    isOpen
                      ? 'border-primary text-foreground bg-input'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground bg-transparent'
                  }`}
                >
                  <span>
                    {def.label}
                    {selectedCount > 0 ? ` (${selectedCount})` : ''}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-56 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="p-2 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="搜索..."
                          value={filterSearch[def.key] ?? ''}
                          onChange={(e) =>
                            setFilterSearch((prev) => ({
                              ...prev,
                              [def.key]: e.target.value,
                            }))
                          }
                          className="w-full pl-7 pr-2 py-1.5 rounded-md bg-input border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {getFilteredOptions(def.key, def.optionsKey).length === 0 ? (
                        <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                          暂无选项
                        </div>
                      ) : (
                        getFilteredOptions(def.key, def.optionsKey).map((opt) => {
                          const checked = filters[def.key].includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => toggleFilterItem(def.key, opt)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors text-left"
                            >
                              <span
                                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                  checked
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-border bg-transparent'
                                }`}
                              >
                                {checked && <Check className="w-3 h-3" />}
                              </span>
                              <span className="truncate">{opt}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 卡片网格 */}
      {loadingList ? (
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-5 w-1/2 bg-muted rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-xl">
          <ImageIcon className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">暂无匹配的资产</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            试试调整筛选条件或搜索关键词
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-4">
            {items.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <span className="text-sm text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  hint?: string;
  loading: boolean;
  isText?: boolean;
}

const StatCard = ({ label, value, suffix, hint, loading, isText }: StatCardProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-sm text-muted-foreground mb-2">{label}</div>
      {loading ? (
        <div className="h-8 w-24 bg-muted rounded animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-1">
          <span
            className={`${
              isText ? 'text-xl font-medium' : 'text-3xl font-light'
            } text-foreground`}
          >
            {value}
          </span>
          {suffix && !isText && (
            <span className="text-sm text-muted-foreground">{suffix}</span>
          )}
        </div>
      )}
      {hint && <div className="text-xs text-muted-foreground/70 mt-1">{hint}</div>}
    </div>
  );
};

interface AssetCardProps {
  asset: Asset;
}

const AssetCard = ({ asset }: AssetCardProps) => {
  const coverUrl = asset.imageUrls?.[0];
  const hasAudio = !!asset.audioUrl;
  const isSGrade = asset.gradeRating === 'S';

  const tags: string[] = [];
  if (asset.artStyle) tags.push(asset.artStyle);
  if (asset.assetType) tags.push(asset.assetType);
  if (asset.dramaArchetype) tags.push(asset.dramaArchetype);
  const displayTags = tags.slice(0, 2);

  return (
    <Link
      to={`/asset-detail/${asset.id}`}
      className="group block bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors"
    >
      {/* 图片区 */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {asset.previewStatus === '缺图' || !coverUrl ? (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            缺图
          </div>
        ) : (
          <Image
            src={coverUrl}
            alt={asset.name}
            className="w-full h-full object-cover"
            width={400}
            height={400}
          />
        )}
        {/* 右上角角标 */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {hasAudio && (
            <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-xs backdrop-blur-sm">
              含音频
            </span>
          )}
          {asset.imageCount > 0 && !hasAudio && (
            <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-xs backdrop-blur-sm">
              {asset.imageCount}张
            </span>
          )}
          {asset.imageCount > 0 && hasAudio && (
            <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-xs backdrop-blur-sm">
              {asset.imageCount}张
            </span>
          )}
        </div>
      </div>

      {/* 信息区 */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          {isSGrade && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex-shrink-0">
              ★ S
            </span>
          )}
          <span className="text-sm font-medium text-foreground truncate">
            {asset.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {displayTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full border border-border bg-background/50 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default AssetListPage;
