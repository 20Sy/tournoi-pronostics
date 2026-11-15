'use strict';
// Serveur de pronostics - Tournoi Drone FPV
// Aucune dependance : il suffit d'avoir Node.js installe.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');

const VERSION = '1.0.0';

// Les reglages sont dans config.json (cree automatiquement au 1er lancement).
const CONFIG_FILE = path.join(__dirname, 'config.json');
const CONFIG_DEFAUT = {
  nomTournoi: 'Tournoi Drone FPV',
  motDePasseAdmin: null,        // genere au hasard au 1er lancement
  delaiMinutes: 15,             // un prono compte s'il est place au moins X min avant la saisie du resultat
  port: 3000,
  ouvrirNavigateur: true
};
function chargerConfig() {
  let c = {};
  try { if (fs.existsSync(CONFIG_FILE)) c = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
  catch (e) {
    console.error('config.json illisible (' + e.message + '). Corrigez-le ou supprimez-le pour le recreer.');
    process.exit(1);
  }
  const cfg = Object.assign({}, CONFIG_DEFAUT, c);
  let modifie = !fs.existsSync(CONFIG_FILE);
  if (!cfg.motDePasseAdmin) {
    cfg.motDePasseAdmin = crypto.randomBytes(4).toString('hex');
    modifie = true;
  }
  cfg.delaiMinutes = Math.max(0, Number(cfg.delaiMinutes) || 0);
  cfg.port = Number(cfg.port) || 3000;
  if (modifie) fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
  return cfg;
}
const CFG = chargerConfig();
const ADMIN_PASSWORD = String(CFG.motDePasseAdmin);
const DELAI_MIN = CFG.delaiMinutes;
const PORT_DEPART = CFG.port;
const PILOTES_DEFAUT = ['Pilote 1', 'Pilote 2', 'Pilote 3', 'Pilote 4', 'Pilote 5', 'Pilote 6', 'Pilote 7', 'Pilote 8'];
// Scores possibles : 3 = victoire, 2 = termine les 3 tours mais perd, 0 = crash
const SCORES = ['3-2', '2-3', '3-0', '0-3', '0-0'];

const DATA_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

function roundRobin(noms) {
  const arr = noms.slice();
  if (arr.length % 2) arr.push(null);
  const n = arr.length;
  const journees = [];
  for (let r = 0; r < n - 1; r++) {
    const j = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i], b = arr[n - 1 - i];
      if (a && b) j.push([a, b]);
    }
    journees.push(j);
    arr.splice(1, 0, arr.pop()); // rotation, le premier reste fixe
  }
  return journees;
}

function genererMatchs(pilotes) {
  const matchs = [];
  let id = 1;
  roundRobin(pilotes).forEach((j, ji) => {
    j.forEach(([p1, p2]) => {
      matchs.push({ id: id++, journee: ji + 1, p1, p2, score: null, resultAt: null });
    });
  });
  return matchs;
}

function donneesNeuves() {
  return { pilotes: PILOTES_DEFAUT.slice(), matchs: genererMatchs(PILOTES_DEFAUT), parieurs: {}, pronos: {} };
}

let data;
function charger() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      // compatibilite avec l'ancien format (prono = simple texte)
      for (const mid of Object.keys(data.pronos || {})) {
        for (const k of Object.keys(data.pronos[mid])) {
          if (typeof data.pronos[mid][k] === 'string') data.pronos[mid][k] = [{ s: data.pronos[mid][k], t: 0 }];
        }
      }
      data.matchs.forEach(m => { delete m.horaire; if (m.resultAt === undefined) m.resultAt = m.score ? Date.now() : null; });
      return;
    }
  } catch (e) {
    const bak = DATA_FILE.replace('.json', '-corrompu-' + Date.now() + '.json');
    try { fs.renameSync(DATA_FILE, bak); } catch (_) {}
    console.log('Fichier de donnees illisible, sauvegarde dans ' + bak);
  }
  data = donneesNeuves();
  sauver();
}
function sauver() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 1));
}

function statut(m) {
  return m.score ? 'termine' : 'ouvert';
}
// Prono retenu : le dernier place au moins DELAI_MIN avant la saisie du resultat
function pronoRetenu(m, hist) {
  if (!m.resultAt || !hist) return null;
  const limite = m.resultAt - DELAI_MIN * 60000;
  let r = null;
  for (const h of hist) if (h.t <= limite) r = h;
  return r;
}

function hashPin(key, pin) {
  return crypto.createHash('sha256').update(key + ':' + pin).digest('hex');
}
function auth(body) {
  const pseudo = String(body.pseudo || '').trim();
  const key = pseudo.toLowerCase();
  const p = data.parieurs[key];
  if (!p || p.pin !== hashPin(key, String(body.pin || ''))) return null;
  return key;
}

function adressesIP() {
  const ips = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list || []) {
      if (i.family === 'IPv4' && !i.internal) ips.push(i.address);
    }
  }
  return ips;
}

