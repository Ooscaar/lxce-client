import log from "loglevel"
import yargs from "yargs"
import { bashCompletion, zshCompletion } from "../completions/completions"

// Install function
function cmdCompletion(args: yargs.Arguments) {
    if (args.shell == "bash") {
        log.info(bashCompletion)
    } else if (args.shell == "zsh") {
        log.info(zshCompletion)
    } else {
        log.info("Unsupported shell")
        process.exit(1)
    }

}


// ---------------------
// Yargs command options
// ---------------------
export const command = "completion"

export const describe = "Output completions scripts"

export const handler = cmdCompletion

export const builder = (yargs: any) => {
    yargs.usage("$0 completion -s {bash, zsh}")
    yargs.option("shell", {
        alias: "s",
        describe: "Select shell",
        demand: true,
        type: "string",
        nargs: 1,
        group: "Options",
        choices: ["bash", "zsh"]
    })
}

