#!/bin/bash -x

NEWVERSION=$1
NEXTVERSION=$2

# Stashing current changes
git stash

# Replacing version in plugin xml file
sed -i '' "s/version=\"[0-9\\.]*-dev\"/version=\"$NEWVERSION\"/g" plugin.xml

# Committing changes
git add plugin.xml
git commit -m "Preparing version $NEWVERSION"
git tag $NEWVERSION

# Putting next version in plugin xml file
sed -i '' "s/version=\"$NEWVERSION\"/version=\"$NEXTVERSION-dev\"/g" plugin.xml

# Committing changes
git add plugin.xml
git commit -m "New development version $NEXTVERSION-dev"

# Stash pop should be made in the end only
git stash pop
