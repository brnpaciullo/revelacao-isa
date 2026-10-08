import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useLiveState, post, deviceId, REVEAL_DURATION_MS } from '../live.js';
import { unlockAudio, playCelebration } from '../sounds.js';
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
  const { state, apply, offsetRef } = useLiveState(3000);
  const tallies = state?.tallies || { verde: 0, rosa: 0, total: 0 };

  // reflete voto atual se o nome salvo ja estiver registrado
  useEffect(() => {
    const meu = localStorage.getItem(NOME_KEY);
    // com as apostas fechadas nao da mais para trocar: volta a mostrar o voto
    if (!state || !meu || (trocando && state.bettingOpen)) return;
    const v = state.votes.find((x) => x.name.toLowerCase() === meu.normalize('NFC').trim().toLowerCase());
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
    const clean = nome.normalize('NFC').trim();
    if (!clean) {
      setErro('Digite seu nome para registrar a aposta.');
      return;
    }
    if (!escolha) {
      setErro('Escolha um palpite: Menino ou Menina.');
      return;
    }
    unlockAudio();
    const r = await post('/api/vote', { name: clean, choice: escolha, device: deviceId() });
    if (r.ok) {
      // so guarda o nome depois de aceito (senao poderia exibir o voto de outra pessoa)
      localStorage.setItem(NOME_KEY, clean);
      setMeuVoto(escolha);
      setTrocando(false);
      apply(r.state);
    } else if (r.code === 'name-taken') {
      setErro('Esse nome já foi usado por outra pessoa. Use um nome diferente (ex.: com sobrenome).');
    } else if (r.code === 'closed') {
      setErro('As apostas foram encerradas.');
    } else {
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

  // ---------- Revelacao (no relogio do servidor) ----------
  const reveal = state?.reveal;
  const serverNow = Date.now() + offsetRef.current;
  const emRevelacao = reveal?.status === 'countdown' && reveal.result && reveal.startedAt;
  const revelado = emRevelacao && serverNow >= reveal.startedAt + REVEAL_DURATION_MS;
  const apostasAbertas = state?.bettingOpen ?? true;

  // O navegador so libera som depois de um toque na pagina. Quem votou ja tocou,
  // mas quem recarregou a pagina precisa tocar de novo (botao abaixo).
  const [somAtivo, setSomAtivo] = useState(false);
  useEffect(() => {
    if (somAtivo) return;
    const ativar = () => {
      unlockAudio();
      setSomAtivo(true);
    };
    const eventos = ['pointerdown', 'touchend', 'keydown'];
    eventos.forEach((e) => window.addEventListener(e, ativar));
    return () => eventos.forEach((e) => window.removeEventListener(e, ativar));
  }, [somAtivo]);

  // Na hora da explosao: vibra (so Android; o iPhone nao deixa site vibrar), toca a
  // fanfarra, faz a tela tremer e piscar na cor do resultado (funciona no iPhone tambem)
  // e re-renderiza para o resultado aparecer na hora, sem esperar a proxima consulta.
  const [tremendo, setTremendo] = useState(false);
  const vibrou = useRef(null);
  const revelaEm = emRevelacao ? reveal.startedAt + REVEAL_DURATION_MS : null;
  useEffect(() => {
    if (!revelaEm || vibrou.current === revelaEm) return;
    const falta = revelaEm - (Date.now() + offsetRef.current);
    if (falta < -5000) return; // revelacao antiga, nao vibra ao abrir a pagina depois
    const id = setTimeout(() => {
      vibrou.current = revelaEm;
      try {
        navigator.vibrate?.([400, 150, 400, 150, 800]);
      } catch {
        /* navegador sem suporte */
      }
      playCelebration();
      setTremendo(true);
    }, Math.max(0, falta));
    return () => clearTimeout(id);
  }, [revelaEm, offsetRef]);
  useEffect(() => {
    if (!tremendo) return;
    const id = setTimeout(() => setTremendo(false), 2000);
    return () => clearTimeout(id);
  }, [tremendo]);

  // ---------- Resultado no celular ----------
  if (revelado) {
    const menino = reveal.result === 'verde';
    const cravou = meuVoto === reveal.result;
    return (
      <div className={tremendo ? 'page tremer' : 'page'}>
        {tremendo && <div className={`flash-revelacao ${reveal.result}`} />}
        <TopBar />
        <div className="faixa-ouro" />
        <div className="votar-wrap">
          <div className={`confirmacao resultado ${reveal.result}`}>
            <div className="check">{menino ? '💚' : '💗'}</div>
            <h2>{menino ? 'É MENINO!' : 'É MENINA!'}</h2>
            {meuVoto ? (
              <>
                <div className="resultado-palpite">{cravou ? 'Deu green! 🟢🎉' : 'Deu red 🔴😅'}</div>
                <p>
                  {cravou
                    ? `Boa, ${nome.trim()}! Seu palpite estava certo.`
                    : `Não foi dessa vez, ${nome.trim()}. Avanti mesmo assim!`}
                </p>
              </>
            ) : (
              <p>Você não chegou a apostar, mas a festa é sua também. Avanti!</p>
            )}
          </div>
          <p className="rodape">
            <b>AVANTI PALESTRA!</b> <span className="rodape-escudo"><Crest size={18} /></span>
          </p>
        </div>
      </div>
    );
  }

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
            {apostasAbertas ? (
              <div>
                <button className="link-trocar" onClick={trocar}>
                  Cancelar e apostar de novo
                </button>
              </div>
            ) : (
              <div className="aviso-encerrado">
                {emRevelacao ? 'A revelação começou! Olhe o telão 👀' : '🔒 Apostas encerradas'}
              </div>
            )}
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
          {!somAtivo && (
            // o toque em si e tratado pelos eventos globais acima
            <button className="btn-som-celular">🔊 Toque aqui para ouvir a revelação</button>
          )}
        </div>
      </div>
    );
  }

  // ---------- Apostas encerradas (sem voto deste aparelho) ----------
  if (!apostasAbertas) {
    return (
      <div className="page">
        <TopBar />
        <div className="faixa-ouro" />
        <div className="votar-wrap">
          <div className="confirmacao">
            <div className="check">🔒</div>
            <h2>Apostas encerradas</h2>
            <p>
              {emRevelacao
                ? 'A revelação começou! Olhe o telão 👀'
                : 'O mercado fechou. Agora é esperar a revelação!'}
            </p>
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
          {!somAtivo && (
            // o toque em si e tratado pelos eventos globais acima
            <button className="btn-som-celular">🔊 Toque aqui para ouvir a revelação</button>
          )}
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
          <h1 className="titulo">Em quem você vai apostar?</h1>
        </div>

        <div className="cupom">
          <div className="campo-nome">
            <label>Identifique sua aposta (seu nome)</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Bruno tio, Isa mãe, Douglas avô"
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
          <b>AVANTI PALESTRA!</b>
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
