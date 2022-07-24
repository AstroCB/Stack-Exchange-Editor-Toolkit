#!/bin/sh
set -e

diffs=`git diff --cached --name-only --diff-filter=ACMTUXB editor.user.js editor.meta.js version spelling-corrections.txt content-free-words.txt example-domain-words.txt file-extensions.txt top-level-domains.txt`
if [ "z$diffs" != "z" ]
then
	echo "Local changes detected, commit changes before bumping version"
	exit 0
fi

diffs=`git diff --cached --name-only --diff-filter=ACMTUXB origin editor.user.js spelling-corrections.txt content-free-words.txt example-domain-words.txt file-extensions.txt top-level-domains.txt`
if [ "z$diffs" == "z" ]
then
	echo "No changes compared to origin, version does not need to be bumped"
	exit 0
fi

version=`cat version`
newversion=`semver -i "$1" $version`
echo "Old version: $version"
echo "New version: $newversion"
echo $newversion > version
sed -E -i "s|^// \@version .*|// @version $newversion|g" editor.user.js
awk '/^\/\/ ==UserScript==$/,/^\/\/ ==\/UserScript==$/' editor.user.js > editor.meta.js
git commit -m "bump version" editor.user.js editor.meta.js version
