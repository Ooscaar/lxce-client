import yargs from "yargs"
import path from "path"
import * as net from "net"
import { askQuestion, checkAccess, checkDomain, checkInitialized, generatePassword, getContainersDomain, getDomains, getContainerName, getUserContainer, lxcDelete, lxcDeviceAdd, lxcLaunch, lxcPassword, lxcProxy, lxcWait, lxdDNS, readContainerConfig, readLxceConfig, writeContainerConfig } from "../utils/util"
import * as http from "http"
import { resolve } from "node:path"
import { rejects } from "node:assert"
import { POINT_CONVERSION_COMPRESSED } from "node:constants"
import { CONF_FILE, CONTAINER_CONFIG_DIR, DEFAULT_CONTAINER_CONF_FILE, LXCE_DIR, SHARED_FOLDER } from "../constants"
import { getPortNumber } from "./launch"

function checkRebase() {
    // Check Init
    if (!checkInitialized()) {
        yargs.showHelp()
        console.log("[*] run lxce init before")
        process.exit(1)
    }
    console.log("[*] Init: ok!")


    // Check write permissions
    if (!checkAccess()) {
        console.log("[*] Does not have access to the directory")
        console.log("[*] Please run the command with sudo")
        process.exit(1)
    }
    console.log("[*] Permission checked")

}

// Rebase container by deleting container
// and relaunch it with the new base
// aplying all the configurations and shared folders
function rebase(name: string, domain: string, newBase: string, seed: string, hostname: string) {

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

}


async function cmdRebase(args: any) {

    if (!args.global && !args.domain && !args.name && !args.alias) {
        yargs.showHelp()
        process.exit(1)
    }

    checkRebase()
    const containerConfigDefault = readContainerConfig(DEFAULT_CONTAINER_CONF_FILE)
    const lxceConfig = readLxceConfig(CONF_FILE)
    const newBase = containerConfigDefault.base

    // --global
    if (args.global) {
        if (!args.yes) {
            const answer = await askQuestion(`Do you want to rebase ALL containers with ${newBase}?`)
            if (!answer) {
                process.exit(1)
            }
        }

        for (let domain of getDomains()) {
            for (let containerName of getContainersDomain(domain)) {
                console.log(`[*] Rebasing ${containerName}`)
                rebase(containerName, domain, newBase, lxceConfig.seed, lxceConfig.hypervisor.SSH_hostname)
                console.log(`[*] Rebasing ${containerName}: ok!`)
            }
        }
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
            const answer = await askQuestion(`Do you want to rebase ALL containers within ${args.domain} with ${newBase}?`)
            if (!answer) {
                process.exit(1)
            }
        }

        for (let containerName of getContainersDomain(args.domain)) {
            console.log(`[*] Rebasing ${containerName}`)
            rebase(containerName, args.domain, newBase, lxceConfig.seed, lxceConfig.hypervisor.SSH_hostname)
            console.log(`[*] Rebasing ${containerName}: ok!`)
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
        const answer = await askQuestion(`Do you want to rebase ${containerName} container within ${args.domain} with ${newBase}?`)
        if (!answer) {
            process.exit(1)
        }
    }

    console.log(`[*] Rebasing ${containerName}`)
    rebase(containerName, args.domain, newBase, lxceConfig.seed, lxceConfig.hypervisor.SSH_hostname)
    console.log(`[*] Rebasing ${containerName}: ok!`)
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
        nargs: 0
    })
    yargs.option("domain", {
        alias: 'd',
        describe: 'Domain name for a group of containers',
        demand: false,
        type: 'string',
        nargs: 1,
    })
    yargs.option("name", {
        alias: 'n',
        describe: 'Container name',
        demand: false,
        type: 'string',
        nargs: 1,
    })
    yargs.option("alias", {
        alias: 'a',
        describe: 'Container alias',
        demand: false,
        type: 'string',
        nargs: 1,
    })
    yargs.example([
        ["$0 rebase --global", "Applies new base to all containers"],
        ["$0 rebase -d google", "Applies new base to all containers withing google domain"],
        ["$0 rebase -d google -n still-yellow", "Applies new base to container specified"],
        ["$0 rebase -d google -a alice", "Applies new base to container specified"],
    ])
}


