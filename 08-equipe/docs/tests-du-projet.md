# Tests du projet

À lire avant d’écrire un test.

Données de démonstration : src/donnees.js, fictives. creerDonnees() rend une copie neuve à chaque appel.

Clients (identifiant, nom, ville) :
- 1, Bâti Rhône SARL, Lyon, grand compte
- 2, Menuiserie Garnier, Villeurbanne
- 3, Isol’Est Rénovation, Bron (apostrophe typographique dans le nom)
- 4, Carrelages du Val, Vienne
- 5, Couvertures Faure, Givors
- 6, Plâtrerie Moulin, Écully
- 7, Habitat Concept 69, Caluire, grand compte
- 8, Électricité Perret, Oullins
Grands comptes : clients 1 et 7 seulement (grandCompte: true).
Un identifiant de client absent (0, 42, 99) rend 404 avec le corps { erreur: 'Client introuvable' }.

Devis (identifiant, client, date, total HT, total TTC) :
- 1, client 2, 2026-10-05, 412,50 €, 495,00 €
- 2, client 1, 2026-10-05, 3 180,00 €, 3 816,00 €
- 3, client 4, 2026-10-06, 96,40 €, 115,68 €
- 4, client 7, 2026-10-08, 1 250,00 €, 1 500,00 €
- 5, client 3, 2026-10-08, 640,25 €, 768,30 €
- 6, client 5, 2026-10-09, 75,00 €, 90,00 €
- 7, client 6, 2026-10-12, 2 045,80 €, 2 454,96 €
- 8, client 8, 2026-10-12, 318,00 €, 381,60 €
Un identifiant de devis absent rend 404 avec le corps { erreur: 'Devis introuvable' }.

Dates : chaînes AAAA-MM-JJ, du 2026-10-05 au 2026-10-12. Aucun devis de démonstration n’est daté d’aujourd’hui.
Montants : nombres, en euros. formaterEuros (src/utils/format.js) écrit 1 234,50 € avec des espaces insécables : un test compare à la sortie de formaterEuros, jamais à un texte tapé au clavier.
Types de contenu (src/reponses.js) : 'application/json; charset=utf-8' pour le JSON, 'text/html; charset=utf-8' pour une page.

Aide de test : test/aide.js, deux fonctions, à utiliser dans tout nouveau test de route.
- appelerRoute(chemin, donnees) : construit l’application sur donnees (creerDonnees() si absent), envoie GET chemin, rend { statut, type, corps, objet } ; objet est le corps lu en JSON, ou null pour une page.
- attendreErreur(reponse, statut, message) : vérifie le statut, le type JSON et le corps { erreur: message }.
Exemple : attendreErreur(appelerRoute('/devis/99'), 404, 'Devis introuvable');
Les tests déjà écrits n’utilisent pas l’aide : ne les réécris pas.

Échappement HTML : dans une page, un texte venu des données est échappé. & devient &amp;, < devient &lt;, > devient &gt;, " devient &quot;, ' devient &#39;.
Un test de page compare le texte après lecture de ces entités, pas le HTML brut.
