import { execSync } from "child_process"
import * as crypto from "crypto"
import * as fs from "fs"
import inquirer from "inquirer"
import path from "path"
import {
    CONF_FILE,
    CONTAINER_CONFIG_DIR,
    DEFAULT_CONTAINER_CONF_FILE,
    MAX_DOMAINS,
    MAX_PROXIES_PER_CONTAINER,
    PASSWORD_LENGTH,
    SSH_DIR,
    UID
} from "../constants"
import { ContainerConfig, LxceConfig, Proxy } from "../interfaces/interfaces"
import { Convert } from "./parser"
import chalk from "chalk"



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
 * Compute container password based on seed, key and user
 *
 * @param seed Container seed
 * @param name Container name
 * @param user Container user
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
        console.log(`[*] LxceConfig: ${err.message}`)

        process.exit(1)
        // throw err

    }
}

export function writeContainerConfig(filePath: string, containerConfig: ContainerConfig, encoding = "utf-8") {
    try {
        const json = Convert.containerConfigToJson(containerConfig)
        fs.writeFileSync(filePath, json, encoding)

    } catch (err) {
        console.log(err.message)

        process.exit(1)
        //throw err
    }

}

export function writeLxceConfig(filePath: string, lxceConfig: LxceConfig, encoding = "utf-8") {
    try {
        const json = Convert.lxceConfigToJson(lxceConfig)
        fs.writeFileSync(filePath, json, encoding)

    } catch (err) {
        console.log(err.message)

        process.exit(1)
        //throw err
    }

}

export function writeSSHConfig(filePath: string, sshConfig: string, encoding = "utf-8") {
    try {
        fs.writeFileSync(filePath, sshConfig, encoding)

    } catch (err) {
        console.log(err.message)

        process.exit(1)
        //throw err

    }

}


// ----------------------------------------------------------------  //
// ********************* ALIAS-NAMES-USER-DOMAINS *****************  //
// ----------------------------------------------------------------  //

export function addDomain(domain: string) {
    let lxceConfig = readLxceConfig(CONF_FILE)

    // Find first hole
    const ids = lxceConfig.domains.map(item => item.id)
    let counter = 0
    let container_id = 0
    for (let id of ids) {
        if (id !== counter) {
            container_id = counter
            break
        }
        counter += 1
    }
    container_id = counter

    lxceConfig.domains.push({
        id: container_id,
        name: domain
    })

    // Update lxce.conf
    writeLxceConfig(CONF_FILE, lxceConfig)
}


export function deleteDomain(domain: string) {
    let lxceConfig = readLxceConfig(CONF_FILE)

    // Filter domains (a bit ugly)
    let domainsFiltered = lxceConfig.domains.filter(elem => elem.name !== domain)
    lxceConfig.domains = domainsFiltered

    // Update lxce.conf
    writeLxceConfig(CONF_FILE, lxceConfig)
}

// TODO: manage if its undefined
export function getDomainId(domain: string): number | undefined {
    const lxceConfig = readLxceConfig(CONF_FILE)

    const elem = lxceConfig.domains.find(elem => elem.name === domain)
    return elem?.id
}

/**
 * Return all current domains
 * based on the existing folders
 * located on container.conf.d
 */
export function getDomains(): string[] {
    return fs.readdirSync(CONTAINER_CONFIG_DIR)
}

/**
 * Return all containers names from specific domain
 *
 * If domain does not exist, return an empty list
 *
 * @param domain Container domain
 */
export function getContainersDomain(domain: string): string[] {
    try {
        return fs.readdirSync(path.join(CONTAINER_CONFIG_DIR, domain))
    } catch (err) {
        if (err.code === "ENOENT") {
            return []
        }
        throw err

    }

}
/**
 * Return all containers names from all domains
 */
export function getContainersAll(): string[] {
    let containers: string[] = []

    // A bit ugly as we are overwriting the
    // array
    // concat return a new array
    for (const domain of getDomains()) {
        containers = containers.concat(
            fs.readdirSync(
                path.join(CONTAINER_CONFIG_DIR, domain)
            )
        )
    }
    return containers

}


// Get name from alias within a domain
function getNamefromAlias(alias: string, domain: string): string {

    for (let containerName of getContainersDomain(domain)) {
        const containerConfig = readContainerConfig(path.join(CONTAINER_CONFIG_DIR, domain, containerName))

        if (containerConfig.alias == alias) {
            return containerName
        }
    }

    // For typescript message
    return ""

}

// TODO: manage the process exit
/**
 * Get container name from name/alias
 * provided within a domain.
 *
 *
 * @param argsName Container alias or container name
 * @param domain Container domain
 */
export function getContainerName(argsName: string, domain: string): string {
    let name = ""
    if (!checkDomain(domain)) {
        console.log(`[**] Domain ${chalk.bold(domain)} does not exist`)
        process.exit(1)
    }
    if (existAlias(argsName, domain)) {
        return getNamefromAlias(argsName, domain)
    }

    if (!existName(argsName, domain)) {
        console.log(`[**] Name/alias ${chalk.bold(argsName)} provided does not exist inside ${chalk.bold(domain)}`)
        process.exit(1)
    }
    return argsName
}

