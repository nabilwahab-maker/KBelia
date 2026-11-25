import QRCode from 'qrcode';

export interface QrSvgOptions {
  size?: number;
  darkColor?: string;
  lightColor?: string;
  includeMonogram?: boolean;
  monogramText?: string;
  className?: string;
}

const escapeXml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * Builds the canonical verification URL encoded inside official KBelia document QR codes.
 */
export const buildVerificationQrPayload = (refCode: string): string => {
  const cleanCode = (refCode || 'REG-2026-BELIA').trim();
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://kbelia.kelantan.my';
  return `${origin}/?verify=${encodeURIComponent(cleanCode)}`;
};

/**
 * Builds a structured merchant business/DuitNow standee verification payload.
 */
export const buildBusinessQrPayload = (
  refOrId: string,
  businessName?: string
): string => {
  const cleanRef = (refOrId || '').trim();
  if (cleanRef) {
    return buildVerificationQrPayload(cleanRef);
  }
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://kbelia.kelantan.my';
  return `${origin}/?verify=${encodeURIComponent((businessName || 'KBELIA-NIAGA').toUpperCase())}`;
};

/**
 * Generates a deterministic short cryptographic-style audit fingerprint for document footers.
 */
export const computeIntegrityChecksum = (seedText: string): string => {
  const input = (seedText || 'KBELIA-2026').trim().toUpperCase();
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 = Math.imul(h2 ^ ch, 0x85ebca6b);
  }
  const partA = ((h1 >>> 0).toString(16).toUpperCase()).padStart(8, '0').slice(0, 4);
  const partB = ((h2 >>> 0).toString(16).toUpperCase()).padStart(8, '0').slice(0, 4);
  const partC = (((h1 ^ h2) >>> 0).toString(16).toUpperCase()).padStart(8, '0').slice(0, 4);
  return `${partA}·${partB}·${partC}`;
};

/**
 * Synchronously generates a real, scannable QR code matrix with Error Correction Level H
 * and returns a crisp standalone SVG string (with optional centered KB monogram seal).
 */
export const generateQrSvgString = (
  payload: string,
  options: QrSvgOptions = {}
): string => {
  const {
    size = 120,
    darkColor = '#0F172A',
    lightColor = '#FFFFFF',
    includeMonogram = true,
    monogramText = 'KB',
    className = ''
  } = options;

  const safePayload = (payload || 'https://kbelia.kelantan.my').trim();
  const qr = QRCode.create(safePayload, { errorCorrectionLevel: 'H' });
  const moduleCount = qr.modules.size;
  const data = qr.modules.data;
  const quietZone = 2;
  const totalUnits = moduleCount + quietZone * 2;

  let pathD = '';
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (data[row * moduleCount + col]) {
        const x = col + quietZone;
        const y = row + quietZone;
        pathD += `M${x},${y}h1v1h-1z`;
      }
    }
  }

  // With ECC H (30% recovery), a centered ~18% badge preserves 100% scannability on all phones
  const badgeSize = Math.max(4, Math.round(totalUnits * 0.19));
  const badgeOffset = (totalUnits - badgeSize) / 2;
  const badgeRadius = Math.max(0.7, badgeSize * 0.22);
  const innerInset = badgeSize * 0.14;
  const center = totalUnits / 2;
  const fontSize = badgeSize * 0.44;

  const monogramOverlay = includeMonogram
    ? `
      <rect x="${badgeOffset.toFixed(2)}" y="${badgeOffset.toFixed(2)}" width="${badgeSize}" height="${badgeSize}" rx="${badgeRadius.toFixed(2)}" fill="#FFFFFF"/>
      <rect x="${(badgeOffset + innerInset).toFixed(2)}" y="${(badgeOffset + innerInset).toFixed(2)}" width="${(badgeSize - innerInset * 2).toFixed(2)}" height="${(badgeSize - innerInset * 2).toFixed(2)}" rx="${(badgeRadius * 0.72).toFixed(2)}" fill="#1E3A8A" stroke="#B45309" stroke-width="${Math.max(0.25, badgeSize * 0.06).toFixed(2)}"/>
      <text x="${center}" y="${(center + fontSize * 0.35).toFixed(2)}" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="${fontSize.toFixed(2)}" letter-spacing="0.04">${escapeXml(monogramText)}</text>
    `
    : '';

  const classAttr = className ? ` class="${escapeXml(className)}"` : '';

  return `<svg${classAttr} width="${size}" height="${size}" viewBox="0 0 ${totalUnits} ${totalUnits}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kod QR Pengesahan Rasmi">
    <rect width="${totalUnits}" height="${totalUnits}" fill="${escapeXml(lightColor)}"/>
    <path d="${pathD}" fill="${escapeXml(darkColor)}" shape-rendering="crispEdges"/>
    ${monogramOverlay}
  </svg>`;
};

