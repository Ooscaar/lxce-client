import * as crypto from "crypto"
import * as util from "util"
import * as fs from "fs"
import * as child from "child_process"
import { error } from "console"

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


/**
 * Exec commands and print outputs
 *
 * @param command
 * @param dry
 * @param debug
 */
export async function cmd(command: string, dry = false, debug = false) {
    try {
        if (dry) console.log("DRY: " + command);
        else {
            const { stdout, stderr } = await exec(command);
            if (debug) console.log('Exec: ' + command);
            if (stdout) console.log(stdout);
            if (stderr) console.log(stderr);
        }
    } catch (err) {
        //console.error(error(err));
        // TODO: implement with error
        console.log(error)
    }
}
