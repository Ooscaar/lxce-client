import { execSync } from "child_process"
import path from "path"
import yargs from "yargs"
import { CONTAINER_CONFIG_DIR } from "../constants"
import { checkDomain, checkInitialized, getContainerName } from "../utils/util"
import * as fs from "fs"


function stopContainer(name: string) {
    let cmdStop = `lxc stop ${name} -f`
    let cmdShow = "lxc list"
    try {
        console.log(`[*] Debug: ${cmdStop}`)
        execSync(cmdStop)
        console.log("[*] Container ok !!")
    } catch (err) {
        console.log(err.message)
    }
}

function checkStop(domain: string) {

    if (!checkInitialized()) {
        yargs.showHelp()
        console.log("[*] run lxce init before")
        process.exit(1)
    }

    if (domain) {
        if (!checkDomain(domain)) {
            yargs.showHelp()
            console.log("[*] Domain does not exist")
            process.exit(1)
        }
    }

}

// TEMPORAL
// Start options:
// lxce stop --global
// lxce stop --domain default
// lxce stop --name alice --domain default (alias or name)
function cmdStop(args: any) {

    if (!args.name && !args.global && !args.domain) {
        yargs.showHelp()
        process.exit(1)
    }

    checkStop(args.domain)

    if (args.global) {
        console.log("[*] Running global")
        let domains = fs.readdirSync(CONTAINER_CONFIG_DIR)
        for (let domain of domains) {
            for (let containerName of fs.readdirSync(path.join(CONTAINER_CONFIG_DIR, domain))) {
                stopContainer(containerName)
            }

        }
        process.exit(0)
    }

    if (args.domain && !args.name && !args.alias) {
        console.log("[*] Running within domain")

        if (!checkDomain(args.domain)) {
            yargs.showHelp()
            console.log("[*] Domain does not exist")
            process.exit(1)
        }

        for (let containerName of fs.readdirSync(path.join(CONTAINER_CONFIG_DIR, args.domain))) {
            stopContainer(containerName)
        }
        process.exit(0)


    } else {
        if (!args.domain) {
            yargs.showHelp()
            console.log("[*] Please select the domain")
            process.exit(1)
        }
        if (!checkDomain(args.domain)) {
            yargs.showHelp()
            console.log("[*] Domain does not exist")
            process.exit(1)
        }
        console.log("[*] Running only one container")
        let containerName = getContainerName(args.alias ?? args.name, args.domain)
        stopContainer(containerName)
        process.exit(0)
    }


}


// ---------------------
// Yargs command options
// ---------------------
export const command = "stop"

export const describe = "Stop containers"

export const handler = cmdStop


export const builder = (yargs: any) => {
    yargs.usage("Usage: $0 stop <options> <flags>")
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
    yargs.example([
        ["$0 stop --global", "Stop all containers"],
        ["$0 stop -d google", "Stop all container within domain"],
        ["$0 stop -d google -n still-yellow", "Stop container defined by name"],
        ["$0 stop -d google -a alice", "Stop container defined by alias"],
    ])
}
