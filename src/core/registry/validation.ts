import { z } from 'zod';

import { getEntryType, getItemType } from '@/core/registry/registry';

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; fieldErrors: Record<string, string[]>; formErrors: string[] };

/**
 * Core fields every entry carries regardless of module (design D1). Status and
 * visibility are validated here as well as by the database enums, so an
 * unrecognized value is caught before a round trip (entry-logging:
 * "Rejecting an unrecognized status").
 */
export const coreEntryFieldsSchema = z.object({
  occurredAt: z.string().datetime().optional(),
  status: z.enum(['planned', 'in_progress', 'done']).optional(),
  visibility: z.enum(['private', 'friends', 'public']).optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Turns Zod issues into per-field messages. The caller keeps the user's input
 * and shows these against the offending fields — an invalid payload must never
 * discard what was typed (entry-logging: "Invalid payload").
 */
function toValidationFailure(error: z.ZodError): {
  ok: false;
  fieldErrors: Record<string, string[]>;
  formErrors: string[];
} {
  const fieldErrors: Record<string, string[]> = {};
  const formErrors: string[] = [];

  for (const issue of error.issues) {
    if (issue.path.length === 0) {
      formErrors.push(issue.message);
      continue;
    }
    const field = issue.path.join('.');
    (fieldErrors[field] ??= []).push(issue.message);
  }

  return { ok: false, fieldErrors, formErrors };
}

function validateAgainst<T>(
  schema: { safeParse: (value: unknown) => z.ZodSafeParseResult<T> },
  payload: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(payload);
  return result.success
    ? { ok: true, value: result.data }
    : toValidationFailure(result.error);
}

/**
 * Validates an entry payload against the schema its module declares for that
 * entry type. Used on both create and edit, so an edit cannot write a payload
 * a create would have refused.
 */
export function validateEntryPayload(
  moduleId: string,
  entryTypeId: string,
  payload: unknown,
): ValidationResult<unknown> {
  const entryType = getEntryType(moduleId, entryTypeId);

  if (!entryType) {
    return {
      ok: false,
      fieldErrors: {},
      formErrors: [
        `No entry type "${entryTypeId}" is registered for module "${moduleId}".`,
      ],
    };
  }

  return validateAgainst(entryType.schema, payload);
}

export function validateItemPayload(
  moduleId: string,
  itemTypeId: string,
  payload: unknown,
): ValidationResult<unknown> {
  const itemType = getItemType(moduleId, itemTypeId);

  if (!itemType) {
    return {
      ok: false,
      fieldErrors: {},
      formErrors: [
        `No item type "${itemTypeId}" is registered for module "${moduleId}".`,
      ],
    };
  }

  return validateAgainst(itemType.schema, payload);
}
