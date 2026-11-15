# 📶 Configurer le réseau WiFi local

Ce guide explique comment monter le réseau de l'événement pour que les téléphones des spectateurs accèdent au serveur de pronostics, **sans Internet**.

Les menus changent selon les marques de routeurs : les noms ci-dessous sont les plus courants, cherchez l'équivalent dans l'interface du vôtre.

---

## Le principe

```
                ┌──────────────────────┐
                │    Routeur WiFi      │   (pas besoin d'Internet)
                │   192.168.1.1        │
                └───┬─────────────┬────┘
        câble ou WiFi│             │ WiFi
                    │             │
   ┌────────────────▼──┐     ┌────▼──────────────────────┐
   │  PC serveur        │     │  Téléphones spectateurs   │
   │  192.168.1.50      │◄────┤  http://192.168.1.50:3000 │
   │  (IP réservée)     │     └───────────────────────────┘
   └────────────────────┘
```

Le routeur distribue des adresses à tous les appareils. Les téléphones ouvrent l'adresse du PC dans leur navigateur. Tout reste dans le réseau local.

---

## Étape 1 – Choisir le matériel

| Option | Pour qui | Remarques |
|---|---|---|
| **Routeur dédié** (routeur de voyage, ancien routeur, point d'accès) | Recommandé | Réseau maîtrisé, pas de surprise. Un routeur WiFi 5 (ac) ou plus récent est conseillé au-delà de 20-30 téléphones. |
| **Box Internet** du lieu | Pratique si disponible | Il faut un accès à son interface pour réserver l'IP et vérifier l'isolation. |
| **Partage de connexion** du téléphone de l'organisateur | Dépannage pour quelques personnes | Nombre d'appareils limité (souvent 5 à 10) et certains téléphones isolent les clients. |

> Pas besoin de brancher le routeur à Internet. Le WiFi fonctionne seul. Les téléphones peuvent afficher « Pas d'accès Internet » : il faut **rester connecté quand même** (Android propose parfois de basculer en 4G : refuser).

## Étape 2 – Brancher

1. Allumez le routeur.
2. Reliez le PC au routeur, de préférence **en Ethernet** sur un port LAN (plus stable que le WiFi pendant plusieurs heures).
3. Laissez le PC **sur secteur** et désactivez la **mise en veille** pendant le tournoi.

## Étape 3 – Accéder à l'interface du routeur

1. Ouvrez un navigateur sur le PC et tapez l'adresse du routeur, souvent `192.168.1.1`, `192.168.0.1` ou `192.168.8.1`. Elle est généralement imprimée sous le routeur, avec l'identifiant et le mot de passe.
2. Pour la retrouver sous Windows : ouvrez l'**Invite de commandes**, tapez `ipconfig`, et lisez la ligne **Passerelle par défaut**.

## Étape 4 – Réserver une adresse IP fixe pour le PC (fortement conseillé)

Sans réservation, l'adresse du PC peut changer d'un jour à l'autre et l'adresse imprimée pour les spectateurs ne marcherait plus.

1. Dans le routeur, cherchez **DHCP**, puis **Réservation d'adresse**, **IP statique**, **Static lease** ou **Address reservation**.
2. Repérez le PC dans la liste des appareils connectés (par son nom).
3. Associez-lui une adresse, par exemple `192.168.1.50`, et enregistrez.
4. Déconnectez puis reconnectez le PC (ou redémarrez-le) pour qu'il prenne la nouvelle adresse.
5. Lancez le serveur : la fenêtre doit afficher `http://192.168.1.50:3000`.

Une fois l'adresse fixée, vous pouvez **préparer un QR code** à l'avance avec n'importe quel générateur de QR code, et l'imprimer.

## Étape 5 – Vérifier l'isolation des clients

Beaucoup de routeurs ont une option qui empêche les appareils WiFi de communiquer entre eux. Si elle est active, les téléphones verront le WiFi mais **n'ouvriront jamais la page**.

- Cherchez **AP isolation**, **Client isolation**, **Isolation des clients**, **Isolation sans fil** ou **Station isolation**, et **désactivez-la**.
- **N'utilisez pas le réseau invité** (Guest) : il isole presque toujours les appareils.
- Si le PC est en Ethernet et les téléphones en WiFi, vérifiez qu'aucune séparation entre filaire et sans-fil n'est activée.

## Étape 6 – Nom et sécurité du WiFi

- Donnez au WiFi un nom clair, par exemple `TOURNOI-DRONE`.
- **Avec mot de passe (WPA2/WPA3)** : affichez-le à l'entrée. Conseillé si le lieu est fréquenté.
- **Sans mot de passe** : plus simple pour les spectateurs, mais n'importe qui à portée peut se connecter. Acceptable pour un événement entre passionnés.
- Changez le mot de passe d'administration du routeur s'il est encore celui d'usine.

## Étape 7 – Régler le PC

### Windows

1. **Profil réseau Privé** : Paramètres → Réseau et Internet → Ethernet (ou WiFi) → cliquez sur le réseau → **Type de profil réseau : Privé**.
2. **Pare-feu** : au premier lancement du serveur, Windows demande d'autoriser Node.js. Cochez **Réseaux privés** et cliquez sur **Autoriser**.
   - Si vous avez refusé par erreur : Panneau de configuration → Pare-feu Windows Defender → **Autoriser une application via le Pare-feu Windows** → cochez **Privé** en face de **Node.js** (ou « Node.js JavaScript Runtime »).
3. **Veille** : Paramètres → Système → Alimentation → mise en veille sur **Jamais** (sur secteur).

### macOS

Au premier lancement, macOS peut demander si « node » peut accepter des connexions entrantes : cliquez sur **Autoriser**.

### Linux

Si un pare-feu est actif (par exemple `ufw`), ouvrez le port : `sudo ufw allow 3000/tcp`.

## Étape 8 – Tester

1. Lancez le serveur sur le PC.
2. Avec un téléphone connecté au WiFi de l'événement (**4G désactivée** pour être sûr), ouvrez `http://192.168.1.50:3000`.
3. Créez un compte test, faites un prono.
4. Sur la page admin, vérifiez que le compte apparaît dans le classement des pronostiqueurs.

Si le test réussit, tout est prêt. Pensez à cliquer sur **Tout remettre à zéro** avant le tournoi.

---

## Dépannage réseau

| Symptôme | Cause probable | Solution |
|---|---|---|
| La page ne se charge pas sur le téléphone, mais marche sur le PC (`localhost`) | Pare-feu ou isolation WiFi | Étapes 5 et 7 |
| Le téléphone affiche « Pas d'Internet » et ouvre la page en 4G | Le téléphone a quitté le WiFi | Désactiver les données mobiles, rester sur le WiFi |
| Ça marchait hier, plus aujourd'hui | L'adresse du PC a changé | Réserver l'IP (étape 4) |
| Le serveur affiche plusieurs adresses | Le PC est connecté à plusieurs réseaux (WiFi + Ethernet, VPN…) | Utiliser celle qui commence comme l'adresse du routeur (ex. `192.168.1.x`). Désactiver le VPN. |
| Seuls quelques téléphones arrivent à se connecter | Limite du routeur ou du partage de connexion | Utiliser un routeur dédié plus récent |
| Le serveur affiche « aucun réseau détecté » | Le PC n'est connecté à aucun réseau | Brancher le câble ou se connecter au WiFi du routeur, puis relancer |

### Trouver l'adresse IP du PC à la main

- **Windows** : Invite de commandes → `ipconfig` → ligne **Adresse IPv4**.
- **macOS** : Réglages Système → Réseau → votre connexion → **Adresse IP**.
- **Linux** : `ip -4 addr` ou `hostname -I`.
