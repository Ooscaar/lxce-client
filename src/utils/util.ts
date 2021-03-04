import { execSync } from "child_process"
import * as crypto from "crypto"
import * as fs from "fs"
import path from "path"
import yargs from "yargs"
import {
    CONF_FILE,
    CONTAINER_CONFIG_DEFAULT,
    CONTAINER_CONFIG_DIR,
    DEFAULT_CONTAINER_CONF_FILE,
    MAX_CONTAINER_PER_DOMAIN,
    MAX_DOMAINS,
    MAX_PROXIES_PER_CONTAINER,
    PASSWORD_LENGTH,
    SSH_DIR,
    UID
} from "../constants"
import { ContainerConfig, LxceConfig, SSH } from "../interfaces/interfaces"
import { Convert } from "./parser"



// --------------------------------------------------------  //
// ******************** Crypto-passwords ******************  //
// --------------------------------------------------------  //
/**
 * Generate internal seed intented to operate
 * in each container
 *
 * @param bits
 * @param encoding
 */
export function generateSeed(bits: number, encoding: BufferEncoding): string {
    return crypto.randomBytes(bits).toString(encoding)

}

/**
 * 
 * @param seed 
 * @param name 
 */
export function generatePassword(seed: string, name: string, user: string): string {
    let key = seed + name + user
    return crypto.
        createHash('sha256').
        update(key, 'utf8').
        digest('hex').
        substring(0, PASSWORD_LENGTH);
}

// --------------------------------------------------------  //
// ********************* JSON utils ***********************  //
// --------------------------------------------------------  //
/**
 * Write JSON in path indicated syncronously
 * Throw exceptions if the file does not exists
 * https://github.com/sindresorhus/write-json-file/blob/main/index.js
 * TODO: rewrite description
 *
 * @param filePath
 * @param data
 * @param space
 * @param encoding
 */
export function writeJSON(filePath: string, data: any, space = 2, encoding = "utf8") {
    try {
        const file = fs.readFileSync(filePath)
    } catch (err) {
        // Everything except if file does not exists
        if (err.code !== "ENOENT") {
            console.log(err.code)
            throw err
        }
    }

    const json = JSON.stringify(data, null, space)
    fs.writeFileSync(filePath, json, encoding)
}

/**
 * Reads file and return json object
 * with utf-8 encoding by default
 *
 * @param filePath
 */
export function readJSON(filePath: string): any {
    try {
        // Must specify encoding to return string
        const file = fs.readFileSync(filePath, "utf-8")

        const json = JSON.parse(file)
        return json

    } catch (err) {
        throw err

    }
}

export function readContainerConfig(filePath: string): ContainerConfig {
    try {
        const json = fs.readFileSync(filePath, "utf-8")
        const containerConfig = Convert.toContainerConfig(json)
        return containerConfig

    } catch (err) {
        console.log(err.message)
        //process.exit(1)
        throw err

    }
}

export function readLxceConfig(filePath: string): LxceConfig {
    try {
        const json = fs.readFileSync(filePath, "utf-8")
        const lxceConfig = Convert.toLxceConfig(json)
        return lxceConfig

    } catch (err) {
        console.log(err.message)
        //process.exit(1)
        throw err

    }
}

export function writeContainerConfig(filePath: string, containerConfig: ContainerConfig, encoding = "utf-8") {
    try {
        const json = Convert.containerConfigToJson(containerConfig)
        fs.writeFileSync(filePath, json, encoding)

    } catch (err) {
        console.log(err.message)
        //process.exit(1)
        throw err
    }

}

export function writeLxceConfig(filePath: string, lxceConfig: LxceConfig, encoding = "utf-8") {
    try {
        const json = Convert.lxceConfigToJson(lxceConfig)
        fs.writeFileSync(filePath, json, encoding)

    } catch (err) {
        console.log(err.message)
        // process.exit(1)
        throw err
    }

}

export function writeSSHConfig(filePath: string, sshConfig: string, encoding = "utf-8") {
    try {
        fs.writeFileSync(filePath, sshConfig, encoding)

    } catch (err) {
        console.log(err.message)
        throw err

    }

}



// --------------------------------------------------------  //
// ********************* ALIAS-NAMES-USER *****************  //
// --------------------------------------------------------  //

// We don't check the existence of name
// as it should be checked before
export function getNamefromAlias(alias: string, domain: string): string {
    for (const loc of fs.readdirSync(path.join(CONTAINER_CONFIG_DIR, domain))) {
        const containerConfig = readContainerConfig(path.join(CONTAINER_CONFIG_DIR, domain, loc))

        // As file name corresponds to container name
        if (containerConfig.alias == alias) return loc
    }
    // For typescript message
    return ""

}

// Get container name from name provided
// which can be either an alias or a full
// container name within a domain
// TODO: manage the process exit
export function getName(argsName: string, domain: string): string {
    let name = ""
    if (existAlias(argsName, domain)) {
        return getNamefromAlias(argsName, domain)
    }

    if (!existName(argsName)) {
        yargs.showHelp()
        console.log("[*] Name does not exist")
        process.exit(1)
    }
    return argsName
}

// Get user of existing running container
export function getUserContainer(name: string): string {
    try {
        console.log("[**] Getting user")
        let command = `lxc exec ${name} -- bash -c "id -un ${UID}"`
        let user = execSync(command).toString().replace("\n", "")
        console.log(`[**] Getting user: ${user} !!`)
        if (!user) {
            console.log("dentro del if")
            let user = execSync(command).toString().replace("\n", "")
            console.log("user:", user)
            process.exit(1)
        }
        return user
    } catch (err) {
        console.log("[**] user not found")
        throw err

    }
}



