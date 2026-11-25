# Historique des versions

## v1.1.0 – 2026-11-15

- Bannière « Prochains matchs » (les 2 suivants) en haut de la page admin et fixe en haut de la page spectateurs ; pronostic possible directement depuis la bannière.
- Les prochains matchs sont calculés à partir du dernier résultat saisi.
- Bouton **Reporter** : le match passe en fin de file (étiquette « Reporté ») ; **Annuler le report** le remet à sa place.
- Page admin : panneau Classement flottant (reste visible au défilement), avec cases à cocher Sportif / Pronostiqueurs.
- Gestion des pilotes et remise à zéro regroupées dans un bloc repliable.
- Les données d'une installation v1.0.0 (`data.json`) sont reprises automatiquement.

## v1.0.0 – 2026-11-15

Première version publique.

- Serveur local sans dépendance (Node.js seul), données dans `data.json`.
- Page spectateurs : compte pseudo + code à 4 chiffres, pronostics du score exact, classements pilotes et pronostiqueurs.
- Page admin : saisie des résultats, liste des pilotes, calendrier « chacun contre chacun » généré automatiquement.
- Anti-triche : un prono compte s'il est placé au moins N minutes (15 par défaut) avant la saisie du résultat ; contrôle fait par le serveur.
- Réglages dans `config.json`, mot de passe admin généré au premier lancement.
- Lanceurs Windows, macOS et Linux ; protection contre le lancement de deux serveurs.
- Notice complète et guide de configuration du routeur WiFi.
