const child = require("child_process")

string = child.execSync(`lxc list --format csv -c "n"`).toString()
names = string.split("\n")

for (name of names) {
    child.execSync(`lxc delete ${name} -f`)
    console.log("Removed:", name)
}
console.log("Succes!!")