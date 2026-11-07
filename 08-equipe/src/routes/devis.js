'use strict';

const { json, html } = require('../reponses');
const { trouverClient } = require('../donnees');
const { formaterEuros } = require('../utils/format');

function echapperHtml(valeur) {
  const caracteres = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(valeur).replace(/[&<>"']/g, (caractere) => caracteres[caractere]);
}

module.exports = function routesDevis(routeur, donnees) {
  // Liste des devis, filtrée par client si ?client=<id> est donné.
  routeur.get('/devis', (requete) => {
    const client = requete.query.client ? Number(requete.query.client) : null;
    const liste = client === null ? donnees.devis : donnees.devis.filter((devis) => devis.clientId === client);
    return json(200, liste);
  });

  routeur.get('/devis/du-jour', () => {
    const maintenant = new Date();
    const date = [
      maintenant.getFullYear(),
      String(maintenant.getMonth() + 1).padStart(2, '0'),
      String(maintenant.getDate()).padStart(2, '0'),
    ].join('-');
    const devisDuJour = donnees.devis.filter((devis) => devis.date === date);
    const lignes = devisDuJour.map((devis) => {
      const client = trouverClient(donnees, devis.clientId);
      return `<tr><td>${echapperHtml(devis.id)}</td><td style="white-space: pre-wrap">${echapperHtml(client ? client.nom : '')}</td><td>${echapperHtml(formaterEuros(devis.totalTTC))}</td></tr>`;
    });
    const contenu = lignes.length
      ? `<table><thead><tr><th>Numéro</th><th>Client</th><th>Total TTC</th></tr></thead><tbody>${lignes.join('')}</tbody></table>`
      : '<p>Aucun devis aujourd’hui</p>';
    return html(
      200,
      `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Devis du jour</title></head><body><h1>Devis du jour</h1>${contenu}</body></html>`,
    );
  });

  routeur.get('/devis/:id', (requete) => {
    const devis = donnees.devis.find((d) => d.id === Number(requete.params.id));
    if (!devis) return json(404, { erreur: 'Devis introuvable' });
    return json(200, devis);
  });
};
