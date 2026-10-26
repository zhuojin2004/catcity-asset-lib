import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { ArrowLeft, Eye } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@client/src/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@client/src/components/ui/dialog';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import Image from '@client/src/components/ui/image';

import { assets } from '@client/src/api';
import type { Asset, ReviewStatus } from '@shared/api.interface';

const MY_SUB_TABS: Array<{ value: ReviewStatus | '全部'; label: string }> = [
  { value: '全部', label: '全部' },
  { value: '待审核', label: '待审核' },
  { value: '已通过', label: '已通过' },
  { value: '已驳回', label: '已驳回' },
];

const ReviewPage = () => {
  const navigate = useNavigate();

  // 待审核列表
  const [pendingList, setPendingList] = useState<Asset[]>([]);
  const [pendingLoading, setPendingLoading] = useState<boolean>(false);

  // 我的提交
  const [myList, setMyList] = useState<Asset[]>([]);
  const [myLoading, setMyLoading] = useState<boolean>(false);
  const [myStatusFilter, setMyStatusFilter] = useState<ReviewStatus | '全部'>(
    '全部',
  );

  // 驳回弹窗
  const [rejectDialogOpen, setRejectDialogOpen] = useState<boolean>(false);
  const [rejectingId, setRejectingId] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectSubmitting, setRejectSubmitting] = useState<boolean>(false);
  const [rejectError, setRejectError] = useState<string>('');

  // 操作反馈
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 加载待审核列表
  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      // 用列表接口筛审核状态，管理员视角
      const result = await assets.getAssetList({
        reviewStatus: '待审核',
        pageSize: 100,
        page: 1,
      });
      setPendingList(result.items);
    } catch (error) {
      logger.error('加载待审核列表失败', error);
      showToast('error', '加载待审核列表失败');
    } finally {
      setPendingLoading(false);
    }
  }, [showToast]);

  // 加载我的提交
  const loadMySubmissions = useCallback(
    async (status: ReviewStatus | '全部') => {
      setMyLoading(true);
      try {
        const statusParam = status === '全部' ? undefined : status;
        const data = await assets.getMySubmissions(statusParam);
        setMyList(data);
      } catch (error) {
        logger.error('加载我的提交失败', error);
        showToast('error', '加载我的提交失败');
      } finally {
        setMyLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    loadMySubmissions(myStatusFilter);
  }, [myStatusFilter, loadMySubmissions]);

  // 通过
  const handleApprove = useCallback(
    async (id: string) => {
      try {
        await assets.reviewAsset(id, { status: '已通过' });
        setPendingList((prev) => prev.filter((a: Asset) => a.id !== id));
        showToast('success', '审核通过');
        logger.info('审核通过', id);
      } catch (error) {
        logger.error('审核通过失败', error);
        showToast('error', '操作失败，请重试');
      }
    },
    [showToast],
  );

  // 打开驳回弹窗
  const openRejectDialog = useCallback((id: string) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectError('');
    setRejectDialogOpen(true);
  }, []);

  // 确认驳回
  const confirmReject = useCallback(async () => {
    if (!rejectReason.trim()) {
      setRejectError('请填写驳回原因');
      return;
    }
    setRejectSubmitting(true);
    setRejectError('');
    try {
      await assets.reviewAsset(rejectingId, {
        status: '已驳回',
        reason: rejectReason.trim(),
      });
      setPendingList((prev) =>
        prev.filter((a: Asset) => a.id !== rejectingId),
      );
      setRejectDialogOpen(false);
      showToast('success', '已驳回');
      logger.info('审核驳回', rejectingId);
    } catch (error) {
      const msg =
        (error as { response?: { data?: { error?: { message?: string } } } })
          .response?.data?.error?.message || '操作失败，请重试';
      setRejectError(msg);
      logger.error('审核驳回失败', error);
    } finally {
      setRejectSubmitting(false);
    }
  }, [rejectReason, rejectingId, showToast]);

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case '待审核':
        return (
          <Badge
            variant="outline"
            className="text-warning border-warning/50 bg-warning/10"
          >
            待审核
          </Badge>
        );
      case '已通过':
        return (
          <Badge
            variant="outline"
            className="text-success border-success/50 bg-success/10"
          >
            已通过
          </Badge>
        );
      case '已驳回':
        return (
          <Badge
            variant="outline"
            className="text-destructive border-destructive/50 bg-destructive/10"
          >
            已驳回
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case '角色':
        return '#8b5cf6';
      case '场景':
        return '#06b6d4';
      case '道具':
        return '#f97316';
      case '音色':
        return '#ec4899';
      default:
        return '#9ca0a8';
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* 顶部 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          aria-label="返回资产库"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            ← 返回资产库
          </Link>
          <h1 className="text-2xl font-semibold mt-1">审核管理</h1>
        </div>
      </div>

      {/* 全局 toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 rounded-lg px-4 py-3 text-sm shadow-lg border ${
            toast.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* 主 Tab */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-muted">
          <TabsTrigger value="pending">待审核（管理员）</TabsTrigger>
          <TabsTrigger value="mine">我的提交</TabsTrigger>
        </TabsList>

        {/* Tab 1: 待审核 */}
        <TabsContent value="pending" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg font-medium">待审核资产</CardTitle>
              <CardDescription>
                以下是待审核的资产列表，共 {pendingList.length} 条
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  加载中...
                </div>
              ) : pendingList.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  暂无待审核资产
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingList.map((asset: Asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center gap-4 p-4 bg-card/50 border border-border rounded-xl hover:border-primary/30 transition-colors"
                    >
                      <div className="w-[60px] h-[60px] rounded-lg overflow-hidden flex-shrink-0 bg-input">
                        {asset.imageUrls && asset.imageUrls.length > 0 ? (
                          <Image
                            src={asset.imageUrls[0]}
                            alt={asset.name}
                            width={60}
                            height={60}
                            className="w-[60px] h-[60px] object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            无图
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-foreground truncate">
                            {asset.name}
                          </h3>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: `${getCategoryColor(asset.category)}20`,
                              color: getCategoryColor(asset.category),
                            }}
                          >
                            {asset.category}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          提交时间：{formatDate(asset.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(asset.id)}
                          className="bg-success text-success-foreground hover:bg-success/90 rounded-lg"
                        >
                          通过
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(asset.id)}
                          className="rounded-lg"
                        >
                          驳回
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: 我的提交 */}
        <TabsContent value="mine" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg font-medium">我的提交</CardTitle>
              <CardDescription>查看我提交的资产及审核状态</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 子 Tab */}
              <div className="flex flex-wrap gap-2 border-b border-border pb-3">
                {MY_SUB_TABS.map(
                  (tab: { value: ReviewStatus | '全部'; label: string }) => (
                    <button
                      key={tab.value}
                      onClick={() => setMyStatusFilter(tab.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        myStatusFilter === tab.value
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ),
                )}
              </div>

              {myLoading ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  加载中...
                </div>
              ) : myList.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  暂无提交记录
                </div>
              ) : (
                <div className="space-y-3">
                  {myList.map((asset: Asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center gap-4 p-4 bg-card/50 border border-border rounded-xl hover:border-primary/30 transition-colors"
                    >
                      <div className="w-[60px] h-[60px] rounded-lg overflow-hidden flex-shrink-0 bg-input">
                        {asset.imageUrls && asset.imageUrls.length > 0 ? (
                          <Image
                            src={asset.imageUrls[0]}
                            alt={asset.name}
                            width={60}
                            height={60}
                            className="w-[60px] h-[60px] object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            无图
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-foreground truncate">
                            {asset.name}
                          </h3>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: `${getCategoryColor(asset.category)}20`,
                              color: getCategoryColor(asset.category),
                            }}
                          >
                            {asset.category}
                          </span>
                          {getStatusBadge(asset.reviewStatus)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          提交时间：{formatDate(asset.createdAt)}
                        </p>
                        {asset.reviewStatus === '已驳回' &&
                          asset.reviewReason && (
                            <p className="text-xs text-destructive mt-1">
                              驳回原因：{asset.reviewReason}
                            </p>
                          )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/asset-detail/${asset.id}`)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`查看${asset.name}详情`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        查看详情
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 驳回原因弹窗 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">驳回资产</DialogTitle>
            <DialogDescription>
              请填写驳回原因，提交人将收到通知
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason" className="text-sm">
              驳回原因 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请填写驳回原因"
              rows={4}
              className="bg-input border-border rounded-lg resize-none"
            />
            {rejectError && (
              <p className="text-xs text-destructive">{rejectError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRejectDialogOpen(false)}
              className="text-muted-foreground"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectSubmitting}
              className="rounded-lg"
            >
              {rejectSubmitting ? '提交中...' : '确认驳回'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewPage;
