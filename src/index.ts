// Consts and helpers
import * as arguments from "./constants"         //Ugly?
import yargs, { string, describe } from "yargs";

// Commands imports
// TODO: clean imports
// follow: https://github.com/gebhartn/motive.cli/blob/master/src/cmds/index.ts
import {cmdInstall} from "./cmds/install"
import {cmdInit} from "./cmds/init"
import {cmdLaunch} from "./cmds/launch"
import {cmdDelete} from "./cmds/delete"
import {cmdDestroy} from "./cmds/destroy"
import {cmdStart} from "./cmds/start"
import {cmdStop} from "./cmds/stop"
import {cmdProxy} from "./cmds/proxy"
import {cmdPass} from "./cmds/pass"
import {cmdShow} from "./cmds/show"
import {cmdNginx} from "./cmds/nginx"
import {cmdMan} from "./cmds/man"


// ------------------------
// Command options
// Need to be declared before yargs parser
// ------------------------
const configFile: yargs.Options = {
    alias: 'c',
    describe: 'File with the definitions of a container',
    demand: false,
    type: 'string',
    nargs: 1,
  };
  const name: yargs.Options = {
    alias: 'n',
    describe: 'Name of the container',
    demand: false,
    type: 'string',
    nargs: 1,
  };
  const aliasname: yargs.Options = {
    alias: 'a',
    describe: 'Alias name of the container',
    demand: false,
    type: 'string',
    nargs: 1,
  };
  const quiet: yargs.Options = {
    alias: 'q',
    describe: 'Quiet mode',
    demand: false,
    type: 'boolean',
  };
  const user: yargs.Options = {
    alias: 'u',
    describe: 'User to compute password. Default: alice and bob',
    demand: false,
    type: 'string',
    nargs: 1,
  };
  const domain: yargs.Options = {
    alias: 'd',
    describe: 'Domain name for a group of containers',
    demand: false,
    type: 'string',
    nargs: 1,
  };
  const range: yargs.Options = {
    alias: 'r',
    describe: 'range of containers, e.g. -r 5 ',
    demand: false,
    type: 'string',
    nargs: 1,
  };
  const Range = {
    alias: 'R',
    describe: 'Range of containers, e.g. -R 0-5 or 0-5',
    demand: false,
    type: 'string',
    nargs: 1,
  };
  const force = {
    alias: 'f',
    describe: 'Force changes ',
    demand: false,
    type: 'boolean',
  };
  const find = {
    describe: 'Find an item ',
    demand: false,
    type: 'string',
    nargs: 1,
  };
  const list = {
    alias: 'l',
    describe: 'list of items',
    demand: false,
    type: 'boolean',
  };
  const debug = {  // executes commands and provides a verbose output
    describe: 'Debug mode. Verbose output ',
    demand: false,
    type: 'boolean',
  };
  const remove = {   // dry run shows the commands without executing any
    alias: 'rm',
    describe: 'remove an item',
    demand: false,
    type: 'string',
    nargs: 1,
  };
  const dry = {   // dry run shows the commands without executing any
    describe: 'Dry run of the command',
    demand: false,
    type: 'boolean',
  };
  const yes = {
    alias: 'y',
    describe: 'yes answer to questions',
    demand: false,
    type: 'boolean',
  };
  const start = {
    describe: 'Start dockerized nginx',
    demand: false,
    type: 'boolean',
  };
  const stop = {
    describe: 'Stop dockerized nginx',
    demand: false,
    type: 'boolean',
  };
  const restart = {
    describe: 'Restart dockerized nginx',
    demand: false,
    type: 'boolean',
  };
  const reload = {
    describe: 'Reload dockerized nginx',
    demand: false,
    type: 'boolean',
  };
  const purge = {
    describe: 'Remove config files and certificates that do not have an asociated lxce container',
    demand: false,
    type: 'boolean',
  };
  const filter = {
    alias: 'F',
    describe: 'List config files and certs for ContainerName',
    demand: false,
    type: 'string',
    nargs: 1,
  };

/******************************************/    
// Command line parsing
/******************************************/
const argv = yargs(process.argv.slice(2))
    .command({
        command: "install",
        describe: "Install config files in default locations",
        handler: cmdInstall
    })
    .command({
        command: "init",
        describe: "Initialize files depends on config files",
        handler: cmdInit
    })
    .command({
        command: "launch",
        describe: "Launch containers from a config file or a domain",
        handler: cmdLaunch,
        builder : {
            name,
        },
    })
    .command(
        "delete",
        "Stop and remove a container, its associated config file and its nginx config",
        {

        },
        cmdDelete
    )
    .command(
        "destroy",
        "Delete all the resources of the container including it's volumes and it's nginx configurations with their associated certificate",
        {

        },
        cmdDestroy
    )
    .command(
        "start",
        "Start a container that created before",
        {

        },
        cmdStart
    )
    .command(
        "stop",
        "Stop a container",
        {

        },
        cmdStop
    )
    .command(
        "proxy",
        "Stop current proxies and generate new ones from config file",
        {

        },
        cmdProxy
    )
    .command(
        "pass",
        "Computes the passwords of a container",
        {

        },
        cmdPass
    )
    .command(
        "show",
        "Show information about containers",
        {

        },
        cmdShow
    )
    .command(
        "nginx",
        "Manage nginx, their confile files and certbot certificates",
        {

        },
        cmdNginx
    )
    .command(
        "man",
        "Show manuals and detailed functionalities of the command",
        {

        },
        cmdMan
    )
    .strict()
    .help()
    .alias('h', 'help')
    .alias('v', 'version')
    .help()
    .argv;

