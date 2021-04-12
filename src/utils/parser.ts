// To parse this data:
//
//   import { Convert, LxceConfig, ContainerConfig, Track } from "./file";
//
//   const lxceConfig = Convert.toLxceConfig(json);
//   const containerConfig = Convert.toContainerConfig(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.
// ref: https://app.quicktype.io/

import {
    LxceConfig,
    ContainerConfig
} from "../interfaces/interfaces";


// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toLxceConfig(json: string): LxceConfig {
        return cast(JSON.parse(json), r("LxceConfig"));
    }

    public static lxceConfigToJson(value: LxceConfig): string {
        return JSON.stringify(uncast(value, r("LxceConfig")), null, 2);
    }

    public static toContainerConfig(json: string): ContainerConfig {
        return cast(JSON.parse(json), r("ContainerConfig"));
    }

    public static containerConfigToJson(value: ContainerConfig): string {
        return JSON.stringify(uncast(value, r("ContainerConfig")), null, 2);
    }

}

function invalidValue(typ: any, val: any, key: any = ''): never {
    if (key) {
        throw Error(`Error reading json: Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Error reading json: Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`,);
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) { }
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems") ? transformArray(typ.arrayItems, val)
                : typ.hasOwnProperty("props") ? transformObject(getProps(typ), typ.additional, val)
                    : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}


// Quick fix for declaring tipeMap in different file
// export
function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

// Should be changed manually!!
const typeMap: any = {
    "LxceConfig": o([
        { json: "hypervisor", js: "hypervisor", typ: r("Hypervisor") },
        { json: "seed", js: "seed", typ: "" },
        { json: "domains", js: "domains", typ: a(r("Domain")) },
        { json: "locations", js: "locations", typ: a("") },
    ], false),
    "Hypervisor": o([
        { json: "SSH_hostname", js: "SSH_hostname", typ: "" },
        { json: "SSH_suffix", js: "SSH_suffix", typ: "" },
    ], false),
    "Domain": o([
        { json: "id", js: "id", typ: 0 },
        { json: "name", js: "name", typ: "" },
    ], false),
    "ContainerConfig": o([
        { json: "name", js: "name", typ: "" },
        { json: "alias", js: "alias", typ: "" },
        { json: "user", js: "user", typ: "" },
        { json: "id_domain", js: "id_domain", typ: 0 },
        { json: "id_container", js: "id_container", typ: 0 },
        { json: "alias", js: "alias", typ: "" },
        { json: "domain", js: "domain", typ: "" },
        { json: "base", js: "base", typ: "" },
        { json: "userData", js: "userData", typ: "" },
        { json: "proxies", js: "proxies", typ: a(r("Proxy")) },
        { json: "nginx", js: "nginx", typ: r("Nginx") },
    ], false),
    "Nginx": o([
        { json: "novnc", js: "novnc", typ: 0 },
        { json: "www", js: "www", typ: 0 },
    ], false),
    "Proxy": o([
        { json: "name", js: "name", typ: "" },
        { json: "type", js: "type", typ: "" },
        { json: "listen", js: "listen", typ: "" },
        { json: "port", js: "port", typ: 0 },
    ], false),
};

