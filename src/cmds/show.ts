import * as fs from "fs"
import yargs from "yargs"


// Install function
function cmdShow(args: yargs.Arguments) {
    console.log("Not implemented")
    process.exit(1)

}


// ---------------------
// Yargs command options
// ---------------------
export const command = "list"

export const describe = "Show containers configurations files"

export const handler = cmdShow

export const builder = {
    "global": {
        alias: "g",
        describe: "Apply to all containers",
        demand: false,
        type: "boolean",
        nargs: 0
    },
    "domain": {
        alias: 'd',
        describe: 'Domain name for a group of containers',
        demand: false,
        type: 'string',
        nargs: 1,
    },
    "name": {
        alias: 'n',
        describe: 'Container name',
        demand: false,
        type: 'string',
        nargs: 1,
    }
}
