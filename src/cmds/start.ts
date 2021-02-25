import { execSync } from "child_process"
import { getName } from "../utils/util"



function startContainer(name: string) {
    let cmdStart = `lxc start ${name}`
    let cmdShow = "lxc list"
    try {
        console.log(`[*] Debug: ${cmdStart}`)
        execSync(cmdStart)
        console.log("[*] Container ok !!")
    } catch(err) {
        console.error(err.message)
        process.exit(1)
    }
}


export function cmdStart(args: any) {

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

    startContainer(name)
    process.exit(0)

}
