import * as fs from "fs"
import path from "path"
import inquirer from "inquirer"

import {
    CONF_FILE,
    CONTAINER_CONFIG_DIR,
    DEFAULT_CONTAINER_CONF_FILE,
    SSH_DIR,
    BASE_DIR,
    CONTAINER_CONFIG_DEFAULT,
    CONF_FILE_DATA,
    SEED_LENGHT,
    SEED_ENCODING
} from "../constants"

import {
    checkBase,
    generateSeed,
    gitInit,
    writeContainerConfig,
    writeLxceConfig
} from "../utils/util"

import {
    ContainerConfig,
    LxceConfig
} from "../interfaces/interfaces"
import { execSync } from "child_process"
import log from "loglevel"
import { Convert } from "../utils/parser"



// Check permission and if lxce init has been
// already executed
function checkInit() {

    if (fs.existsSync(BASE_DIR)) {
        console.log(`[*] Existing configuration folder detected at ${BASE_DIR}`)
        console.log(`[*] Use lxce uninstall`)
        process.exit(1)
    }

    try {
        fs.accessSync(path.dirname(BASE_DIR), fs.constants.W_OK)
    } catch (err) {
        console.log(`[*] Error: don't have permissions on ${BASE_DIR}`)
        process.exit(1)
    }

}

function init(containerConfig: ContainerConfig, lxceConfig: LxceConfig) {

    // First create parent folder (BASE_DIR)
    // as writeContainerConfig will fail is
    // parent folder is missing
    fs.mkdirSync(BASE_DIR)

    writeContainerConfig(DEFAULT_CONTAINER_CONF_FILE, containerConfig)

    // Generate seed
    writeLxceConfig(CONF_FILE, lxceConfig)

    fs.mkdirSync(CONTAINER_CONFIG_DIR)
    fs.mkdirSync(SSH_DIR)

    gitInit(SSH_DIR)

}

// Ask for locations until no more are demanded
async function askLocations(questions: inquirer.QuestionCollection) {
    let locations: string[] = []
    let askAgain = true

    // Ask until no more questions (askAgain=false)
    while (askAgain) {
        const answer = await inquirer.prompt(questions)
        if (!locations.includes(answer.locations)) {
            locations.push(answer.location)
        }
        askAgain = answer.askAgain
    }

    return locations
}

// Init function
async function cmdInit(args: any) {

    checkInit()

    const lxceQuestions: inquirer.QuestionCollection = [
        {
            type: "input",
            name: "hostname",
            message: "lxce.conf: Select hypervisor hostname",
            validate: (answer) => {
                if (answer) {
                    return true
                }

                return "Please enter a valid hostname"
            }
        },
        {
            type: "input",
            name: "suffix",
            message: "lxce.conf: Select ssh suffix",
            validate: (answer) => {
                if (answer) {
                    return true
                }

                return "Please enter a valid suffix"
            }
        },
    ]


    // recursively locations questions
    const locationsQuestions: inquirer.QuestionCollection = [
        {
            type: "input",
            name: "location",
            message: "lxce.conf: Select data location [full path]",
            validate: (answer) => {
                // answer is the full response
                // no object
                if (answer) {
                    if (fs.existsSync(answer)) {
                        return true
                    }

                    return `${answer} does not exist`

                }

                return "Please enter a valid location"
            }

        },
        {
            type: 'confirm',
            name: 'askAgain',
            message: 'Want to add another data location (just hit enter for YES)?',
            default: true,
        },
    ]

    // Set values from answers provided
    let containerConfig = CONTAINER_CONFIG_DEFAULT
    let lxceConfig = CONF_FILE_DATA

    // Questions logic
    // - first ask the lxce.conf (last one recursively)
    // - second ask for the default container conf
    //   using some default values from before
    const lxceAnswers = await inquirer.prompt(lxceQuestions)
    const locations = await askLocations(locationsQuestions)

    // 1
    lxceConfig.hypervisor.SSH_hostname = lxceAnswers.hostname
    lxceConfig.hypervisor.SSH_suffix = lxceAnswers.suffix
    lxceConfig.seed = generateSeed(SEED_LENGHT, SEED_ENCODING)
    lxceConfig.locations = locations

    // 2
    const containerQuestions: inquirer.QuestionCollection = [
        {
            type: "input",
            name: "base",
            message: "container.default: Select containers base",
            default: CONTAINER_CONFIG_DEFAULT.base,
            validate: (answer) => {
                if (answer) {
                    if (checkBase(answer)) {
                        return true
                    }

                    return "Base does not exist"
                }

                return "Please enter a valid base"
            }
        },
        {
            type: "list",
            name: "location",
            message: "container.default: Select default container location",
            choices: locations
        }
    ]
    const containerAnswers = await inquirer.prompt(containerQuestions)

    containerConfig.base = containerAnswers.base
    containerConfig.userData = containerAnswers.location


    init(containerConfig, lxceConfig)

    console.log("[*] Good!!")
    process.exit(0)

}


// ---------------------
// Yargs command options
// ---------------------
export const command = "init"

export const describe = "Initialize lxce command"

export const handler = cmdInit

export const builder = (yargs: any) => {
    yargs.usage("Usage: $0 init <flags>")
}


