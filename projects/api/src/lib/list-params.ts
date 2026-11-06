import type { ListContract, ListQuery, Page } from './api.models';

/** Construit les query params d'une liste selon le contrat (page, pageSize, sort, q, filter[x]). */
export function buildListParams(query: ListQuery, c: ListContract): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (query.page !== undefined) out[c.pageParam] = query.page;
  if (query.pageSize !== undefined) out[c.pageSizeParam] = query.pageSize;
  if (query.sort?.length) out[c.sortParam] = query.sort.map((s) => `${s.field}:${s.direction}`).join(',');
  if (query.search?.trim()) out[c.searchParam] = query.search.trim();
  for (const [key, value] of Object.entries(query.filters ?? {})) {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length)) continue;
    out[c.filterParam(key)] = value;
  }
  return out;
}

/** Accepte `{items,total}`, `{data,total}`, `{content,totalElements}` (Spring), `{results,count}` ou un simple tableau. */
export function defaultMapPage<T>(body: unknown, query: ListQuery): Page<T> {
  const page = query.page ?? 1;
  if (Array.isArray(body)) return { items: body as T[], total: body.length, page, pageSize: query.pageSize ?? body.length };
  const b = (body ?? {}) as Record<string, unknown>;
  const items = (b['items'] ?? b['data'] ?? b['content'] ?? b['results'] ?? []) as T[];
  const total = Number(b['total'] ?? b['totalElements'] ?? b['totalCount'] ?? b['count'] ?? items.length);
  return { items, total, page: Number(b['page'] ?? page), pageSize: Number(b['pageSize'] ?? query.pageSize ?? items.length) };
}
