//let array = [0,1,2,3,4,6,7,12,8,9]
let array = [0,1,2,3,4,5]
array.sort((a, b) => a-b)

let i = 0
let id = 0
for (elem of array) {
	if (elem !== i ) {
		console.log("Missing", i)
		break
	}
	i += 1
}
id = i
console.log("id:", id)

