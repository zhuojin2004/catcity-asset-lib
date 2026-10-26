import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Upload, ArrowLeft } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Button } from '@client/src/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Label } from '@client/src/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';

import { assets } from '@client/src/api';
import type {
  AssetCategory,
  CreateAssetDto,
  BatchSubmitDto,
} from '@shared/api.interface';

const CATEGORIES: AssetCategory[] = ['角色', '场景', '道具', '音色'];

const ASSET_SECTIONS = ['写实动物纪录片', '概念设定'];

const SOURCE_CHAPTERS = [
  '猫城篇',
  '荒野山脉篇',
  '双角保卫战',
  '二十四节气',
  '代际远行篇',
];

const ASSET_TYPE_MAP: Record<AssetCategory, string[]> = {
  角色: ['单体', '群像'],
  场景: ['主场景', '过渡场景'],
  道具: ['关键道具', '普通道具'],
  音色: ['旁白', '角色音'],
};

const initialForm: CreateAssetDto = {
  name: '',
  category: '角色',
  assetSection: '',
  sourceChapter: '',
  sourceProject: '',
  artStyle: '',
  assetType: '',
  assetDescription: '',
  promptText: '',
  imageUrls: [],
  voiceGender: '',
  voiceTrait: '',
  sampleDuration: '',
  audioUrl: '',
};

const UploadPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateAssetDto>(initialForm);
  const [imageUrlsText, setImageUrlsText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  const [batchForm, setBatchForm] = useState<BatchSubmitDto>({
    tableLink: '',
    category: '角色',
    sourceProject: '',
  });
  const [batchSubmitting, setBatchSubmitting] = useState<boolean>(false);
  const [batchSuccess, setBatchSuccess] = useState<string>('');
  const [batchError, setBatchError] = useState<string>('');

  const [urlDialogOpen, setUrlDialogOpen] = useState<boolean>(false);
  const [urlDialogValue, setUrlDialogValue] = useState<string>('');

  const assetTypeOptions = ASSET_TYPE_MAP[form.category] || [];

  const updateField = useCallback(
    <K extends keyof CreateAssetDto>(key: K, value: CreateAssetDto[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleCategoryChange = useCallback((val: string) => {
    const cat = val as AssetCategory;
    setForm((prev) => ({
      ...prev,
      category: cat,
      assetType: '',
    }));
  }, []);

  const validateForm = useCallback((): string | null => {
    if (!form.name.trim()) return '请填写资产名称';
    if (!form.category) return '请选择资产品类';
    return null;
  }, [form.name, form.category]);

  const handleSubmit = useCallback(async () => {
    const err = validateForm();
    if (err) {
      setSubmitError(err);
      return;
    }

    const urls = imageUrlsText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    const payload: CreateAssetDto = {
      ...form,
      imageUrls: urls,
      assetSection: form.assetSection || undefined,
      sourceChapter: form.sourceChapter || undefined,
      assetType: form.assetType || undefined,
    };

    if (form.category !== '音色') {
      delete payload.voiceGender;
      delete payload.voiceTrait;
      delete payload.sampleDuration;
      delete payload.audioUrl;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      await assets.createAsset(payload);
      setSubmitSuccess(true);
      logger.info('资产提交成功');
    } catch (error) {
      const msg =
        (error as { response?: { data?: { error?: { message?: string } } } })
          .response?.data?.error?.message || '提交失败，请稍后重试';
      setSubmitError(msg);
      logger.error('资产提交失败', error);
    } finally {
      setSubmitting(false);
    }
  }, [form, imageUrlsText, validateForm]);

  const handleBatchSubmit = useCallback(async () => {
    if (!batchForm.tableLink.trim()) {
      setBatchError('请填写资产表格链接');
      return;
    }
    if (!batchForm.sourceProject.trim()) {
      setBatchError('请填写来源项目名');
      return;
    }

    setBatchSubmitting(true);
    setBatchError('');
    setBatchSuccess('');

    try {
      const result = await assets.batchSubmit(batchForm);
      setBatchSuccess(`成功提交 ${result.count} 条资产`);
      logger.info('批量提交成功', result.count);
    } catch (error) {
      const msg =
        (error as { response?: { data?: { error?: { message?: string } } } })
          .response?.data?.error?.message || '批量提交失败，请稍后重试';
      setBatchError(msg);
      logger.error('批量提交失败', error);
    } finally {
      setBatchSubmitting(false);
    }
  }, [batchForm]);

  const openUrlDialog = useCallback(() => {
    setUrlDialogValue(imageUrlsText);
    setUrlDialogOpen(true);
  }, [imageUrlsText]);

  const confirmUrlDialog = useCallback(() => {
    setImageUrlsText(urlDialogValue);
    setUrlDialogOpen(false);
  }, [urlDialogValue]);

  const imageUrlCount = imageUrlsText
    .split('\n')
    .filter((line: string) => line.trim().length > 0).length;

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
          <h1 className="text-2xl font-semibold mt-1">上传资产</h1>
          <p className="text-sm text-muted-foreground">
            提交后资产将进入待审核状态，审核通过后入库
          </p>
        </div>
      </div>

      {/* 单条上传卡片 */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            上传{form.category}资产
          </CardTitle>
          <CardDescription>
            填写资产信息并上传图片，提交后进入待审核状态
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 资产名称 */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">
                资产名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="请输入资产名称"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="bg-input border-border rounded-lg"
              />
            </div>

            {/* 资产品类 */}
            <div className="space-y-2">
              <Label className="text-sm">
                资产品类 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full bg-input border-border rounded-lg">
                  <SelectValue placeholder="请选择品类" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat: string) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 资产板块 */}
            <div className="space-y-2">
              <Label className="text-sm">资产板块</Label>
              <Select
                value={form.assetSection || ''}
                onValueChange={(val) => updateField('assetSection', val)}
              >
                <SelectTrigger className="w-full bg-input border-border rounded-lg">
                  <SelectValue placeholder="请选择板块" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_SECTIONS.map((sec: string) => (
                    <SelectItem key={sec} value={sec}>
                      {sec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 来源篇章 */}
            <div className="space-y-2">
              <Label className="text-sm">来源篇章</Label>
              <Select
                value={form.sourceChapter || ''}
                onValueChange={(val) => updateField('sourceChapter', val)}
              >
                <SelectTrigger className="w-full bg-input border-border rounded-lg">
                  <SelectValue placeholder="请选择篇章" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_CHAPTERS.map((ch: string) => (
                    <SelectItem key={ch} value={ch}>
                      {ch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 来源项目 */}
            <div className="space-y-2">
              <Label className="text-sm">来源项目</Label>
              <Input
                placeholder="如 EP16"
                value={form.sourceProject || ''}
                onChange={(e) => updateField('sourceProject', e.target.value)}
                className="bg-input border-border rounded-lg"
              />
            </div>

            {/* 美术风格 */}
            <div className="space-y-2">
              <Label className="text-sm">美术风格</Label>
              <Input
                placeholder="请输入美术风格"
                value={form.artStyle || ''}
                onChange={(e) => updateField('artStyle', e.target.value)}
                className="bg-input border-border rounded-lg"
              />
            </div>

            {/* 资产类型 */}
            <div className="space-y-2">
              <Label className="text-sm">资产类型</Label>
              <Select
                value={form.assetType || ''}
                onValueChange={(val) => updateField('assetType', val)}
              >
                <SelectTrigger className="w-full bg-input border-border rounded-lg">
                  <SelectValue placeholder="请选择资产类型" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypeOptions.map((t: string) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 资产说明 */}
          <div className="space-y-2">
            <Label className="text-sm">资产说明</Label>
            <Textarea
              placeholder="请输入资产说明"
              rows={3}
              value={form.assetDescription || ''}
              onChange={(e) =>
                updateField('assetDescription', e.target.value)
              }
              className="bg-input border-border rounded-lg resize-none"
            />
          </div>

          {/* 出图/制作提示词 */}
          <div className="space-y-2">
            <Label className="text-sm">出图/制作提示词</Label>
            <Textarea
              placeholder="请输入出图或制作提示词"
              rows={3}
              value={form.promptText || ''}
              onChange={(e) => updateField('promptText', e.target.value)}
              className="bg-input border-border rounded-lg resize-none"
            />
          </div>

          {/* 图片附件 */}
          <div className="space-y-2">
            <Label className="text-sm">图片附件</Label>
            <div
              onClick={openUrlDialog}
              className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-card/50"
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-foreground">添加图片</p>
              <p className="text-xs text-muted-foreground mt-1">
                最多 12 张（已添加 {imageUrlCount} 张）
              </p>
            </div>
          </div>

          {/* 音色专属字段 */}
          {form.category === '音色' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">声线性别</Label>
                  <Select
                    value={form.voiceGender || ''}
                    onValueChange={(val) => updateField('voiceGender', val)}
                  >
                    <SelectTrigger className="w-full bg-input border-border rounded-lg">
                      <SelectValue placeholder="请选择声线性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="男声">男声</SelectItem>
                      <SelectItem value="女声">女声</SelectItem>
                      <SelectItem value="中性">中性</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">音色特质</Label>
                  <Input
                    placeholder="如：温柔、低沉、清亮"
                    value={form.voiceTrait || ''}
                    onChange={(e) => updateField('voiceTrait', e.target.value)}
                    className="bg-input border-border rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">样本时长</Label>
                  <Input
                    placeholder="如：30秒"
                    value={form.sampleDuration || ''}
                    onChange={(e) =>
                      updateField('sampleDuration', e.target.value)
                    }
                    className="bg-input border-border rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">音频附件（URL）</Label>
                <Input
                  placeholder="请输入音频文件 URL"
                  value={form.audioUrl || ''}
                  onChange={(e) => updateField('audioUrl', e.target.value)}
                  className="bg-input border-border rounded-lg"
                />
              </div>
            </>
          )}

          {/* 提交状态提示 */}
          {submitSuccess && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-center justify-between">
              <span className="text-sm text-success">
                提交成功！资产已进入待审核状态
              </span>
              <Link
                to="/review"
                className="text-sm text-primary hover:underline"
              >
                查看我的提交 →
              </Link>
            </div>
          )}
          {submitError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <span className="text-sm text-destructive">{submitError}</span>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary text-primary-foreground rounded-lg px-6 py-2 font-medium"
            >
              {submitting ? '提交中...' : '提交审核'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 批量提交卡片 */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <span>📋</span>
            批量提交资产表格
          </CardTitle>
          <CardDescription>
            粘贴多维表格数据表链接，系统将自动提取并批量提交审核
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label className="text-sm">资产表格链接</Label>
              <Input
                placeholder="请粘贴多维表格链接"
                value={batchForm.tableLink}
                onChange={(e) =>
                  setBatchForm((prev) => ({
                    ...prev,
                    tableLink: e.target.value,
                  }))
                }
                className="bg-input border-border rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">所属品类</Label>
              <Select
                value={batchForm.category}
                onValueChange={(val) =>
                  setBatchForm((prev) => ({
                    ...prev,
                    category: val as AssetCategory,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-input border-border rounded-lg">
                  <SelectValue placeholder="请选择品类" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat: string) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">来源项目名</Label>
              <Input
                placeholder="如 EP16"
                value={batchForm.sourceProject}
                onChange={(e) =>
                  setBatchForm((prev) => ({
                    ...prev,
                    sourceProject: e.target.value,
                  }))
                }
                className="bg-input border-border rounded-lg"
              />
            </div>
          </div>

          {batchSuccess && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-4">
              <span className="text-sm text-success">{batchSuccess}</span>
            </div>
          )}
          {batchError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <span className="text-sm text-destructive">{batchError}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              重复提交自动去重
            </p>
            <Button
              onClick={handleBatchSubmit}
              disabled={batchSubmitting}
              className="bg-primary text-primary-foreground rounded-lg px-6 py-2 font-medium"
            >
              {batchSubmitting ? '提交中...' : '批量提交审核'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 图片 URL 输入弹窗 */}
      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">添加图片</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              每行输入一个图片 URL，最多 12 张
            </p>
            <Textarea
              value={urlDialogValue}
              onChange={(e) => setUrlDialogValue(e.target.value)}
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              rows={8}
              className="bg-input border-border rounded-lg resize-none font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setUrlDialogOpen(false)}
              className="text-muted-foreground"
            >
              取消
            </Button>
            <Button
              onClick={confirmUrlDialog}
              className="bg-primary text-primary-foreground"
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UploadPage;
