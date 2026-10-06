import { vote, getState } from '../lib/game.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const { name, choice } = req.body || {};
  if (!(await vote(name, choice))) {
    return res.status(400).json({ ok: false, error: 'Dados invalidos' });
  }
  res.status(200).json({ ok: true, state: await getState() });
}
