
import { execSync } from "child_process"
import path from "path"
import yargs from "yargs"
import { BASE_DIR, CONF_FILE, DEFAULT_CONTAINER_CONF_FILE, LXCE_DIR } from "../constants"
import {
    askQuestion,
    checkAccess,
    checkDomain,
    checkInitialized,
    getContainersAll,
    lxcDelete,
    readContainerConfig,
    readLxceConfig
} from "../utils/util"

function checkUninstall() {
    // Check Init
    if (!checkInitialized()) {
        yargs.showHelp()
        console.log("[*] run lxce init before")
        process.exit(1)
    }
    console.log("[*] Init: ok!")


    // Check write permissions
    if (!checkAccess()) {
        console.log("Does not have access to the directory")
        console.log("Please run the command with sudo")
        process.exit(1)
    }
    console.log("[*] Permission checked")

}

// Delete:
// - containers
// - configurations
// - read only folders
function uninstall() {
    // Remove existing/running containers
    console.log("[*] Deleting and stoping current containers")
    for (let containerName of getContainersAll()) {
        lxcDelete(containerName)
    }

    // TODO: commit the destroy??
    // Now remove all folders
    // Get folder locations before removing
    const locationsAbsolute = readLxceConfig(CONF_FILE).locations
        .map(loc => path.join(loc, LXCE_DIR))
    for (let location of locationsAbsolute) {
        execSync(`rm -rf ${location}`)
    }

    // Remove configuration files
    execSync(`rm -rf ${BASE_DIR}`)
    console.log(`[*] Delete ${BASE_DIR}`)

}

// Install function
async function cmdUninstall(args: any) {
    checkUninstall()

    if (!args.yes) {
        const answer = await askQuestion(`Do you want to uninstall the lxce command and all it's configurations?`)
        if (!answer) {
            process.exit(1)
        }
    }
    uninstall()
    process.exit(0)
}


// ---------------------
// Yargs command options
// ---------------------
export const command = "uninstall"

export const describe = "Remove all configurations from the lxce command"

export const handler = cmdUninstall


export const builder = (yargs: any) => {
    yargs.usage("$0 uninstall <options> <flags>")
    yargs.option("yes", {
        alias: "y",
        demand: false,
        type: "boolean",
        nargs: 0,
        group: "Options"
    })
}
