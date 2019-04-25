  const request = require('request'); // request
  const Promise = require('promise');
  const api = require('../../config/api');

  function getRequest(insertData, callback) {

    const serviceKey = api.seoulTimetable //서비스키
    const stationCode = insertData.stationCode // 역코드
    const updown = insertData.updown // 상하행여부
    const day = insertData.day //평일 휴일
    const url = 'http://openAPI.seoul.go.kr:8088/' + serviceKey + '/json/SearchSTNTimeTableByIDService/1/300/' + stationCode + '/' + day + '/' + updown + '/'
    //http://openAPI.seoul.go.kr:8088/sample/json/SearchSTNTimeTableByIDService/1/300//1/1/
    //console.log(url)
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

      //console.log('body: ' + body.toString())

      const json = JSON.parse(body)

      //error
      if (json.hasOwnProperty('RESULT')) {
        callback(err, {
          code: 300,
          list: '',
          status: 'fail'
        });
        return;
      }

      //error
      if (json.SearchSTNTimeTableByIDService.RESULT.CODE != 'INFO-000') {
        callback(err, {
          code: 400,
          list: '',
          status: 'fail'
        });
        return;
      }

      //Get 200 info
      const list = json.SearchSTNTimeTableByIDService.row;
      callback(err, {
        code: 200,
        list: list,
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
