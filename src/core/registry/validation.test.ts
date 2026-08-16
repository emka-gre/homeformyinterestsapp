import { z } from 'zod';

import { registerModule, resetRegistry } from '@/core/registry/registry';
import type { ModuleManifest } from '@/core/registry/types';
import {
  coreEntryFieldsSchema,
  validateEntryPayload,
  validateItemPayload,
} from '@/core/registry/validation';

function registerCoffee() {
  const manifest: ModuleManifest = {
    id: 'coffee',
    name: 'Coffee',
    icon: 'cup',
    color: '#6F4E37',
    entryTypes: [
      {
        id: 'brew',
        label: 'Brew',
        schema: z.object({
          method: z.enum(['pour-over', 'espresso']),
          waterGrams: z.number().positive(),
        }),
      },
    ],
    itemTypes: [
      {
        id: 'bean',
        label: 'Bean',
        schema: z.object({ name: z.string().min(1) }),
      },
    ],
    FeedCard: () => null,
    usesPlaces: true,
  };
  registerModule(manifest);
}

beforeEach(() => {
  resetRegistry();
  registerCoffee();
});

describe('validateEntryPayload', () => {
  it('accepts a payload matching the entry type schema', () => {
    const result = validateEntryPayload('coffee', 'brew', {
      method: 'pour-over',
      waterGrams: 300,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ method: 'pour-over', waterGrams: 300 });
    }
  });

  it('rejects a payload violating the schema, with a per-field error', () => {
    const result = validateEntryPayload('coffee', 'brew', {
      method: 'french-press', // not in the enum
      waterGrams: 300,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.method).toBeDefined();
      expect(result.fieldErrors.waterGrams).toBeUndefined();
    }
  });

  it('reports every invalid field, not just the first', () => {
    const result = validateEntryPayload('coffee', 'brew', {
      method: 'french-press',
      waterGrams: -5,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual([
        'method',
        'waterGrams',
      ]);
    }
  });

  it('fails with a form-level error for an unregistered module', () => {
    const result = validateEntryPayload('not-a-module', 'brew', {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.formErrors[0]).toMatch(/No entry type "brew"/);
    }
  });

  it('fails with a form-level error for an unregistered entry type on a real module', () => {
    const result = validateEntryPayload('coffee', 'not-a-real-entry-type', {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.formErrors[0]).toMatch(/No entry type "not-a-real-entry-type"/);
    }
  });
});

describe('validateItemPayload', () => {
  it('accepts a payload matching the item type schema', () => {
    const result = validateItemPayload('coffee', 'bean', { name: 'Yirgacheffe' });
    expect(result.ok).toBe(true);
  });

  it('rejects an empty required field', () => {
    const result = validateItemPayload('coffee', 'bean', { name: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.name).toBeDefined();
    }
  });

  it('fails with a form-level error for an unregistered item type', () => {
    const result = validateItemPayload('coffee', 'not-a-real-item-type', {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.formErrors[0]).toMatch(/No item type "not-a-real-item-type"/);
    }
  });
});

describe('coreEntryFieldsSchema', () => {
  it('accepts an entry with none of the optional fields set', () => {
    expect(coreEntryFieldsSchema.safeParse({}).success).toBe(true);
  });

  it('rejects an out-of-range rating', () => {
    expect(coreEntryFieldsSchema.safeParse({ rating: 6 }).success).toBe(false);
    expect(coreEntryFieldsSchema.safeParse({ rating: -1 }).success).toBe(false);
  });

  it('rejects a status value the database enum does not recognize', () => {
    // entry-logging: "Rejecting an unrecognized status" is meant to be caught
    // here, before any round trip to Postgres.
    expect(
      coreEntryFieldsSchema.safeParse({ status: 'cancelled' }).success,
    ).toBe(false);
  });

  it('rejects a visibility value the database enum does not recognize', () => {
    expect(
      coreEntryFieldsSchema.safeParse({ visibility: 'unlisted' }).success,
    ).toBe(false);
  });

  it('accepts a null rating and null notes', () => {
    const result = coreEntryFieldsSchema.safeParse({ rating: null, notes: null });
    expect(result.success).toBe(true);
  });
});
