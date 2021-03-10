import * as fs from "fs"
import path from "path";
import { hostname } from "os";
import { exec, execSync } from "child_process"

import { uniqueNamesGenerator } from 'unique-names-generator';

import {
    DEFAULT_CONTAINER_CONF_FILE,
    CONF_FILE,
    SSH_DIR,
    NAMES_CONFIG,
    LXCE_DIR,
    CONTAINER_CONFIG_DIR,
    MAX_CONTAINER_PER_DOMAIN,
    FIRST_PORT,
    SHARED_FOLDER
} from "../constants"

import {
    checkAcces,
    checkContainerConfig,
    checkDefaultConfig,
    checkInitialized,
    existAlias,
    generatePassword,
    getUserContainer,
    lxdDNS,
    readContainerConfig,
    readLxceConfig,
    writeContainerConfig,
    writeLxceConfig,
    writeSSHConfig
} from "../utils/util"

import {
    ContainerConfig,
    LxceConfig,
    SSH,
    Proxy
} from "../interfaces/interfaces"

import { lxcProxy } from "./proxy";
import yargs, { string } from "yargs";

// TODO: document it
export function getPortNumber(id_container: number, id_domain: number, id_proxy: number): number {
    return FIRST_PORT + id_domain * 1000 + id_container * 10 + id_proxy
}

function getDomainID(domain: string): number {
    const lxceConfig = readLxceConfig(CONF_FILE)
    return lxceConfig.domains.findIndex(elem => elem === domain)
}

function getContainerID(domain: string): number {
    // Read all containers id's from a domain
    let containers_ids: Array<number> = []

    // FIXME: for now, at the time of calling getContainerID
    // we have not create the domain folder yet
    // So fs.readdirSync will throw and exception
    let containers: Array<string>
    try {
        containers = fs.readdirSync(path.join(CONTAINER_CONFIG_DIR, domain))
    } catch (err) {
        // In this case, simply return first id -> 0
        return 0
    }

    // In case folder in empty
    if (containers.length === 0) {
        return 0
    }
    for (let container of containers) {
        let containerConfig = readContainerConfig(
            path.join(CONTAINER_CONFIG_DIR, domain, container)
        )
        containers_ids.push(containerConfig.id_container)
    }
    containers_ids.sort()

    // Find first hole
    // ex: [0,1,2,4] -> 3
    // ex: [1,2,3] -> 0
    let counter = 0
    let container_id = 0
    for (let id of containers_ids) {
        if (id !== counter) {
            container_id = counter
            break
        }
        counter += 1
    }
    container_id = counter
    return container_id
}


function sshConfig(ssh: SSH): string {
    let firstLine = `Host ${ssh.name}.${ssh.domain}.${ssh.suffix}`
    if (ssh.alias) firstLine += `, ${ssh.alias}.${ssh.domain}.${ssh.suffix}`

    let config = `${firstLine}
    Hostname ${ssh.hostname}
    User ${ssh.user}
    Port ${ssh.port}
    TCPKeepAlice yes
    ServerAliveInterval 300`

    //console.log(`[**] debug: ${config}`)

    return config
}




function checkLaunch(domain: string) {
    console.log("[*] Initialized")
    if (!checkInitialized()) {
        console.log("[*] Exiting ...")
        process.exit(1)
    }
    console.log("[*] Initialized: ok!")

    console.log("[*] Acces")
    if (!checkAcces()) {
        console.log("[*] Exiting ...")
        process.exit(1)
    }
    console.log("[*] Acces: ok!")

    if (!checkDefaultConfig()) {
        console.log("[*] Exiting ...")
        process.exit(1)
    }

    if (!checkContainerConfig(DEFAULT_CONTAINER_CONF_FILE)) {
        console.log("[*] Exiting ...")
        process.exit(1)
    }

    // TODO: check domain inside other function
    if (fs.readdirSync(CONTAINER_CONFIG_DIR).length === MAX_CONTAINER_PER_DOMAIN) {
        console.log("[**] MAX CONTAINER x DOMAIN used")
        console.log("[**] Relaunch the container with another domains")
        process.exit(1)
    }

    // Adding domain to general conf 
    // FIXME: should be in another place??
    let lxceConfig = readLxceConfig(CONF_FILE)
    if (!lxceConfig.domains.includes(domain)) {
        lxceConfig.domains.push(domain)
        writeLxceConfig(CONF_FILE, lxceConfig)
    }

    console.log("[*] Checks: ok!")

}

function launchContainer(name: string, base: string, seed: string): string {
    // Launching
    // ---------
    try {
        execSync(`lxc launch ${base} ${name}`)
        execSync(`lxc exec ${name} -- cloud-init status -w`, { stdio: [process.stdin, process.stdout, process.stderr] })

        let user = getUserContainer(name)
        let password = generatePassword(seed, name, user)
        execSync(`lxc exec ${name} -- bash -c "echo ${user}:${password} | chpasswd"`)
        console.log("[**] Password created:", password)
        return user

    } catch (err) {
        console.log(err.message)
        throw err
    }

}

