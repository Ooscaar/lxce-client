import yargs from "yargs";


yargs(process.argv.slice(2))
    .usage("Usage: $0 [command] <options> <flags>")
    .scriptName("lxce")
    .commandDir("cmds")
    .strict()
    //.completion()
    .demandCommand(1, "")  //demand 1 command and don't print
    .recommendCommands()
    .help()
    .alias("h", "help")
    .version()
    .alias("v", "version")
    .group(["version", "help"], "Flags")
    .argv

    // WARNING !!!
    // Don't use hear yargs.showHelp()
    // Some main commands are async (due to using inquirer)
    // and will result printing the help before the questions
    // yargs.showHelp() => demandCommand(1, "")


// TODO: maybe add here the exceptions handler
