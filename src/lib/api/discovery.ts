import type { Service } from '@/config/services';
import { services as localServices } from '@/config/services';
import { apiRequest } from '@/lib/api/client';
import { hasApiBaseUrl } from '@/lib/config';

/** `GET /services` response shape from the Phase 3 discovery contract. */
export type ServiceListResponse = { services?: Service[] };

/**
 * Discovery catalogue. Until `EXPO_PUBLIC_API_BASE_URL` is configured the bundled list in
 * `src/config/services.ts` is returned, so Home and Services work without a backend.
 */
export async function getServices(): Promise<readonly Service[]> {
  if (!hasApiBaseUrl) return localServices;

  const data = await apiRequest<ServiceListResponse>('/services');

  return Array.isArray(data?.services) ? data.services : localServices;
}

/**
 * `GET /search?q=` (Part 2, P5). Without a backend the bundled catalogue is
 * filtered on name, tagline and tag, which matches what the API is expected to index.
 */
export async function searchServices(query: string): Promise<readonly Service[]> {
  const term = query.trim();
  if (!term) return [];

  if (!hasApiBaseUrl) {
    const needle = term.toLowerCase();
    return localServices.filter((service) =>
      `${service.name} ${service.tagline} ${service.tag ?? ''}`.toLowerCase().includes(needle),
    );
  }

  const params = new URLSearchParams({ q: term });

  const data = await apiRequest<ServiceListResponse>(`/search?${params.toString()}`);
  return Array.isArray(data?.services) ? data.services : [];
}
