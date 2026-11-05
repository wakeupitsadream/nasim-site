import { ArrowRightIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import areasSeed from '@/content/seed/areas.json';
import pricesSeed from '@/content/seed/prices.json';
import servicesSeed from '@/content/seed/services.json';
import { TelegramIcon, WhatsAppIcon } from '@/components/icons/brand';
import { LocalizedText } from '@/components/localized-text';
import { Ltr } from '@/components/ltr';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { Eyebrow } from '@/components/marketing/eyebrow';
import { MediaFrame } from '@/components/marketing/media-frame';
import { SectionHeader } from '@/components/marketing/section-header';
import { ServiceCard } from '@/components/marketing/service-card';
import { StickyBar } from '@/components/marketing/sticky-bar';
import { TierLadder } from '@/components/marketing/tier-ladder';
import { getPricingConfig, getServices } from '@/lib/content/queries';
import { findLine, priceFrom } from '@/lib/pricing';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/sonner';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { getSiteSettings } from '@/lib/content/site';
import { isProductionDeployment } from '@/lib/env';
import { formatAED, formatNumber } from '@/lib/i18n/format';
import { Link } from '@/lib/i18n/navigation';
import { pick, pickLocalized } from '@/lib/i18n/text';
import { PhoneInputDemo, ToastDemo } from './demos';

// Internal UI kit: local builds and Vercel previews (the owner reviews it via the PR link).
// Production gets a real 404 — VERCEL_ENV is known at build time, so the route prerenders as one.

export async function generateMetadata(): Promise<Metadata> {
  if (isProductionDeployment()) return {};
  const t = await getTranslations('DevUi');
  return { title: t('title'), robots: { index: false, follow: false } };
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-h3 text-primary">
        {title}
      </h2>
      <Card>
        <CardContent className="flex flex-col gap-6">{children}</CardContent>
      </Card>
    </section>
  );
}

