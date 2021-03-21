export interface LxceConfig {
    hypervisor: Hypervisor,
    seed: string,
    domains: Domain[],
    locations: string[],
}

export interface Hypervisor {
    SSH_hostname: string,
    SSH_suffix: string
}

export interface Domain {
    id: number,
    name: string
}

export interface ContainerConfig {
    name: string,
    alias: string,
    user: string,
    id_domain: number,
    id_container: number,
    domain: string
    base: string,
    userData: string,
    proxies: Proxy[],
    nginx: Nginx
}

export interface Nginx {
    novnc: number,
    www: number
}

export interface Proxy {
    name: string,
    type: string,
    listen: string,
    port: number,
}

export interface SSH {
    name: string,
    domain: string,
    hostname: string,
    user: string,
    port: number,
    suffix: string,
    alias?: string

}
