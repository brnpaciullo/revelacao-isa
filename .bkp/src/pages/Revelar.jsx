import { useState } from 'react';
import { useLiveState, useReveal, post } from '../live.js';
import { unlockAudio } from '../sounds.js';
import RevealOverlay from '../components/RevealOverlay.jsx';
import Crest from '../components/Crest.jsx';

const EMPTY = { votes: [], tallies: { verde: 0, rosa: 0, total: 0 } };

export default function Revelar() {
  const [autorizado, setAutorizado] = useState(false);
  const [pin, setPin] = useState('');
  const [pinErro, setPinErro] = useState('');
  const [resultado, setResultado] = useState(null); // 'verde' | 'rosa'

  const { state, apply, offsetRef } = useLiveState(1500);
  const [revelacao, fecharRevelacao] = useReveal(state, offsetRef);
  const { votes, tallies } = state || EMPTY;

  async function validarPin(e) {
    e.preventDefault();
    setPinErro('');
    unlockAudio();
    const r = await post('/api/reveal', { action: 'verify', pin });
    if (r.ok) setAutorizado(true);
    else setPinErro('PIN incorreto. Tente de novo.');
  }

  async function iniciarRevelacao() {
    if (!resultado) return;
    setPinErro('');
    unlockAudio();
    const sentAt = Date.now();
    const r = await post('/api/reveal', { action: 'start', result: resultado, pin });
    if (r.ok) apply(r.state, sentAt);
    else setPinErro('Não foi possível iniciar a revelação. Tente de novo.');
  }

  async function alternarApostas() {
    setPinErro('');
    const sentAt = Date.now();
    const action = state?.bettingOpen ? 'close' : 'open';
    const r = await post('/api/reveal', { action, pin });
    if (r.ok) apply(r.state, sentAt);
    else setPinErro('Não foi possível alterar as apostas. Tente de novo.');
  }

  async function reiniciarTudo() {
    if (!window.confirm('Apagar TODOS os votos e voltar ao estado inicial? Isso não tem volta.')) return;
    const sentAt = Date.now();
    const r = await post('/api/reveal', { action: 'reset', pin });
    if (r.ok) {
      apply(r.state, sentAt);
      setResultado(null);
    }
  }

  // ---------- Gate de PIN ----------
  if (!autorizado) {
    return (
      <div className="page">
        <TopBar />
        <div className="faixa-ouro" />
        <div className="admin-wrap">
          <form className="pin-box" onSubmit={validarPin}>
            <Crest size={64} />
            <h1 className="titulo" style={{ marginTop: 12 }}>Área dos organizadores</h1>
            <p>Digite o PIN de 4 dígitos para controlar a revelação.</p>
            <input
              className="pin-input"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              placeholder="••••"
              autoFocus
            />
            {pinErro && <div className="erro-msg" style={{ marginTop: 16 }}>{pinErro}</div>}
            <div style={{ marginTop: 18 }}>
              <button className="btn-revelar" type="submit" disabled={pin.length !== 4}>
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------- Painel autorizado ----------
  return (
    <div className="page">
      <TopBar />
      <div className="faixa-ouro" />
      <div className="admin-wrap">
        <div className="admin-stats">
          <div className="stat-tile verde">
            <div className="n titulo">{tallies.verde}</div>
            <div className="l">💚 Menino</div>
          </div>
          <div className="stat-tile rosa">
            <div className="n titulo">{tallies.rosa}</div>
            <div className="l">💗 Menina</div>
          </div>
          <div className="stat-tile total">
            <div className="n titulo">{tallies.total}</div>
            <div className="l">Apostas</div>
          </div>
        </div>

        <div className="admin-card">
          <h1 className="titulo">Mercado de apostas</h1>
          <p className="dica">
            {state?.bettingOpen
              ? '🟢 Apostas ABERTAS. Encerre alguns minutos antes da revelação, como numa casa de apostas.'
              : '🔒 Apostas ENCERRADAS. Ninguém consegue votar nem trocar o voto.'}
          </p>
          <button
            className={state?.bettingOpen ? 'btn-encerrar' : 'btn-ghost'}
            onClick={alternarApostas}
            disabled={!state || state.reveal.status !== 'idle'}
          >
            {state?.bettingOpen ? '🔒 Encerrar apostas' : '🔓 Reabrir apostas'}
          </button>
        </div>

        <div className="admin-card">
          <h1 className="titulo">Qual é o resultado real?</h1>
          <p className="dica">
            Escolha o sexo verdadeiro do bebê e dispare a revelação. Todos os telões e esta tela
            entram na contagem regressiva juntos. As apostas fecham na hora e cada celular mostra
            o resultado quando a contagem termina.
          </p>

          <div className="escolha-resultado">
            <button
              className={`escolha-btn verde ${resultado === 'verde' ? 'sel' : ''}`}
              onClick={() => setResultado('verde')}
            >
              💚 MENINO
            </button>
            <button
              className={`escolha-btn rosa ${resultado === 'rosa' ? 'sel' : ''}`}
              onClick={() => setResultado('rosa')}
            >
              💗 MENINA
            </button>
          </div>

          <button className="btn-revelar" onClick={iniciarRevelacao} disabled={!resultado}>
            🎉 Iniciar revelação
          </button>
          {pinErro && <div className="erro-msg" style={{ marginTop: 14 }}>{pinErro}</div>}
        </div>

        <div className="admin-card">
          <p className="dica" style={{ marginBottom: 12 }}>
            Zona de teste — use antes da festa e limpe tudo depois para não misturar com os votos
            de verdade.
          </p>
          <button className="btn-reset" onClick={reiniciarTudo}>
            🗑️ Reiniciar tudo (apagar votos)
          </button>
        </div>

        <p className="rodape">
          Abra o <b><a href="/placar" style={{ color: '#f0d060' }}>/placar</a></b> no telão da festa. Avanti Palestra!
        </p>
      </div>

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

function TopBar() {
  return (
    <div className="topbar">
      <Crest size={44} />
      <div className="marca">
        VERDÃO REVELA
        <small>PAINEL DE REVELAÇÃO</small>
      </div>
      <nav className="nav-links">
        <a href="/votar">Votar</a>
        <a href="/placar">Placar</a>
      </nav>
    </div>
  );
}
