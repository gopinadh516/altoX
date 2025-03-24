export function rgbToHex(color: RGB): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function convertFigmaAlignment(alignment: string): string {
  const alignmentMap: { [key: string]: string } = {
    'MIN': 'flex-start',
    'MAX': 'flex-end',
    'CENTER': 'center',
    'SPACE_BETWEEN': 'space-between'
  };
  return alignmentMap[alignment] || 'flex-start';
}