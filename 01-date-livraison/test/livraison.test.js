'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dateLivraison } = require('../src/livraison.js');

function commande(valideeLe, surCommande = false) {
  return {
    numero: 'CMD-TEST',
    valideeLe,
    lignes: [
      { reference: 'VIS-INOX-4X40', quantite: 1, surCommande: false },
      ...(surCommande ? [{ reference: 'POR-CHENE-83', quantite: 1, surCommande: true }] : []),
    ],
  };
}

test('exemple du ticket : lundi matin, livrée deux jours ouvrés plus tard', () => {
  assert.equal(dateLivraison(commande('2026-11-02T10:00')), '2026-11-04');
});

test('exemple du ticket : vendredi après-midi, le 11 novembre est sauté', () => {
  assert.equal(dateLivraison(commande('2026-11-06T15:00')), '2026-11-12');
});

test('avant 12 h, la commande est préparée le jour même', () => {
  assert.equal(dateLivraison(commande('2026-10-13T11:30')), '2026-10-15');
});

test('à 12 h pile, la commande est préparée le jour ouvré suivant', () => {
  assert.equal(dateLivraison(commande('2026-10-13T12:00')), '2026-10-16');
});

test('un dimanche, la préparation passe au lundi', () => {
  assert.equal(dateLivraison(commande('2026-10-18T09:00')), '2026-10-21');
});

test('un jour férié, la préparation passe au jour ouvré suivant', () => {
  assert.equal(dateLivraison(commande('2026-05-14T09:00')), '2026-05-19');
});

test('un article sur commande repousse la préparation de 5 jours ouvrés', () => {
  assert.equal(dateLivraison(commande('2026-10-13T09:00', true)), '2026-10-22');
});

test('sans article sur commande, aucun délai supplémentaire', () => {
  const sansDelai = commande('2026-10-13T09:00');
  sansDelai.lignes.push({ reference: 'PAU-LAITON', quantite: 2 });
  assert.equal(dateLivraison(sansDelai), '2026-10-15');
});

test('le changement d’année saute le 1er janvier', () => {
  assert.equal(dateLivraison(commande('2026-12-31T10:00')), '2027-01-05');
});