function vueEtat(key) {
  const now = Date.now();
  const matchs = data.matchs.map(m => {
    const st = statut(m);
    const pr = data.pronos[m.id] || {};
    const o = {
      id: m.id, journee: m.journee, p1: m.p1, p2: m.p2,
      score: m.score, resultAt: m.resultAt, statut: st, nbPronos: Object.keys(pr).length
    };
    if (st === 'termine') {
      const rep = {};
      for (const hist of Object.values(pr)) { const r = pronoRetenu(m, hist); if (r) rep[r.s] = (rep[r.s] || 0) + 1; }
      o.repartition = rep;
    }
    if (key && pr[key]) {
      const hist = pr[key], last = hist[hist.length - 1];
      o.monProno = last.s; o.monPronoT = last.t;
      if (st === 'termine') { const r = pronoRetenu(m, hist); o.monRetenu = r ? r.s : null; }
    }
    return o;
  });

  // Classement des pilotes
  const cp = {};
  data.pilotes.forEach(n => { cp[n] = { nom: n, points: 0, joues: 0, v: 0, d: 0, c: 0 }; });
  const compter = (nom, val) => {
    if (!cp[nom]) return;
    const s = cp[nom];
    s.points += val; s.joues++;
    if (val === 3) s.v++; else if (val === 2) s.d++; else s.c++;
  };
  data.matchs.forEach(m => {
    if (!m.score) return;
    const [a, b] = m.score.split('-').map(Number);
    compter(m.p1, a); compter(m.p2, b);
  });
  const classementPilotes = Object.values(cp)
    .sort((x, y) => y.points - x.points || y.v - x.v || x.nom.localeCompare(y.nom));

  // Classement des pronostiqueurs
  const classementParieurs = Object.entries(data.parieurs).map(([k, p]) => {
    let pts = 0, nb = 0;
    data.matchs.forEach(m => {
      const hist = (data.pronos[m.id] || {})[k];
      if (!hist) return;
      nb++;
      const r = pronoRetenu(m, hist);
      if (m.score && r && r.s === m.score) pts++;
    });
    return { pseudo: p.pseudo, points: pts, pronos: nb };
  }).sort((x, y) => y.points - x.points || x.pseudo.localeCompare(y.pseudo));

  return {
    serverTime: now, delai: DELAI_MIN, nomTournoi: CFG.nomTournoi, version: VERSION, scores: SCORES,
    connecte: !!key, pseudo: key ? data.parieurs[key].pseudo : null,
    pilotes: data.pilotes, matchs, classementPilotes, classementParieurs
  };
}

let portActuel = PORT_DEPART;

const routes = {
  'POST /api/state': b => vueEtat(auth(b)),

  'POST /api/entrer': b => {
    const pseudo = String(b.pseudo || '').trim();
    const pin = String(b.pin || '');
    if (pseudo.length < 2 || pseudo.length > 20) throw err(400, 'Pseudo : 2 a 20 caracteres');
    if (!/^\d{4}$/.test(pin)) throw err(400, 'Le code doit faire 4 chiffres');
    const key = pseudo.toLowerCase();
    const ex = data.parieurs[key];
    if (ex) {
      if (ex.pin !== hashPin(key, pin)) throw err(401, 'Ce pseudo existe deja avec un autre code');
      return { pseudo: ex.pseudo, cree: false };
    }
    data.parieurs[key] = { pseudo, pin: hashPin(key, pin) };
    sauver();
    console.log('Nouveau pronostiqueur : ' + pseudo);
    return { pseudo, cree: true };
  },

  'POST /api/prono': b => {
    const key = auth(b);
    if (!key) throw err(401, 'Reconnecte-toi');
    const m = data.matchs.find(x => x.id === Number(b.matchId));
    if (!m) throw err(404, 'Match introuvable');
    if (!SCORES.includes(b.score)) throw err(400, 'Score invalide');
    if (m.score) throw err(403, 'Resultat deja saisi, pronos fermes pour ce match');
    const pm = data.pronos[m.id] = data.pronos[m.id] || {};
    const hist = pm[key] = pm[key] || [];
    const last = hist[hist.length - 1];
    if (!last || last.s !== b.score) {
      hist.push({ s: b.score, t: Date.now() });
      if (hist.length > 30) hist.shift();
    }
    sauver();
    return { ok: true, t: hist[hist.length - 1].t };
  },

  'POST /api/admin/state': b => {
    admin(b);
    return Object.assign(vueEtat(null), { ips: adressesIP(), port: portActuel });
  },

  'POST /api/admin/resultat': b => {
    admin(b);
    const m = data.matchs.find(x => x.id === Number(b.matchId));
    if (!m) throw err(404, 'Match introuvable');
    if (b.score !== null && !SCORES.includes(b.score)) throw err(400, 'Score invalide');
    if (b.score === null) m.resultAt = null;
    else if (!m.score) m.resultAt = Date.now();   // une correction garde l'heure de la 1re saisie
    m.score = b.score;
    sauver();
    console.log(`Resultat match ${m.id} (${m.p1} vs ${m.p2}) : ${b.score || 'efface'}`);
    return { ok: true };
  },

  'POST /api/admin/pilotes': b => {
    admin(b);
    const liste = (Array.isArray(b.liste) ? b.liste : [])
      .map(s => String(s).trim()).filter(Boolean);
    const uniques = [...new Set(liste)];
    if (uniques.length < 2) throw err(400, 'Il faut au moins 2 pilotes');
    data.pilotes = uniques;
    data.matchs = genererMatchs(uniques);
    data.pronos = {};
    sauver();
    return { ok: true, nb: data.matchs.length };
  },

  'POST /api/admin/reset': b => {
    admin(b);
    data = donneesNeuves();
    sauver();
    return { ok: true };
  }
};

