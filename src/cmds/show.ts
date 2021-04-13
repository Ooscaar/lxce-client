import path from "path"
import yargs from "yargs"
import { CONF_FILE, CONTAINER_CONFIG_DIR, SSH_DIR } from "../constants"
import {
    getDomains,
    getContainersDomain,
    readContainerConfig,
    getContainerName,
    checkDomain,
    checkInitialized,
    generatePassword,
    readLxceConfig
} from "../utils/util"
import chalk from "chalk"
import fs from "fs"




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

// Prints:
// - ssh configuration
// - password
// - container configuration (verbose enabled)
function show(name: string, domain: string, verbose: string) {
    const lxceConfig = readLxceConfig(CONF_FILE)
    const containerConfig = readContainerConfig(
        path.join(
            CONTAINER_CONFIG_DIR,
            domain,
            name
        )
    )
    const sshConfig = fs.readFileSync(path.join(SSH_DIR, domain, name), "utf-8")
    const password = generatePassword(
        lxceConfig.seed,
        name,
        containerConfig.user
    )

    //let json = Convert.containerConfigToJson(containerConfig)
    console.log(chalk.bold.cyan(`[*] Configuration ${name}`))
    console.log(chalk.blue(sshConfig))
    console.log(chalk.red(`Password: ${password}`))
    if (verbose) {
        console.log(containerConfig)
    }

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
                show(containerName, domain, args.extra)
            }
        }
        process.exit(0)
    }

    // --domain | --domain --name
    if (args.domain && !args.name && !args.alias) {
        console.log(`[*] Configurations from`, chalk.bold(`${args.domain}`))
        console.log("---------------------------------------")
        for (let containerName of getContainersDomain(args.domain)) {
            show(containerName, args.domain, args.extra)
        }
        process.exit(0)

    } else {
        if (!args.domain) {
            console.log("[*] Please select the domain")
            console.log("[*] Example: lxce show -d google -n alice")
            process.exit(1)
        }
        let containerName = getContainerName(args.alias ?? args.name, args.domain)
        show(containerName, args.domain, args.extra)
        process.exit(0)
    }
}


// ---------------------
// Yargs command options
// ---------------------
export const command = "show"

export const describe = "Show containers configurations files"

export const handler = cmdShow

export const builder = (yargs: any) => {
    yargs.option("global", {
        alias: "g",
        describe: "Apply to all containers",
        demand: false,
        type: "boolean",
        nargs: 0,
        group: "Options"
    })
    yargs.option("domain", {
        alias: 'd',
        describe: 'Domain name for a group of containers',
        demand: false,
        type: 'string',
        nargs: 1,
        group: "Options"
    })
    yargs.option("name", {
        alias: 'n',
        describe: 'Container name',
        demand: false,
        type: 'string',
        nargs: 1,
        group: "Options"
    })
    yargs.option("alias", {
        alias: 'a',
        describe: 'Container alias',
        demand: false,
        type: 'string',
        nargs: 1,
        group: "Options"
    })
    yargs.option("extra", {
        alias: 'e',
        describe: 'Show extra information',
        demand: false,
        default: false,
        type: 'boolean',
        nargs: 0,
        group: "Options"
    })
    yargs.example([
        ["$0 show --global", "Show all containers configurations"],
        ["$0 show -d google", "Show all containers configurations within domain"],
        ["$0 show -d google -n still-yellow", "Show container configurations defined by name"],
        ["$0 show -d google -a alice", "Stop container configuration defined by alias"],
    ])
}
