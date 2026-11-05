import { NextResponse } from 'next/server';
import {
  AiNetworkError,
  AiNotConfiguredError,
  AiParseError,
  AiRefusedError,
  AiUpstreamError,
  diagnose,
} from '@/lib/ai';
import type { CatalogueEntry } from '@/lib/ai/diagnose-prompt';
import { getPricingConfig, getServices } from '@/lib/content/queries';
import { getSiteSettings } from '@/lib/content/site';
import { pick } from '@/lib/i18n/text';
import { priceFrom } from '@/lib/pricing';
import { allow, clientIp, hashIp } from '@/lib/ratelimit';
import {
  diagnoseRequestSchema,
  type DiagnoseError,
  type DiagnoseResponse,
} from '@/lib/validation/diagnose';

// POST /api/diagnose — AI triage of a customer's description and optional photo.
// No PII is logged (rule 7): only error class names reach the logs. Dynamic route (rule 5).

const PER_VISITOR = { limit: 6, windowMs: 60_000 };
const PER_INSTANCE = { limit: 60, windowMs: 60_000 };
// Gateway answers that are ours to fix (key, Polza balance, rate), not the visitor's to retry.
const UNAVAILABLE_UPSTREAM = new Set([401, 402, 403, 429]);

const fail = (error: DiagnoseError, status: number) =>
  NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  const ipKey = hashIp(clientIp(request.headers));
  if (!allow(`diagnose:${ipKey}`, PER_VISITOR) || !allow('diagnose:all', PER_INSTANCE)) {
    return fail('rate_limited', 429);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = diagnoseRequestSchema.safeParse(body);
  if (!parsed.success) return fail('invalid', 400);
  const input = parsed.data;

  const [settings, services, pricing] = await Promise.all([
    getSiteSettings(input.locale),
    getServices({ status: ['active', 'coming_soon'] }),
    getPricingConfig(),
  ]);
  const catalogue: CatalogueEntry[] = services.map((s) => ({
    slug: s.slug,
    category: s.category,
    status: s.status === 'coming_soon' ? 'coming_soon' : 'active',
    name: s.name.en,
    short: s.short.en,
    symptoms: s.symptoms.map((x) => x.en),
    includes: s.includes.map((x) => x.en),
  }));

  try {
    const diagnosis = await diagnose(input, settings.brandName.text, catalogue);
    const service = services.find((s) => s.slug === diagnosis.service) ?? null;
    const response: DiagnoseResponse = {
      ...diagnosis,
      service: service
        ? {
            slug: service.slug,
            name: pick(service.name, input.locale),
            href: `/services/${service.slug}`,
            priceFrom: priceFrom(pricing, service.slug),
            estimate: service.pricing_unit === 'from',
            comingSoon: service.status === 'coming_soon',
          }
        : null,
    };
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof AiNotConfiguredError) return fail('unavailable', 503);
    if (error instanceof AiRefusedError) return fail('refused', 422);
    if (error instanceof AiUpstreamError) {
      console.error(`[diagnose] upstream ${error.status}${error.code ? ` ${error.code}` : ''}`);
      return UNAVAILABLE_UPSTREAM.has(error.status)
        ? fail('unavailable', 503)
        : fail('failed', 502);
    }
    if (error instanceof AiParseError || error instanceof AiNetworkError) {
      console.error(`[diagnose] ${error.name}`);
      return fail('failed', 502);
    }
    console.error('[diagnose] unexpected', error instanceof Error ? error.name : typeof error);
    return fail('failed', 500);
  }
}
