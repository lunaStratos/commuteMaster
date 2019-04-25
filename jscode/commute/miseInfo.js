  const request = require('request'); // request
  const Promise = require('promise');
  const api = require('../../config/api');
  function getRequest(insertData, callback) {

    let form = {};

    const serviceKey = // api.api
    form.ver = '1.3'
    form.numOfRows = '1'
    form.pageNo = '1'
    form.sidoName = insertData.location
    form.serviceKey = serviceKey
    const url = 'http://openapi.airkorea.or.kr/openapi/services/rest/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty'

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
      //console.log(body)

      parser.parseString(body, function(err, XmlJson) {
        if (XmlJson.response.header.resultCode != 00) { // 에러없음
          callback(null, {
            code: 400,
            status: 'fail'
          });
          return;
        }

        const list = XmlJson.response.body.items
        callback(null, {
          code: 200,
          list: list,
          status: 'ok'
        });

      }); //xml parser

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
