import type { InventoryLabGelChart, InventoryLabGelComponentKey } from '@/types/api';

export function agaroseGrams(percent: number, volumeMl: number): number {
  return Math.round((percent / 100) * volumeMl * 100) / 100;
}

export function formatGelPercentLabel(percent: number): string {
  return Number.isInteger(percent) ? `${percent}%` : `${percent}%`;
}

export function computeGelComponents(
  chart: InventoryLabGelChart,
  percent: number,
  volumeMl: number,
): Array<{
  key: InventoryLabGelComponentKey;
  name: string;
  quantityValue: string;
  quantityUnit: string;
  catalogItemId: string | null;
}> {
  const byKey = new Map(chart.components.map((row) => [row.componentKey, row]));
  const etbr = chart.etbrUlByVolumeMl[String(volumeMl)];
  const agarose = byKey.get('agarose');
  const buffer = byKey.get('buffer');
  const stain = byKey.get('stain');
  return [
    {
      key: 'agarose',
      name: agarose?.name || 'Agarose',
      quantityValue: String(agaroseGrams(percent, volumeMl)),
      quantityUnit: 'g',
      catalogItemId: agarose?.catalogItemId ?? null,
    },
    {
      key: 'buffer',
      name: buffer?.name || '1X TAE Buffer',
      quantityValue: String(volumeMl),
      quantityUnit: 'mL',
      catalogItemId: buffer?.catalogItemId ?? null,
    },
    {
      key: 'stain',
      name: stain?.name || 'EtBr',
      quantityValue: etbr === undefined ? '' : String(etbr),
      quantityUnit: 'µL',
      catalogItemId: stain?.catalogItemId ?? null,
    },
  ];
}
