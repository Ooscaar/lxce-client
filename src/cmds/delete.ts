import { exec, execSync } from "child_process"
import path from "path"
import * as fs from "fs"
import yargs from "yargs"
import chalk from "chalk"

import { CONTAINER_CONFIG_DIR, DEFAULT_CONTAINER_CONF_FILE, LXCE_DIR, SSH_DIR } from "../constants"
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

function deleteConfigurations(containerConfig: ContainerConfig, force: boolean) {

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

        // If forced is passed, removed all domain folder
        // with shared folder included
        let directoriesPath: string
        if (force) {
            directoriesPath = path.join(
                containerConfig.userData,
                LXCE_DIR,
                containerConfig.domain,
            )
        } else {
            directoriesPath = path.join(
                containerConfig.userData,
                LXCE_DIR,
                containerConfig.domain,
                containerConfig.name
            )

        }

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
                lxcDelete(containerName)
                //deleteConfigurations(containerConfig)
            }
        }

        // Delete all contents within configurations folders and
        // shared directories folders
        try {
            const containerDefaultConfig = readContainerConfig(DEFAULT_CONTAINER_CONF_FILE)

            execSync(`rm -rf ${path.join(SSH_DIR, "*")}`)
            execSync(`rm -rf ${path.join(CONTAINER_CONFIG_DIR, "*")}`)
            execSync(`rm -rf ${path.join(containerDefaultConfig.userData, "*")}`)
        } catch (err) {
            console.log("Error: removing configuration folders")
            process.exit(1)
        }

        // Commit changes
        gitCommit(SSH_DIR, "delete: all containers")

        console.log("--------------------------------")
        console.log("[*] Delete all containers: ok!")
        process.exit(0)
    }

    // --domain | --domain --name
    if (args.domain && !args.name && !args.alias) {
        let force = true

        // Questions
        if (!args.yes) {
            let firstQuestion = [
                `Do you want to delete ALL containers from ${args.domain}?`,
                getContainersDomain(args.domain).join("\n"),
            ].join("\n")

            const firstAnswer = await askQuestion(firstQuestion)
            if (!firstAnswer) {
                process.exit(1)
            }

            let secondQuestion = "Do you want to delete the shared folder also?"

            const secondAnswer = await askQuestion(secondQuestion)
            force = secondAnswer ? true : false

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
            deleteConfigurations(containerConfig, force)
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

        let containerName = getContainerName(args.alias ?? args.name, args.domain)
        let force = true
        // Questions
        if (!args.yes) {
            const answer = await askQuestion(`Do you want to delete ${containerName}?`)
            if (!answer) {
                process.exit(1)
            }

            force = false   // if yes not specified, force false by default

            // If last container, ask the question
            if (getContainersDomain(args.domain).length == 1) {
                const question = [
                    "Last container within domain detected",
                    "  Do you want to delete the shared folder also?",
                ].join("\n")

                const answer = await askQuestion(question)
                force = answer ? true : false
            }


        }
        let containerConfig = readContainerConfig(path.join(
            CONTAINER_CONFIG_DIR,
            args.domain,               // domain passed
            containerName
        ))
        lxcDelete(containerName)
        deleteConfigurations(containerConfig, force)
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
        nargs: 0,
        group: "Options"
    },
    "domain": {
        alias: 'd',
        describe: 'domain name for a group of containers',
        demand: false,
        type: 'string',
        nargs: 1,
        group: "Options"
    },
    "name": {
        alias: 'n',
        describe: 'container name',
        demand: false,
        type: 'string',
        nargs: 1,
        group: "Options"
    },
    "alias": {
        alias: 'a',
        describe: 'container alias',
        demand: false,
        type: 'string',
        nargs: 1,
        group: "Options"
    },
    "yes": {
        alias: "y",
        describe: "yes to questions",
        demand: false,
        type: "boolean",
        nargs: 0,
        group: "Options"
    },
}
