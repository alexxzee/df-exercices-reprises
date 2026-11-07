# Audit de sync_tarifs.py

| Gravité | Fichier:ligne | Catégorie | Faille | Correctif |
|---|---|---|---|---|
| Haute | sync_tarifs.py:31-32 | Secret en dur | Mot de passe et clé d'API du portail écrits dans le code | Lire les identifiants dans des variables d'environnement |
| Haute | sync_tarifs.py:115 | Requête construite à la main | Commande shell construite avec le nom du fichier (shell=True) | subprocess.run avec une liste d'arguments, ou le module tarfile |
| Moyenne | sync_tarifs.py:82, 107 | Requête construite à la main | Requêtes SQL construites par f-string | Requêtes paramétrées avec ? |
| Moyenne | sync_tarifs.py:121 | Exécution de donnée | pickle.load sur un fichier de cache | Cache en JSON |
| Basse | sync_tarifs.py:87 | Journal trop bavard | Le chemin du fichier est écrit dans le journal | rien trouvé de sensible, à vérifier |
| | | Vérification désactivée | rien trouvé | |

Non vérifié : le contenu réel du cache et des archives, la configuration du portail fournisseur.
