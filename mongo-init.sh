#!/bin/bash

echo "[mongo-init] Restoring supermarket_sim database..."
mongorestore --db=supermarket_sim /mongo-seed/supermarket_sim
echo "[mongo-init] Done."
