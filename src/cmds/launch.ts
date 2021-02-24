import * as fs from "fs"
import { uniqueNamesGenerator } from 'unique-names-generator';
import yargs, { check } from "yargs"
import { exec, execSync } from "child_process"

import { DEFAULT_CONTAINER_CONF_FILE, CONF_FILE, SSH_DIR, CONTAINER_CONFIG_DIR, CONF_FILE_DATA, NAMES_CONFIG } from "../constants"
import { readJSON, writeJSON } from "../utils/util"
import path from "path";
import { hostname } from "os";


// Install function
export function cmdLaunch(args: any) {

    try {

        // Match alias with containers
        if (args.alias) {
            if (args.alias.length != args.range) {
                console.log("Number of alias does not match number of containers")
                process.exit(1)
            }

            // TODO: change names of alias to distinguish plural
            if (!checkAlias(args.alias)) {
                console.log("[*] Alias already used")
                process.exit(1)
            }

        }

        if (!checkInit()) {
            console.log("Some init not correctly")
            console.log("TODO: output nicely")
            process.exit(1)
        }

        // TODO: check customConfig parameters
        // readJSONConfig
        console.log("[*] Reading configuration for container")
        const configContainer = readJSON(DEFAULT_CONTAINER_CONF_FILE)
        const configLXCE = readJSON(CONF_FILE)
        console.log("[\u2713] Reading configuration for container")

        // Works for any configuration, as args. not given are set
        // to "undefined"
        for (let i = 0; i < args.range; i++) {
            let name: string = uniqueNamesGenerator(NAMES_CONFIG)
            console.log("[*] Launching container with", name)
            launch(configContainer, configLXCE, name, args.domain, args.alias[i])
            console.log("[\u2713] Launching container with", name)
        }
        console.log("[*] -------------------")
        console.log("[*] Succes!!")
        process.exit(0)

    } catch (err) {
        console.error(err)
    }
}

// Check is everything is initialized
// (i.e: lxce init ejecuted before)
// and throws exceptions if we don't have permissions
function checkInit(): boolean {
    try {
        console.log("[*] -------------------")
        console.log("[*] Checking configurations ...")
        if (!fs.existsSync(DEFAULT_CONTAINER_CONF_FILE)) return false
        if (!fs.existsSync(CONF_FILE)) return false
        if (!fs.existsSync(SSH_DIR)) return false
        if (!fs.existsSync(CONTAINER_CONFIG_DIR)) return false
        console.log("[\u2713] Checking configurations: ok!")

        // TODO: Check:
        // [x]: locations
        // [x]: base
        // [ ]: domain?
        console.log("[*] Checking locations ...")
        const confLxce = readJSON(CONF_FILE)
        console.log("[*] debug:", confLxce)
        for (const loc of confLxce.locations) {
            if (!fs.existsSync(loc)) return false
        }
        console.log("[\u2713] Checking locations: ok!")

        console.log("[*] Checking base ...")
        const confContainer = readJSON(DEFAULT_CONTAINER_CONF_FILE)
        const base = confContainer.base
        // TODO: temporal
        // If command fails will throw exception
        let command = `lxc image list ${base} `
        const output = execSync(command)
        console.log("[\u2713] Checking base: ok!")
        console.log("[*] -------------------")

        return true

    } catch (err) {
        throw err
    }
}

function checkAlias(aliases: Array<string>): boolean {
    let existingAlias: Array<string> = []
    try {
        const dirCont = fs.readdirSync(CONTAINER_CONFIG_DIR)

        for (const file of dirCont) {
            // It return relative paths
            let filePath = path.join(CONTAINER_CONFIG_DIR, file)
            let configFile = readJSON(filePath)
            existingAlias.push(configFile.alias)
        }

        for (const alias of aliases) {
            if (existingAlias.includes(alias)) {
                console.log(`[**] alias:${alias} already used`)
                return false
            }
        }

        return true

    } catch (err) {
        throw err
    }

}

// Launch will:
// [ ]- Launch container with (lxc launch ...)
//   ---> @param name container
// [ ]- Attach read only directories
//    - and create directories in host
//   ---> @param domain
// [ ] - Create ssh configuration files
// [ ] - Nginx ?
// [ ] - Create git repository
// [ ] - Certificates ?
function launch(configContainer: any, configLXCE: any, name: string, domain: string, alias?: string) {
    console.log("[**] domain:", domain)
    console.log(`[**] name:${name}`)
    if (alias) console.log("[**] alias:", alias)

    try {

        // Launch
        // execSync(
        //     `lxc launch ${configContainer.base} ${name}`,
        //     { stdio: [process.stdin, process.stdout, process.stderr] }
        // )

        // Generate and change password of existing user
        let user = ""

        // Directories
        fs.mkdirSync(path.join(configContainer.userData, "lxce", domain, name), { recursive: true })

        // Ssh .config
        fs.mkdirSync(path.join(SSH_DIR, configContainer.domain))    // fs.writeFile does not create direct.
        let fileName = alias ?? name
        fs.writeFileSync(
            path.join(SSH_DIR, domain, fileName),
            sshConfig(
                name,
                domain,
                configLXCE.hypervisor.SSH_hostname,
                user,
                configLXCE.hypervisor.SSH_port,
                configLXCE.hypervisor.SSH_suffix,
                alias
            )
        )

    } catch (err) {
        // TODO: should remove all configurations generated in case
        //       of error
        console.error("launch (error): check permissions")
        throw err

    }

    // Directories

    // Commands (launch)
    // -----------------
    // $: lxc launch ${base} ${name}
    // $: lxc exec ${name} --bash -c  \
    //    "useradd -u 1000 -m -G sudo -s /bin/bash ${user}
    //   -m: creates home directory
    //   -G: add group
    //   -s: select default bash
    //
    // $: mkdir -p ${dir}
    // $: chown -R 10000:10000 ${dir}
    // $: lxc config set ${name} raw.idmap "both 10000 1000"
    // $: lxc config device add data-${user} disck source=${data} \
    //    path="home/${user}/${data...}"
    //
    // $: mkdir -p /datassd/lxce/${config.domain}
    //
    // Command (proxies)
    // ----------------
    // $: lxc config device add ${name} proxy-${proxy.name} proxy \
    //    listen=${proxy.type}:${proxy.listen}:${proxy} ...       \
    //    connect=${proxy.type}:${ip}:${port}
    //
    // Command (ssh)
    // -------------
    // '  Host ' + config.id + '.' + config.domain + '.' + conf_file.hypervisor.SSH_suffix + '  \n' +
    // '  HostName ' + conf_file.hypervisor.SSH_hostname + ' \n' +
    // '  User alice\n' +
    // '  Port ' + DI + config.id + portSSH + '\n' +
    // '  TCPKeepAlive yes \n' +
    // '  ServerAliveInterval 300 \n', 'utf8');
    //
    // Command (git)
    // -------------
    // $: git -C ${SSH_DIR}/lxce add ${SSH_DIR}/lxce/*
    // $: git -C ${SSH_DIR}/lxce commit -am "${name}: created"
}

function sshConfig(name: string, domain: string, hostname: string, user: string, port: string, suffix: string, alias?: string): string {
    let firstLine = `Host ${name}.${domain}.${suffix}`
    if (alias) firstLine += `, ${alias}`

    let ssh = `${firstLine} \n
        Hostname ${hostname}
        User ${user}
        Port ${port}
        TCPKeepAlice yes
        ServerAliveInterval 300`

    console.log(`[**] debug: ${ssh}`)

    return ssh
}
