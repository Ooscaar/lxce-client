import * as fs from "fs"
import { execSync } from "child_process"

import { CONF_FILE, CONTAINER_CONFIG_DIR, DEFAULT_CONTAINER_CONF_FILE, SSH_DIR, BASE_DIR } from "../constants"
import { checkContainerConfig, checkDefaultConfig } from "../utils/util"

// Check if init has already been initialized
// and in negative case, check is the default
// configurations are correct
// Then checkAccess to the directories, as write
// actions will be executed
function checkInit() {

    // Checking one folder creations is enought
    if (fs.existsSync(CONTAINER_CONFIG_DIR)) {
        console.log("[**] Configurations folders detected")
        console.log("[**] If you want to use init, you should use")
        console.log("[**] lxce destroy")
        console.log("[*] Exiting ...")
        process.exit(1)
    }

    if (!fs.existsSync(CONF_FILE) || !fs.existsSync(DEFAULT_CONTAINER_CONF_FILE)) {
        console.log("[**] Configurations files missing")
        console.log("[**] run lxce install")
        process.exit(1)
    }

    console.log("[*] checking permissions")
    try {
        fs.accessSync(BASE_DIR, fs.constants.W_OK)
    } catch (err) {
        console.log("[*] checking permissions: fail!")
        process.exit(1)
    }
    console.log("[*] checking permissions: ok!")

    console.log("[*] checking configurations")
    if (!checkDefaultConfig()) {
        console.log("[*] checking configurations: fail!")
        process.exit(1)
    }

    if (!checkContainerConfig(DEFAULT_CONTAINER_CONF_FILE)) {
        console.log("[*] checking configurations: fail!")
        process.exit(1)
    }
    console.log("[*] checking configurations: ok!")

}

function init() {

    fs.mkdirSync(CONTAINER_CONFIG_DIR);
    console.log("[*] mkdir: container_conf_dir")

    fs.mkdirSync(SSH_DIR);
    console.log("[*] mkdir: ssh_dir")

    // TODO: init git repository
    let command = `git init ${SSH_DIR}`
    try {
        execSync(command)

    } catch (err) {
        console.log("[*] Error creating git repository")
        console.log("[*] Make sure you have git --system configured:")
        console.log("[*] git config --global -e")
        console.log("[*] And git init manually", SSH_DIR)
        process.exit(1)
    }
    console.log("[*] git init: ssh_dir")

}


// Init function
function cmdInit(args: any) {
    checkInit()

    init()

    console.log("[*] Good!!")
    process.exit(0)

}


// ---------------------
// Yargs command options
// ---------------------
export const command = "init"

export const describe = "Init configuration files with default values"

export const handler = cmdInit


