  const request = require('request'); // request
  const Promise = require('promise');
  const api = require('../../config/api');

  function getRequest(insertData, callback) {

    let form = {};
    form.version = '1'
    form.centerLat =  insertData.centerLat // '37.5544875'
    form.centerLon =  insertData.centerLon // '126.9689441'
    form.radius = '5' //1500 고정
    form.zoomLevel = '15' //15~17
    form.trafficType = 'AROUND'
    form.appKey = api.tmap

    const url = 'https://api2.sktelecom.com/tmap/traffic'

    let options = {
      method: 'GET',
      url: url,
      encoding: null,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/603.1.1 (KHTML, like Gecko) Version/9.1.2 Safari/601.7.7'
      },
      timeout: 1000 * 30,
      qs: form
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

      const json = JSON.parse(body)

      const list = json.features

      callback(null, {
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
