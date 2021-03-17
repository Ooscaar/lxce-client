import { exec, execSync } from "child_process"
import path from "path"
import * as fs from "fs"
import chalk from "chalk"
import { CONTAINER_CONFIG_DIR, LXCE_DIR, SSH_DIR } from "../constants"
import { askQuestion, checkAccess, checkDomain, checkInitialized, existName, getContainersAll, getContainersDomain, getDomains, getContainerName, readContainerConfig } from "../utils/util"
import yargs from "yargs"
import { ContainerConfig } from "../interfaces/interfaces"

function checkDelete(domain: string) {
    // Check Init
    if (!checkInitialized()) {
        yargs.showHelp()
        console.log("[*] run lxce init before")
        process.exit(1)
    }
    console.log("[*] Init: ok!")


    // Check write permissions
    if (!checkAccess()) {
        console.log("Does not have access to the directory")
        console.log("Please run the command with sudo")
        process.exit(1)
    }
    console.log("[*] Permission checked")

    if (domain) {
        if (!checkDomain(domain)) {
            console.log("[*] Domain does not exist")
            process.exit(1)
        }
    }


}

function deleteContainer(name: string) {
    // Stop and delete containers
    let remove: string = `lxc delete ${name} -f`
    try {
        execSync(remove)
    } catch (err) {
        console.log("[*] Error removing containers")
        process.exit(1)
    }
    console.log(`[*] Delete and stop container ${name}`)
}

function deleteConfigurations(containerConfig: ContainerConfig) {
    // Delete configurations files
    try {
        // Configuration file
        fs.unlinkSync(
            path.join(
                CONTAINER_CONFIG_DIR,
                containerConfig.domain,
                containerConfig.name
            )
        )
        // SSH config file
        fs.unlinkSync(
            path.join(
                SSH_DIR,
                containerConfig.domain,
                containerConfig.name
            )
        )
        // Shared directories
        // As we are removing a whole folder, with or
        // without contents, we use rm -rf
        let folderPath = path.join(
            containerConfig.userData,
            LXCE_DIR,
            containerConfig.domain,
            containerConfig.name
        )
        execSync(`rm -rf ${folderPath}`)
        console.log("[*] Related conf and folders deleted")

    } catch (err) {
        console.error(err)
        process.exit(1)

    }

}

// Only works with name, as it ensures
// be more specific for the container
// to remove
// async: in order to use inquirer nicely
async function cmdDelete(args: any) {


    if (!args.name && !args.global && !args.domain) {
        yargs.showHelp()
        process.exit(1)
    }

    checkDelete(args.domain)

    // --global
    if (args.global) {
        if (!args.yes) {
            const answer = await askQuestion("Do you want to delete ALL containers?")
            if (!answer) {
                process.exit(1)
            }
        }

        console.log("[*] Deleting all containers")
        console.log("--------------------------------")

        // Loop over the domains, as domain is needed
        for (let domain of getDomains()) {
            for (let containerName of getContainersDomain(domain)) {
                let containerConfig = readContainerConfig(
                    path.join(
                        CONTAINER_CONFIG_DIR,
                        domain,                 // loop domain
                        containerName
                    )
                )
                deleteContainer(containerName)
                deleteConfigurations(containerConfig)
            }
        }

        console.log("--------------------------------")
        console.log("[*] Delete all containers: ok!")
        process.exit(0)
    }

    // --domain | --domain --name
    if (args.domain && !args.name) {
        if (!args.yes) {
            const answer = await askQuestion(`Do you want to delete ALL containers from ${args.domain}?`)
            if (!answer) {
                process.exit(1)
            }
        }
        console.log(`[*] Deleting all containers from ${args.domain}`)
        console.log("-----------------------------------------------")

        for (let containerName of getContainersDomain(args.domain)) {
            let containerConfig = readContainerConfig(path.join(
                CONTAINER_CONFIG_DIR,
                args.domain,               // domain passed
                containerName
            ))
            console.log(chalk.bold(`${containerName}`))
            deleteContainer(containerName)
            deleteConfigurations(containerConfig)
        }

        console.log("-----------------------------------------------")
        console.log(`[*] Deleting all containers from ${args.domain}: ok!`)
        process.exit(0)

    } else {
        if (!args.domain) {
            console.log("[*] Please select the domain")
            console.log("[*] Example: lxce delete -d google -n alice")
            process.exit(1)
        }

        let containerName = getContainerName(args.name, args.domain)
        if (!args.yes) {
            const answer = await askQuestion(`Do you want to delete ${containerName}?`)
            if (!answer) {
                process.exit(1)
            }
        }
        let containerConfig = readContainerConfig(path.join(
            CONTAINER_CONFIG_DIR,
            args.domain,               // domain passed
            containerName
        ))
        deleteContainer(containerName)
        deleteConfigurations(containerConfig)
        process.exit(0)
    }



}


// ---------------------
// Yargs command options
// ---------------------
export const command = "delete"

export const describe = "Delete containers and configurations/folders related"

export const handler = cmdDelete

export const builder = {
    "global": {
        alias: "g",
        describe: "apply to all containers",
        demand: false,
        type: "boolean",
        nargs: 0
    },
    "domain": {
        alias: 'd',
        describe: 'domain name for a group of containers',
        demand: false,
        type: 'string',
        nargs: 1,
    },
    "name": {
        alias: 'n',
        describe: 'container name',
        demand: false,
        type: 'string',
        nargs: 1,
    },
    "yes": {
        alias: "y",
        demand: false,
        type: "boolean",
        nargs: 0,
    },
}
