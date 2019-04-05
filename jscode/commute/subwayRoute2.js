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
    //api.api
    const url = 'http://swopenapi.seoul.go.kr/api/subway/' + '5a6851595968696b373747544e5a79' + '/json/shortestRoute/0/5/' + encodeURI(insertData.startStation)+ '/' + encodeURI(insertData.endStation)
    console.log(url)

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
      let jsonparse = ''

      try {
        jsonparse = JSON.parse(body)
      } catch (e) {
        callback(err, {
          code: 600,
          email: '',
          status: 'fail'
        });
        return;
      } finally {

      }

      if (jsonparse.hasOwnProperty('status')) {
        if (jsonparse.status == 500) {
          callback(err, {
            code: 400,
            email: '',
            status: 'fail'
          });
          return;
        }
      }




      callback(null, {
        code: 200,
        list: jsonparse.shortestRouteList[0],
        result: 'success'
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
