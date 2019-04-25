  const request = require('request'); // request
  const Promise = require('promise');
  const stationCodeBook = require("./subwayCodeBusan.js");
  const api = require('../../config/api');
  function getRequest(insertData, callback) {

    const serviceKey = api.api //서비스키
    const stationCode = insertData.stationCode // 역코드
    const updown = insertData.updown // 상하행여부
    const day = insertData.day //평일 휴일
    const starttime = insertData.starttime

    const url = 'http://data.humetro.busan.kr/voc/api/open_api_process.tnn?serviceKey=' + serviceKey + '&day=' + day + '&updown=' + updown + '&stime=' + starttime + '&act=json&scode=' + stationCode

    let options = {
      method: 'GET',
      url: url,
      encoding: null,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/603.1.1 (KHTML, like Gecko) Version/9.1.2 Safari/601.7.7'
      },
      timeout: 1000 * 30
    }

    //request module
    request(options, function(err, resp, body) {
      //에러시 처리
      if (err) {
        callback(err, {
          code: 400,
          email: '',
          status: 'fail'
        });
        return;
      }
      //console.log('body: ' + body)

      const json = JSON.parse(body)

      //error
      if (json.response.header.resultCode != '00') {
        callback(err, {
          code: 400,
          email: '',
          status: 'fail'
        });
        return;
      }

      //Get 200 info
      const list = json.response.body.item;

      let resultList = []//output list

      for (var i = 0; i < list.length; i++) {
        resultList.push({
          'ARRIVETIME': (list[i].hour + ':' + list[i].time + ':00'),//시간 완성
          'SUBWAYSNAME': stationCodeBook.subwayCodeToNameBusan(list[i].endcode)// 역 이름으로 변경해서 저장
        })
      }
      callback(err, {
        code: 200,
        list: resultList,
        status: 'ok'
      });

    });

  }

  // promise async
  const getSync = (insertData) => new Promise(function(resolved, rejected) {
    getRequest(insertData, function(err, result) {
      if (err) {
        rejected(err);
      } else {
        resolved(result);
      }
    });
  });

  //kmdata()
  module.exports = getSync
