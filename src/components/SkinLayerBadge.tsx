import { SkinLayer, SKIN_LAYER_LABELS } from '@/types/skin';
import { cn } from '@/lib/utils';

const layerStyles: Record<SkinLayer, string> = {
  epidermis: 'bg-sage-light text-sage-dark',
  dermis: 'bg-amber-light text-amber',
  subcutaneous: 'bg-rose-light text-rose',
};

interface SkinLayerBadgeProps {
  layer: SkinLayer;
  className?: string;
}

const SkinLayerBadge = ({ layer, className }: SkinLayerBadgeProps) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', layerStyles[layer], className)}>
    {SKIN_LAYER_LABELS[layer]}
  </span>
);

export default SkinLayerBadge;
