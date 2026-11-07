# Compte rendu d’exemple de chef-equipe

Fichier de la formation : ne pas modifier.

Compte rendu final réel de `chef-equipe`, rendu par Codex (codex-cli 0.165.0, modèle `gpt-6.1-sol`, effort `high`) le 2 novembre 2026, sur la demande de l’étape 3. Il est recopié sans retouche, sauf les tirets des titres, remplacés par une virgule. Il sert à faire l’étape 5 si votre équipe n’a pas abouti. Le défaut `/devis/%ZZ` qu’il signale a été corrigé depuis dans `src/routeur.js`.

## Réponse finale

La page `/devis/du-jour` est ajoutée : date locale, TTC français et noms fidèles, avec échappement HTML et conservation des blancs.

**21 tests réussis.** ESLint, Prettier et Gitleaks passent. La relecture valide le nouveau rendu.

Un défaut préexistant reste signalé : `/devis/%ZZ` peut provoquer une exception susceptible d’arrêter le serveur. Il concerne des fichiers pédagogiques protégés, laissés intacts.

## Compte rendu des agents, consignes initiales exactes et résultats

**Explorateur, consigne :**
> Lis .codex/agents/explorateur.toml et applique ses consignes. En lecture seule, repère les fichiers et règles utiles pour ajouter docs/page-devis-du-jour.md, le routage, les données, le formatage et les tests existants. Rends les références fichier:ligne, les imports, les voisins écartés et les ambiguïtés, en 15 lignes maximum. Ne lis aucun .env.

**Rendu :** route statique à placer avant `/devis/:id`, helpers et contrats repérés avec références.
Contrat public confirmé ; fuseau et client absent non précisés dans la spec.

**Dev-web, consigne :**
> Lis .codex/agents/dev-web.toml, AGENTS.md et docs/page-devis-du-jour.md. Implémente la page dans src/routes/devis.js uniquement (et si nécessaire un nouveau utilitaire src/utils/html.js). Lis src/reponses.js, src/donnees.js, src/utils/format.js et src/routeur.js pour leurs contrats. Place GET /devis/du-jour avant /devis/:id, filtre la date locale du serveur, affiche id, nom client exact et TTC français, échappe les données dans le HTML et affiche le texte vide prescrit. Réutilise les outils existants, aucune dépendance. Tu partages le dépôt avec le testeur : ne réécris pas ses changements. Lance npm test puis rends fichiers modifiés, résultat et doutes. Ne lis aucun .env ; aucun commit ni installation.

**Rendu :** seul `src/routes/devis.js` modifié ; page implémentée, formatage corrigé et blancs des noms préservés.
21 tests réussis ; un client absent produit un nom vide, cas non spécifié.

**Testeur, consigne :**
> Lis .codex/agents/testeur.toml, AGENTS.md et docs/page-devis-du-jour.md. Écris uniquement test/devis-du-jour.test.js depuis cette spec, sans lire src/ ni déduire les attendus du code. Contrat public : require('../src/app').creerApp(donnees).traiter({ methode: 'GET', chemin: '/devis/du-jour' }) rend { statut, type, corps }. Données : { clients: [{ id, nom }], devis: [{ id, clientId, date: 'AAAA-MM-JJ', totalHT, totalTTC }] }. Couvre HTML, aujourd’hui inclus et hier/demain exclus, numéro/client/TTC français, noms contenant caractères HTML et Unicode affichés fidèlement sans injection, liste vide. Fixe l’horloge pour éviter des tests dépendants du jour ; le jour retenu est local au serveur. Noms des tests commençant par « Règle N », attendus justifiés par la spec. Tu partages le dépôt avec dev-web : ne réécris pas ses changements. Lance npm test, laisse tout échec visible et rends fichiers, résultats et ambiguïtés. Aucune dépendance, aucun .env, commit ou installation.

**Rendu :** 11 nouveaux tests dans `test/devis-du-jour.test.js`, écrits sans lire `src/`.
Dates limites, jour local, montants, Unicode, injection et listes vides couverts ; 21 tests réussis au total.

**Auditeur, consigne :**
> Lis .codex/agents/auditeur.toml et audite en lecture seule src/routes/devis.js et ses données utilisées, au regard de docs/page-devis-du-jour.md. Vérifie particulièrement le rendu fidèle et sûr des noms clients et autres valeurs dans le HTML. Rends le tableau prescrit avec fichier:ligne et les limites. Aucun .env, aucune modification.

**Rendu :** aucune faille trouvée dans le nouveau rendu, confirmation après les corrections.
Défaut préexistant dans `src/routeur.js:19` et `src/serveur.js:16` ; affichage dans un navigateur réel non vérifié.

**Outilleur, consigne :**
> Lis .codex/agents/outilleur.toml et docs/boite-a-outils.md. Depuis le projet, lance séparément et dans cet ordre npm test, npx eslint ., npx prettier --check src test, gitleaks dir . --redact, même en cas d’échec. Lecture et contrôles seulement : aucune installation ni correction, aucun .env lu directement. Rends en dix lignes maximum le résultat prescrit pour chaque commande.

**Rendu :** défaut de formatage initial signalé puis corrigé par dev-web.
Les quatre commandes passent dans l’état final.

**Agent non appelé :** `refacto`, car aucune refactorisation n’était nécessaire. Le rôle de chef d’équipe a été assuré ici, sans modification directe de fichier.
