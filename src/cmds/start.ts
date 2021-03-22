import { execSync } from "child_process"
import * as fs from "fs"
import path from "path"
import yargs from "yargs"
import { CONF_FILE, CONTAINER_CONFIG_DIR } from "../constants"
import { checkDomain, checkInitialized, getContainersAll, getContainersDomain, getContainerName, readContainerConfig, readLxceConfig } from "../utils/util"



function startContainer(name: string) {
    let cmdStart = `lxc start ${name} 2>/dev/null`
    try {
        console.log(`[**] Starting: ${name}`)
        execSync(cmdStart)
        console.log("[**] Container ok !!")
    } catch (err) {
        // Only show error, continue ejecution
        console.log(err.message)

    }
}

function checkStart(domain: string) {

    if (!checkInitialized()) {
        yargs.showHelp()
        console.log("[*] run lxce init before")
        process.exit(1)
    }

    if (domain) {
        if (!checkDomain(domain)) {
            console.log("[*] Domain does not exist")
            process.exit(1)
        }
    }
}

// Start options:
// lxce start --global
// lxce start --domain default
// lxce start --name alice --domain default (alias or name)
export function cmdStart(args: any) {

    if (!args.name && !args.global && !args.domain) {
        yargs.showHelp()
        process.exit(1)
    }

    checkStart(args.domain)

    // --global
    if (args.global) {
        console.log("[*] Starting all containers")
        console.log("--------------------------------")
        for (let containerName of getContainersAll()) {
            startContainer(containerName)
        }
        console.log("--------------------------------")
        console.log("[*] Starting all containers: ok!")
        process.exit(0)
    }

    // --domain | --domain --name
    if (args.domain && !args.name) {
        console.log(`[*] Starting all containers from ${args.domain}`)
        console.log("-----------------------------------------------")
        for (let containerName of getContainersDomain(args.domain)) {
            startContainer(containerName)
        }
        console.log("-----------------------------------------------")
        console.log(`[*] Starting all containers from ${args.domain}: ok!`)
        process.exit(0)

    } else {
        if (!args.domain) {
            console.log("[*] Please select the domain")
            console.log("[*] Example: lxc start -d google -n alice")
            process.exit(1)
        }
        let containerName = getContainerName(args.alias ?? args.name, args.domain)
        startContainer(containerName)
        process.exit(0)
    }


}

// ---------------------
// Yargs command options
// ---------------------
export const command = "start"

export const describe = "Start containers"

export const handler = cmdStart

export const builder = {
    "global": {
        alias: "g",
        describe: "Apply to all containers",
        demand: false,
        type: "boolean",
        nargs: 0
    },
    "domain": {
        alias: 'd',
        describe: 'Domain name for a group of containers',
        demand: false,
        type: 'string',
        nargs: 1,
    },
    "name": {
        alias: 'n',
        describe: 'Container name',
        demand: false,
        type: 'string',
        nargs: 1,
    },
    "alias": {
        alias: 'a',
        describe: 'Container alias',
        demand: false,
        type: 'string',
        nargs: 1,
    }
}
