import * as fs from "fs"
import yargs from "yargs"


// Install function
function cmdAlias(args: yargs.Arguments) {
    console.log("Not implemented")
    process.exit(1)

}

export const command = "alias"

export const describe = "Manage containers alias"

export const handler = cmdAlias