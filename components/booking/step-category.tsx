'use client';

import { ArrowRightIcon } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Ltr } from '@/components/ltr';
import { AcUnitArt, SofaArt } from '@/components/marketing/illustrations';
import type { BookingCategory, BookingPayload } from '@/components/booking/types';
import { formatAED } from '@/lib/i18n/format';
import { stagger } from '@/lib/motion';
import { cn } from '@/lib/utils';

type Props = {
  payload: BookingPayload;
  headingId: string;
  onChoose: (category: BookingCategory) => void;
};

/** Step 1: the two big pictures (the owner's flow). Buttons, not radios: a tap is a choice. */
export function StepCategory({ payload, headingId, onChoose }: Props) {
  const t = useTranslations('Booking');
  const tPrice = useTranslations('Price');
  const cards: { key: BookingCategory; art: typeof AcUnitArt }[] = [
    { key: 'ac', art: AcUnitArt },
    { key: 'upholstery', art: SofaArt },
  ];

  return (
    <div role="group" aria-labelledby={headingId} className="grid gap-4 sm:grid-cols-2">
      {cards.map(({ key, art: Art }, i) => {
        const flagship = payload.services.find((s) => s.category === key && s.priceFrom);
        const photo = payload.categoryPhotos[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChoose(key)}
            style={stagger(i)}
            className="group reveal-fade flex flex-col overflow-clip rounded-panel border border-border bg-card text-start shadow-card transition-[transform,box-shadow] duration-(--nasim-dur) ease-brand outline-none hover:shadow-lift focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:hover:-translate-y-0.5"
          >
            {/* The picture is decorative: the card's title names the category. */}
            <span
              aria-hidden="true"
              className={cn('relative block aspect-16/9 w-full', !photo && 'nasim-placeholder')}
            >
              {photo ? (
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 560px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-(--nasim-dur-slow) ease-brand motion-safe:group-hover:scale-[1.03]"
                />
              ) : (
                <Art className="absolute inset-s-1/2 top-1/2 w-[42%] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2" />
              )}
            </span>
            <span className="flex flex-1 flex-col gap-1 p-5">
              <span className="flex items-center justify-between gap-3 text-lead font-medium text-foreground">
                {t(`category.${key}.title`)}
                <ArrowRightIcon
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-5 shrink-0 text-primary transition-transform duration-(--nasim-dur) group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                />
              </span>
              <span className="text-small text-muted-foreground">{t(`category.${key}.text`)}</span>
              {flagship?.priceFrom ? (
                <span className="mt-2 text-small text-muted-foreground">
                  {t.rich(`category.${key}.price`, {
                    amount: formatAED(flagship.priceFrom.amount, payload.locale),
                    unit: tPrice(`per.${flagship.priceFrom.unit}`),
                    price: (chunks) => (
                      <Ltr className="font-medium text-foreground tabular-nums">{chunks}</Ltr>
                    ),
                  })}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
