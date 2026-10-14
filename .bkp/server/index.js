// Servidor local (dev e "Wi-Fi da festa"). Na Vercel quem responde sao as
// funcoes da pasta api/ — aqui elas sao montadas no Express com as mesmas rotas.
import express from 'express';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';
import stateHandler from '../api/state.js';
import voteHandler from '../api/vote.js';
import revealHandler from '../api/reveal.js';
import { PIN } from '../lib/game.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());

app.get('/api/state', stateHandler);
app.post('/api/vote', voteHandler);
app.post('/api/reveal', revealHandler);

// Melhor IP da rede local (prioriza 192.168.x, depois 10.x, evita adaptadores virtuais 172.x)
function localIPs() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  return ips;
}

function bestLanIP() {
  const rank = (ip) => {
    if (ip.startsWith('192.168.')) return 0;
    if (ip.startsWith('10.')) return 1;
    if (ip.startsWith('172.')) return 3; // costuma ser Hyper-V/WSL/Docker
    return 2;
  };
  return localIPs().sort((a, b) => rank(a) - rank(b))[0] || 'localhost';
}

// Info de rede para o QR apontar para o IP desta maquina (so existe localmente;
// na Vercel o QR usa o proprio endereco do site)
app.get('/api/net', (_req, res) => {
  const ip = bestLanIP();
  res.json({ ip, port: Number(PORT), votarUrl: `http://${ip}:${PORT}/votar` });
});

// ---------- Servir o client buildado ----------
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (_req, res) => res.sendFile(join(DIST_DIR, 'index.html')));
}

app.listen(PORT, () => {
  console.log('\n=============================================');
  console.log(`  Cha Revelacao no ar!  (PIN de revelacao: ${PIN})`);
  console.log(`  Local:   http://localhost:${PORT}/votar`);
  for (const ip of localIPs()) {
    console.log(`  Na rede: http://${ip}:${PORT}/votar   <- use este no celular`);
  }
  console.log('=============================================\n');
});
