import { serviceContentBySlug, type ServiceContent } from '@/config/service-content';
import { apiRequest } from '@/lib/api/client';
import { hasApiBaseUrl } from '@/lib/config';

/** `GET /services/{slug}` payload; only `content` is consumed by P7 so far. */
type ServiceContentResponse = { content?: Partial<ServiceContent> };

/**
 * Service landing copy. Until `EXPO_PUBLIC_API_BASE_URL` is configured the bundled
 * content is returned; a configured backend may override any field it sends.
 */
export async function getServiceContent(slug: string): Promise<ServiceContent | null> {
  const local = serviceContentBySlug(slug) ?? null;
  if (!hasApiBaseUrl) return local;

  const data = await apiRequest<ServiceContentResponse>(`/services/${encodeURIComponent(slug)}`);

  if (!local) return data?.content ? ({ ...data.content, slug } as ServiceContent) : null;
  return { ...local, ...data?.content, slug: local.slug };
}
