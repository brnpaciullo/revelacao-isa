import { vote, getState } from '../lib/game.js';

const ERRORS = {
  invalid: [400, 'Dados invalidos'],
  closed: [409, 'Apostas encerradas'],
  'name-taken': [409, 'Esse nome ja foi usado por outra pessoa'],
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const { name, choice, device } = req.body || {};
  const fail = await vote(name, choice, device);
  if (fail) {
    const [status, error] = ERRORS[fail];
    return res.status(status).json({ ok: false, code: fail, error });
  }
  res.status(200).json({ ok: true, state: await getState() });
}
