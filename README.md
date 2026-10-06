# 🌴 Verdão Revela — Chá Revelação estilo casa de apostas

Web app de **chá revelação** com votação ao vivo, placar animado (divisão diagonal Verde × Rosa)
e tela de revelação sincronizada em todos os dispositivos. Visual com identidade do **Palmeiras**
(verde/branco/dourado, clima de arquibancada) — **menino = Verde** 💚, **menina = Rosa** 💗.

> É uma brincadeira de palpite. **Não há dinheiro real** envolvido em momento nenhum.

## 🧩 Como funciona (arquitetura)

- **Funções da Vercel** (`api/`) recebem votos e comandos do painel. Os votos ficam no
  **Upstash Redis** (na Vercel) ou no arquivo `server/data.json` (rodando localmente).
- As telas consultam `/api/state` a cada 1,5–3s (*polling*) — placar e odds atualizam sozinhos.
- **Odds** no modelo de apostas mútuas: `odd = total de apostas ÷ apostas naquele lado`
  (a casa abre com 1 aposta em cada lado, para começar em 2.00 × 2.00). Ver `src/odds.js`.
- A revelação é disparada pelo painel `/revelar`: o servidor marca o horário de início
  (3s no futuro) e todas as telas contam juntas pelo relógio do servidor.
- Som da revelação: menino → "Acabou, acabou, é tetra!" e depois o hino; menina → hino.

As três rotas:

- `/votar`  → votação (celular)
- `/placar` → telão (TV)
- `/revelar`→ painel dos organizadores (PIN)

## ☁️ Publicar na Vercel (acessível de qualquer lugar)

1. Em [vercel.com](https://vercel.com) → **Add New → Project** → importe este repositório do GitHub.
   A Vercel detecta Vite sozinha → **Deploy**.
2. No projeto → **Storage → Create Database → Upstash (Redis)**, plano grátis, e conecte ao
   projeto. As variáveis de conexão são criadas automaticamente.
3. **Settings → Environment Variables** → adicione `REVEAL_PIN` com o PIN que quiser.
4. **Deployments → Redeploy** para aplicar banco e PIN.
5. Links: convidados `.../votar` • telão `.../placar` • organizadores `.../revelar`.

## 🚀 Rodar localmente

Requisitos: Node.js 18+.

```bash
npm install
npm run dev        # cliente em http://localhost:5173/votar (servidor na 3001)
```

### 📶 Só na Wi-Fi da festa (sem internet)

```bash
npm run build      # gera a pasta dist/
npm start          # servidor único na porta 3001
```

O terminal mostra algo como:

```
Na rede: http://192.168.0.15:3001/votar   <- use este no celular
```

> No Windows, se os celulares não abrirem, libere a porta no Firewall:
> Painel de Controle → Firewall → permitir o Node.js em redes privadas.

## 🔐 PIN da revelação

- Padrão: **`1914`**. Troque definindo a variável de ambiente `REVEAL_PIN`.
  - Local: `REVEAL_PIN=4321 npm start` (no PowerShell: `$env:REVEAL_PIN="4321"; npm start`)
  - Vercel: defina em *Settings → Environment Variables*.

## 📲 QR Code

Na tela `/votar` há o botão **"Mostrar QR"** — gera o QR apontando para a própria `/votar`.
Abra no computador, aperte o botão e imprima/print para deixar na entrada da festa.

## 🧪 Testando antes da festa

1. Vote de vários celulares/abas em `/votar`.
2. Acompanhe o `/placar` animando.
3. Em `/revelar`, entre com o PIN, escolha Menino/Menina e clique **Iniciar revelação**.
4. Depois de testar, use **Reiniciar tudo** para zerar os votos.

## 🗂️ Estrutura

```
revelacao/
├─ api/                # funções da Vercel: state, vote, reveal
├─ lib/                # regras do jogo + armazenamento (Upstash Redis ou data.json)
├─ server/index.js     # servidor local (Express) usando as mesmas funções
├─ vercel.json         # rotas do app (SPA)
├─ index.html
├─ vite.config.js
└─ src/
   ├─ main.jsx         # rotas
   ├─ live.js          # polling do estado + sincronização da revelação
   ├─ odds.js          # cálculo das odds
   ├─ sounds.js        # tambores + músicas da revelação
   ├─ index.css        # tema Palmeiras
   ├─ components/      # Crest, Confetti, RevealOverlay
   └─ pages/           # Votar, Placar, Revelar
```

Avanti Palestra! 🌴
