// Armazenamento do estado (votos + revelacao).
// - Na Vercel: Upstash Redis (variaveis criadas pela integracao do Marketplace).
// - Local (sem variaveis): arquivo server/data.json.
//
// Tudo fica num unico hash do Redis, assim cada leitura do estado e 1 comando so:
//   campo "v:<nome em minusculas>" -> { name, choice, ts }
//   campo "reveal"                 -> { status, result, startedAt }
import { Redis } from '@upstash/redis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const KEY = 'revelacao';
const IDLE = { status: 'idle', result: null, startedAt: null };

// A integracao da Vercel pode criar as variaveis com um prefixo escolhido no painel
// (ex.: STORAGE_KV_REST_API_URL), entao procura pelo final do nome.
function envEndingWith(...suffixes) {
  for (const suffix of suffixes) {
    const name = Object.keys(process.env).find((k) => k === suffix || k.endsWith(`_${suffix}`));
    if (name && process.env[name]) return process.env[name];
  }
  return undefined;
}

const url = envEndingWith('UPSTASH_REDIS_REST_URL', 'KV_REST_API_URL');
const token = envEndingWith('UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_TOKEN');

function redisStore() {
  const redis = new Redis({ url, token });
  return {
    async get() {
      const h = (await redis.hgetall(KEY)) || {};
      const votes = [];
      let reveal = IDLE;
      for (const [field, value] of Object.entries(h)) {
        if (field === 'reveal') reveal = value;
        else if (field.startsWith('v:')) votes.push(value);
      }
      votes.sort((a, b) => a.ts - b.ts);
      return { votes, reveal };
    },
    async setVote(vote) {
      await redis.hset(KEY, { [`v:${vote.name.toLowerCase()}`]: vote });
    },
    async setReveal(reveal) {
      await redis.hset(KEY, { reveal });
    },
    async reset() {
      await redis.del(KEY);
    },
  };
}

function fileStore() {
  const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'server', 'data.json');
  const load = () => {
    try {
      if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf-8'));
    } catch {
      /* arquivo corrompido: comeca do zero */
    }
    return { votes: [], reveal: IDLE };
  };
  const save = (s) => writeFileSync(file, JSON.stringify(s, null, 2));
  return {
    async get() {
      return load();
    },
    async setVote(vote) {
      const s = load();
      const key = vote.name.toLowerCase();
      s.votes = s.votes.filter((v) => v.name.toLowerCase() !== key);
      s.votes.push(vote);
      save(s);
    },
    async setReveal(reveal) {
      const s = load();
      s.reveal = reveal;
      save(s);
    },
    async reset() {
      save({ votes: [], reveal: IDLE });
    },
  };
}

export const storage = url && token ? 'redis' : 'file';
export const store = storage === 'redis' ? redisStore() : fileStore();
