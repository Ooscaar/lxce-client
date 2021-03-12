import { table } from "table"
import { CONTAINER_CONFIG_DIR, tableConfig } from "../constants";
import { execSync } from "child_process";
import { checkInitialized, readContainerConfig } from "../utils/util";
import path from "path";
import * as fs from "fs";
import { getPortNumber, launchProxies } from "./launch";
import yargs from "yargs";


// Temporal client
const URL = "unix://var/snap/lxd/common/lxd/unix.socket"

// TODO: add socket and client lxd checks
function checkList() {

    if (!checkInitialized()) {
        process.exit(1)
    }
}

function getContainerJSON(name: string, domain: string): any {
    let data = execSync(`curl --unix-socket /var/snap/lxd/common/lxd/unix.socket s/1.0/containers/${name}/state 2>/dev/null`).toString()
    let json = JSON.parse(data).metadata
    const containerConfig = readContainerConfig(path.join(CONTAINER_CONFIG_DIR, domain, name))

    // FIXME: Temporal
    let id_container = containerConfig.id_container
    let id_domain = containerConfig.id_domain
    let ports = containerConfig.proxies.map((proxy, index) => {
        let port = getPortNumber(
            id_container,
            id_domain,
            index
        )
        return `${proxy.port}/${proxy.type} -> ${proxy.listen}:${port}\n`
    })

    // Return object according to table
    return {
        name: name,
        alias: containerConfig.alias,
        domain: domain,
        state: json.status ?? "",
        ipv4: json.network ? json.network.eth0.addresses[0].address : "",
        ports: ports.toString().replace(",", "")        // remove , for format
    }
}

function cmdList(args: any) {

    // Check
    checkList()

    // Get info from all containers
    let data: Array<any> = [["NAME", "ALIAS", "DOMAIN", "STATE", "Ipv4", "PORTS"]]
    let domains = fs.readdirSync(CONTAINER_CONFIG_DIR)
    for (let domain of domains) {
        for (let containerName of fs.readdirSync(path.join(CONTAINER_CONFIG_DIR, domain))) {
            let dataContainer = getContainerJSON(containerName, domain)
            let arr = []
            for (let elem of Object.values(dataContainer)) {
                arr.push(elem)
            }
            data.push(arr)
        }

    }

    // Create table
    console.log(table(data, tableConfig))
    process.exit(0)


}

// ---------------------
// Yargs command options
// ---------------------
export const command = "list"

export const describe = "List containers properties"

export const handler = cmdList

export const builder = {
    "format": {
        alias: "f",
        describe: "Values to show",
        type: "array",
        required: false
    }
}
