#!/usr/bin/python3 
import sys


lxce_commands = {
    "install": "Install config files in default locations",
    "init": "Initialize files depends on config files",
    "launch": "Launch containers from a config file or a domain",
    "start": "Start a container that created before",
    "stop": "Stop a container",
    "delete": "Stop and remove a container along it's configuration files",
    "destroy": "NOT IMPLEMENTED-1",
    "proxy": "Stop current proxies and generate new ones from config file",
    "list": "Temporal list of containers",
    "pass": "NOT IMPLEMENTED-2",
    "show": "NOT IMPLEMENTED-3",
    "nginx": "NOT IMPLEMENTED-4",
    "man": "NOT IMPLEMENTED-5",
    "completion": "generate completion script"
}

lxce_options = {
    "--help": "Show help",
    "--version": "Show version number",
    "--names": "Names of the containers",
    "--range": "range of containers, e.g. -r 5", 
    "--domain": "Domain name for a group of containers",
    "--global": "Applied to all containers"
}

def parse(input):
   commands = ""
   for elem in input:
        try:
            # Add \n for parsing as lines
            if (elem.startswith("--")):
                commands += f'{elem}:{lxce_options[elem]}\n'
            else:
                commands += f'{elem}:{lxce_commands[elem]}\n'
        except:
            # Yargs default otherwhise
            commands += f'{elem}:NOT FOUND\n'
   print(commands)



if __name__ == "__main__":
    input = sys.argv[1:] 
    parse(input)
    exit(0)