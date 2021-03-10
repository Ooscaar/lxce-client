import { execSync } from "child_process"
import path from "path"
import * as fs from "fs"
import { CONTAINER_CONFIG_DIR, SSH_DIR } from "../constants"
import { checkAcces, checkDomain, checkInitialized, existName, getName } from "../utils/util"
import yargs from "yargs"

function checkDestroy(domain: string) {
    // Check Init
    if (!checkInitialized()) {
        yargs.showHelp()
        console.log("[*] run lxce init before")
        process.exit(1)
    }
    console.log("[*] Init: ok!")


    // Check write permissions
    if (!checkAcces()) {
        console.log("Does not have access to the directory")
        console.log("Please run the command with sudo")
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

function deleteContainer(name: string) {
    // Stop and delete containers
    let remove: string = `lxc delete ${name} -f`
    try {
        execSync(remove)
    } catch (err) {
        console.log("[*] Error removing containers")
        process.exit(1)
    }
    console.log(`[*] Delete and stop container ${name}`)
}

function deleteConfigurations(name: string, domain: string) {
    // Delete configurations files 
    try {
        fs.unlinkSync(path.join(
            CONTAINER_CONFIG_DIR,
            domain,
            name
        ))
        fs.unlinkSync(path.join(
            SSH_DIR,
            domain,
            name
        ))
        console.log("[*] Related conf and folders deleted")

    } catch (err) {
        console.error(err)
        process.exit(1)

    }

}

// Only works with name, as it ensures 
// be more specific for the container 
// to remove
function cmdDestroy(args: any) {
    checkDestroy(args.domain)

    let containerName = getName(args.name, args.domain)
    // First stop container in case of error
    deleteContainer(containerName)
    deleteConfigurations(containerName, args.domain)

    console.log("[*] Success!!")
    process.exit(0)

}


// ---------------------
// Yargs command options
// ---------------------
export const command = "destroy"

export const describe = "Destroy containers and configurations/folders related"

export const handler = cmdDestroy

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