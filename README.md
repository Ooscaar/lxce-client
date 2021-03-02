# LXCE Usage

Command to manage LXD containers with a tunned configuration which includes dockerized NGINX configurations, ZFS partiton with hypervisor mountpoints and SSH client configurations.

- [LXCE Usage](#lxce-usage)
  - [USAGE](#usage)
    - [lxce install](#lxce-install)
    - [lxce init](#lxce-init)
    - [lxce launch](#lxce-launch)
    - [lxce delete](#lxce-delete)
    - [lxce destroy](#lxce-destroy)
    - [lxce start](#lxce-start)
    - [lxce stop](#lxce-stop)
    - [lxce proxy](#lxce-proxy)
    - [lxce pass](#lxce-pass)
    - [lxce show](#lxce-show)
    - [lxce alias](#lxce-alias)
    - [lxce nginx](#lxce-nginx)
    - [lxce man](#lxce-man)
- [FIRST STEPS](#first-steps)
  - [LXCE PASSWORD](#lxce-password)


## USAGE

Options:
  --version  Show version number
  --help     Show help

lxce [command]
| subcommand | Description |
|:-----------|:----------- |
| install    | install the lxce                                                  |
| init       | Initialize config with defaults                                   |
| launch     | Launch containers from a config file or a domain                  |
| delete     | Stop and remove a container and its asociated config file         |
| destroy    | Delete all the resources of the - container including it's volumes|
| start      | start the container that created before                           |
| stop       | stop container                                                    |
| proxy      | Stop current proxies and generate new ones from config file.      |
| pass       | Computes the passwords of a container                             |
| show       | Show information about domains and containers                     |
| alias      | Reference an alias to an ID. Ex: default-00 -> default-alias      |
| nginx      | Manage nginx, their config files and certbot certificates         |
| man        | Show manual                                                       |
| --version  | Show version number                                               |
| --help     | Show help                                                         |

### lxce install

*Install config files and default locations*

- Create default folders  
- Initialize config files with defaults  

---------------------------------------------------------

### lxce init

*Initialize files depends on config files*

   - Apply the configuration files
   - It is compulsary to use it before using other commands

---------------------------------------------------------

### lxce launch

*Launch containers from a config file or a domain*

- lxce launch
  - It creates a container in the default domain
  - e.g: lxce launch

- lxce launch [-d Domain_Name]
  - It creates Domain with the given name (Domain_Name)
  - e.g: lxce launch -d fullstack 
  
- lxce launch [-r Range]
  - It creates the number of Range containers
  - e.g: lxce launch -r 3  
    -  default-00 default-01 default-02

- lxce launch -d fulltack -r 5 
  - Creates 5 container in fullstack domain uses first empty holes

---------------------------------------------------------

### lxce delete

*Stop and remove a container, its associated config file and its nginx config*

- lxce delete -n ContainerName
  - e.g: lxce delete -n fullstack-02

- lxce delete -d DomainName
  - lxce delete -d fullstack : Delete all containers of fullstack

- lxce delete -d DomainName -R StartOfRange-EndOfRange                     
  - lxce delete -d fullstack -R 01-03

- lxce delete -R 03-06  
  - deletes default containers 03-06 : default-03, default-04, ...

 ---------------------------------------------------------

 ### lxce destroy

 *Stop and delete all the resources of the container including it's volumes and it's nginx configurations *

- lxce destroy -n ContainerName
  - e.g: lxce destroy -n fullstack-02

- lxce destroy -d DomainName
  - lxce destroy -d fullstack : Delete & Destroy all containers of fullstack

- lxce destroy -d DomainName -R StartOfRange-EndOfRange                     
  - lxce destroy -d fullstack -r 01-03

- lxce destroy -R 03-06  
  - deletes destroy containers 03-06 : default-03, default-04, ...

- lxce destroy 
  - destroy all the containers also /etc/lxce directory

---------------------------------------------------------

### lxce start

*Start the container that created before*

- lxce start -n ContainerName
  - lxce start -n fullstack-03

- lxce start -d DomainName  : starts all containers inside given domain
  - e.g: lxce start -d fullstack 

- lxce start -d DomainName -R StartofRange-EndOfRange
  - e.g: lxce start -d fullstack -R 02-04
    - starts fullstack-02, fullstack-03, fullstack-04 

- lxce start -R 00-02
  - starts: default-00 to default-02

---------------------------------------------------------

### lxce stop

*Stop container*

- lxce stop -n ContainerName
  - undex.js stop -n fullstack-03

- lxce stop -d DomainName  : stops all containers inside given domain
  - e.g: lxce stop -d fullstack 

- lxce stop -d DomainName -R StartofRange-EndOfRange
  - e.g: lxce stop -d fullstack -r 02-04
    - stops fullstack-02, fullstack-03, fullstack-04 

- lxce stop -R 00-02
  - stops: default-00 to default-02

---------------------------------------------------------

### lxce proxy

*Stop current proxies and generate new ones from config file*

- lxce proxy -n default-00: remove current proxies and recreate 
  it from the config file

---------------------------------------------------------

### lxce pass 

*Computes the passwords of a container*

- lxce pass -n ContainerName : Print passwords for alice and bob
- lxce pass -n ContainerName -q : Only prints passwords
- lxce pass -n ContainerName -u User : Print passwords for User

---------------------------------------------------------

### lxce show

*Show information about containers*

- lxce show
  - show information about all containers and domains
  - default   domain_id: 10 last_container_id: 7 holes_container_id: [2,4] 

- lxce show -n ContainerName
  - lxce show -n fullstack-00 : print configuration file  

- lxce show -d DomainName
  - lxce show -d fullstack : print domain info in a column
    
---------------------------------------------------------

### lxce alias 

*Reference an alias to an ID. Ex: default-00 -> default-alias*

- lxce alias -n ContainerName -a AliasName
  - e.g. lxce alias -n default-00 -a hesam
  - This command also checks and updates nginx configurations and certificates

- lxce alias --rm ContainerName : Remove alias from a container
  - e.g. lxce --rm default-hesam
  - This command also checks and updates nginx configurations and certificates

- lxce alias -l|--list
  - shows all aliases used

- lxce alias --find aliasName
  - Return container name with id 
  - e.g. lxce alias -a default-hesam
  ```
  default-00
  ```
----------------------------------------------------------

### lxce nginx

*Manage nginx, their config files and certbot certificates*

- lxce nginx --start
  - Start dockerized nginx

- lxce nginx --stop
  - Stop dockerized nginx

- lxce ngnix --restart
  - Restart dockerized nginx

- lxce ngnix --reload
  - Reload dockerized nginx

- lxce ngnix --purge 
  - Remove config files and certificates that do not have an asociated lxce container

- lxce ngnix -n ContainerName 

- lxce ngnix -l|--list : List all the '50-lxce' config files and certificates

- lxce ngnix --filter ContainerName : List config files and certs for ContainerName

----------------------------------------------------------

### lxce man

*Show manuals and detailed functionalities of the command*

- lxce man : Prints the documentation for all the subcommands

- lxce man -f|--filter SubcommandName : Prints only SubcommandName documentation


# FIRST STEPS

TODO...

Careful with letsencrypt limits.
The main limit is Certificates per Registered Domain (50 per week).
https://letsencrypt.org/docs/rate-limits/

lxce launch -d testing
lxce show
lxc ls

cat /etc/lxce/ssh/lxce/testing-00
cat /etc/lxce/container.conf.d/testing-00

lxce proxy -n testing-00
lxc config device show testing-00
netstat -ntlp

cd /datassd/lxce/testing-00

cd /opt/nginx
ls docker-volumes/nginx

docker-compose exec certbot certbot delete

lxce alias
lxce alias -n testing-00 -a jose

docker-compose exec nginx nginx -s reload
docker-compose exec certbot certbot list
docker-compose exec certbot certbot delete

ll docker-volumes/nginx
cat docker-volumes/nginx/50-lxce-www.jose.testing.conf
cat docker-volumes/nginx/50-lxce-www.00.testing.conf
cat docker-volumes/nginx/50-lxce-www.jose.testing.conf

lxce alias -l

lxce destroy testing-00
lxce destroy -n testing-00
lxce destroy -n default-00


## LXCE PASSWORD

During 'lxce install' a 16 random hex digits are generated as a seed in the /etc/lxce/lxce.conf file. Then, this seed is used to compute each password with the following line:

> crypto.createHash('sha256').update(key, 'utf8').digest('hex').substring(0, PASSWORD_LENGTH);

*Note: key is 'seed + cname + user'*
