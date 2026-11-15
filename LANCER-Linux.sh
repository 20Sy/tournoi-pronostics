#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js n'est pas installe. Telechargez la version LTS sur https://nodejs.org"
  read -r -p "Appuyez sur Entree pour fermer..."
  exit 1
fi
node server.js
echo
read -r -p "Le serveur est arrete. Appuyez sur Entree pour fermer..."
