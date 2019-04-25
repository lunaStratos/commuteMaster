  const request = require('request'); // request
  const Promise = require('promise');
  var xml2js = require('xml2js');
  var parser = new xml2js.Parser();
  const api = require('../../config/api');

  //휘발유:B027, 경유:D047, 고급휘발유: B034, 실내등유: C004, 자동차부탄: K015
  function getRequest(insertData, callback) {

    let form = {};

    let url = "http://www.opinet.co.kr/api/aroundAll.do";
    form.x = insertData.x;
    form.y = insertData.y;
    form.prodcd = insertData.prodcd;
    form.radius = '1000'; // 1000m
    form.sort = '1'; //가격으로 정리
    form.code = api.oilInfo
    form.out = 'json'

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


      const result = JSON.parse(body);
      const OilArray = result.RESULT.OIL;
      if (OilArray[0] == undefined) {
        //callback
        callback(null, {
          code: 400,
          result: 'fail'
        });

      } else {


        //callback
        callback(null, {
          code: 200,
          list: OilArray,
          result: 'success'
        });

      }

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
