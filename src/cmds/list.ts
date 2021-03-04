import { table } from "table"
import { CONTAINER_CONFIG_DIR, tableConfig } from "../constants";
import { execSync } from "child_process";
import { readContainerConfig } from "../utils/util";
import path from "path";
import * as fs from "fs";


// Temporal client 
const URL = "unix://var/snap/lxd/common/lxd/unix.socket"



function getContainerJSON(name: string, domain: string): any {
    let data = execSync(`curl --unix-socket /var/snap/lxd/common/lxd/unix.socket s/1.0/containers/${name}/state 2>/dev/null`).toString()
    let json = JSON.parse(data,).metadata
    // Return object according to table
    return {
        name: name,
        alias: readContainerConfig(path.join(CONTAINER_CONFIG_DIR, domain, name)).alias,
        domain: domain,
        state: json.status ?? "",
        ipv4: json.network ? json.network.eth0.addresses[0].address : ""
    }
}

export function cmdList(args: any) {

    // Get info from all containers
    let data: Array<any> = [["NAME", "ALIAS", "DOMAIN", "STATE", "Ipv4"]]
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