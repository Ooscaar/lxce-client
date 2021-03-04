#!/bin/bash
#
# Restart all containers

echo "[*] Restarting all containers"
for c in `ls /etc/lxce/container.conf.d`;
do
    lxc restart $c
done
echo "[*] Ok!"