export default async function DevUiPage() {
  if (isProductionDeployment()) notFound();

  const locale = await getLocale();
  const [t, tCommon, tPhone, tCta, tNav, settings] = await Promise.all([
    getTranslations('DevUi'),
    getTranslations('Common'),
    getTranslations('PhoneInput'),
    getTranslations('Cta'),
    getTranslations('Nav'),
    getSiteSettings(locale),
  ]);

  const [pricing, marketingServices] = await Promise.all([
    getPricingConfig(),
    getServices({ status: ['active', 'coming_soon'] }).then((all) =>
      all.filter((s) => s.slug === 'emergency-ac-repair' || s.slug === 'water-tank-cleaning'),
    ),
  ]);
  const acLine = findLine(pricing, 'ac_clean');
  const prices = pricesSeed.price_items.slice(0, 8);
  const areas = areasSeed.areas.filter((a) => a.published);
  const marina = areasSeed.areas.find((a) => a.slug === 'dubai-marina');
  const acCleaning = servicesSeed.services.find((sv) => sv.slug === 'ac-cleaning');
  const arrow = <ArrowRightIcon className="rtl:-scale-x-100" />;

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-12 px-gutter py-12 lg:px-gutter-lg">
      <header className="flex flex-col gap-3">
        <h1 className="text-h1 text-primary">{t('title')}</h1>
        <p className="max-w-prose text-lead text-muted-foreground">{t('intro')}</p>
      </header>

      <Section id="buttons" title={t('sections.buttons')}>
        <div className="flex flex-wrap items-center gap-3">
          <Button>{t('samples.primary')}</Button>
          <Button variant="secondary">{t('samples.secondary')}</Button>
          <Button variant="outline">
            {t('samples.outline')}
            {arrow}
          </Button>
          <Button variant="ghost">{t('samples.ghost')}</Button>
          <Button variant="link">{t('samples.link')}</Button>
          <Button variant="destructive">{t('samples.destructive')}</Button>
          <Button disabled>{t('samples.disabled')}</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="whatsapp">
            <WhatsAppIcon />
            {tCta('whatsapp')}
          </Button>
          <Button variant="telegram">
            <TelegramIcon />
            {tCta('telegram')}
          </Button>
          <Button size="lg">{t('samples.primary')}</Button>
          <Button size="icon" aria-label={t('samples.iconLabel')}>
            {arrow}
          </Button>
          <Button size="icon" variant="whatsapp" aria-label={tCta('whatsapp')}>
            <WhatsAppIcon />
          </Button>
        </div>
        <div className="max-w-xs">
          <Button className="h-auto min-h-tap w-full py-2 whitespace-normal">
            {t('samples.longButton')}
          </Button>
        </div>
      </Section>

      <Section id="cards" title={t('sections.cards')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="bg-background">
            <CardHeader>
              <CardTitle className="text-lead font-semibold">{t('samples.cardTitle')}</CardTitle>
              <CardDescription className="text-body">{t('samples.cardText')}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <p className="text-lead font-semibold text-primary">
                {t.rich('samples.cardFrom', {
                  amount: formatAED(199, locale),
                  price: (chunks) => <Ltr>{chunks}</Ltr>,
                })}
              </p>
              <Badge variant="highlight">{t('samples.badgeFixed')}</Badge>
            </CardContent>
          </Card>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </Section>

      <Section id="badges" title={t('sections.badges')}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{t('samples.badgeNew')}</Badge>
          <Badge variant="secondary">{t('samples.badgeSoon')}</Badge>
          <Badge variant="outline">{t('samples.badgeFixed')}</Badge>
          <Badge variant="highlight">{t('samples.badgeDiag')}</Badge>
          <Badge variant="success">{t('samples.badgeDone')}</Badge>
          <Badge variant="warning">{t('samples.badgeWait')}</Badge>
          <Badge variant="destructive">{t('samples.destructive')}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {marina ? (
            <Badge variant="chip" asChild>
              <Link href={`/areas/${marina.slug}`}>
                <LocalizedText value={pickLocalized(marina.name, locale)} locale={locale} />
              </Link>
            </Badge>
          ) : null}
          <Badge variant="chip" asChild>
            <Link href="/areas">{t('samples.chipAll')}</Link>
          </Badge>
        </div>
      </Section>

      <Section id="accordion" title={t('sections.accordion')}>
        <Accordion type="single" collapsible>
          <AccordionItem value="q1">
            <AccordionTrigger>{t('samples.q1')}</AccordionTrigger>
            <AccordionContent>{t('samples.a1')}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger>{t('samples.q2')}</AccordionTrigger>
            <AccordionContent>{t('samples.a2')}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      <Section id="table" title={t('sections.table')}>
        <Table labelledBy="price-table-caption" stickyFirstColumn className="min-w-xl">
          <TableCaption id="price-table-caption">{t('samples.tableCaption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>{t('samples.tableService')}</TableHead>
              <TableHead className="text-end">{t('samples.tablePrice')}</TableHead>
              <TableHead>{t('samples.tableNote')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prices.map((item) => (
              <TableRow key={item.key}>
                <TableCell className="font-medium">
                  <LocalizedText value={pickLocalized(item.name, locale)} locale={locale} />
                </TableCell>
                <TableCell className="text-end whitespace-nowrap">
                  <Ltr>{formatAED(item.price, locale)}</Ltr>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <LocalizedText value={pickLocalized(item.note, locale)} locale={locale} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section id="forms" title={t('sections.forms')}>
        <div className="grid max-w-xl gap-5">
          <div className="grid gap-2">
            <Label htmlFor="demo-name">{t('samples.nameLabel')}</Label>
            <Input id="demo-name" autoComplete="name" placeholder={t('samples.namePlaceholder')} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="demo-area">{t('samples.areaLabel')}</Label>
            <Select>
              <SelectTrigger id="demo-area" className="w-full">
                <SelectValue placeholder={t('samples.areaPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.slug} value={area.slug}>
                    {pick(area.name, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="demo-message">{t('samples.messageLabel')}</Label>
            <Textarea id="demo-message" placeholder={t('samples.messagePlaceholder')} />
          </div>
          <Label className="flex min-h-tap cursor-pointer items-center gap-3 font-normal">
            <Checkbox />
            {t('samples.consentLabel')}
          </Label>
        </div>
      </Section>

      <Section id="phone" title={t('sections.phone')}>
        <PhoneInputDemo
          labels={{
            label: t('samples.phoneLabel'),
            placeholder: tPhone('placeholder'),
            hint: tPhone('hint'),
            savedAs: t('samples.e164'),
            valid: t('samples.valid'),
            invalid: t('samples.invalid'),
          }}
        />
      </Section>

      <Section id="feedback" title={t('sections.feedback')}>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-10 w-full max-w-xs" />
        </div>
        <div>
          <ToastDemo label={t('samples.toastButton')} message={t('samples.toastMessage')} />
        </div>
      </Section>

      <Section id="sticky-bar" title={t('sections.stickyBar')}>
        <StickyBar preview={{ telegram: true }} />
      </Section>

      <Section id="marketing" title={t('sections.marketing')}>
        <SectionHeader
          id="marketing-sample"
          eyebrow={t('sections.marketing')}
          title={t('samples.cardTitle')}
          lead={t('samples.cardText')}
          className="mb-0"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <MediaFrame ratio="4/3" art="ac" sizes="50vw" />
          <MediaFrame ratio="4/3" art="upholstery" sizes="50vw" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {marketingServices.map((service) => (
            <ServiceCard
              key={service.slug}
              service={service}
              priceFrom={priceFrom(pricing, service.slug)}
              locale={locale}
              badges={service.slug === 'emergency-ac-repair' ? ['sameDay'] : []}
            />
          ))}
        </div>
        {acLine ? (
          <TierLadder line={acLine} locale={locale} label={t('samples.cardTitle')} />
        ) : null}
        <div className="tone-deep flex flex-col gap-3 rounded-panel p-6">
          <Eyebrow>{t('sections.marketing')}</Eyebrow>
          <p className="text-h3 text-on-deep">{t('samples.primary')}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="inverse">{t('samples.primary')}</Button>
            <Button variant="outline-inverse">{t('samples.secondary')}</Button>
          </div>
        </div>
      </Section>

      <Section id="sheet" title={t('sections.sheet')}>
        <div className="flex flex-wrap gap-3">
          {(['inline-end', 'inline-start'] as const).map((side) => (
            <Sheet key={side}>
              <SheetTrigger asChild>
                <Button variant="outline">
                  {t(side === 'inline-end' ? 'samples.sheetEnd' : 'samples.sheetStart')}
                </Button>
              </SheetTrigger>
              <SheetContent side={side} closeLabel={tCommon('close')}>
                <SheetHeader>
                  <SheetTitle>{t('samples.sheetTitle')}</SheetTitle>
                  <SheetDescription>{t('samples.sheetText')}</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          ))}
        </div>
      </Section>

      <Section id="breadcrumbs" title={t('sections.breadcrumbs')}>
        <Breadcrumbs
          items={[
            { label: tNav('services'), href: '/services' },
            { label: acCleaning ? pick(acCleaning.name, locale) : '' },
          ]}
        />
      </Section>

      <Section id="numbers" title={t('sections.numbers')}>
        <p>
          {t.rich('samples.numbersText', {
            a: formatAED(99, locale),
            b: formatAED(199, locale),
            c: formatAED(1499, locale),
            d: formatAED(12500, locale),
            n: formatNumber(12345.5, locale),
            email: 'hello@example.com',
            url: 'https://example.com/en/pricing',
            phone: tPhone('placeholder'),
            ltr: (chunks) => <Ltr>{chunks}</Ltr>,
          })}
        </p>
        <p>
          {t('samples.hoursText')} <LocalizedText value={settings.hours} locale={locale} />
        </p>
      </Section>

      <Section id="long-text" title={t('sections.longText')}>
        <p className="max-w-prose">{t('samples.longParagraph')}</p>
        <div className="max-w-48 rounded-lg border p-3 wrap-break-word hyphens-auto">
          {t('samples.longWord')}
        </div>
      </Section>

      <Toaster />
    </div>
  );
}
