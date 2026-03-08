import { forwardRef } from 'react';
import { SkinLayer, SKIN_LAYER_LABELS } from '@/types/skin';
import { cn } from '@/lib/utils';

const layerStyles: Record<SkinLayer, string> = {
  epidermis: 'bg-sage-light text-sage-dark',
  dermis: 'bg-amber-light text-amber',
  subcutaneous: 'bg-rose-light text-rose',
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

export default SkinLayerBadge;
