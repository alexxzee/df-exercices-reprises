---
name: tester-une-route
description: Écrit le test node:test d’une route HTTP de D&F Commandes à partir d’une règle de spec. À utiliser pour ajouter ou compléter un test de route.
---

# Tester une route

Pour écrire le test d’une route HTTP, dans cet ordre :
1. Lis la règle dans la spec et recopie-la en commentaire au-dessus du test, avec son numéro.
2. Note la méthode, le chemin et ce que la règle attend : statut, type de contenu, corps.
3. Choisis les cas : le cas nominal, puis chaque seuil (la valeur juste avant, sur le seuil, juste après), puis l’absence (identifiant inconnu, liste vide).
4. Écris un test par cas. Son nom dit la règle et le cas, par exemple « Règle 3 : un total de 1 234,50 € s’affiche au format français ».
5. Démarre l’application de test sans serveur ni port : construis-la sur un jeu de données, puis envoie la requête par traiter({ methode, chemin }).
6. Vérifie d’abord le statut, puis le type de contenu, puis le corps : JSON.parse pour une réponse JSON, recherche du texte attendu pour une page HTML.
7. Un cas qui dépend de la date ou d’une donnée particulière : construis le jeu de données dans le test, ne compte pas sur les données de démonstration.
8. Range le test dans test/<domaine>.test.js (clients, devis), à la suite des tests existants. Si le fichier manque, crée-le avec 'use strict' et les require de node:test et node:assert/strict.
9. Lance npm test et lis la sortie : nombre de tests, réussis, échoués.
10. Rends la sortie de la commande telle quelle, sous la liste des tests ajoutés.

Forme d’un test de route :
```js
test('Règle 1 : <le cas vérifié>', () => {
  const reponse = creerApp(creerDonnees()).traiter({ methode: 'GET', chemin: '/<chemin>' });
  assert.equal(reponse.statut, 200);
  assert.equal(reponse.type, 'application/json; charset=utf-8');
  assert.deepEqual(JSON.parse(reponse.corps), { /* corps attendu */ });
});
```
