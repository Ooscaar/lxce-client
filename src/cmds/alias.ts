import yargs from "yargs"
import { checkAccess, checkDomain, checkInitialized, existAlias, getName, readContainerConfig, writeContainerConfig } from "../utils/util"
import { CONTAINER_CONFIG_DIR } from "../constants"
import path from "path"
import { domain } from "node:process"


// Auxiliar function for modify alias
// Valid for:
// - modify
// - delete
function modifyAlias(containerPath: string, alias: string) {
    let containerConfig = readContainerConfig(containerPath)
    console.log(`[**] changing: ${containerConfig.alias} --> ${alias}`)
    containerConfig.alias = alias
    writeContainerConfig(containerPath, containerConfig)
}

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

function cmdAliasModify(args: any) {
    // Checkings
    checkAlias(args.domain)

    // Already check for the existence
    let containerName = getName(args.name, args.domain)

    // Check alias does not exist
    if (existAlias(args.alias, args.domain)) {
        process.exit(1)
    }

    // Modify existing alias
    const containerPath = path.join(
        CONTAINER_CONFIG_DIR,
        args.domain,
        containerName
    )
    modifyAlias(containerPath, args.alias)
    process.exit(0)
}

function cmdAliasDelete(args: any) {
    // Checkings
    checkAlias(args.domain)

    // Already check for the existence
    let containerName = getName(args.name, args.domain)

    // Create alias from args.name
    const containerPath = path.join(
        CONTAINER_CONFIG_DIR,
        args.domain,
        containerName
    )
    // Overwrite it with ""
    modifyAlias(containerPath, "")
    process.exit(0)
}

// Even if the actual alias is provided
// show the current alias
function cmdAliasShow(args: any) {
    // Check only for domain
    if (!checkDomain(args.domain)) {
        console.log(`[*] Domain ${args.domain} does not exist`)
        process.exit(1)
    }
    // Already check for the existence
    let containerName = getName(args.name, args.domain)

    // Create alias from args.name
    const containerPath = path.join(
        CONTAINER_CONFIG_DIR,
        args.domain,
        containerName
    )
    const containerConfig = readContainerConfig(containerPath)
    console.log(`alias: ${containerConfig.alias}`)
}

// Alias function
function cmdAlias(args: any) {
    yargs.showHelp()
}

// ---------------------
// Yargs command options
// ---------------------
export const command = "alias"

export const describe = "Manage containers alias"

export const handler = cmdAlias

const builderModify = {
    "domain": {
        alias: 'd',
        describe: 'container domain',
        demand: true,
        type: 'string',
        nargs: 1,
    },
    "name": {
        alias: 'n',
        describe: 'Container name/alias',
        demand: true,
        type: 'string',
        nargs: 1,
    },
    "alias": {
        alias: 'a',
        describe: 'new container alias',
        demand: true,
        type: 'string',
        nargs: 1,
    }
}


const builderDelete = {
    "domain": {
        alias: 'd',
        describe: 'container domain',
        demand: true,
        type: 'string',
        nargs: 1,
    },
    "name": {
        alias: 'n',
        describe: 'Container name/alias',
        demand: true,
        type: 'string',
        nargs: 1,
    },
}


const builderShow = {
    "domain": {
        alias: 'd',
        describe: 'container domain',
        demand: true,
        type: 'string',
        nargs: 1,
    },
    "name": {
        alias: 'n',
        describe: 'Container name/alias',
        demand: true,
        type: 'string',
        nargs: 1,
    },
}


export const builder = (yargs: any) => {
    yargs.usage("Usage: $0 alias <command> [options] [flags]")
    yargs.demandCommand(1, "")
    yargs.strict()
    yargs.command(
        "modify",
        "modify existing alias",
        builderModify,
        cmdAliasModify
    )
    yargs.command(
        "delete",
        "delete container alias",
        builderDelete,
        cmdAliasDelete
    )
    yargs.command(
        "show",
        "show current container alias",
        builderShow,
        cmdAliasShow
    )
}

