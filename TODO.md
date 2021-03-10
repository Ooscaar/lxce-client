# TODO
---------------------------------------------------------------------------
## v.0.2.0
---------------------------------------------------------------------------
### General
- [ ] Add logger with loglevel specified (i.e: ability to run --debug|--verbose)
- [ ] Manage throws and errors differently. Maybe throw and exit and just print
       the error message (look example repository) 
- [ ] With yargs, create command with options/choices 
       (i.e: launch <--get-name | --global>)
- [ ] Add two different completions scripts (completion.zsh and completion.extra.zsh)
- [ ] Modify README and add a "development guide" 
- [ ] Complete the descriptions of the commands

### Commands
- [ ] global:
    * add commandDir() for yargs with the necessary exports on the commands
    * change locations -> /home/user/data
    * change locations -> /home/user/data-domain 
    * remove user folder
    * ssh-cois INCORRECT   * change from: name.domain.suffix to:suffix.domain.name
    * introduce new options for specific commands (-y) for questions
    * remove all TODO's and FIXME
    * comment utils functions with jsdocs syntax 
- [ ] init: maybe add some questions to initialize the conf files (like lxd)
- [ ] show: show current configurations. Think how to pass the parameters
- [ ] list: 
    * default configuration as it is
    * add -f/--format options
    * lxce list --format --> show all posible options
    * use a more convenient way of making request to the lxd daemon 
      (look at existing client implementations)
    * change ports to port-container --> internal-port
- [ ] delete: remove command
- [ ] destroy: 
    * unify delete and destroy 
    * prompt question with all the containers you are going to remove
- [ ] uninstall: destroy everything, including conf files
- [ ] proxy: added proxy more verbose 
- [ ] completion: think a way to make completion/parser.py global
- [ ] password: compute password for container 
- [ ] alias: add command for:
    * modify
    * create
    * show
- [ ] completion: 
    * implement command script for generating shell completions
      as seen in the links
    * implement custom completion as seen on pull request on yargs

### Customization
- [ ] Add "npm chalck" for custom messages with colors
- [ ] Add "npm loglevel"
- [ ] Add "npm prompt" for the questions following links
- [ ] Modify all the usage messages for each command
- [ ] Order commands in lxce help message

