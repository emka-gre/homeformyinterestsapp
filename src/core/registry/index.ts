export type {
  EntryTypeDefinition,
  ItemTypeDefinition,
  ModuleManifest,
  ModuleRoute,
} from '@/core/registry/types';

export {
  getDetailView,
  getEntryType,
  getFeedCard,
  getItemType,
  getModule,
  listModules,
  registerModule,
  resetRegistry,
} from '@/core/registry/registry';

export {
  coreEntryFieldsSchema,
  validateEntryPayload,
  validateItemPayload,
  type ValidationResult,
} from '@/core/registry/validation';
