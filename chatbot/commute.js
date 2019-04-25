'use strict';

//모듈
const request = require('request'); // request
const Promise = require('promise'); //promise
let async = require('async');
const randomField = require('randomize');

const proj4 = require('proj4'); //지도용
var transporter = require('../config/emailConfig') // 메일 설정저장

const makeJson = require('../chatbot/nugujs.js') // json module
const businfo = require("../jscode/commute/businfo.js"); // 버스정보
const miseInfo = require("../jscode/commute/miseInfo.js"); // 미세먼지 정보
const weatherInfo = require("../jscode/commute/weatherInfo.js"); // 날씨정보
const oilinfo = require("../jscode/commute/oilinfo.js"); //주유정보
const subwayRoute = require("../jscode/commute/subwayRoute.js"); //경로
const subwayRoute2 = require("../jscode/commute/subwayRoute2.js"); //경로

const subwayTimetable = require("../jscode/commute/subwayTimetable.js"); // 지하철 시간표
const subwayTimetableForBusan = require("../jscode/commute/subwayTimetableForBusan.js"); //지하철 시간표 부산
const subwayRealtime = require("../jscode/commute/subwayRealtime.js"); // 리얼타임 지하철 도착
const trafficInfo = require("../jscode/commute/trafficInfo.js"); // 교통정보 Tmap api
const realtimeStation = require("../jscode/commute/realtimeStation.js"); // 실시간 교통 역 확인

//코드 북
const stationCodeBook = require("../jscode/commute/subwayCode.js");
const stationCodeXy = require("../jscode/commute/subwayCodeXy.js");
const stationCodeBookBusan = require("../jscode/commute/subwayCodeBusan.js");
const emailinfo = require('../config/emailInfo'); //이메일

const commuteUtil = require("../jscode/commute/commuteUtil.js"); //로직 유틸

