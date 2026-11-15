# Historique des versions

## v1.0.0 – 2026-11-15

Première version publique.

- Serveur local sans dépendance (Node.js seul), données dans `data.json`.
- Page spectateurs : compte pseudo + code à 4 chiffres, pronostics du score exact, classements pilotes et pronostiqueurs.
- Page admin : saisie des résultats, liste des pilotes, calendrier « chacun contre chacun » généré automatiquement.
- Anti-triche : un prono compte s'il est placé au moins N minutes (15 par défaut) avant la saisie du résultat ; contrôle fait par le serveur.
- Réglages dans `config.json`, mot de passe admin généré au premier lancement.
- Lanceurs Windows, macOS et Linux ; protection contre le lancement de deux serveurs.
- Notice complète et guide de configuration du routeur WiFi.
