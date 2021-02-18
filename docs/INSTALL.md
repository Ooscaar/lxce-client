# INSTALLATION

## LXD

### Remove any previus installation

```
snap stop lxd
snap remove lxd --purge
zpool destroy pool_name

rm /etc/systemd/network/lxd.network
systemctl restart systemd-networkd
```

### Basic install

```
apt install zfsutils-linux -y
snap install lxd
zpool create zpool /dev/sdaX
zfs create zpool/lxd


lxd init
  Would you like to use LXD clustering? (yes/no) [default=no]:
  Do you want to configure a new storage pool? (yes/no) [default=yes]:
  Name of the new storage pool [default=default]: 
  Name of the storage backend to use (btrfs, dir, lvm, zfs) [default=zfs]: 
  Create a new ZFS pool? (yes/no) [default=yes]: no
  Name of the existing ZFS pool or dataset: zpool/lxd
  Would you like to connect to a MAAS server? (yes/no) [default=no]:
  Would you like to create a new local network bridge? (yes/no) [default=yes]: 
  What should the new bridge be called? [default=lxdbr0]: 
  What IPv4 address should be used? (CIDR subnet notation, auto or none) [default=auto]: 
  What IPv6 address should be used? (CIDR subnet notation, auto or none) [default=auto]: 
  Would you like LXD to be available over the network? (yes/no) [default=no]: 
  Would you like stale cached images to be updated automatically? (yes/no) [default=yes] 
  Would you like a YAML "lxd init" preseed to be printed? (yes/no) [default=no]: 
```

*Note: Make sure /snap/bin is in your PATH.*

Configuration files are in /var/lib/lxd and /var/snap/lxd/common/lxd.

You can check the composition of the zfs pool with:
```
zpool status
zfs list
```

### Change the network for containers

Edit the network configuration and modify the address of lxdbr0 to **10.10.0.1/23**

```
lxc network edit lxdbr0
```

### Configure DNS

We want to adjust DNS for resolving .lxd names.
This is hacky and brought us many problems, we follow:

https://linuxcontainers.org/lxd/docs/master/networks
https://blog.simos.info/how-to-use-lxd-container-hostnames-on-the-host-in-ubuntu-18-04/


Fist type the following command to avoid possible DNS loops:
```
echo -e "auth-zone=lxd\ndns-loop-detect" | lxc network set lxdbr0 raw.dnsmasq -
snap restart lxd
```

To check the configuration:
```
lxc network show lxdbr0  
```

Next, we create the following script for DNS in /usr/local/sbin/lxdhostdns.sh:

```
#!/bin/bash

LXDDNSIP=`ip addr show lxdbr0 | grep -Po 'inet \K[\d.]+'`

function start {
  /usr/bin/systemd-resolve \
    --interface lxdbr0 \
    --set-domain '~lxd' \
    --set-dns ${LXDDNSIP}
}

function stop {
  /usr/bin/systemd-resolve --interface lxdbr0 --revert
}

case $1 in
  'start')
    start
    ;;
  'stop')
    stop
    ;;
  'restart')
    stop
    start
    ;;
  *)
    echo "usage: $0 start|stop|restart"
    ;;
esac 
```    

Note. The ~ before the domain name is very important, 
it tells resolved to use this nameserver to look up only this domain.

We give execution permission to the previous script:

```
chmod u+x /usr/local/sbin/lxdhostdns.sh
```

Now we create a service for the previous script in /lib/systemd/system/lxdhostdns.service:

```
[Unit]
Description=LXD host DNS service
After=multi-user.target

[Service]
Type=idle
ExecStart=/usr/local/sbin/lxdhostdns.sh start
RemainAfterExit=true
ExecStop=/usr/local/sbin/lxdhostdns.sh stop
StandardOutput=journal

[Install]
WantedBy=multi-user.target
```                        

Then, we reload the configurations:
```                        
systemctl daemon-reload
systemctl enable --now lxdhostdns.service
systemctl status lxdhostdns.service
```                        

Finally, we need to create a DNS configuration for docker daemon at the hypervisor:
```
echo -n "{
  \"dns\": [\"10.10.0.1\", \"8.8.8.8\"]
}" > /etc/docker/daemon.json

systemctl restart docker.service
```

### Production setup

https://linuxcontainers.org/lxd/docs/master/production-setup

In /etc/security/limits.conf and append:

``` 
# Conf for production LXD
*         soft    nofile        1048576
*         hard    nofile        1048576
root      soft    nofile        1048576
root      hard    nofile        1048576
*         soft    memlock       unlimited
*         hard    memlock       unlimited
``` 

Edit /etc/sysctl.conf and append:

``` 
# Conf for production LXD
fs.inotify.max_queued_events = 1048576
fs.inotify.max_user_instances = 1048576 
fs.inotify.max_user_watches = 1048576
vm.max_map_count = 262144       
kernel.dmesg_restrict = 1       
net.ipv4.neigh.default.gc_thresh3 = 8192
net.ipv6.neigh.default.gc_thresh3 = 8192
net.core.bpf_jit_limit = 3000000000
kernel.keys.maxkeys = 5000
kernel.keys.maxbytes = 5000000
fs.aio-max-nr = 524288

net.core.netdev_max_backlog = 182757
``` 

