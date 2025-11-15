'use client';

import { MouseEvent } from 'react';
import { Heart, Users, Clock, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ImageWithFallback } from './ImageWithFallback';

export interface ExperienceCardProps {
  id: string;
  title: string;
  host: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  image?: string | null;
  category: string;
  duration: string;
  groupSize: string;
  price: number;
  priceLocale?: string;
  currencySymbol?: string;
  priceSuffix?: string;
  rating?: number;
  reviews?: number;
  ratingLabel?: string;
  location: string;
  description?: string;
  tags?: string[];
  onSelect?: (id: string) => void;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: (id: string) => void;
}

export function ExperienceCard({
  id,
  title,
  host,
  image,
  category,
  duration,
  groupSize,
  price,
  rating,
  reviews,
  location,
  description,
  tags = [],
  onSelect,
  priceLocale = 'en-US',
  currencySymbol = '$',
  priceSuffix = ' per person',
  ratingLabel,
  ctaLabel = 'Book now',
  ctaHref,
  onCtaClick,
}: ExperienceCardProps) {
  const numericPrice = Number(price);
  const formattedPrice = Number.isFinite(numericPrice)
    ? `${currencySymbol}${numericPrice.toLocaleString(priceLocale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    : `${currencySymbol}${price}`;

  const handleCtaClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (onCtaClick) {
      onCtaClick(id);
      return;
    }

    if (ctaHref) {
      if (typeof window !== 'undefined') {
        window.location.href = ctaHref;
      }
    }
  };

  return (
    <Card 
      className="group overflow-hidden cursor-pointer hover:shadow-xl transition-shadow !p-0 !py-0 !gap-0 !shadow-none"
      onClick={() => onSelect?.(id)}
    >
      <div className="relative">
        {image ? (
          <ImageWithFallback
            src={image}
            alt={title}
            className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-orange-400 to-rose-500" />
        )}
        <button className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors">
          <Heart className="h-5 w-5" />
        </button>
        <Badge className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-foreground hover:bg-white">
          {category}
        </Badge>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">{location}</p>
            {(rating !== undefined || ratingLabel) && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                {rating !== undefined ? (
                  <>
                    <span className="text-sm">{rating.toFixed(1)}</span>
                    {reviews !== undefined && (
                      <span className="text-sm text-muted-foreground">({reviews})</span>
                    )}
                  </>
                ) : (
                  <span className="text-sm">{ratingLabel}</span>
                )}
              </div>
            )}
          </div>
          <h3 className="line-clamp-2 mb-3">{title}</h3>

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {description}
            </p>
          )}
          
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm truncate">{host.name}</p>
                {host.verified && (
                  <Shield className="h-3 w-3 text-blue-500 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{groupSize}</span>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            <span className="text-lg">{formattedPrice}</span>
            <span className="text-sm text-muted-foreground">{priceSuffix}</span>
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700"
            onClick={handleCtaClick}
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
