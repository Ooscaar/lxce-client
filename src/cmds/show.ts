import path from "path"
import yargs from "yargs"
import { CONTAINER_CONFIG_DIR } from "../constants"
import {
    getDomains,
    getContainersDomain,
    readContainerConfig,
    getContainerName,
    checkDomain,
    checkInitialized
} from "../utils/util"
import chalk from "chalk"




function checkShow(domain: string) {

    // Check Init
    if (!checkInitialized()) {
        yargs.showHelp()
        console.log("[*] run lxce init before")
        process.exit(1)
    }
    console.log("[*] Init: ok!")

    if (domain) {
        if (!checkDomain(domain)) {
            console.log("[*] Domain does not exist")
            process.exit(1)
        }
    }

}

function show(name: string, domain: string) {
    const containerConfig = readContainerConfig(
        path.join(
            CONTAINER_CONFIG_DIR,
            domain,
            name
        )
    )
    //let json = Convert.containerConfigToJson(containerConfig)
    console.log(chalk.bold.cyan(`[*] Configuration ${name} (${containerConfig.alias})`))
    console.log(containerConfig)

}
// Install function
function cmdShow(args: any) {

    if (!args.name && !args.global && !args.domain) {
        yargs.showHelp()
        process.exit(1)
    }

    checkShow(args.domain)

    // --global
    if (args.global) {
        console.log("[*] Showing all configurations")
        // Loop over the domains, as domain is needed
        for (let domain of getDomains()) {
            console.log(`[*] Configurations from`, chalk.bold(`${domain}`))
            console.log("---------------------------------------")
            for (let containerName of getContainersDomain(domain)) {
                show(containerName, domain)
            }
        }
        process.exit(0)
    }

    // --domain | --domain --name
    if (args.domain && !args.name) {
        console.log(`[*] Configurations from`, chalk.bold(`${args.domain}`))
        console.log("---------------------------------------")
        for (let containerName of getContainersDomain(args.domain)) {
            show(containerName, args.domain)
        }
        process.exit(0)

    } else {
        if (!args.domain) {
            console.log("[*] Please select the domain")
            console.log("[*] Example: lxce show -d google -n alice")
            process.exit(1)
        }
        let containerName = getContainerName(args.name, args.domain)
        show(containerName, args.domain)
        process.exit(0)
    }
}


// ---------------------
// Yargs command options
// ---------------------
export const command = "show"

export const describe = "Show containers configurations files"

export const handler = cmdShow

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
    }
}
