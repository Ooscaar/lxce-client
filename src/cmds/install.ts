import * as fs from "fs"
import yargs from "yargs"

//import * as CONST from "../constants"
import { BASE_DIR, CONTAINER_CONFIG_DEFAULT, CONF_FILE, CONF_FILE_DATA, DEFAULT_CONTAINER_CONF_FILE, SEED_LENGHT, SEED_ENCODING } from "../constants"
import { LxceConfig } from "../interfaces/interfaces"
import { generateSeed, writeContainerConfig, writeLxceConfig } from "../utils/util"



// Install function
function cmdInstall(args: yargs.Arguments) {
    try {
        if (fs.existsSync(BASE_DIR)) {
            console.log("[*] The base directory exist at: " + BASE_DIR)
            console.log("[*] If you want to use install, you should destroy everything that is available.")
            console.log("[*] Use lxce uninstall before install.")
            process.exit(1)
        }

        fs.mkdirSync(BASE_DIR);

        let data: LxceConfig = CONF_FILE_DATA;
        data.seed = generateSeed(SEED_LENGHT, SEED_ENCODING)
        // Write configurations from default values
        writeLxceConfig(
            CONF_FILE,
            data
        )

        writeContainerConfig(
            DEFAULT_CONTAINER_CONF_FILE,
            CONTAINER_CONFIG_DEFAULT
        )

    } catch (err) {
        // TODO: manage the errors, as we will have:
        // "EACCES": no permisions to execute the syscall
        // "ENOENT": in case of an inexistent file
        if (err.code == "EACCES") {
            console.error(err.syscall, ": you don't have permissions")
            console.error(err.path)
            process.exit(1)
        }
        if (err.code = "ENOENT") {
            console.error("File does not exist")
            console.error(err)
            process.exit(1)
        }
        console.error(err)
        process.exit(1)
    }

    // This way or before the catch ?
    console.log("[*] install successfully");
    console.log("[*] Complete config file: %s and optinally you can modify the default container configuration", CONF_FILE);
    console.log("[*] at ('TODO') and use :");
    console.log("[*] 'lxce init' to deploy it.");
    process.exit(0)

}
// ---------------------
// Yargs command options
// ---------------------
export const command = "install"

export const describe = "Install configuration files in default locations"

export const handler = cmdInstall

