# LXCE API Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Data Structures & Interfaces](#data-structures--interfaces)
3. [Configuration Constants](#configuration-constants)
4. [Core Utility Functions](#core-utility-functions)
5. [CLI Commands](#cli-commands)
6. [Parser Utilities](#parser-utilities)
7. [Examples & Usage](#examples--usage)

---

## Project Overview

**LXCE (LXD Container Engine)** is a TypeScript CLI tool for managing LXD containers with specialized configurations including:
- Dockerized NGINX configurations
- ZFS partition with hypervisor mountpoints  
- SSH client configurations
- Domain-based container organization
- Automated proxy and networking setup

### Installation & Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Package as executable
npm run pkg
```

---

## Data Structures & Interfaces

### Core Interfaces

#### `LxceConfig`
Main configuration interface for the LXCE system.

```typescript
interface LxceConfig {
    hypervisor: Hypervisor,
    seed: string,
    domains: Domain[],
    locations: string[]
}
```

**Usage Example:**
```typescript
import { readLxceConfig } from './utils/util';

const config = readLxceConfig('/etc/lxce/lxce.conf');
console.log(config.hypervisor.SSH_hostname);
```

#### `ContainerConfig`
Configuration for individual containers.

```typescript
interface ContainerConfig {
    name: string,
    alias: string,
    user: string,
    id_domain: number,
    id_container: number,
    domain: string,
    base: string,
    userData: string,
    proxies: Proxy[],
    nginx: Nginx
}
```

**Usage Example:**
```typescript
import { readContainerConfig } from './utils/util';

const containerConfig = readContainerConfig('/etc/lxce/container.conf.d/default/container-name');
console.log(`Container: ${containerConfig.name}, User: ${containerConfig.user}`);
```

#### `Hypervisor`
SSH connection configuration for the hypervisor.

```typescript
interface Hypervisor {
    SSH_hostname: string,
    SSH_suffix: string
}
```

#### `Domain`
Domain configuration for organizing containers.

```typescript
interface Domain {
    id: number,
    name: string
}
```

#### `Proxy`
Network proxy configuration for containers.

```typescript
interface Proxy {
    name: string,
    type: string,
    listen: string,
    port: number
}
```

**Usage Example:**
```typescript
const sshProxy: Proxy = {
    name: 'ssh',
    type: 'tcp',
    listen: '0.0.0.0',
    port: 22
};
```

#### `Nginx`
NGINX configuration for containers.

```typescript
interface Nginx {
    novnc: number,
    www: number
}
```

#### `SSH`
SSH connection details for containers.

```typescript
interface SSH {
    name: string,
    domain: string,
    hostname: string,
    user: string,
    port: number,
    suffix: string,
    alias?: string
}
```

---

## Configuration Constants

### File Paths & Directories

```typescript
export const BASE_DIR = "/etc/lxce/"
export const SSH_DIR = BASE_DIR + 'ssh/'
export const SHARED_FOLDER = "/shared"
export const NGINX_PATH = "/opt/nginx/"
export const DOCKER_PATH = "/opt/nginx/docker-volumes/"
export const CONTAINER_CONFIG_DIR = BASE_DIR + 'container.conf.d/'
export const DEFAULT_CONTAINER_CONF_FILE = BASE_DIR + 'container_default.conf'
export const CONF_FILE = BASE_DIR + 'lxce.conf'
```

### System Limits

```typescript
export const MAX_DOMAINS = 10
export const MAX_CONTAINER_PER_DOMAIN = 100
export const MAX_PROXIES_PER_CONTAINER = 10
export const PASSWORD_LENGTH = 10
export const FIRST_PORT = 10000
export const UID = 1000
```

### Default Configurations

```typescript
export const CONF_FILE_DATA: LxceConfig = {
    "hypervisor": {
        "SSH_hostname": "",
        "SSH_suffix": "",
    },
    "seed": "",
    "domains": [
        {
            id: 0,
            name: "default"
        }
    ],
    "locations": [
        "/datasdd",
        "/datahdd"
    ]
}
```

---

## Core Utility Functions

### Cryptographic Functions

#### `generateSeed(bits: number, encoding: BufferEncoding): string`
Generate internal seed for container operations.

**Parameters:**
- `bits` - Number of random bits to generate
- `encoding` - Buffer encoding type (e.g., 'hex', 'base64')

**Returns:** Random seed string

**Example:**
```typescript
import { generateSeed } from './utils/util';

const seed = generateSeed(32, 'hex');
console.log(`Generated seed: ${seed}`);
```

#### `generatePassword(seed: string, name: string, user: string): string`
Compute container password based on seed, container name, and user.

**Parameters:**
- `seed` - Container seed
- `name` - Container name
- `user` - Container user

**Returns:** Generated password (truncated to PASSWORD_LENGTH)

**Example:**
```typescript
import { generatePassword } from './utils/util';

const password = generatePassword('myseed123', 'container-01', 'alice');
console.log(`Password for alice: ${password}`);
```

### Configuration Management

#### `readContainerConfig(filePath: string): ContainerConfig`
Read and parse container configuration from JSON file.

**Parameters:**
- `filePath` - Path to container configuration file

**Returns:** Parsed ContainerConfig object

**Throws:** Error if file doesn't exist or JSON is invalid

**Example:**
```typescript
import { readContainerConfig } from './utils/util';

try {
    const config = readContainerConfig('/etc/lxce/container.conf.d/default/mycontainer');
    console.log(`Container domain: ${config.domain}`);
} catch (error) {
    console.error('Failed to read config:', error.message);
}
```

#### `readLxceConfig(filePath: string): LxceConfig`
Read and parse main LXCE configuration file.

**Parameters:**
- `filePath` - Path to LXCE configuration file

**Returns:** Parsed LxceConfig object

**Example:**
```typescript
import { readLxceConfig, CONF_FILE } from './utils/util';

const lxceConfig = readLxceConfig(CONF_FILE);
console.log(`SSH hostname: ${lxceConfig.hypervisor.SSH_hostname}`);
```

#### `writeContainerConfig(filePath: string, containerConfig: ContainerConfig, encoding?: string): void`
Write container configuration to JSON file.

**Parameters:**
- `filePath` - Output file path
- `containerConfig` - Configuration object to write
- `encoding` - File encoding (default: 'utf-8')

**Example:**
```typescript
import { writeContainerConfig } from './utils/util';

const config: ContainerConfig = {
    name: 'test-container',
    alias: 'test',
    user: 'ubuntu',
    // ... other properties
};

writeContainerConfig('/etc/lxce/container.conf.d/default/test-container', config);
```

#### `writeLxceConfig(filePath: string, lxceConfig: LxceConfig, encoding?: string): void`
Write main LXCE configuration to JSON file.

#### `writeSSHConfig(filePath: string, sshConfig: string, encoding?: string): void`
Write SSH configuration to file.

### Domain Management

#### `addDomain(domain: string): void`
Add a new domain to the LXCE configuration.

**Parameters:**
- `domain` - Domain name to add

**Example:**
```typescript
import { addDomain } from './utils/util';

addDomain('development');
```

#### `deleteDomain(domain: string): void`
Remove a domain from the LXCE configuration.

#### `getDomainId(domain: string): number | undefined`
Get the numeric ID for a domain.

**Parameters:**
- `domain` - Domain name

**Returns:** Domain ID or undefined if not found

#### `getDomains(): string[]`
Get list of all current domains.

**Returns:** Array of domain names

**Example:**
```typescript
import { getDomains } from './utils/util';

const domains = getDomains();
console.log('Available domains:', domains);
```

#### `getContainersDomain(domain: string): string[]`
Get all container names from a specific domain.

**Parameters:**
- `domain` - Domain name

**Returns:** Array of container names

#### `getContainersAll(): string[]`
Get all container names from all domains.

**Returns:** Array of all container names

### Container Management

#### `getContainerName(argsName: string, domain: string): string`
Resolve container name from name or alias within a domain.

**Parameters:**
- `argsName` - Container name or alias
- `domain` - Container domain

**Returns:** Actual container name

#### `getUserContainer(name: string): string`
Get the user of an existing running container.

**Parameters:**
- `name` - Container name

**Returns:** Username

### Validation Functions

#### `checkInitialized(): boolean`
Check if LXCE has been properly initialized.

**Returns:** true if initialized, false otherwise

**Example:**
```typescript
import { checkInitialized } from './utils/util';

if (!checkInitialized()) {
    console.log('Run lxce install && init first');
    process.exit(1);
}
```

#### `checkDefaultConfig(): boolean`
Validate default configuration parameters.

#### `checkDomain(domain: string): boolean`
Check if a domain exists.

#### `checkBase(base: string): boolean`
Check if an LXC base image exists.

#### `checkContainerConfig(name: string): boolean`
Validate container-specific configuration.

#### `checkAccess(): boolean`
Check write permissions to configuration directories.

#### `existAlias(argAlias: string | Array<string>, domain: string): boolean`
Check if alias exists within a domain.

#### `existName(name: string, domain: string): boolean`
Check if container name exists within a domain.

### LXC Operations

#### `lxcLaunch(name: string, base: string): void`
Launch LXC container with specified base image.

**Parameters:**
- `name` - Container name
- `base` - Base image name

**Example:**
```typescript
import { lxcLaunch } from './utils/util';

lxcLaunch('my-container', 'ubuntu:20.04');
```

#### `lxcStart(name: string): void`
Start LXC container.

#### `lxcStop(name: string): void`
Stop LXC container.

#### `lxdRestart(name: string): void`
Restart LXC container.

#### `lxcDelete(name: string): void`
Force delete LXC container.

#### `lxcWait(name: string): void`
Wait until container is fully initialized.

#### `lxdDNS(name: string): void`
Perform DNS resolution test inside container.

#### `lxcExec(name: string, command: string): void`
Execute command inside container.

**Parameters:**
- `name` - Container name
- `command` - Command to execute

**Example:**
```typescript
import { lxcExec } from './utils/util';

lxcExec('my-container', 'apt update && apt install -y nginx');
```

#### `lxcProxy(name: string, hostPort: number, hostname: string, proxy: Proxy): void`
Add proxy configuration to container.

#### `lxcDeviceAdd(containerName: string, deviceName: string, hostPath: string, user: string): void`
Add host directory to container.

#### `lxdDeviceRemove(containerName: string, deviceName: string): void`
Remove device from container.

#### `lxcDeviceList(name: string): string[]`
List devices in container.

#### `lxcPassword(name: string, user: string, password: string): void`
Set password for user in container.

### Git Operations

#### `gitInit(path: string): void`
Initialize git repository at specified path.

#### `gitCommit(path: string, message: string): void`
Commit all changes in git repository.

**Example:**
```typescript
import { gitCommit } from './utils/util';

gitCommit('/etc/lxce/ssh', 'Added new container configuration');
```

### Interactive Functions

#### `askQuestion(questionMessage: string): Promise<boolean>`
Display interactive confirmation prompt.

**Parameters:**
- `questionMessage` - Question to display

**Returns:** Promise resolving to user's boolean response

**Example:**
```typescript
import { askQuestion } from './utils/util';

const confirmed = await askQuestion('Are you sure you want to delete this container?');
if (confirmed) {
    // Proceed with deletion
}
```

---

## CLI Commands

### Main Command Structure

All commands follow the pattern:
```bash
lxce [command] [options] [flags]
```

Common flags:
- `--verbose, -v` - Enable verbose logging
- `--help, -h` - Show help
- `--version` - Show version

### `lxce install`
Install config files and create default locations.

**Example:**
```bash
lxce install
```

### `lxce init`
Initialize configuration files and apply settings.

**Example:**
```bash
lxce init
```

### `lxce launch`
Launch containers from configuration or domain.

**Options:**
- `-d, --domain <name>` - Domain name (required)
- `-r, --range <number>` - Number of containers (default: 1)
- `-n, --names <array>` - Container names
- `-a, --aliases <array>` - Container aliases

**Examples:**
```bash
# Launch one container in default domain
lxce launch -d default

# Launch 3 containers with random names
lxce launch -d fullstack -r 3

# Launch containers with specific names
lxce launch -d fullstack -r 3 -n backend frontend database

# Launch with names and aliases
lxce launch -d fullstack -r 3 -n backend frontend database -a api web db
```

### `lxce start`
Start existing containers.

**Options:**
- `-n, --name <name>` - Container name
- `-d, --domain <name>` - Domain name
- `-R, --range <start-end>` - Range of containers

**Examples:**
```bash
# Start specific container
lxce start -n backend-01

# Start all containers in domain
lxce start -d fullstack

# Start range of containers
lxce start -d fullstack -R 01-03
```

### `lxce stop`
Stop running containers.

**Options:** Same as `start`

**Examples:**
```bash
lxce stop -n backend-01
lxce stop -d fullstack
lxce stop -R 00-02
```

### `lxce delete`
Stop and remove containers and their configurations.

**Options:** Same as `start`

**Examples:**
```bash
lxce delete -n backend-01
lxce delete -d fullstack
lxce delete -d fullstack -R 01-03
```

### `lxce destroy`
Delete all resources including volumes and nginx configurations.

**Options:** Same as `delete`

**Examples:**
```bash
lxce destroy -n backend-01
lxce destroy -d fullstack
lxce destroy  # Destroy everything
```

### `lxce proxy`
Manage container proxy configurations.

**Options:**
- `-n, --name <name>` - Container name

**Example:**
```bash
lxce proxy -n backend-01
```

### `lxce pass`
Display or manage container passwords.

**Options:**
- `-n, --name <name>` - Container name
- `-u, --user <user>` - Specific user
- `-q, --quiet` - Only show passwords

**Examples:**
```bash
# Show passwords for alice and bob
lxce pass -n backend-01

# Show only passwords
lxce pass -n backend-01 -q

# Show password for specific user
lxce pass -n backend-01 -u alice
```

### `lxce show`
Display container information and configurations.

**Options:**
- `-g, --global` - Show all containers
- `-d, --domain <name>` - Domain name
- `-n, --name <name>` - Container name
- `-a, --alias <alias>` - Container alias
- `-e, --extra` - Show extra information

**Examples:**
```bash
# Show all containers
lxce show --global

# Show containers in domain
lxce show -d fullstack

# Show specific container
lxce show -d fullstack -n backend-01

# Show by alias
lxce show -d fullstack -a api
```

### `lxce alias`
Manage container aliases.

#### `lxce alias set`
Set alias for container.

**Options:**
- `-d, --domain <name>` - Domain name (required)
- `-n, --name <name>` - Container name (required)
- `-a, --alias <alias>` - New alias (required)

**Example:**
```bash
lxce alias set -d fullstack -n backend-01 -a api
```

#### `lxce alias unset`
Remove alias from container.

**Options:**
- `-d, --domain <name>` - Domain name (required)
- `-n, --name <name>` - Container name
- `-a, --alias <alias>` - Alias to remove

**Examples:**
```bash
lxce alias unset -d fullstack -n backend-01
lxce alias unset -d fullstack -a api
```

### `lxce nginx`
Manage dockerized nginx and certificates.

**Options:**
- `--start` - Start nginx
- `--stop` - Stop nginx
- `--restart` - Restart nginx
- `--reload` - Reload nginx
- `--purge` - Remove orphaned configs
- `-l, --list` - List config files
- `--filter <name>` - Filter by container

**Examples:**
```bash
lxce nginx --start
lxce nginx --reload
lxce nginx --purge
lxce nginx -l
```

### `lxce man`
Show manual pages.

**Options:**
- `-f, --filter <command>` - Show specific command documentation

**Examples:**
```bash
lxce man
lxce man -f launch
```

---

## Parser Utilities

### `Convert` Class
Handles JSON serialization/deserialization with runtime type checking.

#### `Convert.toLxceConfig(json: string): LxceConfig`
Parse JSON string to LxceConfig object.

#### `Convert.lxceConfigToJson(value: LxceConfig): string`
Convert LxceConfig object to JSON string.

#### `Convert.toContainerConfig(json: string): ContainerConfig`
Parse JSON string to ContainerConfig object.

#### `Convert.containerConfigToJson(value: ContainerConfig): string`
Convert ContainerConfig object to JSON string.

**Example:**
```typescript
import { Convert } from './utils/parser';

const jsonString = '{"name": "test", "domain": "default", ...}';
const config = Convert.toContainerConfig(jsonString);

const backToJson = Convert.containerConfigToJson(config);
```

---

## Examples & Usage

### Complete Container Lifecycle

```typescript
import { 
    checkInitialized, 
    addDomain, 
    lxcLaunch, 
    lxcWait,
    generatePassword,
    lxcPassword,
    lxcStart,
    lxcStop,
    lxcDelete 
} from './utils/util';

// Check system is initialized
if (!checkInitialized()) {
    throw new Error('System not initialized');
}

// Add new domain
addDomain('production');

// Launch container
const containerName = 'web-server-01';
const baseImage = 'ubuntu:20.04';

lxcLaunch(containerName, baseImage);
lxcWait(containerName);

// Set password
const password = generatePassword('myseed', containerName, 'ubuntu');
lxcPassword(containerName, 'ubuntu', password);

// Container is ready
console.log(`Container ${containerName} is ready with password: ${password}`);

// Later: stop and cleanup
lxcStop(containerName);
lxcDelete(containerName);
```

### Batch Container Management

```bash
# Launch development environment
lxce launch -d development -r 3 -n frontend backend database -a web api db

# Start all development containers
lxce start -d development

# Show all development containers
lxce show -d development

# Get passwords
lxce pass -n frontend -q
lxce pass -n backend -q
lxce pass -n database -q

# Stop all when done
lxce stop -d development
```

### Configuration Management

```typescript
import { readLxceConfig, writeLxceConfig, CONF_FILE } from './utils/util';

// Read current config
const config = readLxceConfig(CONF_FILE);

// Add new location
config.locations.push('/mnt/new-storage');

// Add new domain
config.domains.push({
    id: config.domains.length,
    name: 'testing'
});

// Save changes
writeLxceConfig(CONF_FILE, config);
```

### Custom Proxy Configuration

```typescript
import { ContainerConfig, Proxy } from './interfaces/interfaces';

const customProxies: Proxy[] = [
    {
        name: 'ssh',
        type: 'tcp',
        listen: '0.0.0.0',
        port: 22
    },
    {
        name: 'web',
        type: 'tcp', 
        listen: '0.0.0.0',
        port: 80
    },
    {
        name: 'https',
        type: 'tcp',
        listen: '0.0.0.0', 
        port: 443
    }
];

// Apply to container config
const containerConfig: ContainerConfig = {
    // ... other properties
    proxies: customProxies
};
```

---

## Error Handling

Most functions will throw errors or exit the process on failure. Wrap critical operations in try-catch blocks:

```typescript
try {
    const config = readContainerConfig('/path/to/config');
    // Process config
} catch (error) {
    console.error('Failed to read configuration:', error.message);
    // Handle error appropriately
}
```

For CLI commands, most errors are handled internally and will display appropriate error messages before exiting.

---

## Security Considerations

- All passwords are generated using SHA-256 hashing
- SSH configurations are automatically managed
- Container isolation is maintained through LXD
- File permissions are checked before operations
- Git versioning tracks configuration changes

---

## Development & Contributing

### Building

```bash
npm run build
```

### Testing Configuration

```bash
# Test with verbose output
lxce --verbose [command]

# Check initialization
lxce show --global
```

### Extending Commands

Commands follow the yargs pattern in `src/cmds/`. Each command exports:
- `command` - Command name
- `describe` - Command description  
- `handler` - Command function
- `builder` - Yargs options configuration

Example new command structure:
```typescript
export const command = "newcommand"
export const describe = "Description of new command"
export const handler = (args: any) => {
    // Command implementation
}
export const builder = (yargs: any) => {
    // Yargs configuration
}
```