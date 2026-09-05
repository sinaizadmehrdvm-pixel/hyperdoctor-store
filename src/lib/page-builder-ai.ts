import { z } from "zod";
import type { BuilderDocument } from "@/lib/page-builder";

const localizedTextSchema = z.object({
  fa: z.string().max(12000).optional(),
  tr: z.string().max(12000).optional(),
  en: z.string().max(12000).optional(),
  ar: z.string().max(12000).optional(),
}).strict();

const cardSchema = z.object({
  id: z.string().min(1).max(160),
  title: localizedTextSchema,
  body: localizedTextSchema,
  imageUrl: z.string().max(4096).optional(),
  href: z.string().max(2048).optional(),
}).strict();

const settingsSchema = z.object({
  background: z.string().max(64).optional(),
  foreground: z.string().max(64).optional(),
  maxWidth: z.string().max(16).optional(),
  paddingY: z.string().max(16).optional(),
  minHeight: z.string().max(16).optional(),
  radius: z.string().max(16).optional(),
  align: z.enum(["start", "center", "end"]).optional(),
  imagePosition: z.enum(["start", "end"]).optional(),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
  hiddenOn: z.array(z.enum(["desktop", "tablet", "mobile"])).max(3).optional(),
}).strict();

const contentSchema = z.object({
  eyebrow: localizedTextSchema.optional(),
  title: localizedTextSchema.optional(),
  body: localizedTextSchema.optional(),
  text: localizedTextSchema.optional(),
  buttonLabel: localizedTextSchema.optional(),
  buttonHref: z.string().max(2048).optional(),
  imageUrl: z.string().max(4096).optional(),
  imageAlt: localizedTextSchema.optional(),
  cards: z.array(cardSchema).max(24).optional(),
}).strict();

const sectionSchema = z.object({
  id: z.string().min(1).max(160),
  type: z.enum(["hero", "richText", "imageText", "cards", "cta", "spacer"]),
  visible: z.boolean().optional(),
  content: contentSchema,
  settings: settingsSchema.optional(),
}).strict();

const themeSchema = z.object({
  pageBackground: z.string().max(64).optional(),
  surface: z.string().max(64).optional(),
  foreground: z.string().max(64).optional(),
  accent: z.string().max(64).optional(),
  muted: z.string().max(64).optional(),
  radius: z.string().max(16).optional(),
  sectionGap: z.string().max(16).optional(),
  fontScale: z.enum(["sm", "md", "lg"]).optional(),
}).strict();

export const builderDocumentAiSchema = z.object({
  version: z.literal(1),
  sections: z.array(sectionSchema).max(100),
  theme: themeSchema.optional(),
}).strict();

export const editorAiRequestSchema = z.object({
  instruction: z.string().trim().min(2).max(4000),
  document: builderDocumentAiSchema,
  scope: z.enum(["page", "section"]).default("page"),
  selectedSectionId: z.string().max(160).nullable().optional(),
  locale: z.enum(["fa", "tr", "en", "ar"]),
  mode: z.enum(["edit", "translate", "responsive"]).default("edit"),
}).strict();

export type EditorAiRequest = z.infer<typeof editorAiRequestSchema>;

export type BuilderDiff = {
  sectionsAdded: number;
  sectionsRemoved: number;
  sectionsChanged: number;
  themeChanged: boolean;
  changedSectionIds: string[];
};

export function parseAiBuilderDocument(value: unknown): BuilderDocument {
  return builderDocumentAiSchema.parse(value) as BuilderDocument;
}

export function builderDiff(before: BuilderDocument, after: BuilderDocument): BuilderDiff {
  const beforeMap = new Map(before.sections.map(section => [section.id, JSON.stringify(section)]));
  const afterMap = new Map(after.sections.map(section => [section.id, JSON.stringify(section)]));
  const changedSectionIds: string[] = [];
  for (const section of after.sections) {
    const previous = beforeMap.get(section.id);
    if (previous && previous !== JSON.stringify(section)) changedSectionIds.push(section.id);
  }
  return {
    sectionsAdded: after.sections.filter(section => !beforeMap.has(section.id)).length,
    sectionsRemoved: before.sections.filter(section => !afterMap.has(section.id)).length,
    sectionsChanged: changedSectionIds.length,
    themeChanged: JSON.stringify(before.theme || {}) !== JSON.stringify(after.theme || {}),
    changedSectionIds,
  };
}

export function enforceAiScope(original: BuilderDocument, candidate: BuilderDocument, scope: "page" | "section", selectedSectionId?: string | null): BuilderDocument {
  if (scope === "page") return candidate;
  if (!selectedSectionId) throw new Error("selected_section_required");
  const replacement = candidate.sections.find(section => section.id === selectedSectionId);
  if (!replacement) throw new Error("selected_section_missing_from_ai_result");
  return {
    ...original,
    version: 1,
    sections: original.sections.map(section => section.id === selectedSectionId ? replacement : section),
  };
}
