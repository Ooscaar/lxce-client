import yargs from "yargs"
import path from "path"
import { askQuestion, checkAccess, checkDomain, checkInitialized, generatePassword, getContainersDomain, getDomains, getContainerName, getUserContainer, lxcDelete, lxcDeviceAdd, lxcLaunch, lxcPassword, lxcProxy, lxcWait, lxdDNS, readContainerConfig, writeContainerConfig, checkBase, readLxceConfig } from "../utils/util"
import { CONF_FILE, CONTAINER_CONFIG_DIR, DEFAULT_CONTAINER_CONF_FILE, LXCE_DIR, SHARED_FOLDER } from "../constants"
import { getPortNumber } from "./launch"
import log from "loglevel"
import chalk from "chalk"

function checkRebase(base: string) {
    // Check Init
    log.debug("[*] init: checking everything is initialized")
    if (!checkInitialized()) {
        yargs.showHelp()
        console.log("[*] run lxce init before")
        process.exit(1)
    }
    log.debug("[*] Init: ok!")


    // Check write permissions
    log.debug("[*] Permission checking")
    if (!checkAccess()) {
        console.log("[*] Does not have access to the directory")
        console.log("[*] Please run the command with sudo")
        process.exit(1)
    }
    log.debug("[*] Permission checking: ok!")

    // Check base exist
    if (!checkBase(base)) {
        log.error(`[*] base ${chalk.bold(base)} does not exist `)
        log.error("[*] please provide a valid container base")
        process.exit(1)
    }

}

// Rebase container by deleting container
// and relaunch it with the new base
// aplying all the configurations and shared folders
function rebase(name: string, domain: string, newBase: string, seed: string, hostname: string) {

    log.info(chalk.bold(`[*] Rebasing ${name}`))

    // Absolute paths
    const containerPath = path.join(CONTAINER_CONFIG_DIR, domain, name)

    // Read existing configuration file
    let containerConfig = readContainerConfig(containerPath)

    // If base is the same abort rebasing of the container
    if (containerConfig.base === newBase) {
        console.log(`[**] Same base detected on ${name}`)
        console.log("[**] Aborting the rebase")
        return
    }

    // Relaunch container with new base
    // and apply all configurations
    lxcDelete(name)
    lxcLaunch(name, newBase)
    lxcWait(name)
    let newUser = getUserContainer(name)
    let newPassword = generatePassword(seed, name, newUser)
    lxcPassword(name, newUser, newPassword)

    // TODO: don't really like this way of gettings the
    // proxy index
    // Proxies
    let index = 0
    for (const proxy of containerConfig.proxies) {
        let hostPort = getPortNumber(
            containerConfig.id_container,
            containerConfig.id_domain,
            index
        )
        lxcProxy(name, hostPort, hostname, proxy)
        index += 1
    }
    // Directories
    const containerDirectoryPath = path.join(containerConfig.userData, LXCE_DIR, domain, name)
    const sharedDirectoryPath = path.join(containerConfig.userData, LXCE_DIR, domain, SHARED_FOLDER)
    lxcDeviceAdd(name, newUser, containerDirectoryPath, newUser)
    lxcDeviceAdd(name, domain, sharedDirectoryPath, newUser)
    lxdDNS(name)


    // Update configuration file
    containerConfig.user = newUser
    containerConfig.base = newBase
    writeContainerConfig(containerPath, containerConfig)

    log.info(chalk.bold(`${chalk.green("[\u2713]")} Rebasing ${name}`))

}


async function cmdRebase(args: any) {

    // if (!args.global && !args.domain && !args.name && !args.alias) {
    //     yargs.showHelp()
    //     process.exit(1)
    // }

    checkRebase(args.base)

    const lxceConfig = readLxceConfig(CONF_FILE)

    // --global
    if (args.global) {
        if (!args.yes) {
            const answer = await askQuestion(`Do you want to rebase ALL containers with ${args.base}?`)
            if (!answer) {
                process.exit(1)
            }
        }

        for (let domain of getDomains()) {
            for (let containerName of getContainersDomain(domain)) {
                rebase(containerName, domain, args.base, lxceConfig.seed, lxceConfig.hypervisor.SSH_hostname)
            }
        }

        // Set default base for next containers
        let containerConfig = readContainerConfig(DEFAULT_CONTAINER_CONF_FILE)
        containerConfig.base = args.base
        writeContainerConfig(DEFAULT_CONTAINER_CONF_FILE, containerConfig)
        log.info(`[*] Set default base: ${args.base}`)

        process.exit(0)
    }

    // --domain
    if (!args.domain) {
        console.log("[*] Please select the domain")
        process.exit(1)
    }

    if (!args.name && !args.alias) {

        if (!checkDomain(args.domain)) {
            console.log(`[*] Domain ${args.domain} does not exist`)
            process.exit(1)
        }

        if (!args.yes) {
            const answer = await askQuestion(`Do you want to rebase ALL containers within ${args.domain} with ${args.base}?`)
            if (!answer) {
                process.exit(1)
            }
        }

        for (let containerName of getContainersDomain(args.domain)) {
            rebase(containerName, args.domain, args.base, lxceConfig.seed, lxceConfig.hypervisor.SSH_hostname)
        }

        process.exit(0)

    }

    // --domain & --name | --alias
    if (args.name && args.alias) {
        console.log("[*] Please select between alias or name")
        process.exit(1)
    }
    let containerName = getContainerName(args.alias ?? args.name, args.domain)

    if (!args.yes) {
        const answer = await askQuestion(`Do you want to rebase ${containerName} container within ${args.domain} with ${args.base}?`)
        if (!answer) {
            process.exit(1)
        }
    }

    rebase(containerName, args.domain, args.base, lxceConfig.seed, lxceConfig.hypervisor.SSH_hostname)
    process.exit(0)



}


// ---------------------
// Yargs command options
// ---------------------
export const command = "rebase"

export const describe = "Relaunch container with new base specified"

export const handler = cmdRebase


export const builder = (yargs: any) => {
    yargs.usage("Usage: $0 rebase <options> <flags>")
    yargs.strict()
    yargs.option("global", {
        alias: "g",
        describe: "Applied to all containers",
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
    yargs.option("base", {
        alias: 'b',
        describe: 'Container base',
        demand: true,
        type: 'string',
        nargs: 1,
        group: "Options"
    })
    yargs.example([
        ["$0 rebase --global", "Applies new base to existing containers and future ones"],
        ["$0 rebase -d google", "Applies new base to all containers withing google domain"],
        ["$0 rebase -d google -n still-yellow", "Applies new base to container specified"],
        ["$0 rebase -d google -a alice", "Applies new base to container specified"],
    ])
}


// Rebase
// rebase --default -b ubuntu:20.04
// rebase --domain google -b ubuntu:20.04
// rebase --domain -n/-a -b ubuntu:20.04

