import type { ComponentType } from 'react';
import type { ZodType } from 'zod';

import type { Entry, Item } from '@/core/types/domain';

/**
 * What a module declares about one kind of thing it can capture. The Zod
 * schema is the single declaration that yields form generation, runtime
 * validation, and the payload's TypeScript type (design D8).
 */
export interface EntryTypeDefinition<TPayload = Record<string, unknown>> {
  id: string;
  label: string;
  /** Shown in the capture menu; falls back to the module's icon. */
  icon?: string;
  schema: ZodType<TPayload>;
  /** Omitted when the generic schema-driven form is sufficient (task 4.4). */
  CaptureScreen?: ComponentType<{ entryTypeId: string }>;
  DetailView?: ComponentType<{ entry: Entry<TPayload> }>;
}

export interface ItemTypeDefinition<TPayload = Record<string, unknown>> {
  id: string;
  label: string;
  icon?: string;
  schema: ZodType<TPayload>;
  DetailView?: ComponentType<{ item: Item<TPayload> }>;
}

export interface ModuleRoute {
  /** Path segment beneath the module's own namespace, e.g. 'beans'. */
  path: string;
  label: string;
  Screen: ComponentType;
}

/**
 * A module is a manifest and nothing else (design D2). The shell reads these
 * to build navigation, routing, and the capture menu, and must never branch on
 * a module id.
 */
export interface ModuleManifest {
  id: string;
  name: string;
  icon: string;
  color: string;
  entryTypes: EntryTypeDefinition<any>[];
  itemTypes: ItemTypeDefinition<any>[];
  /**
   * Renders one entry in the timeline. Required, and resolved regardless of
   * whether the user has the module enabled — a disabled module's entries
   * still render (design D3).
   */
  FeedCard: ComponentType<{ entry: Entry<any> }>;
  usesPlaces: boolean;
  routes?: ModuleRoute[];
}
