import * as crypto from "crypto"
import * as util from "util"
import * as fs from "fs"
import * as child from "child_process"
import { error } from "console"
import path from "path"
import { CONTAINER_CONFIG_DIR, SSH_DIR } from "../constants"

// Constants
const exec = util.promisify(child.exec);


/**
 * Generate internal seed intented to operate
 * in each container
 *
 * @param bits
 * @param encoding
 */
export function generateSeed(bits: number, encoding: BufferEncoding): string {
    return crypto.randomBytes(bits).toString(encoding)

}

/**
 * Write JSON in path indicated syncronously
 * Throw exceptions if the file does not exists
 * https://github.com/sindresorhus/write-json-file/blob/main/index.js
 * TODO: rewrite description
 *
 * @param filePath
 * @param data
 * @param space
 * @param encoding
 */
export function writeJSON(filePath: string, data: any, space = 2, encoding = "utf8") {
    try {
        const file = fs.readFileSync(filePath)
    } catch (err) {
        // Everything except if file does not exists
        if (err.code !== "ENOENT") {
            console.log(err.code)
            throw err
        }
    }

    const json = JSON.stringify(data, null, space)
    fs.writeFileSync(filePath, json, encoding)
}

/**
 * Reads file and return json object
 * with utf-8 encoding by default
 *
 * @param filePath
 */
export function readJSON(filePath: string): any {
    try {
        // Must specify encoding to return string
        const file = fs.readFileSync(filePath, "utf-8")

        const json = JSON.parse(file)
        return json

    } catch(err) {
        throw err
    }
}



// Check all configurations files
// TODO: depending of folders structure
export function existAlias(argAlias: string | Array<string>): boolean {

    // To make the function more general
    // https://stackoverflow.com/questions/35749833/typescript-function-taking-one-or-array-of-objects
    let alias: Array<string> = []    
    alias = alias.concat(argAlias)
    console.log("[**] Debug: alias,", alias)
    let existingAlias: Array<string> = []

    const dirCont = fs.readdirSync(CONTAINER_CONFIG_DIR)

    for (const file of dirCont) {
        // It return relative paths
        let filePath = path.join(CONTAINER_CONFIG_DIR, file)
        let configFile = readJSON(filePath)
        existingAlias.push(configFile.alias)
    }
    console.log("[**] Debug: existing alias", existingAlias)

    for (const cAlias of alias) {
        if (existingAlias.includes(cAlias)) {
            console.log("[**] Debug: compare", cAlias)
            return true 
        }
    }

    return false

}


export function existName(name: string): boolean {
    const locations = fs.readdirSync(CONTAINER_CONFIG_DIR)
    return locations.includes(name)
}

// We don't check the existence of name
// as it should be checked before
export function getNamefromAlias(alias: string): string {
    for (const loc of fs.readdirSync(CONTAINER_CONFIG_DIR)) {
        let config = readJSON(
            path.join(CONTAINER_CONFIG_DIR, loc)
        )
        if (config.alias == alias) return loc
    }
    // For typescript message
    return ""

}

// Get container name from alias or name
// and exits the process in case of 
// not founding neither of them
export function getName(argsAlias: string, argsName: string): string {
    let name = ""
    if (argsAlias) {
        if (! existAlias(argsAlias)) {
            console.log(`[*] Alias ${argsAlias} does not exist`)
            process.exit(1)
        }
        name = getNamefromAlias(argsAlias)
    } else {
        if (! existName(argsName)) {
            console.log("[*] Name does not exist")
            process.exit(1)
        }
        name = argsName
    }
    return name
}

// Check if has access to configuations directories
// - Write
// TODO: add shared directories also?
export function checkAcces(): boolean {
    try {
        fs.accessSync(CONTAINER_CONFIG_DIR, fs.constants.W_OK)
        fs.accessSync(SSH_DIR, fs.constants.W_OK)
        return true
    } catch(err) {
        return false
    }

}