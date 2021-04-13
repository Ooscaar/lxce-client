#!/bin/bash
cd "$(dirname $0)"
set -e 

# lxce command installation script

# Should be run as root
if [[ "$EUID" -ne 0 ]]; then 
	echo "This script must be run as root!" 
	exit 1
fi 

# lxce command
echo "[*] Building and installing the command"
npm ci
cp bin/lxce /usr/sbin/lxce

echo "[*] Building and installing the command: ok!"

# lxce completions
echo "[*] Installing completions"

## bash
completion='eval "$(lxce completion -s bash)"'
if ! grep -q "$completion" ~/.bashrc; then
	echo "$completion" >> ~/.bashrc
	echo "[*] Bash completion installed"
else
	echo "[*] Bash completion already installed"
fi

## zsh
mkdir -p /usr/local/share/zsh/site-functions/
#lxce completion -s zsh > /usr/local/share/zsh/site-functions/_lxce
if ! grep -q "compdef _lxce lxce" ~/.zshrc; then
	lxce completion -s zsh >> ~/.zshrc
	echo "[*] Zsh completion installed"
else
	echo "[*] Zsh completion already installed"
fi


echo "[*] Installing completions: ok!"
echo "[*] Success !!"
exit 0
