'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

type IconProps = {
  as: LucideIcon;
  size?: number;
  className?: string;
} & React.SVGProps<SVGSVGElement>;

export function Icon({ as: As, size = 16, className, ...rest }: IconProps) {
  return <As width={size} height={size} className={`shrink-0 ${className || ''}`} aria-hidden {...rest} />;
}

export default Icon;


