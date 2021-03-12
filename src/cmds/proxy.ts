import { execSync } from "child_process"
import path from "path"
import { CONF_FILE, CONTAINER_CONFIG_DIR } from "../constants"
import { checkDomain, checkInitialized, getName, lxdDNS, readContainerConfig, readLxceConfig } from "../utils/util"
import { ContainerConfig, Proxy } from "../interfaces/interfaces"
import yargs from "yargs"
import * as fs from "fs"
import { launchProxies } from "./launch"


// interface Proxy {
//     name: string,
//     type: string,
//     listen: string
//     port: string
// }


// TODO: move function to utils
export function lxcProxy(name: string, hostPort: number, cHostname: string, proxy: Proxy) {
    let proxyDevice = `proxy-${proxy.name}`
    let command = `lxc config device add ${name} ${proxyDevice} proxy\
    listen=${proxy.type}:${proxy.listen}:${hostPort}\
    connect=${proxy.type}:${cHostname}:${proxy.port}`

    try {
        execSync(command)
        console.log(`[**] added proxy-${proxy.name} `)
    } catch (err) {
        console.error(err.message)
        process.exit(1)
    }

}


function removeProxy(name: string, proxyName: string) {
    try {
        let command = `lxc config device remove ${name} ${proxyName}`
        execSync(command)
    } catch (err) {
        console.log(err.message)
    }

}

// Using:
// lxc config device list ...
// as at the moment of calling the function
// the existing proxies have changed in the
// configuration file of lxce
function removeProxies(name: string) {
    try {
        // Filtering data devices
        let proxiesNames = execSync(`lxc config device list ${name}`)
            .toString()
            .split("\n")
            .filter(elem => elem.startsWith("proxy-"))
        for (let proxyName of proxiesNames) {
            console.log(`[**] Removing proxy: ${proxyName}`)
            removeProxy(name, proxyName)
        }

    } catch (err) {
        console.error(err.message)
    }

}

function checkProxy(domain: string) {

    if (!checkInitialized()) {
        yargs.showHelp()
        console.log("[*] run lxce init before")
        process.exit(1)
    }

    if (domain) {
        if (!checkDomain(domain)) {
            yargs.showHelp()
            console.log("[*] Domain does not exist")
            process.exit(1)
        }
    }

}

// Actions required for cmdProxy on each container
function proxy(name: string, hostname: string, containerConfig: ContainerConfig) {
    removeProxies(name)
    launchProxies(name, hostname, containerConfig)
    lxdDNS(name)
}

function cmdProxy(args: any) {

    if (!args.name && !args.global && !args.domain) {
        yargs.showHelp()
        console.log("[*] Please select at least one option")
        process.exit(1)
    }

    checkProxy(args.domain)

    const lxceConfig = readLxceConfig(CONF_FILE)
    if (args.global) {
        console.log("[*] Running global")
        let domains = fs.readdirSync(CONTAINER_CONFIG_DIR)
        for (let domain of domains) {
            for (let containerName of fs.readdirSync(path.join(CONTAINER_CONFIG_DIR, domain))) {
                let containerPath = path.join(CONTAINER_CONFIG_DIR, domain, containerName)
                let containerConfig = readContainerConfig(containerPath)
                proxy(containerName, lxceConfig.hypervisor.SSH_hostname, containerConfig)
            }

        }
        process.exit(0)
    }

    if (args.domain && !args.name) {
        console.log("[*] Running within domain")

        for (let containerName of fs.readdirSync(path.join(CONTAINER_CONFIG_DIR, args.domain))) {
            let containerPath = path.join(CONTAINER_CONFIG_DIR, args.domain, containerName)
            let containerConfig = readContainerConfig(containerPath)
            proxy(containerName, lxceConfig.hypervisor.SSH_hostname, containerConfig)
        }
        process.exit(0)


    } else {
        if (!args.domain) {
            yargs.showHelp()
            console.log("Please select the domain")
            process.exit(1)
        }
        if (!checkDomain(args.domain)) {
            console.log("[*] Domain does not exist")
            process.exit(1)
        }
        console.log("[*] Running only one container")
        let containerName = getName(args.name, args.domain)
        let containerPath = path.join(CONTAINER_CONFIG_DIR, args.domain, containerName)
        let containerConfig = readContainerConfig(containerPath)
        proxy(containerName, lxceConfig.hypervisor.SSH_hostname, containerConfig)

        process.exit(0)
    }


}


// ---------------------
// Yargs command options
// ---------------------
export const command = "proxy"

export const describe = "Delete and restart proxies based on configuration files"

export const handler = cmdProxy

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
