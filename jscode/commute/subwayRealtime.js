  const request = require('request'); // request
  const Promise = require('promise');
  const api = require('../../config/api');

  function getRequest(insertData, callback) {

    const serviceKey = api.seoulRealtime //서비스키
    const stationName = encodeURI(insertData.stationName) // 역 이름(코드 아님)
    const url = 'http://swopenapi.seoul.go.kr/api/subway/' + serviceKey + '/json/realtimeStationArrival/0/30/' + stationName

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
          code: 600,
          email: '',
          status: 'fail'
        });
        return;
      }

      console.log('body: ' + body)
      /**
      일반에러처리:400
      열차없음 500
      정상 200
      */
      //error: status
      if (body.indexOf('Service Temporarily Unavailable') != -1) {
        callback(err, {
          code: 600,
          email: '',
          status: 'fail'
        });
        return;
      }

      let json = '';

      try {
        json = JSON.parse(body)
      } catch (e) {
        callback(err, {
          code: 600,
          email: '',
          status: 'fail'
        });
      }

      //error: status
      if (json.hasOwnProperty('status')) {
        if (json.status != 200) {
          callback(err, {
            code: 500,
            email: '',
            status: 'fail'
          });
          return;
        }
      }



      //error
      if (json.errorMessage.status != 200) {
        callback(err, {
          code: 400,
          email: '',
          status: 'fail'
        });
        return;
      }

      //Get 200 info
      const list = json.realtimeArrivalList;
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
