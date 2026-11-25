# 🏁 Tournoi Pronostics

Application de **pronostics en direct pour un tournoi de course de drones FPV** (ou toute compétition en duels), qui fonctionne **sans Internet**, sur un simple routeur WiFi.

- Les **spectateurs** se connectent avec leur téléphone, choisissent un pseudo et pronostiquent le score exact de chaque duel.
- L'**organisateur** saisit les résultats sur une page admin.
- Un **score exact trouvé = 1 point**. Classement des pronostiqueurs et des pilotes en temps réel.
- **Anti-triche** : un prono ne compte que s'il a été placé au moins **15 minutes avant** la saisie du résultat (délai réglable).

Aucune installation de paquets : il suffit de **Node.js**. Les données sont enregistrées dans un fichier `data.json`.

---

## Sommaire

1. [Ce qu'il vous faut](#1-ce-quil-vous-faut)
2. [Installation](#2-installation)
3. [Premier lancement](#3-premier-lancement)
4. [Mise en place du réseau WiFi](#4-mise-en-place-du-réseau-wifi)
5. [Préparer le tournoi](#5-préparer-le-tournoi)
6. [Le jour J](#6-le-jour-j)
7. [Règles des pronostics](#7-règles-des-pronostics)
8. [Réglages (config.json)](#8-réglages-configjson)
9. [Sauvegarde et remise à zéro](#9-sauvegarde-et-remise-à-zéro)
10. [Dépannage](#10-dépannage)
11. [Limites connues](#11-limites-connues)

---

## 1. Ce qu'il vous faut

| Matériel | Rôle |
|---|---|
| Un **PC portable** (Windows, Mac ou Linux) | Fait tourner le serveur et la page admin |
| Un **routeur WiFi** (box, routeur de voyage, point d'accès…) | Crée le réseau auquel se connectent les téléphones. **Pas besoin d'Internet.** |
| Les **téléphones** des spectateurs | Un simple navigateur web suffit, rien à installer |

Logiciel : **[Node.js](https://nodejs.org)**, version LTS (gratuit).

## 2. Installation

1. Installez **Node.js LTS** depuis [nodejs.org](https://nodejs.org) (une seule fois).
2. Téléchargez le fichier `tournoi-pronostics-vX.Y.Z.zip` dans la page **[Releases](../../releases)** de ce dépôt.
3. Faites **clic droit → Extraire tout**, puis placez le dossier où vous voulez.

> ⚠️ Ne lancez rien depuis l'intérieur du ZIP : extrayez-le d'abord.
> Évitez aussi les dossiers synchronisés (OneDrive, Dropbox) pendant le tournoi : ils peuvent bloquer l'écriture de `data.json`.

## 3. Premier lancement

| Système | Action |
|---|---|
| **Windows** | Double-clic sur `LANCER-Windows.bat` |
| **Mac** | Clic droit sur `LANCER-Mac.command` → **Ouvrir** (la 1ʳᵉ fois, macOS demande confirmation) |
| **Linux** | Dans un terminal : `./LANCER-Linux.sh` |

Une fenêtre de terminal s'ouvre et affiche :

```
=================================================
  TOURNOI DRONE FPV - PRONOSTICS v1.1.0
=================================================
  Page admin (ce PC) : http://localhost:3000/admin.html
  Mot de passe admin : 3f9a1c7e

  Adresse a donner aux spectateurs (meme WiFi) :
     http://192.168.1.50:3000
=================================================
```

- La page admin s'ouvre automatiquement dans le navigateur.
- Le **mot de passe admin** est généré au hasard au premier lancement et enregistré dans `config.json`.
- **Ne fermez pas cette fenêtre** pendant le tournoi : la fermer arrête le serveur.

**Windows – pare-feu** : au premier lancement, Windows demande s'il faut autoriser Node.js. Cochez **« Réseaux privés »** et cliquez sur **Autoriser**. Sans cela, les téléphones ne pourront pas se connecter.

## 4. Mise en place du réseau WiFi

C'est l'étape la plus importante. Le guide complet, avec la configuration du routeur et la fixation de l'adresse IP, est ici : **[docs/ROUTEUR-WIFI.md](docs/ROUTEUR-WIFI.md)**.

En résumé :

1. Connectez le PC au routeur (**câble Ethernet conseillé**, sinon WiFi).
2. Dans le routeur, **réservez une adresse IP fixe** pour le PC (ex. `192.168.1.50`). L'adresse des spectateurs ne changera plus, vous pourrez imprimer un QR code à l'avance.
3. Vérifiez que l'**isolation des clients WiFi** (« AP isolation », « client isolation ») est **désactivée**, et n'utilisez pas le **réseau invité** : ces options empêchent les téléphones de joindre le PC.
4. Sous Windows, mettez le réseau en profil **Privé**.
5. Testez avec un téléphone : `http://192.168.1.50:3000`

## 5. Préparer le tournoi

Sur la page admin (`http://localhost:3000/admin.html`) :

1. **Liste des pilotes** : remplacez « Pilote 1, Pilote 2… » par vos pilotes (un nom par ligne), puis cliquez sur **Regénérer le calendrier**. Le calendrier « chacun contre chacun » est créé automatiquement (16 pilotes = 15 journées, 120 duels).
2. **Nom du tournoi** : modifiez `nomTournoi` dans `config.json` puis relancez le serveur.
3. **Faites une répétition** : créez un compte spectateur sur un téléphone, faites un prono, saisissez un résultat, vérifiez le classement. Puis cliquez sur **Tout remettre à zéro**.

> Regénérer le calendrier efface les résultats et les pronos, mais conserve les comptes des spectateurs.

## 6. Le jour J

1. Allumez le routeur, puis lancez le serveur.
2. Affichez l'adresse spectateurs (ou un QR code) à l'entrée, sur l'écran, sur les tables.
3. Les spectateurs créent leur compte : **pseudo + code à 4 chiffres** (qui sert à se reconnecter sur un autre appareil).
4. Ils pronostiquent dès qu'ils le veulent : tous les duels sans résultat sont ouverts.
5. **Dès la fin de chaque course**, cliquez sur le score dans la page admin. Les points sont calculés immédiatement.

Lecture d'un score : **score du pilote de gauche – score du pilote de droite**.

| Score | Signification |
|---|---|
| **3** | Victoire (termine les 3 tours en premier) |
| **2** | Termine les 3 tours mais perd |
| **0** | Crash / abandon (ne termine pas les 3 tours) |

Scores possibles pour un duel : `3-2`, `2-3`, `3-0`, `0-3`, `0-0`.

Une erreur de clic ? Cliquez sur le bon score (l'heure de la première saisie est conservée) ou sur **✕** pour effacer le résultat.

### Prochains matchs et reports

- En haut de la page admin et dans une **bannière fixe** chez les spectateurs, les **2 prochains matchs** sont affichés. Les spectateurs peuvent pronostiquer directement depuis la bannière.
- Ils sont calculés **à partir du dernier résultat saisi**, dans l'ordre du calendrier. Si vous saisissez un match hors ordre (par exemple le #10 alors que le #4 n'est pas joué), la bannière repart du #11 ; les matchs sautés réapparaissent quand on arrive en fin de calendrier.
- Un match ne peut pas avoir lieu ? Cliquez sur **Reporter** sous le match : il passe **en fin de file** et reçoit l'étiquette « Reporté ». Les pronos déjà placés sont conservés.
- **Annuler le report** remet le match à sa place d'origine dans le calendrier.

### Classement dans la page admin

Le panneau **Classement** reste visible à droite pendant que vous faites défiler les matchs (sur grand écran). Deux cases à cocher choisissent l'affichage :

| Cases cochées | Affichage |
|---|---|
| Sportif + Pronostiqueurs | Les deux classements l'un sous l'autre |
| Sportif seul | Classement des pilotes |
| Pronostiqueurs seul | Classement des pronos |

Au moins une case reste cochée. Le choix est mémorisé par le navigateur.

## 7. Règles des pronostics

- Un pronostic = un score exact pour un duel. **Score exact = 1 point**, sinon 0.
- Un prono ne compte que s'il a été placé **au moins 15 minutes avant que l'organisateur saisisse le résultat**.
- Le spectateur peut changer d'avis autant qu'il veut. S'il change **trop tard**, c'est son **dernier prono déjà validé** qui compte.
- Sous chaque prono, un compte à rebours indique quand il sera validé.
- Une fois le résultat saisi, plus personne ne peut pronostiquer ce duel.
- Après le résultat, la répartition des pronos du public est affichée.

> ⚠️ **Important pour l'organisateur** : la protection repose sur la rapidité de saisie. Si vous saisissez un résultat 20 minutes après la fin de la course, quelqu'un qui a vu l'arrivée peut encore placer le bon score dans les 5 premières minutes. **Saisissez le résultat dès l'arrivée.**

## 8. Réglages (config.json)

Le fichier `config.json` est créé au premier lancement, à côté de `server.js`. Modifiez-le avec un éditeur de texte (Bloc-notes), puis **relancez le serveur**.

```json
{
  "nomTournoi": "Tournoi Drone FPV",
  "motDePasseAdmin": "3f9a1c7e",
  "delaiMinutes": 15,
  "port": 3000,
  "ouvrirNavigateur": true
}
```

| Réglage | Rôle |
|---|---|
| `nomTournoi` | Nom affiché en haut des pages |
| `motDePasseAdmin` | Mot de passe de la page admin. Supprimez la ligne pour en générer un nouveau. |
| `delaiMinutes` | Délai minimum entre un prono et la saisie du résultat pour qu'il compte |
| `port` | Port du serveur (si occupé, le serveur essaie automatiquement les 10 suivants) |
| `ouvrirNavigateur` | Ouvre la page admin au démarrage (`true` / `false`) |

## 9. Sauvegarde et remise à zéro

- Toutes les données (comptes, pronos, résultats) sont dans **`data.json`**. Elles sont enregistrées à chaque action et survivent à un redémarrage du serveur ou du PC.
- **Sauvegarde** : copiez `data.json` sur une clé USB après le tournoi.
- **Repartir de zéro** : bouton **Tout remettre à zéro** dans l'admin, ou supprimez `data.json` serveur arrêté.

## 10. Dépannage

| Problème | Solution |
|---|---|
| La fenêtre se ferme aussitôt / « Node.js n'est pas installé » | Installez Node.js LTS, puis relancez. |
| « Le serveur tourne déjà » | Une autre fenêtre du serveur est ouverte. Utilisez-la, ou fermez-la avant de relancer. |
| Les téléphones n'arrivent pas à ouvrir la page | Même WiFi que le PC ? Pare-feu autorisé (Réseaux privés) ? Isolation WiFi désactivée ? Voir [docs/ROUTEUR-WIFI.md](docs/ROUTEUR-WIFI.md). |
| L'adresse a changé entre deux lancements | Réservez une IP fixe pour le PC dans le routeur (section 4). |
| « Ce pseudo existe déjà avec un autre code » | Le spectateur s'est trompé de code, ou le pseudo est pris : choisir un autre pseudo. |
| Mot de passe admin oublié | Il est écrit dans `config.json` et affiché dans la fenêtre du serveur. |
| La page admin affiche « Page introuvable » | Vérifiez l'adresse : `http://localhost:3000/admin.html` (le port peut être 3001, 3002… voir la fenêtre du serveur). |
| Double-clic sur `index.html` = page vide ou erreur | Normal : les pages doivent être ouvertes **via le serveur** (`http://…`), jamais directement depuis le dossier. |

## 11. Limites connues

- Pensé pour un usage **en réseau local** (WiFi de l'événement). Il n'est **pas conçu pour être exposé sur Internet** : pas de HTTPS, protection minimale des comptes (code à 4 chiffres).
- Le PC doit rester allumé et le serveur ouvert pendant tout le tournoi.
- Les heures sont celles de l'horloge du PC serveur : vérifiez qu'elle est juste.
- Testé sous Linux avec Node.js 22. Le fonctionnement sous Windows et macOS n'a pas encore été vérifié en conditions réelles : vos retours sont bienvenus dans les [Issues](../../issues).

---

## Pour les curieux : comment ça marche

```
server.js            Serveur HTTP Node.js (aucune dépendance) + API JSON
public/index.html    Page spectateurs (pronostics, classements)
public/admin.html    Page organisateur (résultats, pilotes)
config.json          Réglages (créé au 1er lancement, non versionné)
data.json            Données du tournoi (créé au 1er lancement, non versionné)
```

Le contrôle du délai anti-triche est fait **par le serveur**, avec sa propre horloge : modifier l'heure de son téléphone ne sert à rien.

## Licence

[MIT](LICENSE) – libre d'utilisation, de modification et de partage.
