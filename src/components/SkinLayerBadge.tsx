import { forwardRef } from 'react';
import { SkinLayer, SKIN_LAYER_LABELS, BodyArea, BODY_AREA_LABELS } from '@/types/skin';
import { cn } from '@/lib/utils';

const layerStyles: Record<SkinLayer, string> = {
  epidermis: 'bg-sage-light text-sage-dark',
  dermis: 'bg-amber-light text-amber',
  subcutaneous: 'bg-rose-light text-rose',
};

const bodyAreaStyles: Record<BodyArea, string> = {
  face: 'bg-info-light text-info',
  neck: 'bg-amber-light text-warm-dark',
  arm: 'bg-sage-light text-sage-dark',
  leg: 'bg-rose-light text-rose',
  abdomen: 'bg-amber-light text-amber',
  back: 'bg-info-light text-info',
  chest: 'bg-sage-light text-sage-dark',
  hip: 'bg-rose-light text-rose',
};

interface SkinLayerBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  layer: SkinLayer;
}

const SkinLayerBadge = forwardRef<HTMLSpanElement, SkinLayerBadgeProps>(
  ({ layer, className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', layerStyles[layer], className)}
      {...props}
    >
      {SKIN_LAYER_LABELS[layer]}
    </span>
  )
);
SkinLayerBadge.displayName = 'SkinLayerBadge';

interface BodyAreaBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  area: BodyArea;
}

const BodyAreaBadge = forwardRef<HTMLSpanElement, BodyAreaBadgeProps>(
  ({ area, className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', bodyAreaStyles[area], className)}
      {...props}
    >
      {BODY_AREA_LABELS[area]}
    </span>
  )
);
BodyAreaBadge.displayName = 'BodyAreaBadge';

export { SkinLayerBadge, BodyAreaBadge };
export default SkinLayerBadge;
