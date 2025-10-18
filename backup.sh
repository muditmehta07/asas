#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

OUTPUT_FILE="$DIR/packages.txt"
dpkg --get-selections > "$OUTPUT_FILE"

echo "Package list saved to $OUTPUT_FILE"
