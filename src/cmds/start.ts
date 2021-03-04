import { execSync } from "child_process"
import * as fs from "fs"
import path from "path"
import yargs from "yargs"
import { CONF_FILE, CONTAINER_CONFIG_DIR } from "../constants"
import { checkDomain, checkInitialized, getName, readContainerConfig, readLxceConfig } from "../utils/util"



function startContainer(name: string) {
    let cmdStart = `lxc start ${name} 2>/dev/null`
    let cmdShow = "lxc list"
    try {
        console.log(`[*] Debug: ${cmdStart}`)
        execSync(cmdStart)
        console.log("[*] Container ok !!")
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

// TEMPORAL
// Start options:
// lxce start --global
// lxce start --domain default
// lxce start --name alice --domain default (alias or name)
export function cmdStart(args: any) {

    if (!args.name && !args.global && !args.domain) {
        yargs.showHelp()
        console.log("[*] Please select at least one option")
        process.exit(1)
    }

    checkStart(args.domain)

    if (args.global) {
        console.log("[*] Running global")
        let domains = fs.readdirSync(CONTAINER_CONFIG_DIR)
        for (let domain of domains) {
            for (let containerName of fs.readdirSync(path.join(CONTAINER_CONFIG_DIR, domain))) {
                startContainer(containerName)
            }

        }
        process.exit(0)
    }

    if (args.domain && !args.name) {
        console.log("[*] Running within domain")

        for (let containerName of fs.readdirSync(path.join(CONTAINER_CONFIG_DIR, args.domain))) {
            startContainer(containerName)
        }
        process.exit(0)


    } else {
        if (!args.domain) {
            yargs.showHelp()
            console.log("Please select the domain")
            process.exit(1)
        }
        console.log("[*] Running only one container")
        let containerName = getName(args.name, args.domain)
        startContainer(containerName)
    }


}
