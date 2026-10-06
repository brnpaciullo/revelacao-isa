import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useLiveState, post } from '../live.js';
import { unlockAudio } from '../sounds.js';
import Crest from '../components/Crest.jsx';
import { calcOdds, fmtOdd } from '../odds.js';

const NOME_KEY = 'revelacao:nome';

export default function Votar() {
  const [nome, setNome] = useState(() => localStorage.getItem(NOME_KEY) || '');
  const [escolha, setEscolha] = useState(null);
  const [meuVoto, setMeuVoto] = useState(null); // 'verde' | 'rosa' quando ja votou
  const [trocando, setTrocando] = useState(false); // clicou em 'apostar de novo'
  const [erro, setErro] = useState('');
  const [mostrarQR, setMostrarQR] = useState(false);
  const [lanUrl, setLanUrl] = useState(null); // URL da /votar apontando pro IP da maquina (so local)

  // Tela de voto atualiza com menos frequencia (economiza requisicoes dos celulares)
  const { state, apply } = useLiveState(3000);
  const tallies = state?.tallies || { verde: 0, rosa: 0, total: 0 };

  // reflete voto atual se o nome salvo ja estiver registrado
  useEffect(() => {
    const meu = localStorage.getItem(NOME_KEY);
    if (!state || !meu || trocando) return;
    const v = state.votes.find((x) => x.name.toLowerCase() === meu.trim().toLowerCase());
    setMeuVoto(v ? v.choice : null);
  }, [state, trocando]);

  useEffect(() => {
    fetch('/api/net')
      .then((r) => r.json())
      .then((d) => setLanUrl(d.votarUrl))
      .catch(() => {});
  }, []);

  async function apostar() {
    setErro('');
    const clean = nome.trim();
    if (!clean) {
      setErro('Digite seu nome para registrar a aposta.');
      return;
    }
    if (!escolha) {
      setErro('Escolha um palpite: Menino ou Menina.');
      return;
    }
    unlockAudio();
    localStorage.setItem(NOME_KEY, clean);
    setMeuVoto(escolha);
    setTrocando(false);
    const r = await post('/api/vote', { name: clean, choice: escolha });
    if (r.ok) apply(r.state);
    else {
      setMeuVoto(null);
      setErro('Não foi possível registrar a aposta. Tente de novo.');
    }
  }

  function trocar() {
    setTrocando(true);
    setMeuVoto(null);
    setEscolha(null);
  }

  const odds = calcOdds(tallies);
  const votarUrl = lanUrl || `${window.location.origin}/votar`;

  // ---------- Tela de confirmacao ----------
  if (meuVoto) {
    const menino = meuVoto === 'verde';
    return (
      <div className="page">
        <TopBar />
        <div className="faixa-ouro" />
        <div className="votar-wrap">
          <div className="confirmacao">
            <div className="check">🎟️</div>
            <h2>Aposta registrada!</h2>
            <p>
              Valeu, <b>{nome.trim()}</b>! Sua fé tá no palpite{' '}
              {menino ? 'do Menino 💚' : 'da Menina 💗'}.
            </p>
            <div className={`pill ${meuVoto}`}>
              {menino ? '💚 APOSTOU NO MENINO' : '💗 APOSTOU NA MENINA'}
            </div>
            <p>
              Odd atual: <b>{fmtOdd(odds[meuVoto])}</b> (muda conforme a galera aposta)
            </p>
            <div>
              <button className="link-trocar" onClick={trocar}>
                Cancelar e apostar de novo
              </button>
            </div>
          </div>

          <div className="mini-stat">
            <span>
              💚 Menino: <b>{tallies.verde}</b>
            </span>
            <span>
              💗 Menina: <b>{tallies.rosa}</b>
            </span>
            <span>
              Total: <b>{tallies.total}</b>
            </span>
          </div>
          <p className="rodape">
            Fique de olho no telão pra <b>REVELAÇÃO</b>. Avanti Palestra!
          </p>
        </div>
      </div>
    );
  }

  // ---------- Tela de aposta ----------
  return (
    <div className="page">
      <TopBar />
      <div className="faixa-ouro" />
      <div className="votar-wrap">
        <div className="aposta-header">
          <div className="chamada">Casa de Apostas do Verdão • só de brincadeira</div>
          <h1 className="titulo">Em quem você vai apostar?</h1>
          <div className="sub">Palpite o sexo do bebê. Sem dinheiro, só honra de torcedor.</div>
        </div>

        <div className="cupom">
          <div className="campo-nome">
            <label>Identifique sua aposta (seu nome)</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Tio Palmeirense"
              maxLength={40}
              autoComplete="name"
            />
          </div>

          <div className="odds-grid">
            <button
              className={`odd-card verde ${escolha === 'verde' ? 'selecionado' : ''}`}
              onClick={() => {
                unlockAudio();
                setEscolha('verde');
              }}
            >
              <div className="time-label">Time do</div>
              <div className="time-nome titulo">Menino</div>
              <div className="odd-valor">{fmtOdd(odds.verde)}</div>
            </button>
            <button
              className={`odd-card rosa ${escolha === 'rosa' ? 'selecionado' : ''}`}
              onClick={() => {
                unlockAudio();
                setEscolha('rosa');
              }}
            >
              <div className="time-label">Time da</div>
              <div className="time-nome titulo">Menina</div>
              <div className="odd-valor">{fmtOdd(odds.rosa)}</div>
            </button>
          </div>

          {erro && <div className="erro-msg" style={{ marginTop: 14 }}>{erro}</div>}

          <button className="btn-apostar" onClick={apostar} disabled={!escolha || !nome.trim()}>
            {escolha === 'verde'
              ? 'Apostar no Menino 💚'
              : escolha === 'rosa'
                ? 'Apostar na Menina 💗'
                : 'Faça sua aposta'}
          </button>
        </div>

        <div className="mini-stat">
          <span>
            💚 <b>{tallies.verde}</b>
          </span>
          <span>
            💗 <b>{tallies.rosa}</b>
          </span>
          <span>
            Apostas: <b>{tallies.total}</b>
          </span>
        </div>

        <button className="btn-ghost" onClick={() => setMostrarQR((v) => !v)}>
          {mostrarQR ? 'Esconder QR Code' : '📲 Mostrar QR pra chamar a galera'}
        </button>
        {mostrarQR && (
          <div className="qr-box">
            <h3>Aponte e aposte!</h3>
            <QRCodeCanvas value={votarUrl} size={220} level="M" includeMargin />
            <p>{votarUrl}</p>
          </div>
        )}

        <p className="rodape">
          <b>AVANTI PALESTRA!</b> — jogo de palpite, sem valor em dinheiro.
        </p>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="topbar">
      <Crest size={44} />
      <div className="marca">
        VERDÃO REVELA
        <small>CHÁ REVELAÇÃO</small>
      </div>
      <nav className="nav-links">
        <a href="/placar">Placar</a>
      </nav>
    </div>
  );
}