//최초실행
exports.nugu_chatbot = (knex, req, res, tagId) => {

  const appTitle = '교통마스터' // 앱 타이틀
  // 마이크 오픈 방지 위한 Random LastText
  const lastText = randomField(
    '다음 명령을 말해주세요',
    '다음 질문이 있으신가요',
    '이제 어떤 것을 해드릴까요.',
    '이제 명령을 해 주세요.',
    '다른 질문이 있으신가요?',
    '이제 질문해주세요!',
    '또 궁금하신게 있으신가요?',
    '이제 질문해주세요!',
    '이제 어떤 걸 도와드릴까요?',
  )
  let output = {};
  //log
  console.log(JSON.stringify(req.body)) //console log view

  //OAuth 설정
  let oauthFlag = false // oauth 여부 true : false
  let accessToken = 'test'
  if (req.body.context.session.hasOwnProperty('accessToken')) {
    oauthFlag = true
    accessToken = req.body.context.session.accessToken
  }

  //시간 설정
  const timeUTC = 9 * 3600000 // GCP 앱 엔진에 따른 KST에 맞추기(+9)
  let d = new Date(new Date().getTime() + timeUTC) // GCP 앱 엔진에 따른 KST 시각 조정

  //====================================================================

  //오늘 날씨와 미세먼지 -> 이전 프로젝트에서 가져옴
  const nowWeatherMiseSQL = (insertData) => new Promise(function(resolved, rejected) {
    knex('Camelia_NowWeather').where('name', insertData.location)
      .then(rows => {
        resolved(rows[0]) //　[0]　없이 사용가능
      })
  })

  //내 정보 가져오기 => OAuth 사용시
  const myInfoSQL = (accessToken) => new Promise(function(resolved, rejected) {
    knex('AutumnRain_Users').where('accessToken', accessToken)
      .then(rows => {
        resolved(rows[0]) //　[0]　없이 사용가능
      })
  })

  /**
   * 인천 지하철 데이터
   */
  //역이름
  const subwayTimetableForInchon = (insertData) => new Promise(function(resolved, rejected) {
    knex('autumnrain_inchon').where({
        'station': insertData.stationName,
        'line': insertData.stationLine,
        'day': insertData.day,
        'updown': insertData.updown
      }).select()
      .then(rows => {
        resolved(rows[0]) //　[0]　없이 사용가능
      })
  })

  //wgs84 일반좌표를 KATEC TM128로 변환
  const wgs84ToKATEC_function = (longitude, latitude) => new Promise(function(resolved, rejected) {
    var from = 'WGS84'
    var to = 'KATEC'
    proj4.defs('WGS84', "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs");
    proj4.defs('KATEC', '+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43');

    var arrNumber = new Array(); //배열 선언 : 그냥 [] 로 선언하면 ''가 붙어서 coordinates에러가 뜸.
    arrNumber[0] = parseFloat(longitude)
    arrNumber[1] = parseFloat(latitude)

    var wgs84ToKATEC = proj4(from, to, arrNumber); // WGS84 => TM128
    resolved(wgs84ToKATEC) //　[0]　없이 사용가능
  })

  /**
   * 지하철 실시간 찾을때 재귀로 오류시 계속 부름
   * 600에러시에만 처리
   */
  async function realtimeRecursion(jsons, insertData) {
    if (jsons.code == 600) {
      const result = await subwayRealtime(insertData)
      return realtimeRecursion(result, insertData)
    } else {
      return jsons
    }
  } // realtimeRecursion

  /**
   * 루트에 쓰이는 재귀호출
   * 오류시 재귀로 계속 부름
   * 600 에러(일시적 오류)시에만 처리
   */
  async function routeRecursion(jsons, searchStation) {

    if (jsons.code == 600) { //600에러시 처리
      const result = await subwayRoute2(searchStation)
      return routeRecursion(result, searchStation)
    } else {
      return jsons
    }

  } // routeRecursion

  /**
   * 지하철 시간표
   * param: 지하철 시도: 기본값 서울
   * param: 지하철역 이름
   * param: 지하철 호선
   * param: 상행하행 :기본값 상행선
   *  String Text
   */
  async function station_timetable_action() {
    console.log('station_timetable_action')
    let textField = '' //텍스트 필드

    let stationSido = '서울';
    if (req.body.action.parameters.hasOwnProperty('stationSido')) {
      stationSido = req.body.action.parameters.stationSido.value //시도: 기본값 서울
    }

    let stationName = '';
    if (req.body.action.parameters.hasOwnProperty('stationName')) {
      stationName = req.body.action.parameters.stationName.value //역이름 기본값 서울
    }

    let stationLine = '';
    if (req.body.action.parameters.hasOwnProperty('stationLine')) {
      stationLine = req.body.action.parameters.stationLine.value //호선
    }

    let stationUpdown = '';
    if (req.body.action.parameters.hasOwnProperty('stationUpdown')) {
      stationUpdown = req.body.action.parameters.stationUpdown.value //상행선1 하행선2
    }

    //NUGU에서 역 이름 처리를 못함으로 내가 처리
    if (stationName.substring(stationName.length - 1, stationName.length) == '역') {
      stationName = stationName.substring(0, stationName.length - 1)
    }

    // console.log('stationSido', stationSido)
    // console.log('stationName', stationName)
    // console.log('stationLine', stationLine)
    // console.log('stationUpdown', stationUpdown)

    let insertData = {}
    insertData.stationLine = stationLine
    insertData.updown = commuteUtil.sidoUpdown(stationSido, stationUpdown) //상하행선 -> 부산의 경우 0, 1
    insertData.sido = stationSido
    insertData.day = commuteUtil.sidoTime(d.getDay()) // 요일 입력 -> 인천이면 특수처리
    insertData.stationName = stationName


    let getStationTimetable = ''

    //인천의 경우 라인처리 필요
    if (stationSido == '인천') {
      switch (stationLine) {
        case '1':
          stationLine = 'i01'
          break;
        case '2':
          //인천지하철
          stationLine = 'i02'
          break;
        default:
          stationLine = 'i01'
      }
    }

    if (stationSido == '서울' || stationSido == '인천') {
      const stationCode = stationCodeBook.subwayCode(stationName, stationLine)
      insertData.stationCode = stationCode

      getStationTimetable = await subwayTimetable(insertData);
    } else if (stationSido == '부산') {

      //부산의 경우 시+분 String으로 추가 데이터를 보내야 한다.
      insertData.stationCode = stationCodeBookBusan.nameToSubwayCodeBusan(stationName, 'b0' + stationLine)
      insertData.starttime = ('0' + d.getHours()).slice(-2) + '' + ('0' + d.getMinutes()).slice(-2)
      //console.log('insertData.starttime ', new Date().getHours())
      getStationTimetable = await subwayTimetableForBusan(insertData);

    }

    //console.log(getStationTimetable)

    //에러처리
    if (getStationTimetable.code == 300) {
      textField = '죄송합니다. 호선이나 도시가 일치하지 않아서 정보를 불러올 수 없었습니다. '
      textField += lastText
      output.stationTimetable = textField
      return res.send(makeJson(output))

    } else if (getStationTimetable.code == 400) {
      textField = stationName + '역은 현재 운행중이 아닌거 같습니다. '
      textField += lastText
      output.stationTimetable = textField
      return res.send(makeJson(output))

    } else { //성공시
      const stationTimetablelist = getStationTimetable.list

      let saveTimeList = new Array() //save array

      //현재 시각의 텍스트 변환
      //유저설정: 유저설정이 없으면 그냥 25분으로 설정
      //최대 기다릴수 있는 시각 = 현재시각 + 유저타임
      const waitTime = new Date(d.getTime() + 25 * 60000)

      let countSave = 0;
      let beforeTimeHour = ''
      let beforeRoute = ''

      for (var i = 0; i < stationTimetablelist.length; i++) {

        //get jsonvalue
        const getStationTimeTableTime = (stationTimetablelist[i].ARRIVETIME).split(':') // EX: "05:57:50"

        const subwaydRoute = stationTimetablelist[i].SUBWAYENAME // 마천/상일동
        //도착 타임테이블 시간
        // console.log('d.getFullYear()', d.getFullYear())
        // console.log('d.d.getMonth()', d.getMonth())
        // console.log('d.d.getDate()', d.getDate())

        let arriveDate = new Date(d.getFullYear(), new Date().getMonth(), new Date().getDate(), getStationTimeTableTime[0], getStationTimeTableTime[1], getStationTimeTableTime[2])
        //arriveDate = new Date(arriveDate.getTime() + timeUTC)

        // console.log('stationTimetablelist', stationTimetablelist[i].ARRIVETIME)
        // console.log('arriveDate => ', arriveDate)
        // console.log('waitTime => ', waitTime)
        // console.log('d.getTime() => ', d)

        // 도착 가능한 예정시간은 현재시간 보다는 크거나, 최대 기다릴수 있는 시간보다는 작아야 한다.
        if (arriveDate.getTime() > d.getTime() && arriveDate.getTime() < waitTime.getTime()) {
          //console.log(getStationTimeTableTime[0] + '시' + getStationTimeTableTime[1] + '분')
          if (countSave == 0) { //최초 저장
            beforeTimeHour = getStationTimeTableTime[0]
            beforeRoute = subwaydRoute
            countSave++ //올려줌
            textField += stationName + '역은 ' + subwaydRoute + '행이 ' + getStationTimeTableTime[0] + '시 ' + getStationTimeTableTime[1] + '분, '
          } else {

            //루트가 이전 루트와 같다면
            if (beforeRoute == subwaydRoute) {
              //추가안함
            } else {
              //같지 않다면 추가
              textField += subwaydRoute + '행이 '
              beforeRoute = subwaydRoute //루트 갱신
            }

            //시간이 이전 시간과 같다면 그냥 분만 추가
            if (beforeTimeHour == getStationTimeTableTime[0]) {
              textField += getStationTimeTableTime[1] + '분, '
            } else { // 이전시간과 다르다면 시와 분 추가후 이전 시간 갱신
              beforeTimeHour = getStationTimeTableTime[0]
              textField += getStationTimeTableTime[0] + '시 ' + getStationTimeTableTime[1] + '분, '
            }
          } //countSave == 0


        }

      } //List for
      textField += '열차들이 30분 내에 있습니다. '
      //열차가 없었다면 텍스트 교체
      if (countSave == 0) textField = '설정하신 시간 내에 도착하는 열차가 없습니다. ';

    } //200


    textField += lastText
    output.stationTimetable = textField
    return res.send(makeJson(output))
  } // station_timetable_action



  /**
   * 지하철 실시간
   * param: 지하철역 이름 (ex; 종로, 시청)
   * param2: 지하철 호선
   * @return String Text
   */
  async function station_realtime_action() {

    let textField = '' //텍스트 필드

    let stationLine = '';
    if (req.body.action.parameters.hasOwnProperty('stationLineRealtime')) {
      stationLine = req.body.action.parameters.stationLineRealtime.value //지하철 라인
    }


    let stationUpdn = 'all';
    if (req.body.action.parameters.hasOwnProperty('stationNameRealtimeUpdn')) {
      stationUpdn = req.body.action.parameters.stationNameRealtimeUpdn.value //상행 하행 외선 내선
      //숫자로 표기 1, 2
    }
    const stationName = req.body.action.parameters.stationNameRealtime.value //지하철 이름

    //NUGU에서 역 이름 처리를 못함으로 내가 처리
    if (stationName.substring(stationName.length - 1, stationName.length) == '역') {
      stationName = stationName.substring(0, stationName.length - 1)
    }

    // console.log(stationName)
    // console.log(stationLine)
    // console.log(stationUpdn)

    if (!realtimeStation.checkStation(stationName)) {
      textField = '죄송합니다. ' + stationName + ' 역은 지원하지 않는 역입니다. 현재 실시간 도착정보는 서울시의 역만 가능합니다.' + lastText
      output.stationRealtime = textField
      return res.send(makeJson(output))
    }

    let insertData = {}
    insertData.stationName = stationName
    let getStationRealtime = await subwayRealtime(insertData);
    //console.log(getStationRealtime)
    getStationRealtime = await realtimeRecursion(getStationRealtime, insertData)
    //console.log('getStationRealtime.code : ', getStationRealtime.code)
    if (getStationRealtime.code == 600) {
      textField = '죄송합니다. ' + stationName + ' 역은 현재 일시적인 서버 이상이 있어서 정보를 불러올 수 없었습니다. ' + lastText
      output.stationRealtime = textField
      return res.send(makeJson(output))
    } else if (getStationRealtime.code == 500) {
      textField = '현재 ' + stationName + ' 역은 열차가 없거나, 해당하는 데이터가 없습니다. ' + lastText
      output.stationRealtime = textField
      return res.send(makeJson(output))
    } else {
      const getStationRealtimeList = getStationRealtime.list

      let countSave = 0;
      let beforeTimeHour = ''
      let beforeRoute = ''

      //List
      for (var i = 0; i < getStationRealtimeList.length; i++) {

        //get jsonvalue
        // const subwaylineStr = (getStationRealtimeList[i].statnId).substring(7, 8) //열차 라인: 열차번호에서 추출
        const bstatnNm = getStationRealtimeList[i].bstatnNm //종착역
        const statusMessage = getStationRealtimeList[i].arvlMsg2 // 전역 출발	14분 후 (마천)
        const updnLine = getStationRealtimeList[i].updnLine // 상행하행
        const subwaylineStr = (getStationRealtimeList[i].subwayId).substring(2, 4) //열차 라인: 열차번호에서 추출
        const stationLineCode = commuteUtil.subwayLineToCode(stationLine) //역 라인을 코드변환
        // console.log('getStationRealtimeList[i].subwayList => ', getStationRealtimeList[i].subwayList)
        // console.log('updnLine => ', updnLine)

        let switchUpdn = updnLine
        switch (updnLine) {
          case '외선':
            switchUpdn = '상행'
            break;
          case '내선':
            switchUpdn = '하행'
            break;
          default:

        }

        switch (stationUpdn) {
          case '1':
            stationUpdn = '상행'
            break;
          case '2':
            stationUpdn = '하행'
            break;
          default:

        }

        // console.log('stationUpdn => ', stationUpdn)
        // console.log('switchUpdn => ', switchUpdn)
        // console.log('stationLineCode => ', stationLineCode)
        // console.log('subwaylineStr => ', subwaylineStr)

        //내가 말한 상행선과 switchUpdn, api의 상행선이 일치하면 stationUpdn
        if (stationUpdn == switchUpdn) { // 호선 일치
          if (stationLine != '' && subwaylineStr == stationLineCode) {


            if (countSave == 0) { //최초 저장
              beforeRoute = bstatnNm
              countSave++ //올려줌
              textField += stationName + '역 ' + commuteUtil.subwayCodeToLineName(stationLine) + ' ' + bstatnNm + '행 ' + updnLine + '은 ' + statusMessage + ', ';
            } else {

              //루트가 이전 루트와 같다면
              if (beforeRoute == bstatnNm) {
                //추가안함
              } else {
                //같지 않다면 추가
                textField += bstatnNm + '행이 '
                beforeRoute = bstatnNm //루트 갱신
              }

              textField += statusMessage + ' , '
            }

          }
        }

        //상행선 하행선 지정 없이 말하면 다 말한다.
        if (stationUpdn == 'all') {

          if (stationLine != '' && subwaylineStr == stationLineCode) {
            if (countSave == 0) { //최초 저장
              beforeRoute = bstatnNm
              countSave++ //올려줌
              textField += '상행 하행을 말하지 않으셔서 전체를 알려드릴께요. ' + stationName + '역은 ' + commuteUtil.subwayCodeToLineName(stationLine) + ' ' + bstatnNm + '행 ' + updnLine + '은 ' + statusMessage + ', ';
            } else {
              //루트가 이전 루트와 같다면
              if (beforeRoute == bstatnNm) {
                //추가안함
              } else {
                //같지 않다면 추가
                textField += bstatnNm + '행 ' + updnLine + '은 '
                beforeRoute = bstatnNm //루트 갱신
              }
              textField += statusMessage + ' , '
            }

          } // stationLine != '' && subwaylineStr == stationLine
        } //all

      } //List for

      if (countSave == 0) {
        textField += '죄송합니다. 말하신 노선이 일치하지 않아서 조회된 데이터가 없습니다. '
      } else {
        textField += '도착 입니다. '
      }

    }


    textField += lastText
    output.stationRealtime = textField
    return res.send(makeJson(output))
  } // station_realtime_action

  /**
   * 미세먼지 + 날씨
   * param: 지역이름 (서울, 부산, 인천)
   * @return String Text
   * 미세먼지의 경우 수치를 불러들일것-------------------
   */
  async function weather_mise_now_action() {

    let textField = '' //텍스트 필드
    let weatherLocation = req.body.action.parameters.weatherMiseLocation.value //지역 위치
    weatherLocation = weatherLocation.substring(0,2)

    let insertData = {}
    insertData.location = weatherLocation

    //SQL사용
    const getWeatherMiseInfo = await nowWeatherMiseSQL(insertData) //T1H(varchar : Num), mise(varchar), PTY(varchar :Num)

    textField = randomField(
      weatherLocation + '은 ' + commuteUtil.weatherStatus(getWeatherMiseInfo.PTY) + ' ' + commuteUtil.tempText(getWeatherMiseInfo.T1H) + ' 미세먼지는 ' + (getWeatherMiseInfo.mise).trim() + ' 입니다. ',
      '음... ' + weatherLocation + '지역은 ' + commuteUtil.weatherStatus(getWeatherMiseInfo.PTY) + ' ' + commuteUtil.tempText(getWeatherMiseInfo.T1H) + ' 미세먼지는 ' + (getWeatherMiseInfo.mise).trim() + ' 입니다. ',
      weatherLocation + '는 ' + commuteUtil.weatherStatus(getWeatherMiseInfo.PTY) + ' ' + commuteUtil.tempText(getWeatherMiseInfo.T1H) + ' 미세먼지는 ' + (getWeatherMiseInfo.mise).trim() + ' 입니다. ',
      weatherLocation + '는 ' + commuteUtil.weatherStatus(getWeatherMiseInfo.PTY) + ' ' + commuteUtil.tempText(getWeatherMiseInfo.T1H) + ' 미세먼지는 ' + (getWeatherMiseInfo.mise).trim() + ' 입니다. ',
      '요청하신' + weatherLocation + '지역은 ' + commuteUtil.weatherStatus(getWeatherMiseInfo.PTY) + ' ' + commuteUtil.tempText(getWeatherMiseInfo.T1H) + ' 미세먼지는 ' + (getWeatherMiseInfo.mise).trim() + ' 입니다. '
    ) + lastText
    output.weatherMise = textField
    return res.send(makeJson(output));
  } // weather_mise_now_action

  /**
   * 교통상황
   * param: 지역이름 (서울, 부산, 인천)
   * param2: 구 이름
   * @return String Text
   */
  async function traffic_action() {

    let textField = '' //텍스트 필드
    let trafficLocation = req.body.action.parameters.trafficLocation.value //지역 위치 (구)
    if (trafficLocation == undefined) {
      trafficLocation = '강동구'
    }

    let insertData = {}
    const latlng = commuteUtil.locationTolatlng(trafficLocation)
    insertData.centerLat = latlng.lat
    insertData.centerLon = latlng.lng
    const getTrafficInfo = await trafficInfo(insertData);

    if (getTrafficInfo.code != 200) {
      textField = '죄송합니다. 서버에 이상이 있어서 정보를 불러올 수 없었습니다. '
    } else {
      const getTrafficList = getTrafficInfo.list
      let congestion = 0
      let speed = 0

      let accident = ''
      let accidentDescription = ''
      let accidentResult = ''
      //혼잡도 계산 for 문
      //공식 : 전체를 더한후 리스트 length로 나누어서 평균값.
      for (var i = 0; i < getTrafficList.length; i++) {
        //get jsonvalue
        //혼잡도 입니다. - 0: 정보없음 - 1: 원할 - 2: 서행 - 3: 지체 - 4: 정체
        if (getTrafficList[i].properties.hasOwnProperty('congestion')) congestion += parseInt(getTrafficList[i].properties.congestion);

        if (getTrafficList[i].properties.hasOwnProperty('isAccidentNode')) {
          if (getTrafficList[i].properties.isAccidentNode == 'Y') {
            accident = commuteUtil.accidentLong(getTrafficList[i].properties.accidentDetailCode)
            accidentDescription = getTrafficList[i].properties.description
            accidentResult = '돌발 내용은 ' + accident + '가 있으며 자세한 내용은 ' + commuteUtil.accidentHex(accidentDescription) + ' 입니다. '
          }
        }

      } //List for
      const congestionResult = parseInt(congestion) / getTrafficList.length
      // console.log(congestion)
      // console.log(congestionResult)
      textField = randomField(
        '현재 ' + trafficLocation + '의 평균 혼잡도는 ' + commuteUtil.congestion(congestionResult) + ' 입니다. ' + accidentResult,
        '지금 ' + trafficLocation + '의 평균 혼잡도는 ' + commuteUtil.congestion(congestionResult) + ' 이랍니다. ' + accidentResult,
        '음... ' + trafficLocation + '의 평균 혼잡도는 ' + commuteUtil.congestion(congestionResult) + ' 인거 같네요. ' + accidentResult,
        '요청하신 ' + trafficLocation + '지역의 평균 혼잡도는 ' + commuteUtil.congestion(congestionResult) + ' 상태 입니다. ' + accidentResult,
        '오늘, ' + trafficLocation + '지역의 평균 혼잡도는 ' + commuteUtil.congestion(congestionResult) + ' 인 상태입니다. ' + accidentResult,
        '그럼 ' + trafficLocation + '의 평균 혼잡도는 ' + commuteUtil.congestion(congestionResult) + ' 정도 입니다. ' + accidentResult,
        '' + trafficLocation + '의 평균 혼잡도는 ' + commuteUtil.congestion(congestionResult) + '입니다. ' + accidentResult,
      )

    }

    textField += lastText
    output.trafficInfo = textField
    return res.send(makeJson(output))
  } // traffic_action

  /**
   * 6대 광역도시 구를 말하면 최저가 주유소 정보
   * param: 지역 위치 (구)
   * param: 석유제품 (기본값: 휘발유)
   * return oilinfo
   */
  async function oilinfo_action() {
    let textField = '';
    const trafficLocation = req.body.action.parameters.trafficLocationForOil.value //지역 위치 (구)

    let trafficLocationProduct = 'B027'; // 휘발유로 시작
    if (req.body.action.parameters.hasOwnProperty('trafficLocationForOilProduct')) {
      trafficLocationProduct = req.body.action.parameters.trafficLocationForOilProduct.value //상품: 휘발유
    }

    const latlng = commuteUtil.locationTolatlng(trafficLocation)

    const longitude = parseFloat(latlng.lng).toFixed(6) //129
    const latitude = parseFloat(latlng.lat).toFixed(6) //38

    var wgs84ToKATEC = await wgs84ToKATEC_function(longitude, latitude)

    //json 형태로 보내기
    let insertData = {
      'x': wgs84ToKATEC[0],
      'y': wgs84ToKATEC[1],
      'prodcd': trafficLocationProduct
    }

    //주유소 정보 list
    const getOilInfo = await oilinfo(insertData)

    if (getOilInfo.code != 200) { //에러처리
      textField = '죄송합니다. 서버에 이상이 있어서 정보를 불러올 수 없었습니다. '
      output.oilinfo = textField
      return res.send(makeJson(output))

    } else {
      //정상인 경우 0번째 1개만 출력
      const oilPrice = getOilInfo.list[0].PRICE //주유소 가격
      const oilStationName = getOilInfo.list[0].OS_NM //주유소 이름
      const oilDistance = getOilInfo.list[0].DISTANCE //거리
      textField = randomField(
        trafficLocation + '지역의 ' + commuteUtil.productCodeToName(trafficLocationProduct) + ' 최저가 주유소는 ' + oilDistance + '미터 떨어진 ' + oilStationName + '으로 ' + oilPrice + '원 입니다. ',
        trafficLocation + '의 ' + commuteUtil.productCodeToName(trafficLocationProduct) + ' 최저가 주유소는 ' + oilDistance + '미터 떨어진 ' + oilStationName + '으로 ' + oilPrice + '원 이랍니다. ',
        trafficLocation + '의 ' + commuteUtil.productCodeToName(trafficLocationProduct) + ' 최저가 주유소는 ' + oilDistance + '미터 떨어진 ' + oilStationName + '으로 가격은' + oilPrice + '원 이네요. ',
        '현재 ' + trafficLocation + '의 ' + commuteUtil.productCodeToName(trafficLocationProduct) + ' 최저가 주유소는 ' + oilDistance + '미터 떨어진 ' + oilStationName + '으로 ' + oilPrice + '원 입니다. ',
        trafficLocation + '의 ' + commuteUtil.productCodeToName(trafficLocationProduct) + ' 최저가 주유소는 ' + oilDistance + '미터 떨어진 곳에 있는 ' + oilStationName + '으로 ' + oilPrice + '원 입니다. ',
      )
    }
    textField += randomField('만약 이메일로 최저가 주유 정보를 받아보실려면, 계정연동을 등록후 사용 해주세요. ', '', '', '', '', '', '', '', '', '', '', '')
    textField += lastText
    output.oilinfo = textField
    return res.send(makeJson(output))
  }

  /*
  지하철 경로 안내
  오류시 위 재귀로 처리
   */
  async function subway_route_action() {
    console.log('subwayRoute')
    let textField = '' //텍스트 필드

    //시작역
    let startStation = '';
    if (req.body.action.parameters.hasOwnProperty('startStation')) {
      startStation = req.body.action.parameters.startStation.value
    }

    //끝역
    let endStation = '';
    if (req.body.action.parameters.hasOwnProperty('endStation')) {
      endStation = req.body.action.parameters.endStation.value
    }

    // startStation NUGU에서 역 이름 처리를 못함으로 내가 처리
    if (startStation.substring(startStation.length - 1, startStation.length) == '역') {
      startStation = startStation.substring(0, startStation.length - 1)
    }
    //endStation NUGU에서 역 이름 처리를 못함으로 내가 처리
    if (endStation.substring(endStation.length - 1, endStation.length) == '역') {
      endStation = endStation.substring(0, endStation.length - 1)
    }

    // console.log(startStation)
    // console.log(endStation)
    //역 찾고 데이터 얻기
    const searchStation = stationCodeXy.subwayXY(startStation, endStation)
    const startLine = commuteUtil.CodeToStr(searchStation.startLine)
    const endLine = commuteUtil.CodeToStr(searchStation.endLine)
    //console.log(JSON.stringify(searchStation))

    let subwayRouteParse = await subwayRoute2(searchStation)

    //재귀처리 => 이상시 다시 부름, 없으면 그냥 처리
    subwayRouteParse = await routeRecursion(subwayRouteParse, searchStation)

    //console.log(JSON.stringify(subwayRouteParse))

    //에러: 같은역을 불렀거나, 지원하지 않는 역
    if (subwayRouteParse.code == 400) {
      output.subwayRoute = '죄송합니다. 혹시 같은 역이나 지원하지 않는 역을 말하지 않았나요? 다른역으로 시도해 주세요. ' + lastText
      return res.send(makeJson(output))
      return;
    }

    //정상시
    const subwayRouteList = subwayRouteParse.list

    //데이터
    const subwayRouteStations = (subwayRouteList.shtStatnNm).split(',')
    const subwayRouteMsg = subwayRouteList.shtTransferMsg

    const proceedStation = subwayRouteList.shtStatnCnt
    const minute = subwayRouteList.shtTravelTm
    let trasfer = subwayRouteList.shtTransferCnt
    trasfer = '총 ' + minute + '분 걸리며 ' + trasfer + '번 환승합니다. '

    if (subwayRouteList.shtTransferCnt == 0) {
      trasfer = '총 ' + minute + '분 걸립니다. '
    }

    let trasferArr = (subwayRouteList.shtStatnId).split(',')
    let tempCode = '';
    let transSave = []
    let transLine = []
    for (var i = 0; i < trasferArr.length; i++) {
      if (i == 0) {
        tempCode = trasferArr[i].substring(0, 4)
      } else {
        if (trasferArr[i].substring(0, 4) != '') {
          if (tempCode == trasferArr[i].substring(0, 4)) {

          } else { //다음역이 같지 않으면 = 환승할 역이 있다면
            tempCode = trasferArr[i].substring(0, 4)
            //역 라인과 정보 저장(저장 되지 않을 경우를 대비해서 '')
            transSave.push({
              line: commuteUtil.subwayLineToName(tempCode),
              name: subwayRouteStations[i]
            })
          }
        }
      }

    }

    // 환승역
    //환승역이 0개라면 존재하지 않음으로 for문이 돌아가지 않음. + 입니다도 없음.
    let transferStr = ''
    for (var i = 0; i < transSave.length; i++) {
      if (i == 0) {
        transferStr += '환승역은 '
      }
      transferStr += transSave[i].line + ' ' + transSave[i].name + ', '
    }
    //만약 길이가 0이 아니라면
    if (transSave.length != 0) {
      transferStr += ' 입니다. '
    }

    //텍스트 필드
    textField += startLine + ' ' + startStation + '에서 ' + endLine + ' ' + endStation + '까지 ' + proceedStation + '개 역을 지납니다. ' + trasfer + transferStr + lastText
    output.subwayRoute = textField
    return res.send(makeJson(output))

  }

  //====================================================================
  //=============================OAUTH영역==============================
  //====================================================================

  /**
   *석유 가격정보
   **/
  async function oilinfo_oauth_action() {
    console.log('oilinfo_oauth_action')
    let textField = '' //텍스트 필드

    //oauth 연동여부 체크
    if (!oauthFlag) {
      output.oilinfoOauth = '이 기능은 계정연동이 필요합니다. 계정연동을 하신 후 이용해 주세요. '
      return res.send(makeJson(output))
      return;
    }

    const myinfo = await myInfoSQL(accessToken)

    const longitude = parseFloat(myinfo.lng).toFixed(6) //129.07564159999998
    const latitude = parseFloat(myinfo.lat).toFixed(6)
    const product = myinfo.product

    if (longitude == '' || latitude == '') {
      output.oilinfoOauth = '이 기능은 계정에서 등록을 하신 후 사용하실수 있습니다. 위치를 등록후 사용해주세요.'
      return res.send(makeJson(output))
      return;
    }

    var wgs84ToKATEC = await wgs84ToKATEC_function(longitude, latitude)

    //json 형태로 보내기
    let insertData = {
      'x': wgs84ToKATEC[0],
      'y': wgs84ToKATEC[1],
      'prodcd': product
    }

    //주유소 정보 list
    const getOilInfo = await oilinfo(insertData)

    if (getOilInfo.code != 200) { //에러처리
      textField = '죄송합니다. 서버에 이상이 있어서 정보를 불러올 수 없었습니다. '
      output.oilinfoOauth = textField
      return res.send(makeJson(output))
      return;

    } else {
      //정상인 경우 0번째 1개만 출력
      const oilPrice = getOilInfo.list[0].PRICE //주유소 가격
      const oilStationName = getOilInfo.list[0].OS_NM //주유소 이름
      const oilDistance = getOilInfo.list[0].DISTANCE //거리

      textField = randomField(
        commuteUtil.productCodeToName(product) + '의 최저가 주유소는 ' + oilDistance + '미터 떨어진 ' + oilStationName + '으로 ' + oilPrice + '원 입니다. ',
        commuteUtil.productCodeToName(product) + '의 최저가 주유소는 ' + oilDistance + '미터 떨어진 ' + oilStationName + '으로 ' + oilPrice + '원 이랍니다. ',
        commuteUtil.productCodeToName(product) + '의 최저가로 파는 곳은 ' + oilDistance + '미터 떨어진 ' + oilStationName + '으로 ' + oilPrice + '원 입니다. ',
        commuteUtil.productCodeToName(product) + '가 최저가인 주유소는 ' + oilDistance + '미터 떨어진 ' + oilStationName + '으로 ' + oilPrice + '원 이랍니다. ')
    }

    textField += randomField('이메일로 지도 링크를 받아보실려면, 최저가 주유소를 이메일로 보내줘 라고 말해주세요. ',
      '주유소의 티맵 경로안내링크 이메일을 싶으신가요? 그러시면 , 최저가 주유소를 이메일로 보내줘, 라고 말해주세요. ',
      '지도 위치를 알고 싶으시다면 최저가 주유소를 이메일로 보내줘, 라고 말해주세요. ',
      '다른 가격순 리스트를 받아보고 싶다면 최저가 주유소를 이메일로 보내줘, 라고 말해주세요. ')

    output.oilinfoOauth = textField
    return res.send(makeJson(output));
  } // oilinfo_oauth_action

  var ejs = require("ejs");
  /**
   * 주유소 최저가 이메일로 받기
   * return String Text
   */
  async function oilinfo_email_oauth_action() {
    console.log('oilinfo_email_oauth_action')
    //oauth 연동여부 체크
    if (!oauthFlag) {
      output.oilinfoEmailOauth = '이 기능은 계정연동이 필요합니다. 계정연동을 하신후 이용해 주세요. '
      return res.send(makeJson(output))
      return;
    }

    let textField = '' //텍스트 필드

    //내정보 받기
    const myinfo = await myInfoSQL(accessToken)

    const longitude = parseFloat(myinfo.lng).toFixed(6) //128
    const latitude = parseFloat(myinfo.lat).toFixed(6) // 38
    const product = myinfo.product // 상품정보 (휘발유)

    var wgs84ToKATEC = await wgs84ToKATEC_function(longitude, latitude)

    //json 형태로 보내기
    let insertData = {
      'x': wgs84ToKATEC[0],
      'y': wgs84ToKATEC[1],
      'prodcd': product
    }

    //주유소 정보 list
    const getOilInfo = await oilinfo(insertData)

    let arrList = getOilInfo.list

    //지도 변환
    var from = 'TM128'
    var to = 'WGS84'
    proj4.defs('WGS84', "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs");
    proj4.defs('TM128', '+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43');

    for (var i = 0; i < arrList.length; i++) {
      const gis_X = arrList[i].GIS_X_COOR
      const gis_Y = arrList[i].GIS_Y_COOR

      var xy = new Array();
      xy[0] = parseFloat(gis_X)
      xy[1] = parseFloat(gis_Y)
      var katecToWGS84 = proj4(from, to, xy); // WGS84 => TM128

      const naverMapLink = 'http://maps.naver.com/?menu=location&mapMode=0&lat=' + katecToWGS84[1] + '&lng=' + katecToWGS84[0] + '&dlevel=13&enc=b64mapMode'
      const daumMapLink = 'https://map.daum.net/link/map/' + katecToWGS84[1] + ',' + katecToWGS84[0]
      const googleMapLink = 'https://www.google.com/maps/search/?api=1&query=' + katecToWGS84[1] + ',' + katecToWGS84[0] + '';

      arrList[i].naver = naverMapLink
      arrList[i].kakao = daumMapLink
      arrList[i].google = googleMapLink
      arrList[i].lat = katecToWGS84[0]
      arrList[i].lng = katecToWGS84[1]
      arrList[i].POLL_DIV_CD = commuteUtil.companyNameToOilCompany(getOilInfo.list[0].POLL_DIV_CD)

    }

    const oilPrice = getOilInfo.list[0].PRICE //주유소 가격
    const oilStationName = getOilInfo.list[0].OS_NM //주유소 이름
    const oilDistance = getOilInfo.list[0].DISTANCE //거리
    const oilCompany = getOilInfo.list[0].POLL_DIV_CD // 주유소 회사
    const oilLat = getOilInfo.list[0].lat
    const oilLng = getOilInfo.list[0].lng
    const oilLinkKakao = getOilInfo.list[0].kakao
    const oilLinkGoogle = getOilInfo.list[0].google
    const oilLinkNaver = getOilInfo.list[0].naver


    if (getOilInfo.code != 200) { //에러처리
      textField = '죄송합니다. 서버에 이상이 있어서 정보를 불러올 수 없었습니다. '
    } else {
      /**
       * 이메일 연동 확인하기
       */
      const subject = '[' + appTitle + '] 최저가 리스트.'

      ejs.renderFile("./camelia_web/email/emailCommuteMaster.ejs", {
        lowName: oilStationName, //최저가 상호
        lowPrice: oilPrice, // 최저가 가격
        lowKm: oilDistance, //죄저가 거리
        lowLat: oilLat, //최저가 주유소 위치
        lowLng: oilLng, //최저가 주유소 위치
        lowCompany: oilCompany,
        oilLinkKakao: oilLinkKakao, //카카오 지도
        oilLinkGoogle: oilLinkGoogle, //최저가 구글 지도
        oilLinkNaver: oilLinkNaver, //최저가 네이버 위치
        arr: arrList // arrayList 보내기

      }, function(err, data) {
        if (err) {
          console.log(err);
        } else {
          transporter.sendMail({
            from: emailinfo.email,
            to: myinfo.email, //myinfo.email
            subject: subject,
            html: data
          }, (err, info) => {
            console.log(info);
            console.log(err);
          });
        }

      });
      textField = randomField('가입하신 이메일로 최저가 주유소를 리스트를 보냈습니다. ',
        '가입하신 이메일로 최저가 주유소 정보를 보냈습니다. ',
        '방금 가입한 이메일로 주유소 정보를 보냈습니다. ', )
    }

    output.oilinfoEmailOauth = textField + lastText
    return res.send(makeJson(output));
  } // oilinfo_email_action

  /**
   * 버스 실시간 도착
   * @return String Text
   */
  async function bus_oauth_action() {
    let textField = '' //텍스트 필드
    //oauth 연동여부 체크
    if (!oauthFlag) {
      textField = '이 기능은 계정연동이 필요합니다. 계정연동을 하신후 이용해 주세요. '
      output.busOauth = textField
      return res.send(makeJson(output))
      return;
    }

    const busNum = parseInt(commuteUtil.fisrtTransName(req.body.action.parameters.BusNumOauth.value)) - 1 // 버스넘버: 1~10까지

    const myinfo = await myInfoSQL(accessToken)
    const busJson = JSON.parse(myinfo.bus) //JSon 변환
    console.log('busNum ', busNum)
    // console.log('length ', busJson.list.length)

    //저장된 버스 없을때
    if (busJson.list.length < (busNum + 1)) {
      textField = '그 번호엔 현재 저장된 버스정류장이 없습니다. 로그인 후 페이지에서 설정저장 후 사용해 주세요. '
      output.busOauth = textField
      return res.send(makeJson(output))
      return;
    }

    //저장된 버스 없을때
    if (busJson.list[busNum].status == false) {
      textField = '그 번호엔 현재 저장된 버스정류장이 없습니다. 로그인 후 페이지에서 설정저장 후 사용해 주세요. '
      output.busOauth = textField
      return res.send(makeJson(output))
      return;
    } //status == false stop

    //버스 실시간 데이터 요청
    let insertData = {}
    insertData.arsId = busJson.list[busNum].arsId
    const getBusinfo = await businfo(insertData);

    //즐겨찾기 기능 구현
    const favorite = (busJson.list[busNum].favorite).split(',')
    const useFlag = favorite.length

    //600 에러
    if (getBusinfo.code == 600) {
      textField = '죄송합니다. 없는 버스정류장 이거나 서버에 이상이 있어서 정보를 불러올 수 없었습니다. 다시 시도해주세요. '

      //없는 버스 정류장
    } else if (getBusinfo.code == 400) {
      textField = '지원하지 않는 버스정류장을 입력하셨습니다. 버스기능은 서울권에서만 가능합니다. 로그인 후 다시 확인해 보시는건 어떨까요? '

    } else { //데이터 성공

      const buslist = getBusinfo.list
      let countSame = 0;
      //List for
      for (var i = 0; i < buslist.length; i++) {

        const busName = buslist[i].rtNm // 버스이름 (서초01, 641 형태)
        const bus1 = buslist[i].arrmsg1 // 1번째 버스 예상시간
        const bus2 = buslist[i].arrmsg2 // 2번째 버스 예상시간

        //저상버스 여부 (for handicap)
        let busType1 = '';
        let busType2 = '';
        if (buslist[i].busType1 == 1) busType1 = '저상, ';
        if (buslist[i].busType2 == 1) busType2 = '저상, ';


        //저장되 있는 거라면 length 에서 찾아서 저장(저장된 것만 불러옴)
        if (useFlag != 0) { //true
          let count = 0;
          //console.log('busName ', busName)

          for (var j = 0; j < favorite.length; j++) {
            //console.log('favorite[j] ', favorite[j])
            if (busName == favorite[j]) {
              //makeText
              textField += busName + '의 첫번째 버스는 ' + busType1 + ' ' + bus1 + ' , 2번째 버스는 ' + busType2 + bus2 + ', '
              count++;
              countSame++;
            }

          } //List for


        } else { // length == 0 이면 다 부르기
          textField += busName + '의 첫번째 버스는 ' + busType1 + ' ' + bus1 + '이며, 2번째 버스는 ' + busType2 + bus2 + ', '
        } //useFlag != 0

      } //List for
      textField += '입니다. '
      if (countSame == 0) {
        textField = randomField('설정하신 버스노선과 일치하는 정보가 없었습니다. 로그인 후 한번더 확인해 보시는 건 어떨까요. ',
          '설정하신 버스노선과 일치하는 정보가 없었습니다. 로그인 후 한번더 확인해 보시는 건 어떠시겠어요. ',
          '설정하신 버스노선과 일치하는 정보가 없었습니다. 로그인 후 한번 입력하셨던 라인을 확인해 보시는 건 어껄까요. ',
          '설정하신 버스노선과 일치하는 정보가 없었습니다. 노선이 없는 노선을 입력하셨는지 확인해보세요. ', )

      }
    }
    output.busOauth = textField + lastText
    return res.send(makeJson(output));
  } // bus_oauth_action

  /**
   * 지하철 시간표 Oauth
   */
  async function station_timetable_oauth_action() {
    let textField = '' //텍스트 필드
    //oauth 연동여부 체크
    if (!oauthFlag) {
      textField = '이 기능은 계정연동이 필요합니다. 계정연동을 하신후 이용해 주세요. '
      output.stationTimetableOauth = textField
      return res.send(makeJson(output))
      return;
    }

    const num = parseInt(commuteUtil.fisrtTransName(req.body.action.parameters.SubwayTimeNumOauth.value)) - 1 // 버스넘버: 1~5까지
    const myinfo = await myInfoSQL(accessToken)
    const stationJson = JSON.parse(myinfo.subway)
    const stationList = stationJson.list
    console.log('num ', num)
    console.log('stationList ', stationList)
    console.log('stationList ', stationList.length)

    //저장 기능확인
    if (stationList.length < (num + 1)) {
      textField = '그 번호엔 저장된 역 정보가 없습니다. 로그인 후 페이지에서 설정하신 후 사용해 주세요. '
      output.stationTimetableOauth = textField
      return res.send(makeJson(output))
      return;
    }

    const defineStationListStatus = stationList[num].status

    //저장 기능확인
    if (defineStationListStatus == undefined || defineStationListStatus == false) {
      textField = '그 번호엔 저장된 역 정보가 없습니다. 로그인 후 페이지에서 설정하신 후 사용해 주세요. '
      output.stationTimetableOauth = textField
      return res.send(makeJson(output))
      return;
    }

    let insertData = {}
    insertData.stationCode = stationList[num].stationCode
    insertData.stationLine = stationList[num].line
    insertData.updown = commuteUtil.sidoUpdown(stationList[num].sido, stationList[num].updown) //상하행선 -> 부산의 경우 0, 1
    insertData.sido = stationList[num].sido
    insertData.day = commuteUtil.sidoTime(d.getDay()) // 요일 입력 -> 인천이면 특수처리
    //console.log(insertData)
    let getStationTimetable = ''

    //서울과 인천 & 경기는 동시에 사용 가능
    if (stationList[num].sido == '서울' || stationList[num].sido == '인천') {
      getStationTimetable = await subwayTimetable(insertData);
    } else if (stationList[num].sido == '부산') {
      //부산의 경우 시+분 String으로 추가 데이터를 보내야 한다.
      insertData.starttime = ('0' + d.getHours()).slice(-2) + '' + ('0' + d.getMinutes()).slice(-2)
      getStationTimetable = await subwayTimetableForBusan(insertData);
    }

    //console.log(getStationTimetable)

    if (getStationTimetable.code == 300) {
      textField = '죄송합니다. 호선이나 도시가 일치하지 않아서 정보를 불러올 수 없었습니다. '
      textField += lastText
      output.stationTimetableOauth = textField
      return res.send(makeJson(output))

    } else if (getStationTimetable.code == 400) {
      textField = stationList[num].stationName + '역은 현재 운행중이 아닌거 같습니다. '
      textField += lastText
      output.stationTimetableOauth = textField
      return res.send(makeJson(output))

    } else {

      const stationTimetablelist = getStationTimetable.list
      console.log(getStationTimetable)
      //유저설정: 유저설정이 없으면 그냥 25분으로 설정
      const userWaitTime = parseInt(myinfo.waitTimeSubway)
      //최대 기다릴수 있는 시각 = 현재시각 + (유저타임 * 60초 *1000)
      const waitTime = new Date(d.getTime() + userWaitTime * 60000)

      let countSave = 0;
      let beforeTimeHour = ''
      let beforeRoute = ''


      //List
      for (var i = 0; i < stationTimetablelist.length; i++) {

        //get jsonvalue
        const getStationTimeTableTime = (stationTimetablelist[i].ARRIVETIME).split(':') // EX: "05:57:50"
        const subwaydRoute = stationTimetablelist[i].SUBWAYENAME // 마천/상일동
        //도착 타임테이블 시간
        let arriveDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), getStationTimeTableTime[0], getStationTimeTableTime[1], getStationTimeTableTime[2])
        arriveDate = new Date(arriveDate.getTime())

        // 도착 가능한 예정시간은 현재시간 보다는 크거나, 최대 기다릴수 있는 시간보다는 작아야 한다.
        if (arriveDate.getTime() > d.getTime() && arriveDate.getTime() < waitTime.getTime()) {

          if (countSave == 0) { //최초 저장
            beforeTimeHour = getStationTimeTableTime[0]
            beforeRoute = subwaydRoute
            countSave++ //올려줌
            textField += stationList[num].stationName + '역은 ' + subwaydRoute + '행이 ' + getStationTimeTableTime[0] + '시 ' + getStationTimeTableTime[1] + '분, '
          } else {

            //루트가 이전 루트와 같다면
            if (beforeRoute == subwaydRoute) {
              //추가안함
            } else {
              //같지 않다면 추가
              textField += subwaydRoute + '행이 '
              beforeRoute = subwaydRoute //루트 갱신
            }

            //시간이 이전 시간과 같다면 그냥 분만 추가
            if (beforeTimeHour == getStationTimeTableTime[0]) {
              textField += getStationTimeTableTime[1] + '분, '
            } else { // 이전시간과 다르다면 시와 분 추가후 이전 시간 갱신
              beforeTimeHour = getStationTimeTableTime[0]
              textField += getStationTimeTableTime[0] + '시 ' + getStationTimeTableTime[1] + '분, '
            }
          } //countSave == 0

        }

      } // for
      textField += '열차들이 ' + userWaitTime + '분 안에 있습니다. '

      //열차가 없었다면 텍스트 교체
      if (countSave == 0) textField = '설정하신 ' + stationList[num].stationName + '역에는 현재 시간 내에 도착하는 열차가 없습니다. ';

    } //200

    output.stationTimetableOauth = textField + lastText
    return res.send(makeJson(output));
  } // station_timetable_oauth_action

  /**
   * 지하철 실시간 Oauth
   */

  async function station_realtime_oauth_action() {
    let textField = '' //텍스트 필드

    //oauth 연동여부 체크
    if (!oauthFlag) {
      textField = '이 기능은 계정연동이 필요합니다. 계정연동을 하신 후 이용해 주세요. '
      output.stationRealtimeOauth = textField
      return res.send(makeJson(output))
      return;
    }

    //리스트는 0부터 시작하는관계로 -1을 해준다.
    const num = parseInt(commuteUtil.fisrtTransName(req.body.action.parameters.SubwayRealNumOauth.value)) - 1 // 버스넘버: 1~10
    console.log('num ',  num)
    const myinfo = await myInfoSQL(accessToken)
    const subwayJson = JSON.parse(myinfo.subway)

    const subwayJsonList = subwayJson.list //리스트 불러오기

    //저장 기능확인
    if (subwayJsonList.length < (num + 1)) {
      textField = '그 번호엔 저장된 역 정보가 없습니다. 로그인 후 페이지에서 설정하신 후 사용해 주세요. '
      output.stationRealtimeOauth = textField
      return res.send(makeJson(output))
      return;
    }

    //상태 이상 처리
    if (subwayJsonList[num].status) { //true
      let insertData = {}
      insertData.stationName = subwayJsonList[num].stationName
      const line = (subwayJsonList[num].line)
      let getStationRealtime = await subwayRealtime(insertData);
      //console.log(getStationRealtime)
      getStationRealtime = await realtimeRecursion(getStationRealtime, insertData)

      //역 에러 처리
      if (getStationRealtime.code == 600) {
        textField = '죄송합니다. ' + subwayJsonList[num].stationName + ' 역은 현재 일시적인 서버 이상이 있어서 정보를 불러올 수 없었습니다. ' + lastText
        output.stationRealtimeOauth = textField
        return res.send(makeJson(output))

      } else if (getStationRealtime.code == 500) {
        // 역 안다닐땐 500처리
        textField = '현재 ' + subwayJsonList[num].stationName + ' 역은 열차가 다니고 있지 않습니다. 영업시간이 아닐 가능성이 높습니다. ' + lastText
        output.stationRealtimeOauth = textField
        return res.send(makeJson(output))
      }


      //200 정상처리
      const getStationRealtimeList = getStationRealtime.list
      textField += subwayJsonList[num].stationName + '역 ' + commuteUtil.subwayCodeToLineStr(subwayJsonList[num].line) + ' ' + commuteUtil.updn(subwayJsonList[num].updown) + '행 열차도착은 '
      //stationName + '역 ' + commuteUtil.subwayCodeToLineName(stationLine)+' '
      for (var i = 0; i < getStationRealtimeList.length; i++) {

        const statusMessage = getStationRealtimeList[i].arvlMsg2 // 전역 출발	14분 후 (마천)
        const updnLine = getStationRealtimeList[i].updnLine // 상행하행
        const subwaylineStr = (getStationRealtimeList[i].subwayId).substring(2, 4) //열차 라인: 열차번호에서 추출
        const stationLineCode = commuteUtil.subwayLineToCode(subwayJsonList[num].line) //역 라인을 코드변환

        // console.log(getStationRealtimeList[i].subwayId)
        // console.log(subwayJsonList[num].line)
        // console.log(stationLineCode)
        // console.log(subwaylineStr)

        //같은 호선의 열차만 추출 commuteUtil.subwayCodeToLine(line) == subwaylineStr &&
        if (commuteUtil.updn(getStationRealtimeList[i].updnLine) == subwayJsonList[num].updown && stationLineCode == subwaylineStr) {
          textField += statusMessage + ', '
        }

      } //for
      textField += '입니다. ' + lastText
    } else {
      textField = '저장되지 않은 번호입니다. 계정의 나의 교통정보에서 노선을 저장하신 후 사용해주세요. ' + lastText
    }

    output.stationRealtimeOauth = textField
    return res.send(makeJson(output))
  } // station_realtime_oauth_action

  /**
   * 교통 이메일 Oauth
   */
  async function traffic_my_oauth_email_action() {
    let textField = '' //텍스트 필드
    //oauth 연동여부 체크
    if (!oauthFlag) {
      textField = '이 기능은 계정연동이 필요합니다. 계정연동을 하신 후 이용해 주세요. '
      output.trafficMyOauthEmail = textField
      return res.send(makeJson(output))
      return;
    }
    const location = req.body.action.parameters.trafficLocationOauth.value //집 회사 기타
    const myinfo = await myInfoSQL(accessToken)
    const trafficJson = JSON.parse(myinfo.traffic)

    let myLocation = '';
    let centerLat
    let centerLon

    switch (location) {
      case '집':
        myLocation = trafficJson.home
        break;
      case '회사':
        myLocation = trafficJson.company
        break;
      case '기타':
        myLocation = trafficJson.etc
        break;
    }

    //저장 여부 확인
    if (!myLocation.status) {
      textField = '말하신 장소는 설정되지 않았습니다. 로그인 후 페이지에서 설정하신 후 사용해 주세요. '
      output.trafficMyOauthEmail = textField
      return res.send(makeJson(output))
      return;
    }
    //위치받기
    centerLat = myLocation.centerLat
    centerLon = myLocation.centerLon

    //조회하기
    let insertData = {}
    insertData.centerLat = centerLat
    insertData.centerLon = centerLon
    const getTrafficInfo = await trafficInfo(insertData);

    //서버이상 여부
    if (getTrafficInfo.code != 200) {
      textField = '죄송합니다. 서버에 이상이 있어서 정보를 불러올 수 없었습니다. '
    } else {
      const getTrafficList = getTrafficInfo.list
      /**
       * 교통정보 이메일로 보내기
       */
      textField = '말하신 지역의 교통 종합 정보를 이메일로 보냈습니다. '
    }

    textField += lastText
    output.trafficMyOauthEmail = textField
    return res.send(makeJson(output))
  }

  /**
  교통 정보 처리 Oauth
  **/
  async function traffic_my_oauth_action() {
    let textField = '' //텍스트 필드
    //oauth 연동여부 체크
    if (!oauthFlag) {
      textField = '이 기능은 계정연동이 필요합니다. 계정연동을 하신 후 이용해 주세요. '
      output.trafficMyOauth = textField
      return res.send(makeJson(output))
      return;
    }
    const location = req.body.action.parameters.trafficLocationOauth.value //집 회사 기타
    const myinfo = await myInfoSQL(accessToken)
    const trafficJson = JSON.parse(myinfo.traffic)

    let myLocation = '';
    let centerLat
    let centerLon

    switch (location) {
      case '집':
        myLocation = trafficJson.home
        break;
      case '회사':
        myLocation = trafficJson.company
        break;
      case '기타':
        myLocation = trafficJson.etc
        break;
    }

    //저장 여부 확인
    if (!myLocation.status) {
      textField = '말하신 장소는 설정되지 않았습니다. 로그인 후 페이지에서 설정하신 후 사용해 주세요. '
      output.trafficMyOauth = textField
      return res.send(makeJson(output))
      return;
    }
    //위치받기
    centerLat = myLocation.centerLat
    centerLon = myLocation.centerLon

    //조회하기
    let insertData = {}
    insertData.centerLat = centerLat
    insertData.centerLon = centerLon
    const getTrafficInfo = await trafficInfo(insertData);

    //서버이상 여부
    if (getTrafficInfo.code != 200) {
      textField = '죄송합니다. 서버에 이상이 있어서 정보를 불러올 수 없었습니다. '
    } else {
      const getTrafficList = getTrafficInfo.list
      let congestion = 0

      //혼잡도 더하기
      for (var i = 0; i < getTrafficList.length; i++) {
        //get jsonvalue
        //혼잡도 입니다. - 0: 정보없음 - 1: 원할 - 2: 서행 - 3: 지체 - 4: 정체
        congestion += getTrafficList[i].properties.congestion
      }
      //결과 분석
      const resultCongestion = commuteUtil.congestion(congestion / getTrafficList.length)
      textField = '현재 ' + myLocation.cityname + '의 혼잡도는 ' + resultCongestion
    }
    //이메일로 정보를 받고 싶다면 교통 정보를 이메일로 보내줘 라고 해주세요. '
    textField += '입니다.' + lastText
    output.trafficMyOauth = textField
    return res.send(makeJson(output))
  } // traffic_my_oauth_action


  /**
   * 종합 요약 : todaynow_oauth_action
   * 차량정보 듣을지 여부 (설정에서 설정가능)
   * return : todayNowOauth
   */
  async function todaynow_oauth_action() {

    let textField = '' //텍스트 필드
    //oauth 연동여부 체크
    if (!oauthFlag) {
      textField = '이 기능은 계정연동이 필요합니다. 계정연동을 하신 후 이용해 주세요. '
      output.todayNowOauth = textField
      return res.send(makeJson(output))
      return;
    }

    textField = '그럼 종합정보를 알아보겠습니다. '
    //토큰으로 내 정보 가져오기
    const myinfo = await myInfoSQL(accessToken)

    const myLocation = myinfo.location
    let insertData = {}
    insertData.location = myLocation

    //SQL사용
    /**
     * 날씨정보
     */

    const getWeatherMiseInfo = await nowWeatherMiseSQL(insertData) //T1H(varchar : Num), mise(varchar), PTY(varchar :Num)
    //미세먼지는 12월 부터 4월까지 발생 5월 부터 11월까지는 안내 안함
    if (myinfo.weather == 'true') {
      if ((d.getMonth() + 1) < 5 && (d.getMonth() + 1) > 11) {
        textField += myLocation + '의 날씨는 ' + commuteUtil.weatherStatus(getWeatherMiseInfo.PTY) + '에 ' + getWeatherMiseInfo.T1H + '도 이며, 미세먼지는 ' + (getWeatherMiseInfo.mise).trim() + ' 입니다. '
      } else {
        textField += myLocation + '의 날씨는 ' + commuteUtil.weatherStatus(getWeatherMiseInfo.PTY) + '에 ' + getWeatherMiseInfo.T1H + '도 입니다. '
      }
    }

    /**
     * 버스시간
     */
    //버스정보
    const busJson = JSON.parse(myinfo.bus).list
    let textBus = '';
    //저장 기능확인
    for (var i = 0; i < busJson.length; i++) {
      //사용 여부 확인
      if (busJson[i].use == 'N') {
        continue;
      }

      let insertData = {}
      insertData.arsId = busJson[i].arsId
      const getBusinfo = await businfo(insertData);

      //즐겨찾기 기능 구현
      const favorite = (busJson[i].favorite).split(',')
      const useFlag = favorite.length

      //없는 버스
      if (getBusinfo.code != 200) {

      } else {
        //있는 버스
        const buslist = getBusinfo.list
        //List for
        for (var j = 0; j < buslist.length; j++) {

          const busName = buslist[j].rtNm // 버스이름 (서초01, 641 형태)
          const bus1 = buslist[j].arrmsg1 // 1번째 버스 예상시간
          const bus2 = buslist[j].arrmsg2 // 2번째 버스 예상시간

          //저상버스 여부 (for handicap)
          let busType1 = '';
          let busType2 = '';
          if (buslist[j].busType1 == 1) busType1 = '저상, ';
          if (buslist[j].busType2 == 1) busType2 = '저상, ';

          //저장되 있는 거라면 length 에서 찾아서 저장(저장된 것만 불러옴)
          if (useFlag != 0) { //true

            for (var k = 0; k < favorite.length; k++) {
              if (busName == favorite[k]) {
                //makeText
                textBus += busName + '의 첫번째 버스는 ' + busType1 + ' ' + bus1 + '이며, 2번째 버스는 ' + busType2 + bus2 + ', '

              }
            } //List for
          }

          if (buslist.length - 1 == j) textBus += '입니다. ';

        } // for

        if (buslist.length != 0) textField += textBus

      }

    }



    //subway List
    const stationList = JSON.parse(myinfo.subway).list
    let textSubway = '전철은 '

    //subway for
    for (var i = 0; i < stationList.length; i++) {
      //저장 기능확인
      if (stationList[i].use == 'N') {
        continue;
      }

      let insertData = {}
      insertData.stationCode = stationList[i].stationCode // 지하철 코드
      insertData.stationLine = stationList[i].line // 호선 : s01
      insertData.updown = commuteUtil.sidoUpdown(stationList[i].sido, stationList[i].updown) //상하행선 -> 부산의 경우 0, 1
      insertData.sido = stationList[i].sido // 도시 : 서울 부산 인천만 가능
      insertData.day = commuteUtil.sidoTime(d.getDay()) // 요일 입력 -> 인천이면 특수처리

      let getStationTimetable = ''

      if (stationList[i].sido == '서울' || stationList[i].sido == '인천') {
        getStationTimetable = await subwayTimetable(insertData)
      } else if (stationList[i].sido == '부산') {
        //부산의 경우 시+분 String으로 추가 데이터를 보내야 한다.
        insertData.starttime = ('0' + d.getHours()).slice(-2) + '' + ('0' + d.getMinutes()).slice(-2)
        getStationTimetable = await subwayTimetableForBusan(insertData)
      }


      if (getStationTimetable.code == 300) {

      } else if (getStationTimetable.code == 400) {

      } else {

        const stationTimetablelist = getStationTimetable.list

        //유저설정: 유저설정이 없으면 그냥 25분으로 설정
        const userWaitTime = parseInt(myinfo.waitTimeSubway)
        //최대 기다릴수 있는 시각 = 현재시각 + 유저타임
        const waitTime = new Date(d.getTime() + userWaitTime * 60000)

        let countSave = 0;
        let beforeTimeHour = ''
        let beforeRoute = ''

        //List
        for (var j = 0; j < stationTimetablelist.length; j++) {
          //get jsonvalue

          const getStationTimeTableTime = (stationTimetablelist[j].ARRIVETIME).split(':') // EX: "05:57:50"
          const subwaydRoute = stationTimetablelist[j].SUBWAYENAME // 마천/상일동
          //도착 타임테이블 시간

          let arriveDate = new Date(d.getFullYear(), new Date().getMonth(), new Date().getDate(), getStationTimeTableTime[0], getStationTimeTableTime[1], getStationTimeTableTime[2])

          // 도착 가능한 예정시간은 현재시간 보다는 크거나, 최대 기다릴수 있는 시간보다는 작아야 한다.
          if (arriveDate.getTime() > d.getTime() && arriveDate.getTime() < waitTime.getTime()) {
            //console.log(getStationTimeTableTime[0] + '시' + getStationTimeTableTime[1] + '분')
            if (countSave == 0) { //최초 저장
              beforeTimeHour = getStationTimeTableTime[0]
              beforeRoute = subwaydRoute
              countSave++ //올려줌
              textSubway += stationList[i].stationName + '역은 ' + subwaydRoute + '행이 ' + getStationTimeTableTime[0] + '시 ' + getStationTimeTableTime[1] + '분, '
            } else {

              //루트가 이전 루트와 같다면
              if (beforeRoute == subwaydRoute) {
                //추가안함
              } else {
                //같지 않다면 추가
                textSubway += subwaydRoute + '행이 '
                beforeRoute = subwaydRoute //루트 갱신
              }

              //시간이 이전 시간과 같다면 그냥 분만 추가
              if (beforeTimeHour == getStationTimeTableTime[0]) {
                textSubway += getStationTimeTableTime[1] + '분, '
              } else { // 이전시간과 다르다면 시와 분 추가후 이전 시간 갱신
                beforeTimeHour = getStationTimeTableTime[0]
                textSubway += getStationTimeTableTime[0] + '시 ' + getStationTimeTableTime[1] + '분, '
              }
            } //countSave == 0
          }

        } // for

        if (countSave != 0) textField += textSubway + '입니다. '

      } //200

    } //for subway timetable


    //교통 정보
    const traffic = JSON.parse(myinfo.traffic)
    let textTraffic = ''
    const trafficArray = [traffic.home, traffic.company, traffic.etc]
    //for traffic
    let countText = 0
    for (var i = 0; i < trafficArray.length; i++) {
      if (trafficArray[i].use == 'Y') {

        if (trafficArray[i].centerLon == '' || trafficArray[i].centerLat == '') {
          continue;
        }

        let insertData = {}
        insertData.centerLat = trafficArray[i].centerLat
        insertData.centerLon = trafficArray[i].centerLon

        const getTrafficInfo = await trafficInfo(insertData);

        if (getTrafficInfo.code != 200) {


        } else {
          const getTrafficList = getTrafficInfo.list
          let congestion = 0

          //혼잡도 계산 for 문
          //공식 : 전체를 더한후 리스트 length로 나누어서 평균값.
          for (var j = 0; j < getTrafficList.length; j++) {
            //get jsonvalue
            //혼잡도 입니다. - 0: 정보없음 - 1: 원할 - 2: 서행 - 3: 지체 - 4: 정체
            congestion += getTrafficList[j].properties.congestion
          } //List for
          // 혼잡도  = 전체 혼잡도를 리스트 길이로 나누기
          const congestionResult = parseInt(congestion) / getTrafficList.length
          textTraffic += trafficArray[i].cityname + '의 평균 혼잡도는 ' + commuteUtil.congestion(congestionResult) + ', '

        } // getTrafficInfo.code != 200

        countText++;
      } //Y


    } // for traffic
    if(countText != 0){
      textField += textTraffic+ '입니다. '
    }

    textField += lastText;
    output.todayNowOauth = textField
    return res.send(makeJson(output))
  }

  async function my_subway_route_oauth_action() {
    let textField = '' //텍스트 필드

    //oauth 연동여부 체크
    if (!oauthFlag) {
      textField = '이 기능은 계정연동이 필요합니다. 계정연동을 하신 후 이용해 주세요. '
      output.mySubwayRouteOauth = textField
      return res.send(makeJson(output))
      return;
    }


    //역
    let startStation = '';
    if (req.body.action.parameters.hasOwnProperty('startStationOauth')) {
      startStation = req.body.action.parameters.startStationOauth.value
    }

    //역
    let endStation = '';
    if (req.body.action.parameters.hasOwnProperty('endStationOauth')) {
      endStation = req.body.action.parameters.endStationOauth.value
    }

    const myinfo = await myInfoSQL(accessToken)
    const trafficJson = JSON.parse(myinfo.traffic)

    let myLocation = ''

    switch (startStation) {
      case '집':
        myLocation = trafficJson.home
        break;
      case '회사':
        myLocation = trafficJson.company
        break;
      case '기타':
        myLocation = trafficJson.etc
        break;
    }

    //centerLon x , centerLat y
    let searchStation = stationCodeXy.subwayXY('mylocation', endStation)
    searchStation.startX = myLocation.centerLon
    searchStation.startY = myLocation.centerLat
    const subwayRouteParse = await subwayRoute(searchStation)

    //에러시
    if (subwayRouteParse.code == 600) {
      output.mySubwayRouteOauth = '죄송합니다. 중복되는 역 혹은 존재하지 않는 역을 말하신거 같습니다. ' + lastText
      return res.send(makeJson(output))
      return;
    }

    //에러시
    if (subwayRouteParse.code != 200) {
      output.mySubwayRouteOauth = '죄송합니다. 존재하지 않는 역을 말했거나 서버에 이상이 있습니다. ' + lastText
      return res.send(makeJson(output))
      return;
    }
    //정상시
    const subwayRouteList = subwayRouteParse.list[0].pathList
    const subwayRoutePrice = '요금은 ' + commuteUtil.subwayPrice(subwayRouteParse.list[0].distance) + '원 입니다. '
    const subwayRouteTime = '총 ' + subwayRouteParse.list[0].time + '분 걸리며, ' + subwayRoutePrice
    for (var i = 0; i < subwayRouteList.length; i++) {
      const line = subwayRouteList[i].routeNm // 호: 5호선
      const sStation = subwayRouteList[i].fname //시작역: 둔촌역
      const eStation = subwayRouteList[i].tname //끝역: 대치역
      const stationLength = (subwayRouteList[i].railLinkList).length
      if (subwayRouteList.length == 1) {
        textField += sStation + '에서 ' + line + '을 타고 ' + stationLength + '정거장 지나서 ' + eStation + '에서 내리면 됩니다. '
      } else {
        if (i == 0) {
          textField += sStation + '에서 ' + line + '을 타고 ' + stationLength + '정거장 지나서 ' + eStation + '에서 갈아 탄 후, '
        }
        if (i == subwayRouteList.length - 1) {
          textField += sStation + '에서 ' + line + '을 타고 ' + stationLength + '정거장 지나서 ' + eStation + '에서 내리면 됩니다. '
        }
      }

    }

    textField += subwayRouteTime + lastText

    output.mySubwayRouteOauth = textField
    return res.send(makeJson(output))
  }

  //====================================================================

  function help_action() {

    let textField = '교통마스터는 실시간 버스정류장의 상황과 지하철 시간표, 교통상황을 알려드립니다. '

    //oauthFlag
    if (oauthFlag) {
      textField += randomField(
        '현재는 계정연동 중이라 번호로 다양한 기능을 사용가능 합니다. 지원되는 명령어라고 말하시면 어떻게 사용하는지 알려드립니다.  ',
        '현재는 계정연동 중이라 번호로 다양한 기능을 사용가능 하며, 지원되는 명령어라고 말하시면 어떻게 사용하는지 알려드립니다.  ',
      )
    } else {
      textField += randomField(
        '현재는 계정연동이 아니기에 지하철 역 루트, 30분 내 도착 시간표, 실시간 도착안내 기능을 지원하고 있습니다. 지원되는 명령어라고 말하시면 어떻게 사용하는지 알려드립니다.  ',
        '현재는 계정연동이 아니기에 날씨와 광역시 혼잡도 그리고 최저가 주유소를 지원하고 있습니다. 지원되는 명령어라고 말하시면 어떻게 사용하는지 알려드립니다.  ',
      )
    }

    output.help = textField
    return res.send(makeJson(output));
  }

  //명령어 1개 랜덤으로 알려줌
  function support_action() {
    let textField = '교통마스터가 지원하는 명령어 중 한가지는 '
    if (oauthFlag) {
      textField += randomField(
        '서울 종로구의 교통 혼잡도를 알려줘, ',
        '7호선 남성역의 상행선 시간표를 알려줘, ',
        '보문역에서 강남역까지 가는 방법을 알려줘, ',
        '5호선 강동역의 방화행 실시간 도착을 알려줘, ',
        '부산 진구의 최저가 주유소를 알려줘, ',
        '부산의 날씨를 알려줘, ',
        //계정연동
        ' 하우스의 교통정보를 알려줘, ',
        '이메일을 보내줘, ',
        ' 종합 정보를 알려줘, ',
        ' 나의 주유소 가격정보, ',
        ' 첫번째 버스를 알려줘, ',
        ' 첫번째 지하철 역을 알려줘, ',
        '첫번째 버스를 알려줘, '
      )
    } else {
      textField += randomField(
        '서울 종로구의 교통 혼잡도를 알려줘, ',
        '7호선 남성역의 상행선 시간표를 알려줘, ',
        '보문역에서 강남역까지 가는 방법을 알려줘, ',
        '5호선 강동역의 방화행 실시간 도착을 알려줘, ',
        '부산 진구의 최저가 주유소를 알려줘, ',
        '부산의 날씨를 알려줘, ')
    }

    textField += '입니다. '+ lastText

    output.support = textField
    return res.send(makeJson(output));
  }

  //Oauth 안쓰고도 물어볼수는 있음
  const STATION_TIMETABLE_INTENT = 'action.stationTimetable'; // 지하철 역 시간표
  const STATION_REALTIME_INTENT = 'action.stationRealtime'; // 지하철 역 실시간
  const WEATHER_MISE_NOW_INTENT = 'action.weatherMiseNow'; //오늘의 날씨와 미세먼지(밖에 나가기 좋은지)
  const OILINFO_INTENT = 'action.oilinfo'; // 6대 광역도시 주유소 정보
  const TRAFFIC_INTENT = 'action.traffic'; // 6대 광역도시 교통정보 (구로 묻기)
  const SUBWAYROUTE_INTENT = 'action.subwayRoute'; // 경로 안내 지하철
  //Oauth ======================================================================
  const BUS_OAUTH_INTENT = 'action.busOauth'; //버스 정류장 (저장한 번호)
  const STATION_TIMETABLE_OAUTH_INTENT = 'action.stationTimeTableOauth'; //지하철 역 시간표대로
  const STATION_REALTIME_OAUTH_INTENT = 'action.stationRealtimeOauth'; //실시간 지하철
  const OILINFO_OAUTH_INTENT = 'action.oilinfoOauth'; // 최저가 주유소 정보
  const OILINFO_EMAIL_OAUTH_INTENT = 'action.oilinfoEmailOauth'; // 최저가 주유소 이메일 보내기
  const TRAFFIC_MY_OAUTH_INTENT = 'action.trafficMyOauth'; //서울 + 인천 + 부산의 교통정보: 저장된 위치
  const TRAFFIC_MY_OAUTH_EMAIL_INTENT = 'action.trafficMyOauthEmail'
  const TODAYNOWOAUTH_INTENT = 'action.todayNowOauth'; //종합 요약
  const MY_SUBWAYROUTE_OAUTH_INTENT = 'action.mySubwayRouteOauth'
  //========================================================================
  //퀄리티
  const HELP_INTENT = 'action.help' //도움말
  const SUPPORT_INTENT = 'action.support' //지원되는 메뉴 랜덤으로 3개정도
  //========================================================================
  //최초 시작 부분
  //========================================================================

  switch (tagId) { //intent 별 분기처리
    //일반 묻기
    case STATION_TIMETABLE_INTENT: // 지하쳘 역 시간표 비교
      station_timetable_action()
      break;

    case STATION_REALTIME_INTENT: // 지하철 역 리얼
      station_realtime_action()
      break;

    case WEATHER_MISE_NOW_INTENT: // 날씨 미세먼지
      weather_mise_now_action()
      break;

    case OILINFO_INTENT: // 석유가격 (구 받아서)
      oilinfo_action()
      break;

    case TRAFFIC_INTENT: // 교통조회
      traffic_action()
      break;

    case SUBWAYROUTE_INTENT: // 경로 안내
      subway_route_action()
      break;
      /**
       * Oauth 기능 이용
       */
    case BUS_OAUTH_INTENT: // 버스정보
      bus_oauth_action()
      break;

    case STATION_TIMETABLE_OAUTH_INTENT: //지하철 시간표
      station_timetable_oauth_action()
      break;

    case STATION_REALTIME_OAUTH_INTENT: //실시간 지하철
      station_realtime_oauth_action()
      break;

    case TRAFFIC_MY_OAUTH_INTENT: //집 회사 기타 교통정보
      traffic_my_oauth_action()
      break;
    case TRAFFIC_MY_OAUTH_EMAIL_INTENT: //집 회사 기타 교통정보 이메일
      traffic_my_oauth_email_action()
      break;

    case OILINFO_OAUTH_INTENT: // 주유소 최저가 가격
      oilinfo_oauth_action()
      break;

    case OILINFO_EMAIL_OAUTH_INTENT: // 주유소 최저가 가격 이메일로 보내기
      oilinfo_email_oauth_action()
      break;

    case MY_SUBWAYROUTE_OAUTH_INTENT: // 내 위치에서 경로 안내
      my_subway_route_oauth_action()
      break;

    case TODAYNOWOAUTH_INTENT: //종합 요약 기능
      todaynow_oauth_action()
      break;

    case HELP_INTENT: //일반 퀄리티 용 설명
      help_action()
      break;

    case SUPPORT_INTENT: //일반 퀄리티 용 설명
      support_action()
      break;

  } //switch

} //END
