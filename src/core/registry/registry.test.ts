import { z } from 'zod';

import {
  getDetailView,
  getEntryType,
  getFeedCard,
  getItemType,
  getModule,
  listModules,
  registerModule,
  resetRegistry,
} from '@/core/registry/registry';
import type { ModuleManifest } from '@/core/registry/types';

function makeManifest(overrides: Partial<ModuleManifest> = {}): ModuleManifest {
  return {
    id: 'coffee',
    name: 'Coffee',
    icon: 'cup',
    color: '#6F4E37',
    entryTypes: [
      { id: 'brew', label: 'Brew', schema: z.object({ method: z.string() }) },
    ],
    itemTypes: [
      { id: 'bean', label: 'Bean', schema: z.object({ name: z.string() }) },
    ],
    FeedCard: () => null,
    usesPlaces: true,
    ...overrides,
  };
}

beforeEach(() => {
  resetRegistry();
});

describe('registerModule', () => {
  it('makes the module discoverable by id', () => {
    const manifest = makeManifest();
    registerModule(manifest);
    expect(getModule('coffee')).toBe(manifest);
    expect(listModules()).toEqual([manifest]);
  });

  it('is idempotent when the exact same manifest is registered twice', () => {
    const manifest = makeManifest();
    registerModule(manifest);
    expect(() => registerModule(manifest)).not.toThrow();
    expect(listModules()).toHaveLength(1);
  });

  it('rejects a second, different manifest registered under the same id', () => {
    registerModule(makeManifest());
    expect(() => registerModule(makeManifest({ name: 'Coffee 2' }))).toThrow(
      /already registered/,
    );
  });

  it('rejects a manifest that declares the same entry type id twice', () => {
    const duplicateEntryType = makeManifest({
      entryTypes: [
        { id: 'brew', label: 'Brew', schema: z.object({}) },
        { id: 'brew', label: 'Brew again', schema: z.object({}) },
      ],
    });
    expect(() => registerModule(duplicateEntryType)).toThrow(
      /declares entry type "brew" more than once/,
    );
  });

  it('lets two different modules declare entry types with the same id', () => {
    registerModule(makeManifest({ id: 'coffee' }));
    registerModule(
      makeManifest({
        id: 'sports',
        entryTypes: [{ id: 'brew', label: 'Not coffee', schema: z.object({}) }],
      }),
    );
    expect(listModules()).toHaveLength(2);
  });
});

describe('lookups', () => {
  it('resolves entry types, item types, feed cards, and detail views by module id', () => {
    const DetailView = () => null;
    registerModule(
      makeManifest({
        entryTypes: [
          { id: 'brew', label: 'Brew', schema: z.object({}), DetailView },
        ],
      }),
    );

    expect(getEntryType('coffee', 'brew')?.id).toBe('brew');
    expect(getItemType('coffee', 'bean')?.id).toBe('bean');
    expect(getFeedCard('coffee')).toBeDefined();
    expect(getDetailView('coffee', 'brew')).toBe(DetailView);
  });

  it('returns undefined for an unregistered module rather than throwing', () => {
    expect(getModule('does-not-exist')).toBeUndefined();
    expect(getEntryType('does-not-exist', 'brew')).toBeUndefined();
    expect(getItemType('does-not-exist', 'bean')).toBeUndefined();
    expect(getFeedCard('does-not-exist')).toBeUndefined();
    expect(getDetailView('does-not-exist', 'brew')).toBeUndefined();
  });

  it('returns undefined for an unknown entry/item type on a registered module', () => {
    registerModule(makeManifest());
    expect(getEntryType('coffee', 'no-such-entry-type')).toBeUndefined();
    expect(getItemType('coffee', 'no-such-item-type')).toBeUndefined();
  });

  it('resolves the feed card for a module regardless of enablement (design D3)', () => {
    // The registry has no concept of enablement at all — that's the point:
    // enablement lives in user_modules, not here, so this lookup can't
    // accidentally depend on it.
    registerModule(makeManifest());
    expect(getFeedCard('coffee')).toBeDefined();
  });
});