Extra network configuration:

```
crontab -e
```

Add:

```
@reboot /usr/sbin/ip link set eno1 txqueuelen 10000
@reboot /usr/sbin/ip link set lxdbr0 txqueuelen 10000
```

Reboot the system!

```
apt update && apt upgrade -y && apt autoremove
shutdown -r now
```

### LXD trouble shooting

Check logs: 
/var/log/syslog
/var/snap/lxd/common/lxd/logs 

Usually the problem is that we hit some limit: check disk space, kernel limits, DNS, etc.

## LXCE

### Dependencies

*Everything should be installed in the provison.sh of the hypervisor.*

```
apt install -y git docker.io docker-compose
git config --global user.email "jose.luis.munoz@upc.edu"
git config --global user.name "jlmunoz"

mkdir -p /opt/nginx/docker-volumes
cd /opt/nginx/docker-volumes
git clone https://github.com/novnc/noVNC.git
```


### Configuring NGINX

*We need docker-compose for an nginx in /opt/nginx*

Create directories:

```
mkdir -p /opt/nginx/docker-volumes/nginx/sites-available
mkdir -p /opt/nginx/docker-volumes/certbot/conf
mkdir -p /opt/nginx/docker-volumes/certbot/www
```

Create the docker file:
```
echo -n "version: '3'
services:
  nginx:
    restart: always
    image: nginx:1.15-alpine
    ports:
      - \"80:80\"
      - \"443:443\"
    volumes:
      - ./docker-volumes/nginx:/etc/nginx/conf.d
      - ./docker-volumes/certbot/conf:/etc/letsencrypt
      - ./docker-volumes/noVNC:/opt/noVNC
      - ./docker-volumes/certbot/www:/var/www/certbot
    command: \"/bin/sh -c 'while :; do sleep 6h & wait \$\${!}; nginx -s reload; done & nginx -g \\\"daemon off;\\\"'\"
  certbot:
    restart: always
    image: certbot/certbot
    entrypoint: \"/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \$\${!}; done;'\"
    volumes:
      - ./docker-volumes/certbot/conf:/etc/letsencrypt
      - ./docker-volumes/certbot/www:/var/www/certbot
" > /opt/nginx/docker-compose.yml
```

Create the initial config for certboot:

```
echo -n "
server {
    listen 80 default_server;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}

" > /opt/nginx/docker-volumes/nginx/sites-available/999.default.conf
```

```
cd /opt/nginx/docker-volumes/nginx/
ln -s sites-available/999.default.conf
```

Create the script for updating certificates /opt/nginx/updateDomains.sh :

``` 
#!/bin/bash

if [ $# -le 0 ]; then
  echo Missing domain file!
  exit
fi


if ! [ -x "$(command -v docker-compose)" ]; then
  echo 'Error: docker-compose is not installed.' >&2
  exit 1
fi

domains=(`tr '\n' ' ' < $1`)
rsa_key_size=4096
data_path="./docker-volumes/certbot"
email="jose.luis.munoz@upc.edu" # Adding a valid address is strongly recommended
staging=0 # Set to 1 if you're testing your setup to avoid hitting request limits

if [ -d "$data_path" ]; then
  read -p "Existing data found for $domains. Continue and replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi


if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

echo "### Creating dummy certificate for $domains ..."
path="/etc/letsencrypt/live/$domains"
mkdir -p "$data_path/conf/live/$domains"
docker-compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:1024 -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo


echo "### Starting nginx ..."
docker-compose up --force-recreate -d nginx
echo

echo "### Deleting dummy certificate for $domains ..."
docker-compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$domains && \
  rm -Rf /etc/letsencrypt/archive/$domains && \
  rm -Rf /etc/letsencrypt/renewal/$domains.conf" certbot
echo


echo "### Requesting Let's Encrypt certificate for $domains ..."
#Join $domains to -d args
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Select appropriate email arg
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

# Enable staging mode if needed
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

echo "### Reloading nginx ..."
docker-compose exec nginx nginx -s reload
``` 

Create a certificate for the HYPERVISOR (e.g. gold.upc.edu)

Create the file gold.upc.edu with the content: 
gold.upc.edu

chmod u+x updateDomains.sh
./updateDomains.sh gold.upc.edu

Modify 999.default.conf and remember to edit the HYPERVISOR 
variable, e.g. gold.upc.edu

```
echo -n "
server {
    listen 80 default_server;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/letsencrypt/live/HYPERVISOR/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/HYPERVISOR/privkey.pem;
    
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        return 301 https://HYPERVISOR/;
    }
}
" > /opt/nginx/docker-volumes/nginx/sites-available/999.default.conf
```

### noVNC config in NGINX 

