/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  assetSection: varchar("asset_section", { length: 100 }),
  artStyle: varchar("art_style", { length: 100 }),
  assetType: varchar("asset_type", { length: 100 }),
  sourceChapter: varchar("source_chapter", { length: 100 }),
  sourceProject: varchar("source_project", { length: 255 }),
  gradeRating: varchar("grade_rating", { length: 10 }),
  appearanceGrade: varchar("appearance_grade", { length: 10 }),
  reuseRating: varchar("reuse_rating", { length: 20 }),
  suitableUse: text("suitable_use"),
  confidence: varchar("confidence", { length: 20 }),
  previewStatus: varchar("preview_status", { length: 20 }).default('缺图'),
  categoryPath: text("category_path"),
  imageCount: integer("image_count").default(0),
  assetDescription: text("asset_description"),
  promptText: text("prompt_text"),
  imageUrls: text("image_urls").array().default([]),
  reviewStatus: varchar("review_status", { length: 20 }).default('待审核'),
  reviewReason: text("review_reason"),
  feishuRecordId: varchar("feishu_record_id", { length: 255 }),
  ageGender: varchar("age_gender", { length: 100 }),
  dramaArchetype: varchar("drama_archetype", { length: 100 }),
  personalityMotif: text("personality_motif"),
  spaceLayout: varchar("space_layout", { length: 255 }),
  lightTime: varchar("light_time", { length: 100 }),
  colorTone: varchar("color_tone", { length: 100 }),
  fixedLandmark: text("fixed_landmark"),
  material: varchar("material", { length: 100 }),
  functionBoundary: text("function_boundary"),
  voiceGender: varchar("voice_gender", { length: 50 }),
  voiceTrait: text("voice_trait"),
  sampleDuration: varchar("sample_duration", { length: 50 }),
  audioUrl: varchar("audio_url", { length: 500 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_assets_category").on(table.category),
  index("idx_assets_review_status").on(table.reviewStatus),
  index("idx_assets_grade_rating").on(table.gradeRating),
  // Complex index: CREATE INDEX idx_assets_name_search ON assets USING gin (to_tsvector('simple'::regconfig, (name)::text)),
]);

// table aliases
export const assetsTable = assets;