// Get user of existing running container
// Must be called after the container is completly
// initialized
export function getUserContainer(name: string): string {
    try {
        console.log("[**] Getting user")
        let command = `lxc exec ${name} -- bash -c "id -un ${UID}"`
        let user = execSync(command).toString().replace("\n", "")
        console.log(`[**] Getting user: ${user} !!`)
        return user
    } catch (err) {
        console.log("[**] user not found")
        throw err

    }
}



// --------------------------------------------------------  //
// *********************CHECK FUNCTIONS *******************  //
// --------------------------------------------------------  //
// These functions are intended to:                          //
// - Provide general checks to each command                  //
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
// *read access is assumed
export function checkInitialized(): boolean {
    // Check already configured
    if (!fs.existsSync(CONF_FILE) || !fs.existsSync(DEFAULT_CONTAINER_CONF_FILE)) {
        console.log("[**] Configurations files are missing ");
        console.log("[**] run lxce install && init");
        return false
    }


    if (!fs.existsSync(CONTAINER_CONFIG_DIR)) {
        console.log("[**] The configuration directory is not available")
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
        console.log("[**] SSH suffix has not been set up")
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

    for (const elem of lxceConfig.domains) {
        if (elem.name === domain) {
            return true
        }
    }

    return false
}

export function checkBase(base: string): boolean {
    try {
        let command = `lxc image show ${base}`
        execSync(command, { stdio: "ignore" })
        return true
    } catch (err) {
        //console.log("[**] base does not exist")
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


// Check if has access to configurations directories
// - Write
// as the configurations are located in read only
// directories
export function checkAccess(): boolean {
    try {
        fs.accessSync(CONTAINER_CONFIG_DIR, fs.constants.W_OK)
        fs.accessSync(SSH_DIR, fs.constants.W_OK)

        // Look to parent directories
        const locations = readLxceConfig(CONF_FILE).locations
        for (const loc of locations) {
            fs.accessSync(loc)
            fs.accessSync(loc)
        }

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
                //console.log("[**] exisiting alias:", cAlias)
                return true
            }
        }

        return false
    } catch (err) {
        return false
    }


}


export function existName(name: string, domain: string): boolean {
    return fs.existsSync(
        path.join(
            CONTAINER_CONFIG_DIR,
            domain,
            name
        )
    )
}


// --------------------------------------------------------  //
// ******************** Lxc utils ************************  //
// --------------------------------------------------------  //

// FIXME: implement them

/**
 * Launch lxc container with given base and name
 *
 * @param name container name
 * @param base container base
 */
export function lxcLaunch(name: string, base: string) {

    const launch = `lxc launch ${base} ${name}`
    try {
        console.log(`[**] launching container with base: ${base} ...`)
        execSync(launch)
    } catch (err) {
        console.log("[*] Error launching container")
    }
}

/**
 * Start lxc container
 *
 * @param name container name
 */
export function lxcStart(name: string) {
    const start = `lxc start ${name}`
    try {
        execSync(start)
    } catch (err) {
        console.log("[*] Error starting container")
    }
}

/**
 * Restart lxc container
 *
 * @param name container name
 */
export function lxdRestart(name: string) {
    let restart = `lxc restart ${name} -f`
    try {
        execSync(restart)
    } catch (err) {
        console.log("[*] Error restarting container")
    }

}

/**
 * Stop lxc container
 *
 * @param name container name
 */
export function lxcStop(name: string) {
    const stop = `lxc start ${name}`
    try {
        execSync(stop)
    } catch (err) {
        console.log("[*] Error starting container")
    }
}

/**
 * Force delete of a lxc container
 *
 * @param name container name
 */
export function lxcDelete(name: string) {
    // Stop and delete containers
    const remove: string = `lxc delete ${name} -f`
    try {
        console.log(`[**] Removing ${name}`)
        execSync(remove)
    } catch (err) {
        console.log("[*] Error removing containers")
    }
}


/**
 * Waits until container is fully initialized.
 *
 * Exits process if there is an error waiting
 *
 * @param name container name
 */
export function lxcWait(name: string) {
    const wait = `lxc exec ${name} -- cloud-init status -w`
    try {
        // For now print the waiting message from lxc
        console.log("[**] waiting for container")
        execSync(wait)
    } catch (err) {
        console.log("[*] Error waiting for the container")
        process.exit(1)
    }

}


/**
 * Perfoms dns resolution inside container
 * to check if *.lxd is working
 *
 * Expected result:
 *
 * -> awful-yellow.lxd has address 10.10.0.212
 *
 * -> awful-yellow.lxd has IPv6 address fd42:7c8c:7fab:4125:216:3eff:fe4d:1c95
 *
 * @param name container name
 */
export function lxdDNS(name: string) {
    try {
        let resolve = execSync(`lxc exec ${name} -- bash -c "host ${name}.lxd"`)
            .toString()
            .split("\n")[0]
            .split(" ")[3]
        console.log(`[**] dns resolution: ${name}.lxd -> ${resolve}`)
    } catch (err) {
        console.log("[**] WARNING: DNS resolutions not working")
    }

}


/**
 * Executes bash command passed inside container
 * container given.
 *
 * Exits process if the command fails
 *
 * @param name container name
 * @param command command to be executed inside container
 */
export function lxcExec(name: string, command: string) {
    const exec = `lxc exec ${name} -- ${command}`
    try {
        execSync(exec)
    } catch (err) {
        console.log("[*] Error executing command on container")
        console.log(`[*] Container: ${name}`)
        console.log(`[*] Command: ${command}`)
        process.exit(1)
    }
}

/**
 * Add the proxy object passed to an existing
 * lxc container
 *
 * @param name container name
 * @param hostPort local host port to listen on the hypervisor for the proxy mapped
 * @param hostname TODO!!!
 * @param proxy proxy object according to configuration file proxy field
 */
export function lxcProxy(name: string, hostPort: number, hostname: string, proxy: Proxy) {
    let proxyDevice = `proxy-${proxy.name}`
    let command = `lxc config device add ${name} ${proxyDevice} proxy\
    listen=${proxy.type}:${proxy.listen}:${hostPort}\
    connect=${proxy.type}:${hostname}:${proxy.port}`

    try {
        execSync(command)
        console.log(`[**] added proxy-${proxy.name} `)
    } catch (err) {
        console.error(err.message)
        process.exit(1)
    }

}

/**
 * Add host path folder to and existing
 * lxc container.
 *
 * Exits process if the command fails.
 *
 * @param containerName container name
 * @param deviceName container device name
 * @param hostPath path to the folder to be exported
 * @param user container user
 */
export function lxcDeviceAdd(containerName: string, deviceName: string, hostPath: string, user: string) {

    let deviceAdd = `lxc config device add ${containerName} data-${deviceName} disk source=${hostPath} path="/home/${user}/data-${deviceName}"`
    try {
        execSync(deviceAdd)
        console.log(`[**] added data-${deviceName} `)
    } catch (err) {
        console.log("[*] Error adding device")
        process.exit(1)
    }
}

/**
 * Remove device inside lxc container
 *
 * Exits process if command fails.
 *
 * @param containerName container name
 * @param deviceName lxc device name
 */
export function lxdDeviceRemove(containerName: string, deviceName: string) {

    let deviceRemove = `lxc config device remove ${containerName} ${deviceName}`
    try {
        execSync(deviceRemove)
    } catch (err) {
        console.log("[*] Error removing device")
        process.exit(1)
    }
}

/**
 * Return list of current device names
 * inside a lxc container.
 *
 * Exits process if the command fails
 *
 * @param name container name
 */
export function lxcDeviceList(name: string): string[] {

    let proxiesNames: string[]

    try {

        proxiesNames = execSync(`lxc config device list ${name}`)
            .toString()
            .split("\n")
        return proxiesNames

    } catch (err) {
        console.log("Error listing devices inside container")
        process.exit(1)

    }
}

/**
 * Sets password specified to and
 * existing user inside a lxce container.
 *
 * @param name container name
 * @param user container user
 * @param password password to be set inside container
 */
export function lxcPassword(name: string, user: string, password: string) {
    let setPassword = `lxc exec ${name} -- bash -c "echo ${user}:${password} | chpasswd"`
    try {
        execSync(setPassword)
        console.log("[**] Password created:", password)
    } catch (err) {
        console.log("[*] Error generating password")
    }

}


// --------------------------------------------------------  //
// ******************** Git helper functions *************** //
// --------------------------------------------------------  //

/**
 * Initialize git repostiry at given path
 *
 * @param path git directory path
 */
export function gitInit(path: string) {
    const init = `git init ${path}`

    try {
        execSync(init)
    } catch (err) {
        console.log(`[*] WARNING: error creating git repository at ${path}`)
    }

}

/**
 * Commit all current changes at given path
 *
 * @param path git directory path
 * @param message commit message
 */
export function gitCommit(path: string, message: string) {
    const gitAdd = `git -C ${path} add .`
    const gitCommit = `git -C ${path} commit -m "${message}"`

    try {
        execSync(gitAdd)
        execSync(gitCommit)
    } catch (err) {
        console.log(`[*] WARNING: error commit changes at ${path}`)
        console.log("Error: ", err.message)
    }


}



// --------------------------------------------------------  //
// ******************** Inquirer questions   *************** //
// --------------------------------------------------------  //
export async function askQuestion(questionMessage: string) {
    const question = {
        type: "confirm",
        name: "answer",
        message: questionMessage,
    }
    const { answer } = await inquirer.prompt([question])
    return answer

}
