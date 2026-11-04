import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';
import { routing } from './routing';

// Official next-intl setup on next/root-params (Next ≥ 16.3). Server Actions and Route
// Handlers cannot read root params, so they pass `locale` explicitly and skip this lookup.
export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const paramValue = await rootParams.locale();
    if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue;
    } else {
      notFound();
    }
  }

  return {
    locale,
    timeZone: 'Asia/Dubai',
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
