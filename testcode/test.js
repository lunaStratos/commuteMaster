const meter = 51000

let result = 1250;

//[기본운임] 10km 이내 : 1,250원
if (parseInt(meter) <= 10000) {

} else if (10000 < parseInt(meter) && parseInt(meter) <= 50000) {
  const fiveN = parseInt(((parseInt(meter) - 10000) / 5000) + 1)
  result = 1250 + fiveN * 100
} else if (parseInt(meter) > 50000) {
  const eightN = parseInt(((parseInt(meter) - 50000) / 8000) + 1)
  result = 2150 + eightN * 100
}

console.log(result)
