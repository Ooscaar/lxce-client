import * as fs from "fs"
import * as util from "util"
import yargs from "yargs"
import { exec } from "child_process"

import { CONF_FILE_DATA, CONF_FILE, CONTAINER_CONFIG_DIR, DEFAULT_CONTAINER_CONF_FILE, SSH_DIR } from "../constants"
import { readJSON } from "../utils/util"



// Init function
// TODO: rewrite it with functions
export function cmdInit(args: yargs.Arguments) {
    try {

        // Check already configured
        if (! fs.existsSync(CONF_FILE)) {
            console.log("The configuration file at: %s is not available. ", CONF_FILE);
            console.log("run lxce install");
            process.exit(1);
        }

        if (! fs.existsSync(DEFAULT_CONTAINER_CONF_FILE)) {
            console.log(
                "The configuration file at: %s is not available. ",
                DEFAULT_CONTAINER_CONF_FILE);
            console.log("run lxce install");
            process.exit(1);
        }

        if (fs.existsSync(CONTAINER_CONFIG_DIR)) {
            console.log("The configuration directory exist at: " + CONTAINER_CONFIG_DIR);
            console.log("If you want to use init, you should destroy everything that is available.");
            console.log('Use "lxce destroy" before install & init.');
            process.exit(1);
        }

        // Check configuration file paramaters
        const confFile = readJSON(CONF_FILE)
        console.log(confFile)

        // TODO: check the locations or write directly
        // Here or in launch ???
        // and manager the error
        for (const loc of confFile.locations) {
            if (! fs.existsSync(loc)) {
                //throw Error("Locations not available")
                console.log("Location not available")
                console.log(loc)
                console.log("Check locations or permissions")
                process.exit(1)
            }
        }

        if (confFile.hypervisor.SSH_hostname == "") {
          console.log("SSH_hostname has not set in: %s")
          console.log("Edit the %s and run 'lxce init' again", CONF_FILE)
          process.exit(1)
        }

        if (confFile.hypervisor.SSH_suffix == "") {
            console.log("SSH suffic has not been set")
            console.log("Edit the %s and run 'lxce init' again", CONF_FILE)
            process.exit(1)
        }

        // Initialize the parameters
        // In case we don't have permissions an exceptions is thrown
        fs.mkdirSync(CONTAINER_CONFIG_DIR);
        console.log("[*] mkdir: container_conf_dir")
        fs.mkdirSync(SSH_DIR);
        console.log("[*] mkdir: ssh_dir")

        // TODO: Git repository creation



        console.log("Good!")
        process.exit(0)

    } catch(err) {
        // TODO: in case of error, remove files?
        if (err.code == "EACCES") {
            console.error(err.message)
            console.error(err.syscall)
            console.error(err.path)
            process.exit(1)
        }
        console.error(err.message)

    }
}


async function checkSSH() {}

async function checkLocations() {}

async function init() {}
