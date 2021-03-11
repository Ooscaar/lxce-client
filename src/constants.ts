import { ContainerConfig, LxceConfig } from "./interfaces/interfaces"
// ------------------------
// Configurations constants
// ------------------------
export const UPC = '.upc.edu';
export const rsa_key_size = 4096
export const PASSWORD_LENGTH = 10;
export const SEED_LENGHT = 8
export const SEED_ENCODING = "hex"

export const MAX_DOMAINS = 10
export const MAX_CONTAINER_PER_DOMAIN = 100
export const MAX_PROXIES_PER_CONTAINER = 10

export const UID = 1000
export const FIRST_PORT = 10000

export const EMAIL = "jose.luis.munoz@upc.edu"; // Email for nginx certificates

export const BASE_DIR = "/etc/lxce/"
export const SSH_DIR = BASE_DIR + 'ssh/';
export const SHARED_FOLDER = "/shared"
export const NGINX_PATH = "/opt/nginx/"
export const DOCKER_PATH = "/opt/nginx/docker-volumes/";
export const CONTAINER_CONFIG_DIR = BASE_DIR + 'container.conf.d/';
export const DEFAULT_CONTAINER_CONF_FILE = BASE_DIR + 'container_default.conf';
export const CONF_FILE = BASE_DIR + 'lxce.conf';
export const CONF_FILE_DATA: LxceConfig = {
    "hypervisor":
    {
        "SSH_hostname": "",
        "SSH_suffix": "",
    },
    "seed": "",
    "domains":
        [
            "default",
        ],
    "locations":
        [
            "/datasdd",
            "/datahdd"
        ],
};

export const LXCE_DIR = "lxce/";
export const CONTAINER_CONFIG_DEFAULT: ContainerConfig = {   // save in DEFAULT_CONTAINER_CONF_FILE
    name: "",
    alias: "",
    user: "",
    id_domain: 0,
    id_container: 0,
    domain: 'default',                        // Domain name for the container
    base: 'ubuntu:20.04',                     // Base name in lxc launch
    userData: CONF_FILE_DATA.locations[0],    // /datahdd/lxce
    proxies: [
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


// ---------------------------
// Random names configurations
// ---------------------------
import { Config as NamesConfig, adjectives, colors, animals } from 'unique-names-generator';

export const NAMES_CONFIG: NamesConfig = {
    dictionaries: [adjectives, colors],
    separator: '-',
    length: 2,
};


// ---------------------------
// Table configurations
// ---------------------------
export const tableConfig = {
    border: {
        topBody: `-`,
        topJoin: `+`,
        topLeft: `+`,
        topRight: `+`,

        bottomBody: `-`,
        bottomJoin: `+`,
        bottomLeft: `+`,
        bottomRight: `+`,

        bodyLeft: `|`,
        bodyRight: `|`,
        bodyJoin: `|`,

        joinBody: `-`,
        joinLeft: `+`,
        joinRight: `+`,
        joinJoin: `+`
    },
}

