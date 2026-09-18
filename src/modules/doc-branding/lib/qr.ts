import QRCode from "qrcode";

/** Gera o QR como data URL (PNG) — leve e imprime nítido em 22mm. */
export async function buildQrDataUrl(content: string): Promise<string | undefined> {
  const text = content.trim();
  if (!text) return undefined;
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch {
    return undefined;
  }
}
