#!/bin/bash 
#
# Ensure config in all containers

echo "[*] Setting up correct uid remaps on containers..."
for c in `ls /etc/lxce/container.conf.d`;
do 
    lxc config set $c raw.idmap "both 10000 1000";
done
echo "[*] Ok!!"