/**
 * Generates a high-resolution (1024x1024px) Data URL PNG image of a real scannable QR code
 * with optional branded frame & centered monogram seal.
 */
export const generateHighResQrPngDataUrl = async (
  payload: string,
  options?: {
    sizePx?: number;
    darkColor?: string;
    includeMonogram?: boolean;
    monogramText?: string;
    labelBottom?: string;
    sublabelBottom?: string;
  }
): Promise<string> => {
  const sizePx = options?.sizePx ?? 1024;
  const darkColor = options?.darkColor ?? '#0F172A';
  const includeMonogram = options?.includeMonogram ?? true;
  const monogramText = options?.monogramText ?? 'KB';
  const hasFooter = Boolean(options?.labelBottom);
  const canvasHeight = hasFooter ? Math.round(sizePx * 1.18) : sizePx;

  const qrCanvas = document.createElement('canvas');
  const qrRenderSize = Math.round(sizePx * 0.84);
  await QRCode.toCanvas(qrCanvas, (payload || 'https://kbelia.kelantan.my').trim(), {
    errorCorrectionLevel: 'H',
    width: qrRenderSize,
    margin: 2,
    color: {
      dark: darkColor,
      light: '#FFFFFF'
    }
  });

  const outCanvas = document.createElement('canvas');
  outCanvas.width = sizePx;
  outCanvas.height = canvasHeight;
  const ctx = outCanvas.getContext('2d');
  if (!ctx) {
    return qrCanvas.toDataURL('image/png');
  }

  // Crisp white card background + subtle royal double border
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, sizePx, canvasHeight);

  const pad = Math.round(sizePx * 0.025);
  ctx.strokeStyle = '#1E3A8A';
  ctx.lineWidth = Math.max(4, Math.round(sizePx * 0.006));
  ctx.strokeRect(pad, pad, sizePx - pad * 2, canvasHeight - pad * 2);

  const innerPad = Math.round(sizePx * 0.036);
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = Math.max(2, Math.round(sizePx * 0.0025));
  ctx.strokeRect(innerPad, innerPad, sizePx - innerPad * 2, canvasHeight - innerPad * 2);

  const qrX = Math.round((sizePx - qrRenderSize) / 2);
  const qrY = Math.round(sizePx * 0.08);
  ctx.drawImage(qrCanvas, qrX, qrY, qrRenderSize, qrRenderSize);

  if (includeMonogram) {
    const badgeSize = Math.round(qrRenderSize * 0.19);
    const bx = Math.round(qrX + (qrRenderSize - badgeSize) / 2);
    const by = Math.round(qrY + (qrRenderSize - badgeSize) / 2);
    const r = Math.round(badgeSize * 0.2);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(bx - 8, by - 8, badgeSize + 16, badgeSize + 16, r + 4);
    ctx.fill();

    ctx.fillStyle = '#1E3A8A';
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = Math.max(4, Math.round(badgeSize * 0.05));
    ctx.beginPath();
    ctx.roundRect(bx, by, badgeSize, badgeSize, r);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 ${Math.round(badgeSize * 0.44)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(monogramText, bx + badgeSize / 2, by + badgeSize / 2 + 2);
  }

  if (hasFooter && options?.labelBottom) {
    const textCenterY = sizePx + Math.round((canvasHeight - sizePx) * 0.36);
    ctx.fillStyle = '#1E3A8A';
    ctx.font = `800 ${Math.round(sizePx * 0.036)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.labelBottom, sizePx / 2, textCenterY);

    if (options?.sublabelBottom) {
      ctx.fillStyle = '#475569';
      ctx.font = `600 ${Math.round(sizePx * 0.024)}px monospace`;
      ctx.fillText(options.sublabelBottom, sizePx / 2, textCenterY + Math.round(sizePx * 0.048));
    }
  }

  return outCanvas.toDataURL('image/png');
};

/**
 * Triggers an immediate PNG download of a high-res (1024px) scannable QR code.
 */
export const downloadQrPng = async (
  payload: string,
  fileName: string,
  options?: {
    darkColor?: string;
    includeMonogram?: boolean;
    monogramText?: string;
    labelBottom?: string;
    sublabelBottom?: string;
  }
): Promise<boolean> => {
  try {
    const dataUrl = await generateHighResQrPngDataUrl(payload, {
      sizePx: 1024,
      darkColor: options?.darkColor,
      includeMonogram: options?.includeMonogram,
      monogramText: options?.monogramText,
      labelBottom: options?.labelBottom,
      sublabelBottom: options?.sublabelBottom
    });

    const a = document.createElement('a');
    a.href = dataUrl;
    const cleanName = (fileName || 'Kod_QR_KBelia').replace(/\.png$/i, '') + '.png';
    a.download = cleanName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error('downloadQrPng failed:', err);
    return false;
  }
};
