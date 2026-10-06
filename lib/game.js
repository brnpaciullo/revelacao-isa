// Regras do jogo, usadas pelas funcoes da Vercel (api/) e pelo servidor local (server/).
import { store } from './store.js';

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

// `now` permite ao cliente sincronizar com o relogio do servidor
export async function getState() {
  const { votes, reveal } = await store.get();
  return { votes, reveal, tallies: tallies(votes), now: Date.now() };
}

// Registra ou troca o voto. Dedup por nome (case-insensitive).
export async function vote(name, choice) {
  const clean = String(name || '').trim().slice(0, 40);
  if (!clean || (choice !== 'verde' && choice !== 'rosa')) return false;
  await store.setVote({ name: clean, choice, ts: Date.now() });
  return true;
}

export function checkPin(pin) {
  return String(pin) === PIN;
}

export async function startReveal(result) {
  if (result !== 'verde' && result !== 'rosa') return false;
  await store.setReveal({ status: 'countdown', result, startedAt: Date.now() + REVEAL_LEAD_MS });
  return true;
}

export async function resetAll() {
  await store.reset();
}
