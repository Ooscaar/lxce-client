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


// Init function
async function cmdInit(args: any) {

    checkInit()

    const questions: inquirer.QuestionCollection = [
        {
            type: "input",
            name: "hostname",
            message: "lxce.conf: Select hypervisor hostname",
            validate: (answer) => {
                if (answer) {
                    // Check valid IP
                    if (answer.split(".").length !== 4) {
                        return "Please enter a valid hostname"
                    }

                    for (let block of answer.split(".")) {
                        if ((block < 0) || (block > 255)) {
                            return "Please enter a valid hostname"
                        }
                        continue
                    }
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
            type: "confirm",
            name: "bash",
            message: "Bash completion(TODO)"
        },
        {
            type: "confirm",
            name: "zsh",
            message: "Zsh completion(TODO)"
        }
    ]

    let containerConfig = CONTAINER_CONFIG_DEFAULT
    let lxceConfig = CONF_FILE_DATA

    const answers = await inquirer.prompt(questions)

    // Update defaults configurations files with answers
    containerConfig.base = answers.base

    lxceConfig.hypervisor.SSH_hostname = answers.hostname
    lxceConfig.hypervisor.SSH_suffix = answers.suffix
    lxceConfig.seed = generateSeed(SEED_LENGHT, SEED_ENCODING)

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


