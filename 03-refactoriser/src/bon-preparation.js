// Bon de préparation imprimé par l'entrepôt pour chaque commande.
// La sortie est figée par les tests de caractérisation : toute différence est une régression.
'use strict';

const LARGEUR_CLIENT = 40;
const LARGEUR_EMPLACEMENT = 6;
const LARGEUR_REFERENCE = 10;
const LARGEUR_LIBELLE = 30;
const LARGEUR_QUANTITE = 6;
const LIBELLE_MAX = 28;
const POIDS_DEUX_PERSONNES = 25;
// Les articles sans allée sont rangés en zone de réception : en fin de bon.
const CLE_SANS_ALLEE = 'ZZZ';

function colonne(texte, largeur) {
  return String(texte).padEnd(largeur).substring(0, largeur);
}

function deuxChiffres(nombre) {
  return String(nombre).padStart(2, '0');
}

function dateDepuisIso(dateIso) {
  const [annee, mois, jour] = dateIso.split('-');
  return jour + '/' + mois + '/' + annee;
}

function dateDuJour(date) {
  return deuxChiffres(date.getDate()) + '/' + deuxChiffres(date.getMonth() + 1) + '/' + date.getFullYear();
}

function enTete(commande, aujourdHui) {
  let texte = '';
  if (commande.urgente === true) {
    texte += '*** URGENT ***\n';
  }
  texte += 'BON DE PRÉPARATION N° ' + commande.numero + '\n';
  // Un nom de client trop long n'est pas coupé : il décale la date, comme sur les bons actuels.
  texte += ('Client : ' + commande.client).padEnd(LARGEUR_CLIENT);
  texte += 'Préparer avant : ' + dateDepuisIso(commande.dateLimite) + '\n';
  texte += 'Édité le : ' + dateDuJour(aujourdHui) + '\n';
  return texte;
}

function lignesAPreparer(commande, catalogue) {
  return commande.lignes
    .filter((ligne) => ligne.quantite !== 0)
    .map((ligne) => ({
      ref: ligne.ref,
      quantite: ligne.quantite,
      // Le dernier article du catalogue qui porte la référence l'emporte, comme dans le code d'origine.
      article: catalogue.findLast((article) => article.ref === ligne.ref) || null,
    }));
}

function cleDeTri(ligne) {
  if (ligne.article === null || !ligne.article.allee) {
    return CLE_SANS_ALLEE;
  }
  return ligne.article.allee + '-' + ligne.article.emplacement;
}

function trierParEmplacement(lignes) {
  // Tri stable : deux lignes au même emplacement gardent l'ordre de la commande.
  return [...lignes].sort((a, b) => {
    const cleA = cleDeTri(a);
    const cleB = cleDeTri(b);
    if (cleA === cleB) return 0;
    return cleA > cleB ? 1 : -1;
  });
}

function libelleCourt(libelle) {
  return libelle.length > LIBELLE_MAX ? libelle.substring(0, LIBELLE_MAX) + '…' : libelle;
}

function statut(stock, quantite) {
  // Question au métier : un stock saisi à 0 donne « Partiel (0/n) » et non « Rupture ».
  // Comportement conservé tel quel en attendant leur réponse.
  if (stock === undefined) return 'Rupture';
  if (stock >= quantite) return 'En stock';
  return 'Partiel (' + stock + '/' + quantite + ')';
}

function mentions(article) {
  let texte = '';
  if (article.fragile === true) texte += ' [FRAGILE]';
  if (article.poids > POIDS_DEUX_PERSONNES) texte += ' [2 PERS.]';
  return texte;
}

function colonnes(emplacement, ref, libelle, quantite) {
  return (
    colonne(emplacement, LARGEUR_EMPLACEMENT) +
    colonne(ref, LARGEUR_REFERENCE) +
    colonne(libelle, LARGEUR_LIBELLE) +
    colonne('x ' + quantite, LARGEUR_QUANTITE)
  );
}

function ligneDuBon(ligne, stocks) {
  const article = ligne.article;
  if (article === null) {
    return colonnes('--', ligne.ref, '?', ligne.quantite) + 'Réf. inconnue';
  }
  const emplacement = article.allee ? article.allee + '-' + article.emplacement : '--';
  return (
    colonnes(emplacement, ligne.ref, libelleCourt(article.libelle), ligne.quantite) +
    statut(stocks[ligne.ref], ligne.quantite) +
    mentions(article)
  );
}

function piedDePage(lignes) {
  const articles = lignes.reduce((total, ligne) => total + ligne.quantite, 0);
  return 'Lignes : ' + lignes.length + ' | Articles : ' + articles + '\n';
}

function editerBonPreparation(commande, catalogue, stocks, aujourdHui) {
  const lignes = trierParEmplacement(lignesAPreparer(commande, catalogue));
  const corps = lignes.map((ligne) => ligneDuBon(ligne, stocks) + '\n').join('');
  return enTete(commande, aujourdHui ?? new Date()) +'\n' + corps + '\n' + piedDePage(lignes);
}

module.exports = { editerBonPreparation };
