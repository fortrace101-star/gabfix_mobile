import type { ServiceCategory } from '@/config/service-categories';
import { serviceCategories } from '@/config/service-categories';
import type { Service } from '@/config/services';
import { activeServices } from '@/config/services';
import { apiRequest } from '@/lib/api/client';
import { hasApiBaseUrl } from '@/lib/config';

/** `GET /services` response shape from the Phase 3 discovery contract. */
export type ServiceListResponse = {
  services?: Service[];
  /** Sent with the catalogue so the tab chips come from the same response. */
  categories?: ServiceCategory[];
};

/** Categories for the Services tab; the bundled set until the API sends its own. */
export const catalogueCategories = (): readonly ServiceCategory[] => serviceCategories;

const shown = (services: readonly Service[]) => services.filter((service) => service.active !== false);

/**
 * Discovery catalogue. Until `EXPO_PUBLIC_API_BASE_URL` is configured the bundled list in
 * `src/config/services.ts` is returned, so Home and Services work without a backend.
 */
export async function getServices(): Promise<readonly Service[]> {
  if (!hasApiBaseUrl) return activeServices;

  const data = await apiRequest<ServiceListResponse>('/services');

  return Array.isArray(data?.services) ? shown(data.services) : activeServices;
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
    return activeServices.filter((service) =>
      `${service.name} ${service.tagline} ${service.tag ?? ''}`.toLowerCase().includes(needle),
    );
  }

  const params = new URLSearchParams({ q: term });

  const data = await apiRequest<ServiceListResponse>(`/search?${params.toString()}`);
  return Array.isArray(data?.services) ? shown(data.services) : [];
}
