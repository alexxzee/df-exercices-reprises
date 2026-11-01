'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Les jours fériés viennent du fichier tenu par la logistique, jamais d'une liste dans le code.
const JOURS_FERIES = new Set(
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'donnees', 'jours-feries.json'), 'utf8')),
);

const HEURE_LIMITE = 12;
const DELAI_SUR_COMMANDE = 5;
const DELAI_LIVRAISON = 2;

// On calcule sur des dates « calendaires » en UTC pour qu'aucun changement d'heure
// ni fuseau horaire ne décale le jour.
function versDate(texte) {
  const [annee, mois, jour] = texte.split('-').map(Number);
  return new Date(Date.UTC(annee, mois - 1, jour));
}

function versTexte(date) {
  return date.toISOString().slice(0, 10);
}

function estOuvre(date) {
  const jourSemaine = date.getUTCDay();
  return jourSemaine !== 0 && jourSemaine !== 6 && !JOURS_FERIES.has(versTexte(date));
}

function jourSuivant(date) {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

function ajouterJoursOuvres(date, nombre) {
  let resultat = date;
  for (let i = 0; i < nombre; i++) {
    resultat = jourSuivant(resultat);
    while (!estOuvre(resultat)) resultat = jourSuivant(resultat);
  }
  return resultat;
}

function jourDePreparation(commande) {
  const [jour, heure] = commande.valideeLe.split('T');
  let preparation = versDate(jour);
  const heures = Number(heure.split(':')[0]);
  if (!estOuvre(preparation) || heures >= HEURE_LIMITE) {
    preparation = ajouterJoursOuvres(preparation, 1);
  }
  const surCommande = commande.lignes.some((ligne) => ligne.surCommande === true);
  return surCommande ? ajouterJoursOuvres(preparation, DELAI_SUR_COMMANDE) : preparation;
}

function dateLivraison(commande) {
  return versTexte(ajouterJoursOuvres(jourDePreparation(commande), DELAI_LIVRAISON));
}

module.exports = { dateLivraison };
