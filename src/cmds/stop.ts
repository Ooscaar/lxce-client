import { execSync } from "child_process"
import { getName } from "../utils/util"



function stopContainer(name: string) {
    let cmdStop = `lxc stop ${name}`
    let cmdShow = "lxc list"
    try {
        console.log(`[*] Debug: ${cmdStop}`)
        execSync(cmdStop)
        console.log("[*] Container ok !!")
    } catch(err) {
        console.error(err.message)
        process.exit(1)
    }
}


export function cmdStop(args: any) {

    // TODO: redoit with yargs capabilities
    if (! args.name && ! args.alias) {
        console.log("[*] Please select at least one option")
        process.exit(1)
    }
    if (args.name && args.alias) {
        console.log("[*] Please select name or alias")
        process.exit(1)
    }

    // Start
    let name: string = getName(args.alias, args.name)

    stopContainer(name)
    process.exit(0)

}