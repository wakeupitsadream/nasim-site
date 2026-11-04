import { getTranslations } from 'next-intl/server';
import { PageStub } from '@/components/marketing/page-stub';
import { Link } from '@/lib/i18n/navigation';

export default async function LocaleNotFound() {
  const t = await getTranslations('NotFound');
  return (
    <PageStub title={t('title')}>
      <p className="mt-6">
        <Link href="/" className="text-primary underline underline-offset-4">
          {t('backHome')}
        </Link>
      </p>
    </PageStub>
  );
}
