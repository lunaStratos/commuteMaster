  const request = require('request'); // request
  const Promise = require('promise');
  const xml2js = require('xml2js');
  const parser = new xml2js.Parser();
  const api = require('../../config/api'); // api.api

  /*
  지하철 루트와 걸리는 시간
  XML
   */
  function getRequest(insertData, callback) {

    let url = 'http://ws.bus.go.kr/api/rest/pathinfo/getPathInfoBySubway?serviceKey=' + api.api

    //startX=127.136248&startY=37.527788&endX=127.063642&endY=37.494612
    let options = {} //request options
    options = {
      method: 'GET',
      url: url,
      encoding: null,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/603.1.1 (KHTML, like Gecko) Version/9.1.2 Safari/601.7.7'
      },
      timeout: 1000 * 30,
      qs: insertData //form 입력 Get시 qs사용, post시 form사용
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
      console.log(body.toString())
      parser.parseString(body, function(err, XmlJson) {


        const originalList = XmlJson.ServiceResult
        const headerMsg = originalList.msgHeader.headerCd //정상적으로 처리되었습니다.
        const xmlList = originalList.msgBody[0].itemList //리스트 처리
        //console.log(JSON.stringify(XmlJson))

        //데이터 없음 400 처리
        if (xmlList == undefined || headerMsg == 'INVALID REQUEST PARAMETER ERROR.') {
          callback(null, {
            code: 600,
            list: null,
            result: 'fail'
          });
          return;
        }

        callback(null, {
          code: 200,
          list: xmlList,
          result: 'success'
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
