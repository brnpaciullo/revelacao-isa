// Regras do jogo, usadas pelas funcoes da Vercel (api/) e pelo servidor local (server/).
import { store, storage } from './store.js';

export const PIN = process.env.REVEAL_PIN || '1914'; // ano de fundacao do Palmeiras :)

// A contagem comeca alguns segundos depois do clique, para todas as telas
// (que consultam o servidor a cada ~1,5s) descobrirem a tempo e entrarem juntas.
const REVEAL_LEAD_MS = 3000;

function tallies(votes) {
  let verde = 0;
  let rosa = 0;
  for (const v of votes) {
    if (v.choice === 'verde') verde++;
    else if (v.choice === 'rosa') rosa++;
  }
  return { verde, rosa, total: verde + rosa };
}

// Apostas aceitas so antes de encerrar e antes da revelacao comecar
const isOpen = ({ closed, reveal }) => !closed && reveal.status === 'idle';

// `now` permite ao cliente sincronizar com o relogio do servidor.
// O id do aparelho (`device`) fica so no servidor: se fosse publico, daria para copiar.
export async function getState() {
  const raw = await store.get();
  // normaliza tambem nomes ja gravados antes da correcao
  const votes = raw.votes.map(({ name, choice, ts }) => ({ name: name.normalize('NFC'), choice, ts }));
  return {
    votes,
    reveal: raw.reveal,
    bettingOpen: isOpen(raw),
    tallies: tallies(votes),
    now: Date.now(),
    // ajuda a diagnosticar se o banco (redis) esta conectado
    storage,
  };
}

// Registra ou troca o voto. Dedup por nome (case-insensitive); o nome fica preso
// ao aparelho que votou primeiro, para ninguem trocar o voto de outra pessoa.
// Retorna null se deu certo, ou o motivo da recusa.
export async function vote(name, choice, device) {
  // NFC: alguns celulares mandam o acento separado da letra ("a" + "~"), e a fonte
  // do telao mostra "?" no lugar do acento solto
  const clean = String(name || '').normalize('NFC').trim().slice(0, 40);
  const dev = String(device || '').slice(0, 64);
  if (!clean || !dev || (choice !== 'verde' && choice !== 'rosa')) return 'invalid';
  const raw = await store.get();
  if (!isOpen(raw)) return 'closed';
  const existing = raw.votes.find((v) => v.name.normalize('NFC').toLowerCase() === clean.toLowerCase());
  if (existing?.device && existing.device !== dev) return 'name-taken';
  await store.setVote({ name: clean, choice, ts: Date.now(), device: dev });
  return null;
}

export function checkPin(pin) {
  return String(pin) === PIN;
}

export async function startReveal(result) {
  if (result !== 'verde' && result !== 'rosa') return false;
  await store.setReveal({ status: 'countdown', result, startedAt: Date.now() + REVEAL_LEAD_MS });
  return true;
}

export async function setBettingClosed(closed) {
  await store.setClosed(Boolean(closed));
}

export async function resetAll() {
  await store.reset();
}
