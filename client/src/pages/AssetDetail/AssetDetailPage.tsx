import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Star, ArrowLeft } from 'lucide-react';

import { Image } from '@client/src/components/ui/image';
import { getAssetDetail } from '@client/src/api/assets';
import type { Asset, GradeRating, AssetCategory } from '@shared/api.interface';

const categoryColors: Record<AssetCategory, string> = {
  角色: '#8b5cf6',
  场景: '#06b6d4',
  道具: '#f97316',
  音色: '#ec4899',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function GradeBadge({ label, value }: { label: string; value?: GradeRating }) {
  const isS = value === 'S';
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl px-5 py-4 min-w-[120px]
        ${isS
          ? 'bg-gradient-to-br from-yellow-400 via-amber-400 to-amber-600 text-[hsl(225_18%_7%)]'
          : 'bg-[hsl(220_10%_18%)] border border-[hsl(220_8%_22%)] text-[hsl(220_10%_92%)]'
        }`}
    >
      <span className="text-xs mb-1 opacity-70">{label}</span>
      <span className="text-2xl font-semibold flex items-center gap-1">
        {isS && <Star size={18} fill="currentColor" strokeWidth={0} />}
        {value || '—'}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[hsl(220_5%_60%)]">{label}</span>
      <span className="text-sm text-[hsl(220_10%_92%)]">{value || '—'}</span>
    </div>
  );
}

const AssetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data: Asset = await getAssetDetail(id);
        if (!cancelled) setAsset(data);
      } catch (err) {
        logger.error('加载资产详情失败', err);
        if (!cancelled) setError('加载失败，请稍后重试');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(225_18%_7%)] text-[hsl(220_10%_92%)] p-6">
        <div className="text-sm text-[hsl(220_5%_60%)]">加载中...</div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-[hsl(225_18%_7%)] text-[hsl(220_10%_92%)] p-6">
        <Link to="/" className="text-[hsl(43_91%_61%)] text-sm">
          ← 返回资产库
        </Link>
        <div className="mt-8 text-center text-[hsl(220_5%_60%)]">
          {error || '未找到该资产'}
        </div>
      </div>
    );
  }

  const catColor = categoryColors[asset.category];
  const chips: string[] = [
    asset.artStyle,
    asset.assetType,
    asset.sourceChapter,
  ].filter((v): v is string => Boolean(v));

  const isAudio = asset.category === '音色';

  // Category-specific fields
  const categoryFields: { label: string; value?: string }[] = (() => {
    switch (asset.category) {
      case '角色':
        return [
          { label: '年龄性别', value: asset.ageGender },
          { label: '戏剧原型（角色定位）', value: asset.dramaArchetype },
          { label: '性格母题', value: asset.personalityMotif },
        ];
      case '场景':
        return [
          { label: '空间布局', value: asset.spaceLayout },
          { label: '光线时段', value: asset.lightTime },
          { label: '色调', value: asset.colorTone },
          { label: '固定地标', value: asset.fixedLandmark },
        ];
      case '道具':
        return [
          { label: '材质', value: asset.material },
          { label: '功能边界', value: asset.functionBoundary },
        ];
      case '音色':
        return [
          { label: '声线性别', value: asset.voiceGender },
          { label: '音色特质', value: asset.voiceTrait },
          { label: '样本时长', value: asset.sampleDuration },
        ];
      default:
        return [];
    }
  })();

  return (
    <div className="min-h-screen bg-[hsl(225_18%_7%)] text-[hsl(220_10%_92%)] p-6 space-y-6">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-[hsl(220_10%_92%)] hover:text-[hsl(43_91%_61%)] transition-colors"
          aria-label="返回资产库"
        >
          <ArrowLeft size={16} />
          <span>返回资产库</span>
        </button>
        <span className="text-xs text-[hsl(220_5%_60%)]">
          创建时间：{formatDateTime(asset.createdAt)}
        </span>
      </div>

      {/* 头部信息卡 */}
      <div className="bg-[hsl(220_14%_12%)] border border-[hsl(220_8%_22%)] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-[hsl(220_10%_92%)]">
            {asset.name}
          </h1>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: `${catColor}20`,
              color: catColor,
              border: `1px solid ${catColor}40`,
            }}
          >
            {asset.category}
          </span>
          {asset.assetSection && (
            <span className="rounded-full px-3 py-1 text-xs text-[hsl(220_10%_92%)] bg-[hsl(220_10%_18%)] border border-[hsl(220_8%_22%)]">
              {asset.assetSection}
            </span>
          )}
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip: string) => (
              <span
                key={chip}
                className="rounded-full px-3 py-1 text-xs text-[hsl(220_5%_60%)] bg-[hsl(220_10%_18%)]/60 border border-[hsl(220_8%_22%)]"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {asset.sourceProject && (
          <div className="text-sm text-[hsl(220_5%_60%)]">
            来源项目：<span className="text-[hsl(220_10%_92%)]">{asset.sourceProject}</span>
          </div>
        )}
      </div>

      {/* 素材区卡片 */}
      <div className="bg-[hsl(220_14%_12%)] border border-[hsl(220_8%_22%)] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-[hsl(220_10%_92%)]">
            {isAudio ? '音频素材' : '图片素材'}
          </h2>
          <span className="rounded-md px-2.5 py-0.5 text-xs font-medium bg-[hsl(43_91%_61%)] text-[hsl(225_18%_7%)]">
            {isAudio
              ? asset.audioUrl
                ? '共 1 条'
                : '共 0 条'
              : `共 ${asset.imageUrls.length} 张`}
          </span>
        </div>

        {isAudio ? (
          <div>
            {asset.audioUrl ? (
              <audio controls src={asset.audioUrl} className="w-full max-w-md" />
            ) : (
              <div className="flex items-center justify-center h-32 rounded-xl bg-[hsl(220_10%_18%)] text-[hsl(220_5%_60%)] text-sm">
                暂无音频
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {asset.imageUrls.length > 0 ? (
              asset.imageUrls.map((url: string, idx: number) => (
                <div
                  key={`${url}-${idx}`}
                  className="flex-shrink-0 w-[280px] aspect-[3/4] rounded-xl overflow-hidden bg-[hsl(220_10%_18%)]"
                >
                  <Image
                    src={url}
                    alt={`素材图 ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center w-full h-48 rounded-xl bg-[hsl(220_10%_18%)] text-[hsl(220_5%_60%)] text-sm">
                暂无预览图
              </div>
            )}
          </div>
        )}
      </div>

      {/* 评估档案卡片 */}
      <div className="bg-[hsl(220_14%_12%)] border border-[hsl(220_8%_22%)] rounded-xl p-5 space-y-5">
        <h2 className="text-lg font-medium text-[hsl(220_10%_92%)]">评估档案</h2>

        <div className="flex gap-4 flex-wrap">
          <GradeBadge label="等级评定" value={asset.gradeRating} />
          <GradeBadge label="外观等级" value={asset.appearanceGrade} />
          <div
            className={`flex flex-col items-center justify-center rounded-xl px-5 py-4 min-w-[120px]
              bg-[hsl(220_10%_18%)] border border-[hsl(220_8%_22%)] text-[hsl(220_10%_92%)]`}
          >
            <span className="text-xs mb-1 opacity-70">复用评级</span>
            <span className="text-xl font-semibold">{asset.reuseRating || '—'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div className="space-y-4">
            <InfoRow label="适合用途" value={asset.suitableUse} />
            <InfoRow label="预览状态" value={asset.previewStatus} />
          </div>
          <div className="space-y-4">
            <InfoRow label="置信度" value={asset.confidence} />
            <InfoRow label="审核原因" value={asset.reviewReason} />
          </div>
        </div>
      </div>

      {/* 品类专属信息卡片 */}
      <div className="bg-[hsl(220_14%_12%)] border border-[hsl(220_8%_22%)] rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-medium text-[hsl(220_10%_92%)]">品类专属信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryFields.map((field) => (
            <InfoRow key={field.label} label={field.label} value={field.value} />
          ))}
        </div>
        {isAudio && asset.audioUrl && (
          <div className="pt-2">
            <audio controls src={asset.audioUrl} className="w-full max-w-md" />
          </div>
        )}
      </div>

      {/* 关联信息卡片 */}
      <div className="bg-[hsl(220_14%_12%)] border border-[hsl(220_8%_22%)] rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-medium text-[hsl(220_10%_92%)]">关联信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="来源篇章" value={asset.sourceChapter} />
          <InfoRow label="来源项目" value={asset.sourceProject} />
          <InfoRow label="分类路径" value={asset.categoryPath} />
          <InfoRow label="飞书记录ID" value={asset.feishuRecordId} />
          <InfoRow label="创建时间" value={formatDateTime(asset.createdAt)} />
        </div>
      </div>
    </div>
  );
};

export default AssetDetailPage;
