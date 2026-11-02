'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  arrondir,
  tauxRemiseQuantite,
  calculerLigne,
  calculerDevis,
} = require('../src/devis/calcul.js');

test('arrondir conserve les centimes et arrondit les decimales suivantes', () => {
  for (const [montant, attendu] of [
    [0, 0],
    [12, 12],
    [12.34, 12.34],
    [12.344, 12.34],
    [12.346, 12.35],
    [-12.344, -12.34],
    [-12.346, -12.35],
    [0.1 + 0.2, 0.3],
  ]) {
    assert.equal(arrondir(montant), attendu, `montant : ${montant}`);
  }
});

for (const [quantite, tauxAttendu] of [
  [1, 0],
  [9, 0],
  [10, 0],
  [11, 0.05],
  [49, 0.05],
  [50, 0.08],
  [51, 0.08],
  [99, 0.08],
  [100, 0.12],
  [101, 0.12],
  [1000, 0.12],
]) {
  test(`tauxRemiseQuantite(${quantite}) retourne ${tauxAttendu}`, () => {
    assert.equal(tauxRemiseQuantite(quantite), tauxAttendu);
  });
}

test('calculerLigne retourne les informations du produit et les montants sans remise', () => {
  assert.deepEqual(calculerLigne({ reference: 'DF-01', prix_ht: 12.5 }, 10), {
    reference: 'DF-01',
    quantite: 10,
    prixUnitaire: 12.5,
    brut: 125,
    remise: 0,
    net: 125,
  });
});

for (const [quantite, brut, remise, net] of [
  [11, 110, 5.5, 104.5],
  [50, 500, 40, 460],
  [100, 1000, 120, 880],
]) {
  test(`calculerLigne applique la remise pour ${quantite} unites`, () => {
    assert.deepEqual(calculerLigne({ reference: 'DF-02', prix_ht: 10 }, quantite), {
      reference: 'DF-02',
      quantite,
      prixUnitaire: 10,
      brut,
      remise,
      net,
    });
  });
}

test('calculerLigne arrondit separement le brut, la remise et le net', () => {
  assert.deepEqual(calculerLigne({ reference: 'DF-03', prix_ht: 1.234 }, 11), {
    reference: 'DF-03',
    quantite: 11,
    prixUnitaire: 1.234,
    brut: 13.57,
    remise: 0.68,
    net: 12.9,
  });
});

test('calculerLigne refuse les quantites qui ne sont pas des entiers strictement positifs', () => {
  const produit = { reference: 'DF-04', prix_ht: 10 };
  for (const quantite of [0, -1, 1.5, '10', null, undefined, true, NaN, Infinity]) {
    assert.throws(() => calculerLigne(produit, quantite), {
      name: 'Error',
      message: 'Quantité invalide',
    });
  }
});

test('calculerDevis refuse une liste vide ou une valeur qui ne soit pas un tableau', () => {
  for (const lignes of [[], undefined, null, {}, 'ligne', 1]) {
    assert.throws(() => calculerDevis({}, lignes), {
      name: 'Error',
      message: 'Un devis contient au moins une ligne',
    });
  }
});

test('calculerDevis propage une erreur de quantite dans une ligne', () => {
  assert.throws(() => calculerDevis({}, [
    { produit: { reference: 'DF-05', prix_ht: 10 }, quantite: 1 },
    { produit: { reference: 'DF-06', prix_ht: 20 }, quantite: 0 },
  ]), { name: 'Error', message: 'Quantité invalide' });
});

test('calculerDevis ajoute le port avant de calculer la TVA et le TTC', () => {
  assert.deepEqual(calculerDevis({ grand_compte: false }, [
    { produit: { reference: 'DF-07', prix_ht: 10 }, quantite: 2 },
  ]), {
    lignes: [{ reference: 'DF-07', quantite: 2, prixUnitaire: 10, brut: 20, remise: 0, net: 20 }],
    totalBrut: 20,
    remiseClient: 0,
    port: 25,
    totalHT: 45,
    tva: 9,
    totalTTC: 54,
  });
});

