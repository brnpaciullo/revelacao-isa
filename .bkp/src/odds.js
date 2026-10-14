// Odds no modelo de apostas mutuas (parimutuel), como no turfe/bolao:
// todas as apostas formam um bolo e quem acerta divide o bolo inteiro.
//   odd do lado = total do bolo / apostas naquele lado
// Sem margem da casa: a odd e exatamente o retorno de quem acertar.
//
// A "banca" abre o mercado com 1 aposta em cada lado (SEED). Isso evita odd
// infinita quando um lado ainda nao tem votos e faz o mercado abrir em 2.00 x 2.00.
// O efeito some conforme os votos entram.
const SEED = 1;

export function calcOdds({ verde = 0, rosa = 0 } = {}) {
  const v = verde + SEED;
  const r = rosa + SEED;
  const bolo = v + r;
  return { verde: bolo / v, rosa: bolo / r };
}

export function fmtOdd(odd) {
  return odd.toFixed(2);
}
