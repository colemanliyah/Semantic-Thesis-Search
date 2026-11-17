#!/usr/bin/env bash
# Copy the WordPress plugin + embeddings into the local MAMP site
set -e
cd "$(dirname "$0")"
DEST=/mnt/c/MAMP/htdocs/thesis-archive/wp-content/plugins/semantic-search

mkdir -p "$DEST/embeddings"
cp wordpress-plugin/semantic-search.js wordpress-plugin/semantic-search.php "$DEST/"
cp embeddings/*.json "$DEST/embeddings/"
echo "Deployed to $DEST"
