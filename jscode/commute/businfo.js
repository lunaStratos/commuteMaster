  const request = require('request'); // request
  const Promise = require('promise');
  const xml2js = require('xml2js');
  const parser = new xml2js.Parser();
  const api = require('../../config/api'); // api.api

  function getRequest(insertData, callback) {

    let url = 'http://ws.bus.go.kr/api/rest/stationinfo/getStationByUid?serviceKey=' + api.api
    let forms = {} //form
    forms.arsId = insertData.arsId

    let options = {} //request options
    options = {
      method: 'GET',
      url: url,
      encoding: null,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/603.1.1 (KHTML, like Gecko) Version/9.1.2 Safari/601.7.7'
      },
      timeout: 1000 * 30,
      qs: forms //form 입력 Get시 qs사용, post시 form사용
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


      parser.parseString(body, function(err, XmlJson) {
        let resultform = {}

        const originalList = XmlJson.ServiceResult
        const headerMsg = originalList.headerMsg //정상적으로 처리되었습니다.
        const xmlList = originalList.msgBody[0].itemList //리스트 처리
        //console.log(JSON.stringify(XmlJson))

        if (originalList.hasOwnProperty('msgHeader')) {
          if(originalList.msgHeader[0].headerMsg == '결과가 없습니다.'){
            callback(null, {
              code: 400,
              list: null,
              result: 'fail'
            });
            return;
          }
        }
        
        //데이터 없음 400 처리
        if (xmlList == undefined || headerMsg == 'INVALID REQUEST PARAMETER ERROR.') {
          callback(null, {
            code: 600,
            list: null,
            result: 'fail'
          });
          return;
        }


        //  stationId(정류소 아이디), stationNm(정류소 이름), gpsX(127), gpsY(36), arsId, dist(거리)
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
