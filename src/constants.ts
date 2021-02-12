
// Configurations constants
export const UPC = '.upc.edu';
export const rsa_key_size = 4096
export const PASSWORD_LENGTH = 10;
export const EMAIL = "jose.luis.munoz@upc.edu"; // Email for nginx certificates
export const BASE_DIR = "/etc/lxce/";
export const SSH_DIR = BASE_DIR + 'ssh/';
export const NGINX_PATH = "/opt/nginx/"
export const DOCKER_PATH = "/opt/nginx/docker-volumes/";
export const CONTAINER_CONFIG_DIR = BASE_DIR + 'container.conf.d/';
export const DEFAULT_CONTAINER_CONF_FILE = BASE_DIR + 'container_default.conf';
export const CONF_FILE = BASE_DIR + 'lxce.conf';
export const CONF_FILE_DATA = {
  "hypervisor":
  {
    "SSH_hostname": "",
    "SSH_suffix": ""
  },
  "seed": "",
  "domains":
    [
      "default",
    ],
  "locations":
    [
      "/home/user/datassd/",
      "/home/user/datahdd/"
    ],
};

export const LXCE_DIR = "lxce/";
export const CONTAINER_CONFIG_DEFAULT = {          // save in DEFAULT_CONTAINER_CONF_FILE
  //id: 0,                                  // Identifier from 0 to 99. Autocomputed if empty.
  domain: 'default',                        // Domain name for the container
  alias: '',
  base: 'ubuntu:20.04',                     // Base name in lxc launch
  aliceData: CONF_FILE_DATA.locations[0],   // /datahdd/lxce -> 
  bobData: CONF_FILE_DATA.locations[0],     // 
  proxy: [
    {
      name: 'ssh',                          // Name of the proxy rule
      type: 'tcp',                          // tcp / upd
      listen: '0.0.0.0',                    // IP to listen in the host, typicaly (0.0.0.0 / 127.0.0.1)
      port: 22,                             // Host port DD-CC-P (10000) goes to container_name.lxd:22 -> DD is domain number (e.g. 10), CC is container number (e.g. 00) and P is port (e.g. 0)
    },
    {
      name: 'test',                         // Name of the proxy rule
      type: 'tcp',                          // tcp / upd
      listen: '0.0.0.0',                    // IP to listen in the host, typicaly (0.0.0.0 / 127.0.0.1)
      port: 3000,                           // Host port DD-CC-P (10001) goes to container_name.lxd:3000
    }
  ],
  nginx: {
    novnc: 7000,
    www: 80,
  },

};

// Command options
export const configFile = {
  alias: 'c',
  describe: 'File with the definitions of a container',
  demand: false,
  type: 'string',
  nargs: 1,
};
export const name = {
  alias: 'n',
  describe: 'Name of the container',
  demand: false,
  type: 'string',
  nargs: 1,
};
export const aliasname = {
  alias: 'a',
  describe: 'Alias name of the container',
  demand: false,
  type: 'string',
  nargs: 1,
};
export const quiet = {
  alias: 'q',
  describe: 'Quiet mode',
  demand: false,
  type: 'boolean',
};
export const user = {
  alias: 'u',
  describe: 'User to compute password. Default: alice and bob',
  demand: false,
  type: 'string',
  nargs: 1,
};
export const domain = {
  alias: 'd',
  describe: 'Domain name for a group of containers',
  demand: false,
  type: 'string',
  nargs: 1,
};
export const range = {
  alias: 'r',
  describe: 'range of containers, e.g. -r 5 ',
  demand: false,
  type: 'string',
  nargs: 1,
};
export const Range = {
  alias: 'R',
  describe: 'Range of containers, e.g. -R 0-5 or 0-5',
  demand: false,
  type: 'string',
  nargs: 1,
};
export const force = {
  alias: 'f',
  describe: 'Force changes ',
  demand: false,
  type: 'boolean',
};
export const find = {
  describe: 'Find an item ',
  demand: false,
  type: 'string',
  nargs: 1,
};
export const list = {
  alias: 'l',
  describe: 'list of items',
  demand: false,
  type: 'boolean',
};
export const debug = {  // executes commands and provides a verbose output
  describe: 'Debug mode. Verbose output ',
  demand: false,
  type: 'boolean',
};
export const remove = {   // dry run shows the commands without executing any
  alias: 'rm',
  describe: 'remove an item',
  demand: false,
  type: 'string',
  nargs: 1,
};
export const dry = {   // dry run shows the commands without executing any
  describe: 'Dry run of the command',
  demand: false,
  type: 'boolean',
};
export const yes = {
  alias: 'y',
  describe: 'yes answer to questions',
  demand: false,
  type: 'boolean',
};
export const start = {
  describe: 'Start dockerized nginx',
  demand: false,
  type: 'boolean',
};
export const stop = {
  describe: 'Stop dockerized nginx',
  demand: false,
  type: 'boolean',
};
export const restart = {
  describe: 'Restart dockerized nginx',
  demand: false,
  type: 'boolean',
};
export const reload = {
  describe: 'Reload dockerized nginx',
  demand: false,
  type: 'boolean',
};
export const purge = {
  describe: 'Remove config files and certificates that do not have an asociated lxce container',
  demand: false,
  type: 'boolean',
};
export const filter = {
  alias: 'F',
  describe: 'List config files and certs for ContainerName',
  demand: false,
  type: 'string',
  nargs: 1,
};