import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

interface QrCodeProps {
  valor: string;
}

/**
 * skipLobby: true remove a UI nativa do Playroom (que incluía QR code) — este
 * componente substitui. SVG gerado localmente a partir de `valor` (nossa
 * própria URL de convite), nunca de input de usuário — seguro pra
 * dangerouslySetInnerHTML, mesmo raciocínio de src/icons/Icon.tsx.
 */
export function QrCode({ valor }: QrCodeProps) {
  const svg = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(valor);
    qr.make();
    return qr.createSvgTag({ scalable: true });
  }, [valor]);

  // eslint-disable-next-line react/no-danger
  return <div style={{ width: 220, height: 220 }} dangerouslySetInnerHTML={{ __html: svg }} />;
}