function err(code, msg) { const e = new Error(msg); e.code = code; return e; }
function admin(b) { if (b.password !== ADMIN_PASSWORD) throw err(403, 'Mot de passe admin incorrect'); }

function lireCorps(req) {
  return new Promise((res, rej) => {
    let s = '';
    req.on('data', c => { s += c; if (s.length > 1e6) { req.destroy(); rej(err(413, 'Trop gros')); } });
    req.on('end', () => { try { res(s ? JSON.parse(s) : {}); } catch (e) { rej(err(400, 'JSON invalide')); } });
    req.on('error', rej);
  });
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon' };

async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const route = routes[req.method + ' ' + url.pathname];
  if (route) {
    try {
      const body = await lireCorps(req);
      const out = route(body);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(out));
    } catch (e) {
      res.writeHead(e.code >= 400 && e.code < 600 ? e.code : 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      if (!(e.code >= 400 && e.code < 500)) console.error(e);
    }
    return;
  }
  if (req.method === 'GET' && url.pathname === '/admin') { res.writeHead(302, { Location: '/admin.html' }); return res.end(); }
  // fichiers statiques
  let p = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.normalize(path.join(PUBLIC_DIR, decodeURIComponent(p)));
  if (!file.startsWith(PUBLIC_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Page introuvable');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}

function ouvrirNavigateur(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

function demarrer(port) {
  const srv = http.createServer(handler);
  srv.once('error', e => {
    if (e.code === 'EADDRINUSE' && port < PORT_DEPART + 10) {
      console.log(`Port ${port} occupe, essai du port ${port + 1}...`);
      demarrer(port + 1);
    } else {
      console.error('Impossible de demarrer le serveur :', e.message);
      process.exitCode = 1;
    }
  });
  srv.listen(port, '0.0.0.0', () => {
    portActuel = port;
    poserVerrou(port);
    const ips = adressesIP();
    console.log('');
    console.log('=================================================');
    console.log('  ' + CFG.nomTournoi.toUpperCase() + ' - PRONOSTICS v' + VERSION);
    console.log('=================================================');
    console.log('  Page admin (ce PC) : http://localhost:' + port + '/admin.html');
    console.log('  Mot de passe admin : ' + ADMIN_PASSWORD);
    console.log('');
    console.log('  Adresse a donner aux spectateurs (meme WiFi) :');
    if (ips.length) ips.forEach(ip => console.log('     http://' + ip + ':' + port));
    else console.log('     (aucun reseau detecte - connectez ce PC au WiFi)');
    console.log('');
    console.log('  NE FERMEZ PAS CETTE FENETRE pendant le tournoi.');
    console.log('=================================================');
    console.log('');
    if (CFG.ouvrirNavigateur && !process.env.NO_BROWSER) ouvrirNavigateur('http://localhost:' + port + '/admin.html');
  });
}

// Empeche de lancer deux serveurs sur les memes donnees
const LOCK_FILE = path.join(__dirname, '.serveur.lock');
function verifierInstanceUnique() {
  try {
    const l = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
    if (l.pid && l.pid !== process.pid) {
      process.kill(l.pid, 0); // erreur si le processus n'existe plus
      console.log('');
      console.log('Le serveur tourne deja (port ' + l.port + ') dans une autre fenetre.');
      console.log('Page admin : http://localhost:' + l.port + '/admin.html');
      console.log('Pour le redemarrer, fermez d\'abord l\'autre fenetre.');
      if (CFG.ouvrirNavigateur && !process.env.NO_BROWSER) ouvrirNavigateur('http://localhost:' + l.port + '/admin.html');
      process.exitCode = 2;
      return false;
    }
  } catch (e) { /* pas de verrou valide */ }
  return true;
}
function poserVerrou(port) {
  try { fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, port })); } catch (e) {}
  const lever = () => { try { const l = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8')); if (l.pid === process.pid) fs.unlinkSync(LOCK_FILE); } catch (e) {} };
  process.on('exit', lever);
  ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK'].forEach(sig => { try { process.on(sig, () => process.exit(0)); } catch (e) {} });
}

if (verifierInstanceUnique()) {
  charger();
  demarrer(PORT_DEPART);
}
