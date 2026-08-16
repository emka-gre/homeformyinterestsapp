/**
 * A minimal stand-in for the chainable Postgrest query builder that
 * `getClient().from(...)` returns. Every chain method (`select`, `eq`,
 * `order`, `insert`, `update`, `delete`) records its call and returns the
 * same builder, so `.eq().select()` keeps working regardless of call order;
 * `single`/`maybeSingle`, and a plain `await` on the builder itself, both
 * resolve to whatever result the test set with `setResult`.
 *
 * Used by the repository-layer unit tests (entries/items/places) to assert
 * what a repository function sent to the backend without touching a real
 * Supabase project or the native client in client.ts.
 */
export interface QueryResult<T = unknown> {
  data: T;
  error: { message: string } | null;
}

export interface QueryBuilderMock {
  from: jest.Mock;
  select: jest.Mock;
  order: jest.Mock;
  eq: jest.Mock;
  insert: jest.Mock;
  upsert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  then: (resolve: (result: QueryResult) => void) => void;
  setResult: (result: QueryResult) => void;
}

export function createQueryBuilderMock(): QueryBuilderMock {
  let result: QueryResult = { data: null, error: null };

  const builder: QueryBuilderMock = {
    from: jest.fn(() => builder),
    select: jest.fn(() => builder),
    order: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    upsert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(result)),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    then: (resolve) => resolve(result),
    setResult: (r) => {
      result = r;
    },
  };

  return builder;
}
