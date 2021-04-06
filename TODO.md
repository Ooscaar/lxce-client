# TODO
---------------------------------------------------------------------------
## v.0.2.0
---------------------------------------------------------------------------
### General
- [x] Add two different completions scripts (completion.zsh and completion.extra.zsh)
- [x] set package.json to true
- [x] Added options in different groups for display purposes:
	- command specifics: "Options"
	- global commands: "Flags"
- [x] ~~Manage case when no containers are located in domain:~~ --> should not happen
- [ ] ~~Add logger with loglevel specified (i.e: ability to run --debug|--verbose)
      or just use [yargs-log-example](https://github.com/yargs/yargs/blob/0175677b79ffe50a9c5477631288ae10120b8a32/example/count.js#L9)~~
- [ ] Manage throws and errors differently. Maybe throw and exit and just print
- [ ] Add npm winston logger package
       the error message (look example repository). Or use yargs.fail()
- [ ] ~~With yargs, create command with options/choices
       (i.e: launch <--get-name | --global>)~~
- [ ] Modify README and add a "development guide" 
- [ ] Complete the descriptions of the commands with 
	- yargs.usage("Usage: \n $0 ...)
- [x] Add git utils functions and add commit/pull etc on commands
- [ ] Add utils function which return [] of all the container..
- [ ] Manage error for not letting malfunction configuration files
- [ ] Update function with last utils functions
- [ ] ~~Manage if one command is assumed to receive an existing domain~~


### Commands
- [ ] global:
    * [x] add name property to configuration files
    * [x] add commandDir() for yargs with the necessary exports on the commands 
    * [x] change locations -> /home/user/data
    * [x] change locations -> /home/user/data-domain 
    * [x] remove user folder
    * [x] ssh-config INCORRECT -> change from: name.domain.suffix to:suffix.domain.name
    * [x] introduce new options for specific commands (-y) for questions
    * [x] add user property to configuration files (as needed for password)
    * [x] remove folder from /etc/lxce/container.conf.d/domain/ if the last container within it
	  is removed. Don't do the same (directly) onto the shared directories, as the shared 
	  domain directory may be used later.
	  This prevent us on looking a domain without any container inside
    * [ ] follow same options order for all commands
    * [ ] remove all TODO's and FIXME
    * [ ] comment utils functions with jsdocs syntax 
- [x] show: show current configurations. Think how to pass the parameters
- [x] launch: add user & name parameters to the configuration file
- [x] delete: 
    * [x] unify delete and destroy 
    * [ ] ~~if -f/--force options is passed, remove shared directories and lxceConfig list domains~~
    * [ ] add questions prompting the removal of shared folders
- [x] destroy: remove command
- [x] uninstall: destroy everything, including conf files
- [x] password: compute password for container 
- [x] alias: add command for (Using command for each one??)
    * [x] set
    * [x] unset
    * [x] show
- [x] list: 
    * [x] change ports to port-container --> internal-port
    * [x] default configuration as it is
    * [x] add -f/--format options
    * [x] lxce list --format --> show all posible options
    * [x] use a more convenient way of making request to the lxd daemon 
      (look at existing client implementations)
- [x] **v0.2.1** init: maybe add some questions to initialize the conf files (like lxd) 
    * [x] base (check)
    * [x] suffix (check)
    * [x] ~~Hostname (check)~~ --> don't check the hostname/ip passed as dynamic ..
- [x] rebase: add command (default, domain, container)
- [x] proxy: added proxy more verbose --> make utils function, as is used also
      from launch
- [x] utils:
    * [x] lxc functions
    * [x] git function
- [ ] completion: 
    * implement command script for generating shell completions
      as seen in the links
    * implement custom completion as seen on pull request on yargs
    * think a way to make completion/parser.py global

### From meeting
- [x] rebase: add rebase command
- [x] alias: set/unset/show
- [x] list: show RAM, base
- [ ] add examples and Usage messages



### Customization
- [x] Add "npm prompt" for the questions following links
- [ ] Add "npm chalk" for custom messages with colors
- [x] Add "npm loglevel"
- [ ] Modify all the usage messages for each command
- [ ] ~~Order commands in lxce help message~~

### DUDAS (12/03/2021)
- Borrar el directorio de los dominios cuando no exista ningun contenedor dentro?. Igual con la parte de domains dentro de lxce config.
- Cuando vaya a borrar los contenedores y se especifique domain or global, muestrar como esta ahora, o mostrar toda la lista de contenedores??
- Cuando creo el usuario del contenedor y ejecuto una bash con un sudo no me pido password
- Uninstall borrara tambien los contenedores que estan corriendo, o te deberia de salir los contenedores que vas a borrar??
- Como hago para que cuando llame lxce uninstall me salga el help, porque no tenemos parametros, por tanto siempre acaba inicialzando el programa
- Alias actua sobre uno solo o tambien puede actuar sobre varios parametro (como el launch)?? Definir como usar el comando
- De la forma en la que esta bien (lxce alias modify -d google -n oscar -a perez) o con una pregunta??
- delete: ??? prompt question with all the containers you are going to remove

### Dudas (22/03/2021)
- [ ] **lxce.conf**: no le acabo de encontrar la utilidad a:
  * domains: si los usas como el indice para poder asignar los puertos de los proxies hay el problema de 
    los "agujeros". (De momento he optado por utilizar la lista de carpetas en container.conf.d)
    O estan para los dominios que siempre van a estar o los que solo voy a crear al principio del comando
    En el segundo caso, entonces no se podrian eliminar dichos dominions
  * **IMPORTANTE**: creo que el apartado de locations de lxce.conf, a parte de seguir como una guía para poder
    tener una estructura de dominios, deberia de funcionar de las siguiente forma: - definir la estructura
    de dominios al principio, ESPECIFICANDO LOS ID's de cada dominio, - cada vez que se crea un dominio
    se coge el primer "agujero" o el ultimo disponible. Esto permite poder borrar dominios y que no queden
    agujeros. (NO se si existe otra solucion)
    ```json
	{
	  "domains": [
	    {"name": "default", "id":"0"},
	    {"name": "google", "id":"1"},
	    {"name": "amazon", "id":"3"},
	  ]
	}
    ```
  * domains: son los que primero de crearan?
  * locations: estas locations intuyo que solo entraran en juego en el momento de init y ya esta  
    (ej: situación de que estoy trabajando con los directories compartidos en /datasdd y digo: quiero
    cambiar ahora las locations de los shared) ... que se te pregunte sobre cual quieres??
- [ ] **alias/names**: definir los parametros a pasar
  * [x] launch: --names & --aliases ?? --> ok!
  * alias: como definimos el nuevo alias y el viejo alias??
  * remove (equivale  a otros tambien): --name & --alias
- [ ] el root dentro del contenedor no pide contraseña
- [ ] poner un comando para cambiar los ficheros de configuracion??

### Dudas (26/03/2021)
- [ ] Se deberia de poder borrar el directorio por defecto??
