import yargs from "yargs";


// ------------------------
// Command options
// Need to be declared before yargs parser
// ------------------------
const name: yargs.Options = {
    alias: 'n',
    describe: 'Name of the container',
    demand: false,
    type: 'string',
    nargs: 1,
};

const nameDemand: yargs.Options = {
    alias: 'n',
    describe: 'Name of the container',
    demand: false,
    type: 'string',
    nargs: 1,
};

const nameArray: yargs.Options = {
    alias: 'n',
    describe: 'Names of the containers',
    demand: false,
    type: 'array',
};

const alias: yargs.Options = {
    alias: 'a',
    describe: 'Alias name of the container',
    demand: false,
    type: 'array',
};
const quiet: yargs.Options = {
    alias: 'q',
    describe: 'Quiet mode',
    demand: false,
    type: 'boolean',
};
const domainDemand: yargs.Options = {
    alias: 'd',
    describe: 'Domain name for a group of containers',
    demand: true,
    type: 'string',
    nargs: 1,
};

const domainNoDemand: yargs.Options = {
    alias: 'd',
    describe: 'Domain name for a group of containers',
    demand: false,
    type: 'string',
    nargs: 1,
};

const range: yargs.Options = {
    alias: 'r',
    describe: 'range of containers, e.g. -r 5 ',
    demand: false,
    default: 1,
    type: 'number',
    nargs: 1,
};
const global: yargs.Options = {
    alias: "g",
    describe: "Applied to all containers",
    demand: false,
    type: "boolean",
    nargs: 0
}

const debug: yargs.Options = {  // executes commands and provides a verbose output
    describe: 'Debug mode. Verbose output ',
    demand: false,
    type: 'boolean',
};

const yes: yargs.Options = {
    alias: 'y',
    describe: 'yes answer to questions',
    demand: false,
    type: 'boolean',
};



/******************************************/
// Command line parsing
/******************************************/
// yargs(process.argv.slice(2))
//     .usage("Usage: $0 <command> [options]")
//     .command({
//         command: "install",
//         describe: "Install config files in default locations",
//         handler: cmdInstall
//     })
//     .command({
//         command: "init",
//         describe: "Initialize files depends on config files",
//         handler: cmdInit
//     })
//     .command({
//         command: "launch",
//         describe: "Launch containers from a config file or a domain",
//         builder: {
//             "names": nameArray,
//             range,
//             domain: domainDemand,
//         },
//         handler: cmdLaunch,




//     })
//     .command({
//         command: "start",
//         describe: "Start a container that created before",
//         builder: {
//             global,
//             "domain": domainNoDemand,
//             name,
//         },
//         handler: cmdStart
//     })
//     .command({
//         command: "stop",
//         describe: "Stop a container",
//         builder: {
//             global,
//             "domain": domainNoDemand,
//             name,
//         },
//         handler: cmdStop
//     })
//     .command({
//         command: "delete",
//         describe: "Stop and remove a container along it's configuration files",
//         builder: {
//             name: nameDemand,
//             domain: domainDemand
//         },
//         handler: cmdDelete
//     })
//     .command({
//         command: "destroy",
//         describe: "NOT IMPLEMENTED",
//         //describe: "Same as delete but also remove read only directories ?????",
//         builder: {
//             name,
//             range,
//             alias,

//         },
//         handler: cmdDestroy
//     })
//     .command({
//         command: "proxy",
//         describe: "Stop current proxies and generate new ones from config file",
//         builder: {
//             global,
//             "domain": domainNoDemand,
//             name,
//         },
//         handler: cmdProxy
//     })
//     .command({
//         command: "list",
//         describe: "Temporal list of containers",
//         builder: {
//         },
//         handler: cmdList
//     })
//     .command(
//         "pass",
//         "NOT IMPLEMENTED",
//         //"Computes the passwords of a container",
//         {

//         },
//         cmdPass
//     )
//     .command(
//         "show",
//         "NOT IMPLEMENTED",
//         //"Show information about containers",
//         {

//         },
//         cmdShow
//     )
//     .command(
//         "nginx",
//         "NOT IMPLEMENTED",
//         //"Manage nginx, their confile files and certbot certificates",
//         {

//         },
//         cmdNginx
//     )
//     .command(
//         "man",
//         "NOT IMPLEMENTED",
//         //"Show manuals and detailed functionalities of the command",
//         (yargs) => {
//             yargs.usage("Usage: \n $0 man <option> hjhfdsjkahfjkdsahjfdshfsd")
//             yargs.option("tail", {
//                 description: "nfdsiajfjhsdjkfhds",
//                 default: "all",
//                 alias: "a",
//                 type: "string",
//                 group: "Flags"
//             })
//         },
//         cmdMan
//     )
//     .strict()
//     .completion()
//     .help()
//     .alias('h', 'help',)
//     .alias('v', 'version')
//     .help()
//     .recommendCommands()
//     .group(["version", "help"], "Global options")
//     .argv;
// yargs.showHelp()

yargs(process.argv.slice(2))
    .usage("Usage: $0 [command] <options> <flags>")
    .commandDir("cmds")
    .strict()
    .completion()
    .demandCommand(1, "")  //demand 1 command and don't print
    .recommendCommands()
    .help()
    .alias("h", "help")
    .version("v", "version")
    .alias("v", "version")
    .group(["version", "help"], "Flags")
    .argv

    // WARNING !!!
    // Don't use hear yargs.showHelp()
    // Some main commands are async (due to using inquirer)
    // and will result printing the help before the questions