function launchConfigurations(name: string, user: string, containerConfig: ContainerConfig, lxceConfig: LxceConfig) {
    try {
        // Container.conf.d
        fs.mkdirSync(path.join(CONTAINER_CONFIG_DIR, containerConfig.domain), { recursive: true })    // fs.writeFile does not create direct.
        writeContainerConfig(
            path.join(CONTAINER_CONFIG_DIR, containerConfig.domain, name),
            containerConfig
        )

        // SSH.d
        let ssh: SSH = {
            name: name,
            domain: containerConfig.domain,
            hostname: lxceConfig.hypervisor.SSH_hostname,
            user: user,
            port: getPortNumber(
                containerConfig.id_container,
                containerConfig.id_domain,
                containerConfig.proxies.findIndex(elem => elem.name === "ssh")
            ),
            suffix: lxceConfig.hypervisor.SSH_suffix,
            alias: containerConfig.alias
        }
        fs.mkdirSync(path.join(SSH_DIR, containerConfig.domain), { recursive: true })
        writeSSHConfig(
            path.join(SSH_DIR, containerConfig.domain, name),
            sshConfig(ssh)
        )

    } catch (err) {
        console.log(err.message)
        throw err
    }

}

function launchDirectories(name: string, user: string, containerConfig: ContainerConfig) {
    // Attach read only directories
    // ----------------------------
    let domainDir: string = path.join(
        containerConfig.userData,
        LXCE_DIR,
        containerConfig.domain,
        SHARED_FOLDER
    )
    let userDir: string = path.join(
        containerConfig.userData,
        LXCE_DIR,
        containerConfig.domain,
        name,
        user
    )
    try {
        fs.mkdirSync(domainDir, { recursive: true })
        fs.mkdirSync(userDir, { recursive: true })

        // TODO: manage acces to directories
        //execSync(`chown -R 10000:10000 ${userDir}`)
        execSync(`lxc config set ${name} raw.idmap "both 10000 1000"`)
        execSync(`lxc restart ${name}`) //important

        execSync(`lxc config device add ${name} data-${containerConfig.domain} disk source=${domainDir} path="/home/${user}/${SHARED_FOLDER}"`)
        execSync(`lxc config device add ${name} data-${user} disk source=${domainDir} path="/home/${user}/"`)
        console.log("[**] read only directories: ok!")


    } catch (err) {
        console.log(err.message)
        throw err

    }
}

export function launchProxies(name: string, hostname: string, containerConfig: ContainerConfig) {
    // Proxies
    // -------
    let index = 0
    for (const proxy of containerConfig.proxies) {
        let hostPort = getPortNumber(
            containerConfig.id_container,
            containerConfig.id_domain,
            index
        )
        lxcProxy(name, hostPort, hostname, proxy)
        // Check also if dns resolutions is working
        index += 1
    }

}

function launch(containerConfig: ContainerConfig, lxceConfig: LxceConfig, name: string) {
    console.log("[**] launching ...")
    let user = launchContainer(name, containerConfig.base, lxceConfig.seed)
    console.log("[**] launching: ok!")

    console.log("[**] creating configurations")
    launchConfigurations(name, user, containerConfig, lxceConfig)
    console.log("[**] creating configurations: ok!")

    console.log("[**] read only directories")
    launchDirectories(name, user, containerConfig)
    console.log("[**] read only directories: ok!")

    console.log("[**] adding proxies")
    launchProxies(name, lxceConfig.hypervisor.SSH_hostname, containerConfig)
    // launchProxy()
    console.log("[**] adding proxies: ok!")

    // Temporal
    lxdDNS(name)

    // TODO
    // launchGit()
}

// Command launch
export function cmdLaunch(args: any) {

    // Match alias with containers
    // Names ---> alias!!
    // CAUTION: Names: Array<String>
    if (args.names) {
        if (args.names.length != args.range) {
            yargs.showHelp()
            console.log("")
            console.log("Number of names does not match number of containers")
            process.exit(1)
        }

        if (existAlias(args.names, args.domain)) {
            yargs.showHelp()
            process.exit(1)
        }
    }

    console.log("[*] --------------------------------------------------------------")
    console.log("[*] Checkings")
    checkLaunch(args.domain)
    console.log("[*] --------------------------------------------------------------")


    // Works for any configuration because args. not given are set
    // to "undefined"
    // const configContainer = readJSON(DEFAULT_CONTAINER_CONF_FILE)
    // const configLXCE = readJSON(CONF_FILE)
    try {
        const lxceConfig = readLxceConfig(CONF_FILE)

        for (let i = 0; i < args.range; i++) {
            let name: string = uniqueNamesGenerator(NAMES_CONFIG)

            // In order to have a copy of the object
            let containerConfig = readContainerConfig(DEFAULT_CONTAINER_CONF_FILE)

            containerConfig.alias = args.names ? args.names[i] : ""
            containerConfig.domain = args.domain
            containerConfig.id_domain = getDomainID(args.domain)
            containerConfig.id_container = getContainerID(args.domain)

            console.log("[*] Launching container with", name)
            launch(containerConfig, lxceConfig, name)
            console.log("[\u2713] Launching container with", name)
        }

        console.log("[*] --------------------------------------------------------------")
        console.log("[*] Succes!!")
        process.exit(0)

    } catch (err) {
        console.error(err.message)
        process.exit(1)
    }

}


// ---------------------
// Yargs command options
// ---------------------
export const command = "launch"

export const describe = "Launch containers from a specific domain"

export const handler = cmdLaunch

export const builder = {
    "names": {
        alias: 'n',
        describe: 'Names/name of the containers/container',
        demand: false,
        type: 'array',
    },
    "domain": {
        alias: "d",
        describe: "Domain for the container",
        demand: true,
        type: string,
        nargs: 1
    },
    "range": {
        alias: "r",
        describe: "range of container (ex: -r 5)",
        demand: false,
        type: "number",
        default: 1,
        nargs: 1
    }
}