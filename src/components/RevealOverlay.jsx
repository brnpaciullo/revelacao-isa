import { useEffect, useRef, useState } from 'react';
import Confetti from './Confetti.jsx';
import { REVEAL_DURATION_MS } from '../live.js';
import { playTick, playRoll, playCelebration, playSong, stopSong } from '../sounds.js';

// Som do estouro dos fogos (so menino); quando termina, entra a musica do resultado.
const BOOM_SOUND = '/acabou-acabou-e-tetra-e-teeetraaa.mp3';

// Musica por resultado. Se o arquivo faltar, cai na fanfarra sintetizada.
const SONGS = {
  verde: '/hino-palmeiras.mp3',
  rosa: '/hino-palmeiras.mp3',
};

const EXPLODE_AT = REVEAL_DURATION_MS;
const COUNT_FROM = EXPLODE_AT / 1000;

// Menino: "Acabou, acabou, e tetra!" junto com os fogos e, ao terminar, a musica do
// resultado. Menina: direto a musica do resultado.
function playExplosionSound(result) {
  const src = SONGS[result];
  const playResultSong = () => {
    if (src) playSong(src, () => playCelebration());
    else playCelebration();
  };
  if (result === 'verde') playSong(BOOM_SOUND, playResultSong, playResultSong);
  else playResultSong();
}

// Nomes em grade (lado a lado). Se nao couberem no espaco, a grade rola sozinha,
// desce e volta, porque no telao ninguem vai rolar a lista na mao.
const ROLAGEM_PX_POR_SEG = 25;

function ListaNomes({ votos }) {
  const caixa = useRef(null);
  const grade = useRef(null);
  const [sobra, setSobra] = useState(0); // px que nao cabem na caixa

  useEffect(() => {
    const medir = () => {
      if (!caixa.current || !grade.current) return;
      setSobra(Math.max(0, grade.current.offsetHeight - caixa.current.clientHeight));
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [votos.length]);

  if (votos.length === 0) return <div className="nomes-vazio">Ninguém…</div>;
  const rolagem = sobra
    ? { '--rolagem': -sobra + 'px', animationDuration: Math.max(6, sobra / ROLAGEM_PX_POR_SEG) + 's' }
    : undefined;
  return (
    <div className="nomes-caixa" ref={caixa}>
      <ul ref={grade} className={sobra ? 'nomes-grade rolando' : 'nomes-grade'} style={rolagem}>
        {votos.map((v, i) => (
          <li key={i}>{v.name}</li>
        ))}
      </ul>
    </div>
  );
}

// Fases: 'wait' (antes do horario marcado) -> 'countdown' (10..1) -> 'explode'.
// A linha do tempo segue startAt (horario combinado pelo servidor), entao todas as
// telas contam juntas, mesmo quem descobriu a revelacao um pouco depois.
// props: result ('verde'|'rosa'), startAt (ms, relogio local), votes (array), onClose (fn)
export default function RevealOverlay({ result, startAt, votes, onClose }) {
  const [elapsed, setElapsed] = useState(() => Date.now() - startAt);
  const lastN = useRef(null);
  const exploded = useRef(false);

  const done = elapsed >= EXPLODE_AT;
  useEffect(() => {
    if (done) return; // depois da explosao nao precisa mais acompanhar o relogio
    const id = setInterval(() => setElapsed(Date.now() - startAt), 100);
    return () => clearInterval(id);
  }, [startAt, done]);

  const phase = elapsed < 0 ? 'wait' : elapsed < EXPLODE_AT ? 'countdown' : 'explode';
  const n = COUNT_FROM - Math.floor(Math.max(elapsed, 0) / 1000);

  // Sons: um tambor a cada numero, rufar no ultimo, musica na explosao
  useEffect(() => {
    if (phase === 'countdown' && n !== lastN.current) {
      lastN.current = n;
      playTick();
      if (n === 1) playRoll(0.9);
    }
    if (phase === 'explode' && !exploded.current) {
      exploded.current = true;
      playExplosionSound(result);
    }
  }, [phase, n, result]);

  // Ao fechar/reiniciar a revelacao (desmontar o overlay), para a musica.
  useEffect(() => stopSong, []);

  if (phase !== 'explode') {
    return (
      <div className="reveal-overlay">
        <div className="contagem-label">Segura o coração…</div>
        {phase === 'countdown' && (
          <div className="contagem-num" key={n}>
            {n}
          </div>
        )}
      </div>
    );
  }

  // ---- Explosao ----
  const menino = result === 'verde';
  const acertaram = votes.filter((v) => v.choice === result);
  const erraram = votes.filter((v) => v.choice !== result);
  const confColors = menino
    ? ['#ffffff', '#17c964', '#5bf39a', '#f0d060']
    : ['#ffffff', '#e5897f', '#d3574e', '#f0d060'];

  return (
    <div className={`explosao ${result}`}>
      <Confetti colors={confColors} />

      <div className="anuncio">{menino ? 'É MENINO!' : 'É MENINA!'}</div>
      <div className="subanuncio">
        {menino ? 'Avanti, garotão! 💚' : 'Avanti, princesa! 💗'}
      </div>

      <div className="placares-palpite">
        <div className="coluna-palpite acertou">
          <h4>🟢 Deu green ({acertaram.length})</h4>
          <ListaNomes votos={acertaram} />
        </div>
        <div className="coluna-palpite errou">
          <h4>🔴 Deu red ({erraram.length})</h4>
          <ListaNomes votos={erraram} />
        </div>
      </div>

      {onClose && (
        <button className="reveal-fechar" onClick={onClose}>
          Fechar
        </button>
      )}
    </div>
  );
}
