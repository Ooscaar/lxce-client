import yargs from "yargs"


// Install function
function cmdMan(args: yargs.Arguments) {
    console.log("Not implemented")
    process.exit(1)

}


// ---------------------
// Yargs command options
// ---------------------
export const command = "man"

export const describe = "NOT IMPLEMENTED"

export const handler = cmdMan

