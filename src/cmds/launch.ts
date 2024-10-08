import * as fs from "fs"
import path from "path";
import { execSync } from "child_process"
import chalk from "chalk"

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
    checkAccess,
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
    writeSSHConfig,
    lxcProxy,
    gitCommit,
    checkDomain,
    addDomain,
    getDomainId,
    existName
} from "../utils/util"

import {
    ContainerConfig,
    LxceConfig,
    SSH
} from "../interfaces/interfaces"

import yargs from "yargs";

// TODO: document it
export function getPortNumber(id_container: number, id_domain: number, id_proxy: number): number {
    return FIRST_PORT + id_domain * 1000 + id_container * 10 + id_proxy
}

// TODO: rewrite it with utils functions
function getContainerId(domain: string): number {
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

// Return ssh config file
function sshConfig(ssh: SSH): string {
    let firstLine = `Host ${ssh.suffix}.${ssh.domain}.${ssh.name}`
    // Adding one space !!
    if (ssh.alias) firstLine += ` ${ssh.suffix}.${ssh.domain}.${ssh.alias}`

    let config = [
        `${firstLine}`,
        `   Hostname ${ssh.hostname}`,
        `   User ${ssh.user}`,
        `   Port ${ssh.port}`,
        `   TCPKeepAlive yes `,
        "   ServerAliveInterval 300 \n",
    ].join("\n")

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
    if (!checkAccess()) {
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


    console.log("[*] Checks: ok!")

}

function launchContainer(name: string, base: string, seed: string): string {
    // Launching
    // ---------
    try {
        execSync(`lxc launch ${base} ${name}`)
        console.log("[**] waiting for container...")

        // FIXME: will only work on images with cloud init installed (not an option by default)
        // https://discuss.linuxcontainers.org/t/default-ubuntu-user-runs-sudo-without-authentication/4970/7
        // A possible solution:
        // - change ubuntu --> pedro
        // - pedro will not be able to sudo without password
        // - the ubuntu /etc/sudoers part will remain
        execSync(`lxc exec ${name} -- cloud-init status -w`)

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

        // Update user
        containerConfig.user = user
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

        // Commit container launch
        gitCommit(SSH_DIR, `launch: ${containerConfig.domain}-${name}`)

    } catch (err) {
        console.log(err.message)
        throw err
    }

}

function launchDirectories(name: string, user: string, containerConfig: ContainerConfig) {
    // Attach read only directories
    // ----------------------------
    // /dataxx/lxce/domain
    let domainDir: string = path.join(
        containerConfig.userData,
        LXCE_DIR,
        containerConfig.domain,
        SHARED_FOLDER
    )
    // /dataxdd/lxce/domain/containerName
    let containerDir: string = path.join(
        containerConfig.userData,
        LXCE_DIR,
        containerConfig.domain,
        name,
    )
    try {
        fs.mkdirSync(domainDir, { recursive: true })
        fs.mkdirSync(containerDir, { recursive: true })

        // TODO: manage acces to directories
        //execSync(`chown -R 10000:10000 ${userDir}`)
        execSync(`lxc config set ${name} raw.idmap "both 10000 1000"`)
        execSync(`lxc restart ${name}`) //important

        // Add user and domain directories
        // - /dataxx/lxce/domain/container -> /home/user/data
        // - /dataxx/lxce/domain/shared    -> /home/user/data-domain

        // TODO: implement lxdDevice util function
        const domain = containerConfig.domain
        execSync(`lxc config device add ${name} data-${domain} disk source=${domainDir} path="/home/${user}/data-${domain}"`)
        execSync(`lxc config device add ${name} data-${name} disk source=${domainDir} path="/home/${user}/data"`)
        console.log(`[**] added data-${domain} shared folder`)
        console.log(`[**] added data-${name} shared folder`)
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


    // Match aliases with containers
    if (args.aliases) {
        if (args.aliases.length != args.range) {
            console.log("Number of names does not match number of containers")
            process.exit(1)
        }

        if (existAlias(args.aliases, args.domain)) {
            yargs.showHelp()
            process.exit(1)
        }
    }

    // Match names with containers
    if (args.names) {
        if (args.names.length != args.range) {
            console.log("Number of names does not match number of containers")
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

        // If domain does not exist, add it to the configuration file
        // with the first available domain id
        if (!checkDomain(args.domain)) {
            addDomain(args.domain)
        }

        const lxceConfig = readLxceConfig(CONF_FILE)

        for (let i = 0; i < args.range; i++) {
            let randonName = args.names ? args.names[i] : uniqueNamesGenerator(NAMES_CONFIG)

            // In order to have a copy of the object
            let containerConfig = readContainerConfig(DEFAULT_CONTAINER_CONF_FILE)

            containerConfig.name = randonName
            containerConfig.alias = args.aliases ? args.aliases[i] : ""
            containerConfig.domain = args.domain
            containerConfig.id_domain = getDomainId(args.domain) ?? 0       // TODO: manage the undefined
            containerConfig.id_container = getContainerId(args.domain)

            console.log(chalk.bold("[*] Launching container with", randonName))
            launch(containerConfig, lxceConfig, randonName)
            console.log(chalk.bold(`${chalk.green("[\u2713]")} Launching container with ${randonName}`))
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

export const describe = "Launch containers"

export const handler = cmdLaunch


export const builder = (yargs: any) => {
    yargs.usage("Usage: $0 launch <options> <flags>")
    yargs.strict()
    yargs.option("domain", {
        alias: "d",
        describe: "domain for the container/containers",
        demand: true,
        type: "string",
        nargs: 1,
        group: "Options"
    })
    yargs.option("range", {
        alias: "r",
        describe: "range of container (ex: -r 5)",
        demand: false,
        type: "number",
        default: 1,
        nargs: 1,
        group: "Options"
    })
    yargs.option("names", {
        alias: 'n',
        describe: 'names/name of the containers/container',
        demand: false,
        type: 'array',
        group: "Options"
    })
    yargs.option("aliases", {
        alias: 'a',
        describe: 'aliases/alias of the containers/container',
        demand: false,
        type: 'array',
        group: "Options"
    })
    yargs.example([
        ["$0 launch -d google", "Launch one container within google with a random name"],
        ["$0 launch -d google -r 3", "Launch three containers within google with randon names"],
        ["$0 launch -d google -r 3 -n back front base", "Launch three containers within google with specified names"],
        ["$0 launch -d google -r 3 -n back front base -a alice bob eve", "Launch three containers with names and alias specified"],
        ["$0 launch -d google -r 3 -a alice bob eve", "Launch three containers with random names and alias specified"],
    ])
}