// --------------------------------------------------------  //
// *********************CHECK FUNCTIONS *******************  //
// --------------------------------------------------------  //
// These functions are intented to:                          //
// - Provide general comprovations to each command           //
// - Provide logs and debug messages                         //
//   without killing the process.                            //
// --------------------------------------------------------  //

// Check if cmdInit has already been executed - i.e: exist 
// the following:
// - ssh (d)
// - container.conf.d (d) 
// - lxce.conf
// - container.default.conf
// The default configurations are assumed to be 
// correct as the folders won't be created 
// if the configurations are wrong
// 
// *read acces is assumed
export function checkInitialized(): boolean {
    // Check already configured
    if (!fs.existsSync(CONF_FILE) || !fs.existsSync(DEFAULT_CONTAINER_CONF_FILE)) {
        console.log("[**] Configurations files are missing ");
        console.log("[**] run lxce install && init");
        return false
    }


    if (!fs.existsSync(CONTAINER_CONFIG_DIR)) {
        console.log("[**] The configuration directory is not avalaible")
        console.log("[**] run lxce init")
        return false
    }

    if (!fs.existsSync(SSH_DIR)) {
        console.log("[**] Ssh directory is missing")
        console.log("[**] run lxce init")
        return false
    }
    return true

}

// Check is the default config parameters
// are ok
// TODO: manage the container.default.conf
export function checkDefaultConfig(): boolean {

    // TODO: check the locations or write directly
    // Here or in launch ???
    // and manager the error
    //const configFile = readJSON(CONF_FILE)
    const configLxce = readLxceConfig(CONF_FILE)
    for (const loc of configLxce.locations) {
        if (!fs.existsSync(loc)) {
            //throw Error("Locations not available")
            console.log("[**] Location not available")
            console.log("[**] ", loc)
            console.log("[**] Check locations or permissions")
            return false
        }

    }

    // Hypervisor
    if (!configLxce.hypervisor.SSH_hostname) {
        console.log("[**] SSH_hostname has not been set in: %s")
        console.log("[**] Edit the %s and run 'lxce init' again", CONF_FILE)
        return false
    }


    if (!configLxce.hypervisor.SSH_suffix) {
        console.log("[**] SSH suffic has not been set up")
        console.log("[**] Edit the %s and run 'lxce init' again", CONF_FILE)
        return false
    }

    // Domains limits
    if (configLxce.domains.length === MAX_DOMAINS) {
        console.log("[**] MAX DOMAINS used")
        console.log("Relaunch the container within existing domain")
        return false
    }


    // Container default
    return true

}

export function checkDomain(domain: string): boolean {
    const lxceConfig = readLxceConfig(CONF_FILE)
    return lxceConfig.domains.includes(domain)
}

function checkBase(base: string): boolean {
    try {
        let command = `lxc image ${base}`
        return true
    } catch (err) {
        console.log("[**] base does not exist")
        return false
    }
}
// Check all the configurations related to a container
// - SSH hostname
// - Locations 
// - ....
// in order to initialize specific intructions 
export function checkContainerConfig(name: string): boolean {
    try {
        const containerConfig = readContainerConfig(name)
        if (!fs.existsSync(containerConfig.userData)) {
            console.log("[**] userData not available")
            return false
        }

        if (!checkBase(containerConfig.base)) return false


        if (containerConfig.proxies.length > MAX_PROXIES_PER_CONTAINER) {
            console.log("[**] Check default config:")
            console.log("[**] MAX PROXIES x CONTAINER used")
            return false
        }
        // TODO: all to check??

        return true

    } catch (err) {
        return false
    }

}


// Check if has access to configuations directories
// - Write
// as the configurations are located in read only
// directories 
export function checkAcces(): boolean {
    try {
        fs.accessSync(CONTAINER_CONFIG_DIR, fs.constants.W_OK)
        fs.accessSync(SSH_DIR, fs.constants.W_OK)
        return true
    } catch (err) {
        console.log("[**] don't have permissions")
        return false
    }

}

// Check existing alias inside domain structure
export function existAlias(argAlias: string | Array<string>, domain: string): boolean {

    // To make the function more general
    // https://stackoverflow.com/questions/35749833/typescript-function-taking-one-or-array-of-objects
    let alias: Array<string> = []
    alias = alias.concat(argAlias)
    let existingAlias: Array<string> = []

    // In case not folders exists
    try {
        const dirCont = fs.readdirSync(path.join(CONTAINER_CONFIG_DIR, domain))

        // Container.conf.d
        // -> domain
        // -> google.
        for (const file of dirCont) {
            // It return relative paths
            let filePath = path.join(CONTAINER_CONFIG_DIR, domain, file)
            let configContainer = readContainerConfig(filePath)
            existingAlias.push(configContainer.alias)
        }

        for (const cAlias of alias) {
            if (existingAlias.includes(cAlias)) {
                console.log("[**] exisiting alias:", cAlias)
                return true
            }
        }

        return false
    } catch (err) {
        return false
    }


}


export function existName(name: string): boolean {
    const locations = fs.readdirSync(CONTAINER_CONFIG_DIR)
    return locations.includes(name)
}


// --------------------------------------------------------  //
// ******************** Lxc actions utils *****************  //
// --------------------------------------------------------  //

// FIXME: implement them

export function lxcLaunch() {

}

export function lxcStart() {

}

export function lxcStop() {

}

export function lxcDelete() {

}

export function lxdRestart() {

}

export function lxcProxy() {

}

export function lxcDeviceAdd() {

}

export function lxdDeviceRemove() {

}

export function lxcDeviceList() {

}
