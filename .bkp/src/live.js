import { useCallback, useEffect, useRef, useState } from 'react';

// Estado ao vivo por "polling": cada tela pergunta ao servidor a cada poucos
// segundos (as funcoes da Vercel nao mantem conexao aberta, entao nao ha WebSocket).
// Pausa quando a aba esta escondida, para nao gastar requisicoes a toa. O telao passa
// pausar=false: alguns navegadores de Smart TV dizem que a aba esta escondida mesmo
// na tela, e o placar ficaria parado.
export function useLiveState(intervalMs = 1500, pausar = true) {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(true);
  // diferenca entre o relogio do servidor e o deste aparelho
  const offsetRef = useRef(0);

  const apply = useCallback((s, sentAt = Date.now()) => {
    if (!s) return;
    const receivedAt = Date.now();
    offsetRef.current = s.now - (sentAt + receivedAt) / 2;
    setState(s);
  }, []);

  useEffect(() => {
    let timer;
    let stopped = false;
    async function poll() {
      clearTimeout(timer);
      if (pausar && document.hidden) return;
      const sentAt = Date.now();
      try {
        const r = await fetch('/api/state', { cache: 'no-store' });
        if (!r.ok) throw new Error(r.status);
        apply(await r.json(), sentAt);
        setConnected(true);
      } catch {
        setConnected(false);
      }
      if (!stopped) timer = setTimeout(poll, intervalMs);
    }
    const onVisible = () => !document.hidden && poll();
    document.addEventListener('visibilitychange', onVisible);
    poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs, pausar, apply]);

  return { state, connected, apply, offsetRef };
}

export async function post(path, body) {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json().catch(() => ({ ok: false }));
}

// Duracao da contagem regressiva, do inicio ate a explosao.
export const REVEAL_DURATION_MS = 10000;

// Contagem + tempo para quem abre a pagina atrasado ainda pegar a revelacao.
// Depois disso, uma revelacao antiga gravada no servidor nao reabre sozinha.
const REVEAL_RESUME_MS = REVEAL_DURATION_MS + 2000;

// Decide quando abrir/fechar a tela de revelacao a partir do estado do servidor.
// Retorna { result, startAt } (startAt no relogio deste aparelho) e uma funcao para fechar.
export function useReveal(state, offsetRef) {
  const [revelacao, setRevelacao] = useState(null);
  const dismissed = useRef(null);

  useEffect(() => {
    const r = state?.reveal;
    if (!r || r.status !== 'countdown' || !r.result || !r.startedAt) {
      setRevelacao(null);
      return;
    }
    if (dismissed.current === r.startedAt) return;
    const startAt = r.startedAt - offsetRef.current;
    if (Date.now() - startAt > REVEAL_RESUME_MS) return;
    setRevelacao((cur) =>
      cur && cur.id === r.startedAt ? cur : { id: r.startedAt, result: r.result, startAt },
    );
  }, [state, offsetRef]);

  const close = useCallback(() => {
    setRevelacao((cur) => {
      if (cur) dismissed.current = cur.id;
      return null;
    });
  }, []);

  return [revelacao, close];
}

// Id aleatorio deste aparelho, usado para prender o nome ao celular de quem votou.
const DEVICE_KEY = 'revelacao:device';
export function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`.replace('.', '');
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'sem-storage';
  }
}
