import { useEffect, useState } from 'react';
import { useLiveState, useReveal } from '../live.js';
import { unlockAudio } from '../sounds.js';
import RevealOverlay from '../components/RevealOverlay.jsx';
import Crest from '../components/Crest.jsx';
import { calcOdds, fmtOdd } from '../odds.js';

const SKEW = 8; // "inclinacao" da linha diagonal, em % da largura
const EMPTY = { votes: [], tallies: { verde: 0, rosa: 0, total: 0 }, bettingOpen: true };
const TICKER_SIZE = 12; // quantas apostas recentes passam na faixa

export default function Placar() {
  const { state, connected: conectado, offsetRef } = useLiveState(1500);
  const [revelacao, fecharRevelacao] = useReveal(state, offsetRef);
  const { votes, tallies, bettingOpen } = state || EMPTY;
  // O navegador so libera audio depois de uma interacao com a pagina. Na Smart TV
  // qualquer tecla do controle (setas, OK) conta, nao so o clique no botao.
  const [somAtivo, setSomAtivo] = useState(false);
  useEffect(() => {
    if (somAtivo) return;
    const ativar = () => {
      unlockAudio();
      setSomAtivo(true);
    };
    const eventos = ['keydown', 'pointerdown', 'touchend'];
    eventos.forEach((e) => window.addEventListener(e, ativar));
    return () => eventos.forEach((e) => window.removeEventListener(e, ativar));
  }, [somAtivo]);
  const recentes = [...votes].sort((a, b) => b.ts - a.ts).slice(0, TICKER_SIZE);

  const { verde, rosa, total } = tallies;
  const split = total > 0 ? (verde / total) * 100 : 50; // % que o VERDE ocupa (a partir da esquerda)
  const pctVerde = total > 0 ? Math.round((verde / total) * 100) : 50;
  const pctRosa = 100 - pctVerde;
  const odds = calcOdds(tallies);

  // Rosa fica por cima, recortado numa diagonal; Verde e o fundo cheio.
  const clipRosa = `polygon(${split + SKEW}% 0, 100% 0, 100% 100%, ${split - SKEW}% 100%)`;
  // Costura dourada: uma faixa fina ao longo da diagonal.
  const clipCostura = `polygon(${split + SKEW - 0.7}% 0, ${split + SKEW + 0.7}% 0, ${
    split - SKEW + 0.7
  }% 100%, ${split - SKEW - 0.7}% 100%)`;

  return (
    <div className="placar">
      <div className="lado verde" />
      <div className="lado rosa" style={{ clipPath: clipRosa }} />
      <div className="costura" style={{ clipPath: clipCostura }} />

      <div className="placar-conexao">
        <span className={`dot ${conectado ? 'on' : 'off'}`} />
        {conectado ? 'AO VIVO' : 'reconectando…'}
      </div>

      {!somAtivo && (
        // o clique em si e tratado pelos eventos globais acima
        <button className="btn-ativar-som" autoFocus>
          🔊 Clique (ou aperte OK no controle) para ativar o som
        </button>
      )}

      <div className="placar-topo">
        <Crest size={64} />
        <div className="badge">CHÁ REVELAÇÃO • AVANTI!</div>
      </div>

      <div className="bloco-verde placar-conteudo">
        <div className="lado-nome titulo">MENINO</div>
        <div className="lado-pct titulo">{pctVerde}%</div>
        <div className="lado-votos">💚 {verde} votos</div>
        <div className="lado-odd">ODD {fmtOdd(odds.verde)}</div>
      </div>

      <div className="bloco-rosa placar-conteudo">
        <div className="lado-nome titulo">MENINA</div>
        <div className="lado-pct titulo">{pctRosa}%</div>
        <div className="lado-votos">{rosa} votos 💗</div>
        <div className="lado-odd">ODD {fmtOdd(odds.rosa)}</div>
      </div>

      <div className="placar-total">
        {!bettingOpen && <div className="encerradas">🔒 Apostas encerradas</div>}
        Total de apostas <b>{total}</b>
      </div>

      {recentes.length > 0 && (
        <div className="ticker">
          {/* conteudo duplicado para a faixa rolar sem emenda */}
          <div className="ticker-faixa" style={{ animationDuration: `${recentes.length * 4}s` }}>
            {[...recentes, ...recentes].map((v, i) => (
              <span key={i} className={`ticker-item ${v.choice}`}>
                {v.name} apostou {v.choice === 'verde' ? 'no Menino 💚' : 'na Menina 💗'}
              </span>
            ))}
          </div>
        </div>
      )}

      {revelacao && (
        <RevealOverlay
          key={revelacao.id}
          result={revelacao.result}
          startAt={revelacao.startAt}
          votes={votes}
          onClose={fecharRevelacao}
        />
      )}
    </div>
  );
}
