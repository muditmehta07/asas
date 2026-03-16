#!/bin/bash
# This runs automatically on first startup if the database doesn't exist yet.
# MongoDB only runs files in /docker-entrypoint-initdb.d/ on a fresh volume.

echo "[mongo-init] Restoring supermarket_sim database..."
mongorestore --db=supermarket_sim /mongo-seed/supermarket_sim
echo "[mongo-init] Done."
