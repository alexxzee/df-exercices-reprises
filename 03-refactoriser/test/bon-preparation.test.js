// Tests de caractérisation : ils figent ce que le code fait aujourd'hui,
// y compris ce qui paraît faux. Rien n'est corrigé ici.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { editerBonPreparation } = require('../src/bon-preparation');
const commandes = require('../donnees/commandes.json');
const catalogue = require('../donnees/catalogue.json');
const stocks = require('../donnees/stocks.json');
const attendus = require('./attendus/bons-du-2026-11-02.json');

// Entrée cachée fixée : la date du jour ne sert qu'à « Édité le ».
const LE_2_NOVEMBRE = new Date(2026, 10, 2);

function commande(numero) {
  return commandes.find((c) => c.numero === numero);
}

function bon(numero) {
  return editerBonPreparation(commande(numero), catalogue, stocks, LE_2_NOVEMBRE);
}

// Lignes d'articles : entre la ligne vide qui suit l'en-tête et celle qui précède le pied.
function lignesArticles(texte) {
  const lignes = texte.split('\n');
  const debut = lignes.indexOf('') + 1;
  const fin = lignes.indexOf('', debut);
  return lignes.slice(debut, fin);
}

// 1. Photo d'ensemble : les 9 commandes, sortie complète.
for (const c of commandes) {
  test('photo : bon complet de la commande ' + c.numero, () => {
    assert.equal(bon(c.numero), attendus[c.numero]);
  });
}

// 2. En-tête
test('urgente : la première ligne est *** URGENT ***', () => {
  assert.equal(bon('2026-0411').split('\n')[0], '*** URGENT ***');
});

test('non urgente : la première ligne est le numéro du bon', () => {
  assert.equal(bon('2026-0410').split('\n')[0], 'BON DE PRÉPARATION N° 2026-0410');
});

test('client sur 40 colonnes, puis date limite en JJ/MM/AAAA', () => {
  assert.equal(
    bon('2026-0412').split('\n')[1],
    'Client : Bâti-Sud Rénovation            Préparer avant : 05/11/2026',
  );
});

test('client de plus de 40 colonnes : nom entier, date collée derrière', () => {
  const longue = { ...commande('2026-0410'), client: 'Société Nouvelle Électricité du Comminges' };
  assert.equal(
    editerBonPreparation(longue, catalogue, stocks, LE_2_NOVEMBRE).split('\n')[1],
    'Client : Société Nouvelle Électricité du CommingesPréparer avant : 04/11/2026',
  );
});

test('Édité le : date du jour en JJ/MM/AAAA, avec zéros', () => {
  const texte = editerBonPreparation(commande('2026-0410'), catalogue, stocks, new Date(2026, 0, 5));
  assert.equal(texte.split('\n')[2], 'Édité le : 05/01/2026');
});

test('sans date du jour, la date de la machine est utilisée', () => {
  const texte = editerBonPreparation(commande('2026-0410'), catalogue, stocks);
  assert.match(texte.split('\n')[2], /^Édité le : \d\d\/\d\d\/\d{4}$/);
});

// 3. Ordre des lignes
test('tri par allée puis emplacement, quel que soit l’ordre saisi', () => {
  assert.deepEqual(
    lignesArticles(bon('2026-0410')).map((l) => l.slice(0, 6).trim()),
    ['A-03', 'A-07', 'B-12'],
  );
});

test('article sans allée et référence inconnue placés en fin', () => {
  assert.equal(lignesArticles(bon('2026-0417'))[2].slice(0, 16), '--    REF-6020  ');
  assert.equal(lignesArticles(bon('2026-0413'))[2].slice(0, 16), '--    REF-7777  ');
});

// 4. Libellé
test('libellé de 28 caractères : affiché entier', () => {
  assert.equal(lignesArticles(bon('2026-0411'))[0].slice(16, 46), 'Plaque de plâtre BA13 2,60 m  ');
});

test('libellé de plus de 28 caractères : coupé à 28, suivi de …', () => {
  assert.equal(lignesArticles(bon('2026-0414'))[0].slice(16, 46), 'Interrupteur différentiel 40… ');
});

// 5. Statuts
test('stock suffisant : En stock', () => {
  assert.match(lignesArticles(bon('2026-0410'))[0], /x 6   En stock$/);
});

test('stock insuffisant : Partiel (stock/quantité)', () => {
  assert.match(lignesArticles(bon('2026-0412'))[1], /x 2   Partiel \(1\/2\)$/);
});

test('référence absente des stocks : Rupture', () => {
  assert.match(lignesArticles(bon('2026-0411'))[2], /x 2   Rupture$/);
});

test('référence absente du catalogue : Réf. inconnue', () => {
  assert.equal(
    lignesArticles(bon('2026-0413'))[2],
    '--    REF-7777  ?                             x 3   Réf. inconnue',
  );
});

// Comportement figé tel quel, question posée au métier :
// un stock saisi à 0 donne « Partiel (0/n) », pas « Rupture ».
test('stock saisi à 0 : Partiel (0/quantité), comportement actuel figé', () => {
  assert.match(lignesArticles(bon('2026-0418'))[0], /x 5   Partiel \(0\/5\)$/);
});

// 6. Mentions
test('article fragile : mention [FRAGILE]', () => {
  assert.match(lignesArticles(bon('2026-0413'))[1], / \[FRAGILE\]$/);
});

test('poids de plus de 25 kg : mention [2 PERS.]', () => {
  assert.match(lignesArticles(bon('2026-0411'))[0], / \[2 PERS\.\]$/);
});

test('poids de 25 kg tout juste : aucune mention', () => {
  assert.match(lignesArticles(bon('2026-0413'))[0], /En stock$/);
});

// 7. Quantités et pied
test('quantité 0 : ligne ignorée, absente du pied', () => {
  const texte = bon('2026-0415');
  assert.ok(!texte.includes('REF-4210'));
  assert.match(texte, /Lignes : 2 \| Articles : 60\n$/);
});

test('même référence sur deux lignes : deux lignes, non fusionnées', () => {
  const lignes = lignesArticles(bon('2026-0416'));
  assert.equal(lignes.filter((l) => l.includes('REF-3307')).length, 2);
  assert.match(bon('2026-0416'), /Lignes : 3 \| Articles : 11\n$/);
});

test('pied : nombre de lignes et somme des quantités', () => {
  assert.match(bon('2026-0411'), /\n\nLignes : 3 \| Articles : 34\n$/);
});
