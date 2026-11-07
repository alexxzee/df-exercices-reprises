'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { creerApp } = require('../src/app');

// Attendus tirés de docs/page-devis-du-jour.md, règles 1 à 5.
function figerJourLocal(contexte) {
  const fuseauInitial = process.env.TZ;
  process.env.TZ = 'Europe/Paris';
  contexte.after(() => {
    if (fuseauInitial === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = fuseauInitial;
    }
  });
  // Le 26 octobre à Paris, mais encore le 25 en UTC : règle 2, jour local.
  contexte.mock.timers.enable({
    apis: ['Date'],
    now: new Date('2026-10-26T00:30:00+01:00'),
  });
}

function consulter(donnees) {
  return creerApp(donnees).traiter({
    methode: 'GET',
    chemin: '/devis/du-jour',
  });
}

function texteHtml(html) {
  const entites = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: '\u00a0',
  };
  // Décoder après avoir retiré les balises garde les caractères HTML affichés.
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, entite) => {
      if (entite.toLowerCase().startsWith('#x')) {
        return String.fromCodePoint(parseInt(entite.slice(2), 16));
      }
      if (entite.startsWith('#')) {
        return String.fromCodePoint(parseInt(entite.slice(1), 10));
      }
      return entites[entite.toLowerCase()];
    });
}

test('Règle 1 : GET /devis/du-jour rend une page HTML', (contexte) => {
  figerJourLocal(contexte);
  const reponse = consulter({ clients: [], devis: [] });

  assert.equal(reponse.statut, 200);
  assert.match(reponse.type, /^text\/html\b/i);
  assert.match(reponse.corps, /<(?:!doctype html|html|body|main|h1|p)\b/i);
});

for (const { date, libelle, attendu } of [
  { date: '2026-10-25', libelle: 'hier, juste avant le jour', attendu: false },
  { date: '2026-10-26', libelle: 'aujourd’hui, sur le jour', attendu: true },
  { date: '2026-10-27', libelle: 'demain, juste après le jour', attendu: false },
]) {
  test(`Règle 2 : ${libelle} : devis ${attendu ? 'inclus' : 'exclu'}`, (contexte) => {
    figerJourLocal(contexte);
    const nom = 'Client témoin du filtre journalier';
    const reponse = consulter({
      clients: [{ id: 51, nom }],
      devis: [{ id: 741001, clientId: 51, date, totalHT: 1000, totalTTC: 1200 }],
    });
    const texte = texteHtml(reponse.corps);

    assert.equal(reponse.statut, 200);
    assert.equal(texte.includes(nom), attendu);
    assert.equal(texte.includes('741001'), attendu);
  });
}

test('Règle 2 : la liste mêlée garde tous les devis du jour local et eux seuls', (contexte) => {
  figerJourLocal(contexte);
  const reponse = consulter({
    clients: [
      { id: 1, nom: 'Client de la veille' },
      { id: 2, nom: 'Premier client du jour' },
      { id: 3, nom: 'Second client du jour' },
      { id: 4, nom: 'Client du lendemain' },
    ],
    devis: [
      { id: 741010, clientId: 1, date: '2026-10-25', totalHT: 1, totalTTC: 1.2 },
      { id: 741011, clientId: 2, date: '2026-10-26', totalHT: 2, totalTTC: 2.4 },
      { id: 741012, clientId: 3, date: '2026-10-26', totalHT: 3, totalTTC: 3.6 },
      { id: 741013, clientId: 4, date: '2026-10-27', totalHT: 4, totalTTC: 4.8 },
    ],
  });
  const texte = texteHtml(reponse.corps);

  assert.ok(texte.includes('Premier client du jour'));
  assert.ok(texte.includes('Second client du jour'));
  assert.ok(!texte.includes('Client de la veille'));
  assert.ok(!texte.includes('Client du lendemain'));
  assert.ok(!texte.includes('741010'));
  assert.ok(!texte.includes('741013'));
});

test('Règle 3 : chaque devis affiche son numéro, son client et son TTC français', (contexte) => {
  figerJourLocal(contexte);
  const reponse = consulter({
    clients: [
      { id: 61, nom: 'Matériaux des Alpes' },
      { id: 62, nom: 'Atelier du Rhône' },
    ],
    devis: [
      {
        id: 852001,
        clientId: 61,
        date: '2026-10-26',
        totalHT: 1000,
        totalTTC: 1234.5,
      },
      {
        id: 852002,
        clientId: 62,
        date: '2026-10-26',
        totalHT: 35,
        totalTTC: 42.75,
      },
    ],
  });
  // Les espaces ordinaires, insécables et insécables fines sont français.
  const texte = texteHtml(reponse.corps).replace(/[\u00a0\u202f]/g, ' ');

  for (const valeur of ['852001', 'Matériaux des Alpes', '1 234,50 €', '852002', 'Atelier du Rhône', '42,75 €']) {
    assert.ok(texte.includes(valeur), `Valeur attendue par la règle 3 : ${valeur}`);
  }
});

for (const nom of [
  'Établissements Noël, 東京 😀 Cafe\u0301',
  `Delmas & Fils <b>"L’Atelier"</b> 'Bois' &amp; &#233;`,
  'Client <img src=x onerror="alert(741020)"><script>alert(741021)</script>',
]) {
  test(`Règle 4 : nom affiché fidèlement et sans injection : ${nom}`, (contexte) => {
    figerJourLocal(contexte);
    const reponse = consulter({
      clients: [{ id: 71, nom }],
      devis: [
        {
          id: 963001,
          clientId: 71,
          date: '2026-10-26',
          totalHT: 10,
          totalTTC: 12,
        },
      ],
    });

    assert.ok(texteHtml(reponse.corps).includes(nom));
    assert.doesNotMatch(reponse.corps, /<img\b[^>]*onerror\s*=/i);
    assert.doesNotMatch(reponse.corps, /<script\b[^>]*>\s*alert\(741021\)/i);
  });
}

test('Règle 5 : sans aucun devis, affiche « Aucun devis aujourd’hui »', (contexte) => {
  figerJourLocal(contexte);
  const reponse = consulter({ clients: [], devis: [] });

  assert.equal(reponse.statut, 200);
  assert.ok(texteHtml(reponse.corps).includes('Aucun devis aujourd’hui'));
});

test('Règle 5 : avec seulement des devis hors du jour, affiche le message vide', (contexte) => {
  figerJourLocal(contexte);
  const reponse = consulter({
    clients: [{ id: 81, nom: 'Client hors du jour' }],
    devis: [
      { id: 974001, clientId: 81, date: '2026-10-25', totalHT: 10, totalTTC: 12 },
      { id: 974002, clientId: 81, date: '2026-10-27', totalHT: 20, totalTTC: 24 },
    ],
  });

  assert.equal(reponse.statut, 200);
  assert.ok(texteHtml(reponse.corps).includes('Aucun devis aujourd’hui'));
});
