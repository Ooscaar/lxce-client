import * as fs from "fs"
import yargs from "yargs"


// Install function
function cmdPass(args: yargs.Arguments) {
    console.log("Not implemented")
    process.exit(1)

}


// ---------------------
// Yargs command options
// ---------------------
export const command = "pass"
export const describe = "Compute password from containers"
export const handler = cmdPass