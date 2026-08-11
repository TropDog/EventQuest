import QRCode from 'qrcode';

export async function buildQrCodeDataUrl(joinUrl: string): Promise<string> {
  return QRCode.toDataURL(joinUrl);
}
