let async = require("async");
var refreshToken = require("../jscode/refreshToken"); // Refresh토큰 실행기
var moduleRequest = require("../jscode/moduleRequest");
let knex = require("../config/database");
var util = require('../jscode/util') //각종 도구들
var randtoken = require('rand-token');

let lastTextArr = ['다음 명령을 말해주세요', '다음 질문이 있으신가요', '이제 어떤 것을 해드릴까요.', '이제 명령을 해 주세요.', '다른 질문이 있으신가요?', '이제 질문해주세요!']

const userdata = {
  email: 'lunastratos@gmail.com',
  sex: 'M',
  location: '서울',
  year: '1980',
  name: '로제리아'
}
const emailBase64 = Buffer.from(JSON.stringify(userdata)).toString('base64')
const accessToken = randtoken.uid(32) + '//' + emailBase64;
const base64toJson = JSON.parse((Buffer.from(accessToken.split('//')[1], 'base64')).toString('utf8')) // 종합데이터 받기
//=====================TOKEN_DATA=======================
const emailToken = base64toJson.email;
const nameToken = base64toJson.name;
const sexToken = base64toJson.sex;
const yearToken = base64toJson.year;
const locationToken = base64toJson.location;
console.log(emailToken)
console.log(nameToken)
console.log(sexToken)
console.log(yearToken)
console.log(locationToken)


// promise async
const getSync = (insertData, requestType) => new Promise(function(resolved, rejected) {
  getDataRequest(insertData, requestType, function(err, result) {
    if (err) {
      rejected(err);
    } else {
      resolved(result);
    }
  });
});



//어제와 오늘의 걸음 정보
async function walkinfo_action() {
  const searchJson = {}
  const mytoken = 'ya29.GluuBm-siXJCOBP3d9d-NLn2DjK5GKZp26QWexU8zfefak4mane6Y5_i9ZJ40L_w090RdIyTb67KZx1UCFdv7PIZZgGuINtbpIfjCJgIkpLK_Q4TVjdn_OmOhphc';

    console.log('result : ', mytoken)
    /**
     * GCP상에서의 시간 받기
     *
     */
    var todayD = new Date(new Date('2018-11-03T23:59:59.000Z').getTime()  + 1000 * 60 * 60 * ) //오늘+ 1000 * 60 * 60 * 9
    const todayDate = (todayD.getFullYear()) + ('0' + (todayD.getMonth() + 1)).slice(-2) + '' + ('0' + (todayD.getDate())).slice(-2)
    var yesterD = new Date(new Date('2018-11-03T00:01:01.000Z').getTime() - 1000 * 60 * 60 * 24  - 1000 * 60 * 60 * 1.1 ) // + 1000 * 60 * 60 * 9
    //yesterD.setHours(0, 1, 1); //어제날짜 0시 1분 1초
    //yesterD.setHours(23, 59, 59); //어제날짜 0시 1분

    const yesterDate = yesterD.getFullYear() + '' + ('0' + (yesterD.getMonth() + 1)).slice(-2) + '' + ('0' + (yesterD.getDate())).slice(-2)
    console.log('todayD: ', todayD)
    console.log('yesterD: ', yesterD)
    console.log('result[0] ', mytoken)
    const insertData = {
      startTime: yesterD.getTime(),
      endTime: todayD.getTime(),
      accessToken: mytoken
    }

    const fitness = await moduleRequest(insertData, 'fitness')
    const distance = await moduleRequest(insertData, 'distance')

    console.log('fitness ', fitness)
    console.log('distance ', distance)
    if (fitness.code != 200 || distance.code != 200) {
      //오류 문구 넣기
      const sayText = '죄송합니다. 구글 계정연동에 문제가 있어 데이터를 가져오지 못했습니다. 누구 앱에서 계정을 연동을 하신 후 사용해 주세요. ' + util.shuffleRandom(lastTextArr)[0]
      console.log(sayText)
    } else {
      console.log('fitness.list : ', fitness.list)
      const yesterdayWalkCount = Number(fitness.list[0].walkCount)
      const todayWalkCount = Number(fitness.list[1].walkCount)
      const yesterdayWalkDistance = parseInt(Number(distance.list[0].distance))
      const todayWalkDistance = parseInt(Number(distance.list[1].distance))

      const averageW = util.averageWalk((new Date().getFullYear() - Number(yearToken)), sexToken) * 2

      const allPlusWalk = yesterdayWalkCount + todayWalkCount
      let resultText = '';

      if (allPlusWalk < averageW) { //평균이 더 많으면
        const calWalk = averageW - allPlusWalk
        resultText = '평균보다 적은 편입니다. ' + util.ShuffleUmSay() + calWalk + '걸음을 더 걸으시면 평균을 채울 수 있습니다. 지금이라도 다른 운동으로 채워보는건 어떨까요? '
      } else {
        resultText = '평균보다 많은 편입니다. 지금처럼 잘 유지하시면 더욱 건강하겠죠? '
      }

      let sayText = '어제는 ' + yesterdayWalkCount + '걸음, ' + yesterdayWalkDistance + '미터를 걸었으며 ' +
        '오늘은 ' + todayWalkCount + '걸음, ' + todayWalkDistance + '미터를 걸었습니다. ' + nameToken + '님의 어제와 오늘을 합친 걸음은 ' +
        resultText  + util.shuffleRandom(lastTextArr)[0]
      console.log(sayText)
    }


} // function End

walkinfo_action()
