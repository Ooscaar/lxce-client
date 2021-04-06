import yargs from "yargs"
import { checkAccess, checkDomain, checkInitialized, existAlias, getContainerName, gitCommit, readContainerConfig, readLxceConfig, writeContainerConfig } from "../utils/util"
import { CONF_FILE, CONTAINER_CONFIG_DIR, SSH_DIR } from "../constants"
import path from "path"
import log from "loglevel"
import { readFileSync, writeFileSync } from "fs"



function checkAlias(domain: string) {

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

    if (domain) {
        if (!checkDomain(domain)) {
            console.log("[*] Domain does not exist")
            process.exit(1)
        }
    }
}

function cmdAliasSet(args: any) {
    // Checkings
    checkAlias(args.domain)

    // Already check for the existence
    let containerName = getContainerName(args.name, args.domain)

    // Check alias does not exist
    if (existAlias(args.alias, args.domain)) {
        log.info("[*] Existing alias")
        log.debug(`[*] ${args.alias} assigned to ${getContainerName(args.alias, args.domain)} `)
        process.exit(1)
    }

    // Modify existing alias
    const containerPath = path.join(
        CONTAINER_CONFIG_DIR,
        args.domain,
        containerName
    )

    let containerConfig = readContainerConfig(containerPath)
    containerConfig.alias = args.alias
    writeContainerConfig(containerPath, containerConfig)
    log.info(`[*] set container: ${containerName} --> alias: ${args.alias} `)

    // Change ssh configuration file
    const lxceConfig = readLxceConfig(CONF_FILE)
    const sshPath = path.join(
        SSH_DIR,
        args.domain,
        containerName
    )
    let ssh = readFileSync(sshPath, "utf-8")
        .split("\n")
        .map(line => {
            if (line.startsWith("Host")) {
                return `${line} ${lxceConfig.hypervisor.SSH_suffix}.${args.domain}.${args.alias}`
            }
            return line
        })
        .join("\n")
    writeFileSync(sshPath, ssh)
    gitCommit(SSH_DIR, `alias-set: ${args.domain}-${containerName}`)
    log.info("[*] Updated ssh configuration file")
    log.debug(`[*] Added alias to ${sshPath}`)


    process.exit(0)
}

function cmdAliasUnset(args: any) {
    // Checkings
    checkAlias(args.domain)

    // Already checks existence
    let containerName = getContainerName(args.alias ?? args.name, args.domain)

    const containerPath = path.join(
        CONTAINER_CONFIG_DIR,
        args.domain,
        containerName
    )

    // Overwrite it with ""
    let containerConfig = readContainerConfig(containerPath)
    containerConfig.alias = ""
    writeContainerConfig(containerPath, containerConfig)
    log.info(`[*] unset alias from container: ${containerName}`)

    // Change ssh configuration file
    const lxceConfig = readLxceConfig(CONF_FILE)
    const sshPath = path.join(
        SSH_DIR,
        args.domain,
        containerName
    )
    let ssh = readFileSync(sshPath, "utf-8")
        .split("\n")
        .map(line => {
            if (line.startsWith("Host")) {
                // Remove alias
                return line.split(" ").slice(0, 1).join(" ")
            }
        })
        .join("\n")
    writeFileSync(sshPath, ssh)
    gitCommit(SSH_DIR, `alias-unset: ${args.domain}-${containerName}`)
    log.info("[*] Updated ssh configuration file")
    log.debug(`[*] Removed alias from ${sshPath}`)

    process.exit(0)
}


// Alias function
function cmdAlias(args: any) {
    yargs.showHelp()
}

// ---------------------
// Yargs command options
// ---------------------
export const command = "alias"

export const describe = "Manage containers aliases"

export const handler = cmdAlias

const builderSet = (yargs: any) => {
    yargs.usage("Usage: $0 [options] <flags>")
    yargs.option("domain", {
        alias: 'd',
        describe: 'container domain',
        demand: true,
        type: 'string',
        nargs: 1,
        group: "Options"
    })
    yargs.option("name", {
        alias: 'n',
        describe: 'container name',
        demand: true,
        type: 'string',
        nargs: 1,
        group: "Options"
    })
    yargs.option("alias", {
        alias: 'a',
        describe: 'new container alias',
        demand: true,
        type: 'string',
        nargs: 1,
        group: "Options"
    })
    yargs.example([
        ["$0 alias set -d google -n front -a alice", "Set alias alice to container front within google domain"],
    ])
}

const builderUnset = (yargs: any) => {
    yargs.usage("Usage: $0 <options> <flags>")
    yargs.option("domain", {
        alias: 'd',
        describe: 'container domain',
        demand: true,
        type: 'string',
        nargs: 1,
        group: "Options"
    })
    yargs.option("name", {
        alias: 'n',
        describe: 'container name',
        demand: false,
        type: 'string',
        nargs: 1,
        group: "Options"
    })
    yargs.option("alias", {
        alias: 'a',
        describe: 'new container alias',
        demand: false,
        type: 'string',
        nargs: 1,
        group: "Options"
    })
    yargs.example([
        ["$0 alias unset -d google -n front", "Unset alias to container front within google domain"],
        ["$0 alias unset -d google -a alice", "Unset alias to container with alice alias within google domain"],
    ])
}



export const builder = (yargs: any) => {
    yargs.usage("Usage: $0 alias [command]> <options> <flags>")
    yargs.demandCommand(1, "")
    yargs.strict()
    yargs.command(
        "set",
        "set container alias",
        builderSet,
        cmdAliasSet
    )
    yargs.command(
        "unset",
        "unset container alias",
        builderUnset,
        cmdAliasUnset
    )
}

