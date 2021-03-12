#!/bin/bash

if [ "$EUID" -ne 0 ]
    then echo "[*] Please run as root"
    exit 1
fi
rm -rf /home/oscar/m/tfg-lxce/etc/lxce/container.conf.d/*
rm -rf /home/oscar/m/tfg-lxce/etc/lxce/ssh/*
rm -rf /home/oscar/m/tfg-lxce/datasdd/lxce/*
rm -rf /etc/lxce/
rm -rf /datasdd/lxce/*
echo "Succes!!"
