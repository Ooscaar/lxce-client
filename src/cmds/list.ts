import { table } from "table"
import { CONTAINER_CONFIG_DIR, DEFAULT_LIST_PARAMETERS, LIST_OPTIONS, LIST_PARAMETERS, tableConfig } from "../constants";
import { checkInitialized, getContainersDomain, getDomains, readContainerConfig } from "../utils/util";
import path from "path";
import * as fs from "fs";
import { getPortNumber } from "./launch";
import * as http from "http"



// TODO: add socket and client lxd checks
function checkList() {

    if (!checkInitialized()) {
        process.exit(1)
    }
}

// https://stackoverflow.com/questions/35182752/promises-with-http-get-node-js
async function makeRequest(containerName: string): Promise<any> {

    const options = {
        socketPath: '/var/snap/lxd/common/lxd/unix.socket',
        path: `/1.0/containers/${containerName}/state`
    }

    return new Promise((resolve, reject) => {
        http.get(options, response => {
            response.on("data", data => {
                let json = JSON.parse(data.toString())
                resolve(json.metadata)
            })
            response.on("error", data => {
                reject(data.toString())
            })
        })
    })
}


async function getContainerJSON(name: string, domain: string) {
    // Return object representing container
    let container: any = {}

    // From configuration file
    const containerConfig = readContainerConfig(path.join(CONTAINER_CONFIG_DIR, domain, name))
    container["name"] = containerConfig.name
    container["alias"] = containerConfig.alias
    container["user"] = containerConfig.user
    container["domain"] = containerConfig.domain
    container["ports"] = containerConfig.proxies.map((proxy, index) => {
        let port = getPortNumber(
            containerConfig.id_container,
            containerConfig.id_domain,
            index
        )
        return `${proxy.port}/${proxy.type} -> ${proxy.listen}:${port}\n`
    }).toString().replace(",", "")
    container["base"] = containerConfig.base

    // From API
    const json = await makeRequest(name)
    container["status"] = json.status
    container["ipv4"] = json.network ? json.network.eth0.addresses[0].address : ""
    container["ipv6"] = json.network ? json.network.eth0.addresses[1].address : ""
    container["ram"] = json.memory.usage !== 0 ? `${json.memory.usage / 1e6} MB` : 0


    return container
}



function parse(param: string): string[] {
    let result: string[] = []

    // Map letters with parameters names
    for (let letter of param) {

        if (!LIST_OPTIONS.includes(letter)) {
            console.log(`[*] Unknown Parameter ${letter}`)
            process.exit(1)
        }

        result.push(LIST_PARAMETERS[letter])
    }

    return result
}

async function cmdList(args: any) {

    // Check
    checkList()

    // Parse parameters
    // In case no parameter format specified
    // set default parameters
    const param = args.format ? parse(args.format) : DEFAULT_LIST_PARAMETERS

    // GET json from each container
    // and get only parameters specified
    let data = []
    data.push(param.map(elem => elem.toUpperCase()))

    for (let domain of getDomains()) {
        for (let containerName of getContainersDomain(domain)) {
            let containerData = []
            let containerJson = await getContainerJSON(containerName, domain)

            for (let elem of Object.values(param)) {
                containerData.push(containerJson[elem])
            }

            data.push(containerData)
        }
    }

    // Print table
    console.log(table(data, tableConfig))


}

// ---------------------
// Yargs command options
// ---------------------
export const command = "list"

export const describe = "List containers properties"

export const handler = cmdList

// TODO: resolve spaces in help message
export const builder = (yargs: any) => {
    yargs.usage(
        `Usage: $0 list [--format/-f] options [flags]

    Format options
    ==============
    -n: "name"
    -a: "alias"
    -u: "user"
    -b: "base"
    -r: "ram"
    -p: "ports"
    -4: "ipv4"
    -6: "ipv6"
    -s: "status"
    -d: "domain
    `)
    yargs.strict()
    yargs.option("format", {
        alias: "f",
        describe: "Values to show",
        type: "string",
        required: false,
        nargs: 1
    })
}
