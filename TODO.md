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
- [ ] Add git utils functions and add commit/pull etc on commands
- [ ] Add utils function which return [] of all the container..
- [ ] Manage error for not letting malfunction configuration files
- [ ] Manage if one command is assumed to receive an existing domain 


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
      - [ ] change utils functions related
    * [ ] follow same options order for all commands
    * [ ] remove all TODO's and FIXME
    * [ ] comment utils functions with jsdocs syntax 
- [x] show: show current configurations. Think how to pass the parameters
- [x] launch: add user & name parameters to the configuration file
- [x] delete: 
    * [x] unify delete and destroy 
- [x] destroy: remove command
- [x] uninstall: destroy everything, including conf files
- [x] password: compute password for container 
- [x] alias: add command for (Using command for each one??)
    * modify
    * delete
    * show
- [x] list: 
    * [x] change ports to port-container --> internal-port
    * [ ] default configuration as it is
    * [ ] add -f/--format options
    * [ ] lxce list --format --> show all posible options
    * [ ] use a more convenient way of making request to the lxd daemon 
      (look at existing client implementations)
- [ ] **v0.2.1** init: maybe add some questions to initialize the conf files (like lxd) 
- [ ] proxy: added proxy more verbose --> make utils function, as is used also
      from launch
- [ ] completion: 
    * implement command script for generating shell completions
      as seen in the links
    * implement custom completion as seen on pull request on yargs
    * think a way to make completion/parser.py global
### Customization
- [x] Add "npm prompt" for the questions following links
- [ ] Add "npm chalk" for custom messages with colors
- [ ] Add "npm loglevel"
- [ ] Modify all the usage messages for each command
- [ ] ~~Order commands in lxce help message~~

### DUDAS
- Borrar el directorio de los dominios cuando no exista ningun contenedor dentro?. Igual con la parte de domains dentro de lxce config.
- Cuando vaya a borrar los contenedores y se especifique domain or global, muestrar como esta ahora, o mostrar toda la lista de contenedores??
- Cuando creo el usuario del contenedor y ejecuto una bash con un sudo no me pido password
- Uninstall borrara tambien los contenedores que estan corriendo, o te deberia de salir los contenedores que vas a borrar??
- Como hago para que cuando llame lxce uninstall me salga el help, porque no tenemos parametros, por tanto siempre acaba inicialzando el programa
- Alias actua sobre uno solo o tambien puede actuar sobre varios parametro (como el launch)?? Definir como usar el comando
- De la forma en la que esta bien (lxce alias modify -d google -n oscar -a perez) o con una pregunta??
- delete: ??? prompt question with all the containers you are going to remove
