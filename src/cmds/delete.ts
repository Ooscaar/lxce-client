import { execSync } from "child_process"
import path from "path"
import * as fs from "fs"
import yargs from "yargs"
import chalk from "chalk"

import { CONTAINER_CONFIG_DIR, LXCE_DIR, SSH_DIR } from "../constants"
import {
    askQuestion,
    checkAccess,
    checkDomain,
    checkInitialized,
    getContainersDomain,
    getDomains,
    getContainerName,
    readContainerConfig,
    lxcDelete,
    gitCommit,
    deleteDomain
} from "../utils/util"
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

function deleteConfigurations(containerConfig: ContainerConfig, force?: string) {

    // If last container within domain, remove domain folders
    // from
    // - /etc/lxce/container.conf.d/
    // - /etc/lxce/ssh/
    if (getContainersDomain(containerConfig.domain).length == 1) {
        const confPath = path.join(
            CONTAINER_CONFIG_DIR,
            containerConfig.domain
        )
        const sshPath = path.join(
            SSH_DIR,
            containerConfig.domain
        )
        const directoriesPath = path.join(
            containerConfig.userData,
            LXCE_DIR,
            containerConfig.domain,
            containerConfig.name
        )

        // Use rm -rf as we are removing folders recursively
        try {
            execSync(`rm -rf ${confPath}`)
            execSync(`rm -rf ${sshPath}`)
            execSync(`rm -rf ${directoriesPath}`)
        } catch (err) {
            console.log(err.message)
            process.exit(1)
        }

        // Update domains
        deleteDomain(containerConfig.domain)

    } else {
        // Just remove configuration files
        // and container shared directory
        // Do not remove whole domain folders
        const confPath = path.join(
            CONTAINER_CONFIG_DIR,
            containerConfig.domain,
            containerConfig.name
        )
        const sshPath = path.join(
            SSH_DIR,
            containerConfig.domain,
            containerConfig.name
        )
        const directoriesPath = path.join(
            containerConfig.userData,
            LXCE_DIR,
            containerConfig.domain,
            containerConfig.name
        )

        try {
            fs.unlinkSync(confPath)
            fs.unlinkSync(sshPath)
            execSync(`rm -rf ${directoriesPath}`)
        } catch (err) {
            console.log(err.message)
            process.exit(1)
        }
    }
}

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
                lxcDelete(containerName)
                deleteConfigurations(containerConfig, args.force)
            }
        }
        gitCommit(SSH_DIR, "delete: all containers")

        console.log("--------------------------------")
        console.log("[*] Delete all containers: ok!")
        process.exit(0)
    }

    // --domain | --domain --name
    if (args.domain && !args.name) {
        if (!args.yes) {
            let question = [
                `Do you want to delete ALL containers from ${args.domain}?`,
                getContainersDomain(args.domain).join("\n"),
            ].join("\n")

            const answer = await askQuestion(question)
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
            lxcDelete(containerName)
            deleteConfigurations(containerConfig)
        }
        gitCommit(SSH_DIR, `delete: containers from ${args.domain}`)

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
        lxcDelete(containerName)
        deleteConfigurations(containerConfig)
        gitCommit(SSH_DIR, `delete: ${args.domain}-${containerName}`)
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
        describe: "yes to questions",
        demand: false,
        type: "boolean",
        nargs: 0,
    },
    "force": {
        alias: "f",
        describe: "force the removal of shared domain directory",
        demand: false,
        type: "boolean",
        nargs: 0,
    },
}
