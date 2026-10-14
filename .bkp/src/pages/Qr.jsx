import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Crest from '../components/Crest.jsx';

// Pagina imprimivel. Rodando local, o QR aponta para o IP desta maquina na rede
// (o servidor descobre o IP em /api/net); na Vercel /api/net nao existe e o QR
// usa o proprio endereco do site.
export default function Qr() {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    fetch('/api/net')
      .then((r) => r.json())
      .then((d) => setUrl(d.votarUrl))
      .catch(() => setUrl(`${window.location.origin}/votar`));
  }, []);

  return (
    <div className="page">
      <div className="faixa-ouro" />
      <div className="qr-page">
        <div className="qr-cartaz">
          <div className="qr-cartaz-topo">
            <Crest size={64} />
            <div>
              <div className="qr-cartaz-titulo titulo">FAÇA SUA APOSTA!</div>
              <div className="qr-cartaz-sub">Chá Revelação • Menino ou Menina?</div>
            </div>
          </div>

          <div className="qr-cartaz-corpo">
            <p className="qr-instrucao">Aponte a câmera do celular e vote no palpite 👶</p>
            {url ? (
              <div className="qr-quadro">
                <QRCodeCanvas value={url} size={300} level="M" includeMargin />
              </div>
            ) : (
              <div className="qr-quadro qr-quadro-vazio">Gerando QR…</div>
            )}
            {url && <div className="qr-url">{url}</div>}
          </div>

          <div className="qr-cartaz-rodape">
            AVANTI PALESTRA! &nbsp;•&nbsp; brincadeira de palpite, sem valor em dinheiro
          </div>
        </div>

        <div className="qr-acoes no-print">
          <button className="btn-apostar" onClick={() => window.print()}>
            🖨️ Imprimir cartaz
          </button>
          <p className="rodape">
            Deixe este cartaz na entrada da festa. Todos no mesmo Wi-Fi conseguem escanear.
          </p>
        </div>
      </div>
    </div>
  );
}
