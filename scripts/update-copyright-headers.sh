#!/bin/bash

# Copyright header update script
# This script updates copyright headers across all TypeScript files

COPYRIGHT_HEADER="/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */"

# Find all TypeScript files
find src -name "*.ts" -type f | while read -r file; do
    echo "Processing $file..."

    # Check if file already has copyright header
    if ! head -n 20 "$file" | grep -q "Copyright (C)"; then
        # Create temporary file with copyright header
        temp_file=$(mktemp)
        echo "$COPYRIGHT_HEADER" > "$temp_file"
        echo "" >> "$temp_file"
        cat "$file" >> "$temp_file"
        mv "$temp_file" "$file"
        echo "Added copyright header to $file"
    else
        echo "Copyright header already exists in $file"
    fi
done

echo "Copyright header update complete!"
