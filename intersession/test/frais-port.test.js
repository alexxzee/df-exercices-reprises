'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { calculerFraisPort } = require('../src/frais-port');
const commandes = require('../donnees/commandes.json');
const photo = require('./fixtures/frais-port.json');

// Photo enregistree en executant le code d'origine, sans calculer les attendus
// depuis les regles logistiques. Ne pas la regenerer pendant une refactorisation.
test('photo complete des commandes du projet, sans modifier les entrees', () => {
  const avant = structuredClone(commandes);
  const resultats = commandes.map(commande => ({
    numero: commande.numero,
    resultat: calculerFraisPort(commande),
  }));

  assert.deepStrictEqual(resultats, photo.commandes);
  assert.deepStrictEqual(commandes, avant);
});

// Un cas par comportement et par limite, valeurs relevees sur le code d'origine.
for (const cas of photo.cas) {
  test(cas.nom, () => {
    const commande = structuredClone(cas.commande);
    const avant = structuredClone(commande);

    if (cas.erreur) {
      assert.throws(() => calculerFraisPort(commande), cas.erreur);
    } else {
      assert.deepStrictEqual(calculerFraisPort(commande), cas.resultat);
    }

    assert.deepStrictEqual(commande, avant);
  });
}
