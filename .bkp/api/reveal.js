import { checkPin, startReveal, setBettingClosed, resetAll, getState } from '../lib/game.js';

// Acoes do painel dos organizadores. Todas exigem o PIN.
//   { action: 'verify' }                 -> confere o PIN
//   { action: 'start', result }          -> dispara a revelacao (e encerra as apostas)
//   { action: 'close' } / { action: 'open' } -> encerra / reabre as apostas
//   { action: 'reset' }                  -> apaga votos e revelacao
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const { action, pin, result } = req.body || {};
  if (!checkPin(pin)) return res.status(403).json({ ok: false, error: 'PIN incorreto' });

  if (action === 'verify') return res.status(200).json({ ok: true });
  if (action === 'start') {
    if (!(await startReveal(result))) return res.status(400).json({ ok: false });
  } else if (action === 'close' || action === 'open') {
    await setBettingClosed(action === 'close');
  } else if (action === 'reset') {
    await resetAll();
  } else {
    return res.status(400).json({ ok: false });
  }
  res.status(200).json({ ok: true, state: await getState() });
}
