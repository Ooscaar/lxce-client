import { readFileSync, readFile } from "fs";

console.log("Hello world")

console.log("Hello")

function show(x: number): number {
    console.log("x")
    return 4*x
}

let y = show(5)
console.log(y)