for (const [prix, port, totalHT, tva, totalTTC] of [
  [499.99, 25, 524.99, 105, 629.99],
  [500, 0, 500, 100, 600],
  [500.01, 0, 500.01, 100, 600.01],
]) {
  test(`calculerDevis determine le port au seuil de ${prix} euros nets`, () => {
    const devis = calculerDevis({}, [
      { produit: { reference: 'DF-08', prix_ht: prix }, quantite: 1 },
    ]);
    assert.equal(devis.remiseClient, 0);
    assert.equal(devis.port, port);
    assert.equal(devis.totalHT, totalHT);
    assert.equal(devis.tva, tva);
    assert.equal(devis.totalTTC, totalTTC);
  });
}

test('calculerDevis applique la remise grand compte sur la somme des nets des lignes', () => {
  assert.deepEqual(calculerDevis({ grand_compte: true }, [
    { produit: { reference: 'DF-09', prix_ht: 20 }, quantite: 10 },
    { produit: { reference: 'DF-10', prix_ht: 10 }, quantite: 50 },
  ]), {
    lignes: [
      { reference: 'DF-09', quantite: 10, prixUnitaire: 20, brut: 200, remise: 0, net: 200 },
      { reference: 'DF-10', quantite: 50, prixUnitaire: 10, brut: 500, remise: 40, net: 460 },
    ],
    totalBrut: 700,
    remiseClient: 33,
    port: 0,
    totalHT: 627,
    tva: 125.4,
    totalTTC: 752.4,
  });
});

test('calculerDevis utilise le net apres remise de quantite pour determiner le port', () => {
  const devis = calculerDevis({}, [
    { produit: { reference: 'DF-11', prix_ht: 10 }, quantite: 50 },
  ]);
  assert.equal(devis.totalBrut, 500);
  assert.equal(devis.port, 25);
  assert.equal(devis.totalHT, 485);
  assert.equal(devis.tva, 97);
  assert.equal(devis.totalTTC, 582);
});

test('calculerDevis utilise le net apres remise grand compte pour determiner le port', () => {
  const devis = calculerDevis({ grand_compte: true }, [
    { produit: { reference: 'DF-12', prix_ht: 500 }, quantite: 1 },
  ]);
  assert.equal(devis.remiseClient, 25);
  assert.equal(devis.port, 25);
  assert.equal(devis.totalHT, 500);
  assert.equal(devis.tva, 100);
  assert.equal(devis.totalTTC, 600);
});

for (const [prix, port, totalHT, tva, totalTTC] of [
  [526.31, 25, 524.99, 105, 629.99],
  [526.32, 0, 500, 100, 600],
]) {
  test(`calculerDevis compare le net non arrondi au seuil de port pour ${prix} euros`, () => {
    const devis = calculerDevis({ grand_compte: true }, [
      { produit: { reference: 'DF-13', prix_ht: prix }, quantite: 1 },
    ]);
    assert.equal(devis.remiseClient, 26.32);
    assert.equal(devis.port, port);
    assert.equal(devis.totalHT, totalHT);
    assert.equal(devis.tva, tva);
    assert.equal(devis.totalTTC, totalTTC);
  });
}

test('calculerDevis somme les montants deja arrondis de chaque ligne', () => {
  const devis = calculerDevis({}, [
    { produit: { reference: 'DF-14', prix_ht: 0.335 }, quantite: 1 },
    { produit: { reference: 'DF-15', prix_ht: 0.335 }, quantite: 1 },
  ]);
  assert.equal(devis.totalBrut, 0.68);
  assert.equal(devis.totalHT, 25.68);
  assert.equal(devis.tva, 5.14);
  assert.equal(devis.totalTTC, 30.82);
});
