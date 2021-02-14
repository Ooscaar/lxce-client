// Consts and helpers
import * as CONST from "./constants";
import yargs, { string } from "yargs";

// Commands imports
// TODO: clean imports
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


// Args
// TODO: generalize commands parameters
// Usage:
// #!/usr/bin/env node
// require('yargs')
//   .commandDir('cmds')
//   .demand(1)
//   .help()
//   .argv
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
    .command(
        "launch",
        "Launch containers from a config file or a domain",
        {

        },
        cmdLaunch
    )
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
