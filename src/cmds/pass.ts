import * as fs from "fs"
import path from "path"
import yargs from "yargs"
import { CONF_FILE, CONTAINER_CONFIG_DIR } from "../constants"
import { checkDomain, checkInitialized, generatePassword, getContainersAll, getContainersDomain, getDomains, getContainerName, readContainerConfig, readLxceConfig } from "../utils/util"



function checkPass(domain: string) {
    if (!checkInitialized()) {
        yargs.showHelp()
        console.log("[*] run lxce init before")
        process.exit(1)
    }
    console.log("[*] Init ok!")

    if (domain) {
        if (!checkDomain(domain)) {
            console.log("[*] Domain does not exist")
            process.exit(1)
        }
    }

}

// Computes and print container password
// Note: we are only using the configuration file
// for computing the password.
function pass(name: string, domain: string, seed: string) {
    const containerConfig = readContainerConfig(
        path.join(
            CONTAINER_CONFIG_DIR,
            domain,
            name
        )
    )
    const password = generatePassword(
        seed,
        containerConfig.name,
        containerConfig.user
    )
    console.log(`[*] ${domain}.${name}: ${password}`)
}

// Password function
function cmdPass(args: any) {

    if (!args.name && !args.global && !args.domain) {
        yargs.showHelp()
        process.exit(1)
    }

    checkPass(args.domain)

    const seed = readLxceConfig(CONF_FILE).seed
    // --global
    if (args.global) {
        for (let domain of getDomains()) {
            for (let containerName of getContainersDomain(domain)) {
                pass(containerName, domain, seed)
            }
        }
        process.exit(0)
    }

    // --domain | --domain --name
    if (args.domain && !args.name) {
        for (let containerName of getContainersDomain(args.domain)) {
            pass(containerName, args.domain, seed)
        }
        process.exit(0)

    } else {
        if (!args.domain) {
            console.log("[*] Please select the domain")
            console.log("[*] Example: lxc start -d google -n alice")
            process.exit(1)
        }
        let containerName = getContainerName(args.alias ?? args.name, args.domain)
        pass(containerName, args.domain, seed)
        process.exit(0)
    }
}

// ---------------------
// Yargs command options
// ---------------------
export const command = "pass"

export const describe = "Compute password from containers"

export const handler = cmdPass


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