server { 
    listen 80;
    server_name novnc.mgarcia.tfgpwa.gold.upc.edu;

    location /.well-known/acme-challenge/ {
       root /var/www/certbot;
    }

    location / {
       return 301 https://$host$request_uri;
    } 
}

server {
    listen 443 ssl;
    server_name novnc.mgarcia.tfgpwa.gold.upc.edu;

    ssl_certificate /etc/letsencrypt/live/novnc.mgarcia.tfgpwa.gold.upc.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/novnc.mgarcia.tfgpwa.gold.upc.edu/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /opt/noVNC;
    index vnc.html;
	

    location /websockify {
          proxy_http_version 1.1;
          proxy_pass http://tfgpwa-00.lxd:7000/;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
          proxy_set_header X-Real-IP 127.0.0.1;
          # VNC connection timeout 15 min
          proxy_read_timeout 900s;
          # Disable cache
          proxy_buffering off;
    }
}


### Configuration for mounts:

We a user called alice in the hypervisor to remap directories on the container.
We will create per container directories belonging to these users and to the root group in /datahdd/lxd/container_name/user_name. 
To allow read/write mounts on these directories we need allow remapings of the user's uids and the 0 gid.  

```
useradd -u 10000 alice
echo "root:10000:1" >> /etc/subuid
echo "root:0:1" >> /etc/subgid
```

We create the lxd directores in each *data* mountpoint.
```
mkdir -p /datassd/lxce
mkdir -p /datahdd/lxce
```

### Get the lxce command

To build the command, clone the repository and exec:
```
npm i
npm run pkg
```

The previous command creates a binary called lxce in the same folder.

To deploy the command:
```
mv lxce /usr/local/sbin
```

### Install LXCE

Execute:
```
lxce install 
```

Edit /etc/lxce/lxce.conf with:
* the public IP of the Hypervisor
* the hostname of the machine -> silver, gold, ... (*it will be shown in SSH configs as upc.silver.containerX*)
* change locations with the mountpoints configured on the hypervisor

Example:
```
{
  "hypervisor": {
    "SSH_hostname": "147.83.39.230",
    "SSH_suffix": "silver"
  },
  "domains": [
    "default"
  ],
  "locations": [
    "/datahdd/",
    "/datassd/"
  ]
}
```

*Optinally* Edit /etc/lxce/container_default.conf with default values for every container. 
It can be changed later.

Example:
```
{
  "domain": "default",
  "alias": "",
  "base": "ubuntu:20.04",
  "aliceData": "/datahdd/",
  "bobData": "/datahdd/",
  "proxy": [
    {
      "name": "ssh",
      "type": "tcp",
      "listen": "0.0.0.0",
      "port": 22
    },
    {
      "name": "test",
      "type": "tcp",
      "listen": "0.0.0.0",
      "port": 3000
    }
  ],
  "nginx": {
    "novnc": 7000,
    "www": 80
  }
}
```

### Import a custom base

```
lxc image import image_name.tar.gz --alias myfocal_28_07_2020
```
And change /etc/lxce/container_default.conf to 
put for example myfocal_28_07_2020 as base image.

### Activate nested Docker and nested LXD 

```
lxc profile set default security.nesting true
```

### Init LXCE

Then, execute:
```
lxce init
  Initialized empty Git repository in /etc/lxce/ssh/lxce/.git/
  Initialized!!!
  You can continue with launching new container "lxce launch"
```

### Launch a container with LXCE

Now, you can lauch your first container with LXCE:
```
lxce launch
```

### More info

For more documentation about command functionalities check README.md

### Basic install

```
apt install zfsutils-linux -y
snap install lxd
zpool create zpool /dev/sdaX
zfs create zpool/lxd

## Nested LXD

zfs create zpool/lxd-${cname.domain}
lxd init
  Would you like to use LXD clustering? (yes/no) [default=no]:
  Do you want to configure a new storage pool? (yes/no) [default=yes]:
  Name of the new storage pool [default=default]: 
  Name of the storage backend to use (btrfs, dir, lvm, zfs) [default=zfs]: 
  Create a new ZFS pool? (yes/no) [default=yes]: no
  Name of the existing ZFS pool or dataset: zpool/lxd-${cname.domain}
  Would you like to connect to a MAAS server? (yes/no) [default=no]:
  Would you like to create a new local network bridge? (yes/no) [default=yes]: 
  What should the new bridge be called? [default=lxdbr0]: 
  What IPv4 address should be used? (CIDR subnet notation, auto or none) [default=auto]: 
  What IPv6 address should be used? (CIDR subnet notation, auto or none) [default=auto]: none
  Would you like LXD to be available over the network? (yes/no) [default=no]: 
  Would you like stale cached images to be updated automatically? (yes/no) [default=yes] 
  Would you like a YAML "lxd init" preseed to be printed? (yes/no) [default=no]: 
```

*Note: Make sure /snap/bin is in your PATH.*

Configuration files are in /var/lib/lxd and /var/snap/lxd/common/lxd.

You can check the composition of the zfs pool with:
```
zpool status
zfs list
```