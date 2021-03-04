import yargs, { string, describe, choices, boolean } from "yargs";

// Commands imports
// TODO: clean imports
// follow: https://github.com/gebhartn/motive.cli/blob/master/src/cmds/index.ts
import { cmdInstall } from "./cmds/install"
import { cmdInit } from "./cmds/init"
import { cmdLaunch } from "./cmds/launch"
import { cmdDelete } from "./cmds/delete"
import { cmdDestroy } from "./cmds/destroy"
import { cmdStart } from "./cmds/start"
import { cmdStop } from "./cmds/stop"
import { cmdProxy } from "./cmds/proxy"
import { cmdPass } from "./cmds/pass"
import { cmdShow } from "./cmds/show"
import { cmdNginx } from "./cmds/nginx"
import { cmdMan } from "./cmds/man"
import { cmdList } from "./cmds/list";


// ------------------------
// Command options
// Need to be declared before yargs parser
// ------------------------
const name: yargs.Options = {
    alias: 'n',
    describe: 'Name of the container',
    demand: false,
    type: 'string',
    nargs: 1,
};

const nameDemand: yargs.Options = {
    alias: 'n',
    describe: 'Name of the container',
    demand: false,
    type: 'string',
    nargs: 1,
};

const nameArray: yargs.Options = {
    alias: 'n',
    describe: 'Names of the containers',
    demand: false,
    type: 'array',
};

const alias: yargs.Options = {
    alias: 'a',
    describe: 'Alias name of the container',
    demand: false,
    type: 'array',
};
const quiet: yargs.Options = {
    alias: 'q',
    describe: 'Quiet mode',
    demand: false,
    type: 'boolean',
};
const domainDemand: yargs.Options = {
    alias: 'd',
    describe: 'Domain name for a group of containers',
    demand: true,
    type: 'string',
    nargs: 1,
};

const domainNoDemand: yargs.Options = {
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
    default: 1,
    type: 'number',
    nargs: 1,
};
const global: yargs.Options = {
    alias: "g",
    describe: "Applied to all containers",
    demand: false,
    type: "boolean",
    nargs: 0
}

const Range: yargs.Options = {
    alias: 'R',
    describe: 'Range of containers, e.g. -R 0-5 or 0-5',
    demand: false,
    type: 'string',
    nargs: 1,
};
const force: yargs.Options = {
    alias: 'f',
    describe: 'Force changes ',
    demand: false,
    type: 'boolean',
};
const find: yargs.Options = {
    describe: 'Find an item ',
    demand: false,
    type: 'string',
    nargs: 1,
};
const list: yargs.Options = {
    alias: 'l',
    describe: 'list of items',
    demand: false,
    type: 'boolean',
};
const debug: yargs.Options = {  // executes commands and provides a verbose output
    describe: 'Debug mode. Verbose output ',
    demand: false,
    type: 'boolean',
};
const remove: yargs.Options = {   // dry run shows the commands without executing any
    alias: 'rm',
    describe: 'remove an item',
    demand: false,
    type: 'string',
    nargs: 1,
};
const dry: yargs.Options = {   // dry run shows the commands without executing any
    describe: 'Dry run of the command',
    demand: false,
    type: 'boolean',
};
const yes: yargs.Options = {
    alias: 'y',
    describe: 'yes answer to questions',
    demand: false,
    type: 'boolean',
};
const start: yargs.Options = {
    describe: 'Start dockerized nginx',
    demand: false,
    type: 'boolean',
};
const stop: yargs.Options = {
    describe: 'Stop dockerized nginx',
    demand: false,
    type: 'boolean',
};
const restart: yargs.Options = {
    describe: 'Restart dockerized nginx',
    demand: false,
    type: 'boolean',
};
const reload: yargs.Options = {
    describe: 'Reload dockerized nginx',
    demand: false,
    type: 'boolean',
};
const purge: yargs.Options = {
    describe: 'Remove config files and certificates that do not have an asociated lxce container',
    demand: false,
    type: 'boolean',
};
const filter: yargs.Options = {
    alias: 'F',
    describe: 'List config files and certs for ContainerName',
    demand: false,
    type: 'string',
    nargs: 1,
};



/******************************************/
// Command line parsing
/******************************************/
yargs(process.argv.slice(2))
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
        builder: {
            "names": nameArray,
            range,
            domain: domainDemand,
        },
        handler: cmdLaunch,

    })
    .command({
        command: "start",
        describe: "Start a container that created before",
        builder: {
            global,
            "domain": domainNoDemand,
            name,
        },
        handler: cmdStart
    })
    .command({
        command: "stop",
        describe: "Stop a container",
        builder: {
            global,
            "domain": domainNoDemand,
            name,
        },
        handler: cmdStop
    })
    .command({
        command: "delete",
        describe: "Stop and remove a container along it's configuration files",
        builder: {
            name: nameDemand,
            domain: domainDemand
        },
        handler: cmdDelete
    })
    .command({
        command: "destroy",
        describe: "NOT IMPLEMENTED",
        //describe: "Same as delete but also remove read only directories ?????",
        builder: {
            name,
            range,
            alias,

        },
        handler: cmdDestroy
    })
    .command({
        command: "proxy",
        describe: "Stop current proxies and generate new ones from config file",
        builder: {
            global,
            "domain": domainNoDemand,
            name,
        },
        handler: cmdProxy
    })
    .command({
        command: "list",
        describe: "Temporal list of containers",
        builder: {
        },
        handler: cmdList
    })
    .command(
        "pass",
        "NOT IMPLEMENTED",
        //"Computes the passwords of a container",
        {

        },
        cmdPass
    )
    .command(
        "show",
        "NOT IMPLEMENTED",
        //"Show information about containers",
        {

        },
        cmdShow
    )
    .command(
        "nginx",
        "NOT IMPLEMENTED",
        //"Manage nginx, their confile files and certbot certificates",
        {

        },
        cmdNginx
    )
    .command(
        "man",
        "NOT IMPLEMENTED",
        //"Show manuals and detailed functionalities of the command",
        {

        },
        cmdMan
    )
    .strict()
    .help()
    .alias('h', 'help',)
    .alias('v', 'version')
    .help()
    .argv;
yargs.showHelp()

