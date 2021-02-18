# TODO

## Config

* Change proxie to proxies ???

## SSH config

* Change ssh location to /etc/lxce/ssh ($ETC_DIR/ssh)
* Change ssh configuration names to orange.default-rand and orange.default-alias ($HOST.$DOMAIN-[$NAME, $ALIAS]

## Launch

* User in input, 'user' as default
* Random names instead of numbers
* Remove bob config, only 1 user generation (uid:1000)
* Fix data dirs /home/user/{datassd,datahdd}
* -a, --alias: Add alias to a container
* -N, --nginx: Apply nginx configs only if specified
* Robustness: Check base if exists, etc...
  
## Start/Stop

* Add proxies reload
* Robustness: base, container, proxies, 

## Proxy

* Check DNS failures resolving lxd names

## Nginx 

* all domains of a vm should go in one cert (Cannot wildcard via nginx. Need DNS challenges...)

## Show

* Add ports view (lxc ls -c "ns4mDF") 

## Passwords

* Generate passwords from HOST-seed and random container name
* Generate ssh keys (ssh-keygen -t rsa -b 2048 -f /home/user/.ssh/id_$DOMAIN-$ALIAS) ???
* Generate vnc pass (echo hola1234 | vncpasswd -f > /home/user/.vnc/passwd)

## Base my-ubuntu-mate:20.04

* Disable root user in ssh config
* VNC as a service
* noVNC as a service
* Check software
* Check desktop
* Add compatibility for OVPN
* Add admin ssh key ???

## Fix /data

Base configuration in hypervisor:
```
echo "alice:10000:1" >> /etc/subuid
echo "alice:10000:1" >> /etc/subgid
chown -R alice. /datassd/lxce
```

Ensure config in all lxce contaniers
```
for c in `ls /etc/lxce/container.conf.d`; do lxc config set $c raw.idmap "both 10000 1000"; done
```

Restart desired containers in case of failure or restart all with commented loop
```
  lxc restart $c
  for c in `ls /etc/lxce/container.conf.d`; do lxc restart $c; done
```

[Optional] Add links in each container
```
  mkdir -p /home/alice/data/
  ln -s /data/default/ /home/alice/data/default
  ln -s /data/domain/ /home/alice/data/domain
```

---

# Issues with numbers for containers

In ssh we have to change keys
A container passwords are reused (bad idea)
unique-names-generator

# STOP

Need a stop that does not delete configuration, only change the base 
and keep the directories.

# ROBUSTNESS PROBLEMS

fail if base does not exist (now creates the configuration and provides a bad message)
fail if base does not have /datassd or /datahdd

proxies fail sometimes because the DNS for the container
name (e.g. default-00.lxd) is not available.

lxce launch default

It is also failing the SNAT to outside.


# Remove bob?
Then put and quit sudo
And map both always ssd and hdd
leave the "ubuntu" user??? or myuser

# Renamings in config
In the container config rename Proxie with Proxies

# Fix data directory
Is not working properly: nobody/nobody 

# lxce launch: 
-a: alias (add an alias)
By default should not do any nginx stuff: 
should be activated with -N
-N: certs and nginx
all domains of a vm should go in one cert.

# Check start/stop
Do all the things work with start/stop?
Should work not only in launch!!
I think it does not remap for example.

# lxce show: 
show ports?

# lxce ls:

lxc ls -c "ns4mDF"  

# ssh 
remove one level in ssh repo, from  /etc/lxce/ssh/lxce to /etc/lxce/ssh
ca?

# tigervncserver: 
user service? 
create passwd file?

# check destroy 
It does not remove configuration files in nginx
also did not remove one container when I was testing.

disable root/usr ssh?

echo hola1234 | vncpasswd -f > passwd

# Set the pass for vnc:

echo hola1234 | vncpasswd -f > passwd

