var express = require('express');
var router = express.Router();

const session = require('express-session');
var fs = require("fs");
var ejs = require("ejs");

var transporter = require("../config/emailConfig");
let randomCode = require("../jscode/authmail.js");
let checkCode = require("../jscode/checkForm.js");
let knex = require("../config/database");
var refreshToken = require("../jscode/refreshToken"); // Refresh토큰 실행기
let moduleRequest = require("../jscode/moduleRequest");
const commuteUtil = require("../jscode/commute/commuteUtil.js");
const stationCodeBook = require("../jscode/commute/subwayCode.js");
const checkForm = require("../jscode/commute/checkForm.js");
const stationCodeBookBusan = require("../jscode/commute/subwayCodeBusan.js");
const emailinfo = require('../config/emailInfo'); //이메일

router.use(session({
  key: 'sid',
  secret: '1q2w3e4r',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60
  }
}));

router.use(function(req, res, next) {
  res.locals.email = req.session.email;
  next();
});


//로그인 화면 & 회원가입만 보여줌
router.get('/', function(req, res) {
  console.log('commuteMaster')
  //로그인 페이지로 이동
  if (req.session.email == undefined) {
    return res.render('commuteMaster/login.ejs')
  } else { // 로그인 되 있는 경우 바로 Dashboard로 이동
    return res.render('commuteMaster/index.ejs', {
      email: req.session.email
    })
  }

});

//로그인 화면 & 회원가입만 보여줌
router.get('/login', function(req, res) {
  console.log('commuteMaster')
  //로그인 페이지로 이동
  if (req.session.email == undefined) {
    return res.render('commuteMaster/login.ejs')
  } else { // 로그인 되 있는 경우 바로 Dashboard로 이동
    return res.render('commuteMaster/index.ejs', {
      email: req.session.email
    })
  }

});


//로그인 email
router.post('/checkemail', function(req, res) {
  console.log('checkemail')

  const email = (req.body.email).toLowerCase();
  //SQL 넘어가기
  knex.select('email').from('AutumnRain_Users').where({
      email: email,
    })
    .then(rows => {
      console.log('checkemail: ', rows.length)
      if (rows.length == 0) { //성공
        res.send({
          result: true
        }); //ajax
      } else { //실패
        res.send({
          result: false
        }); //ajax

      }
    }); //then
});


// 일반 로그인 post
router.post('/login', function(req, res) {
  console.log('login')
  const email = (req.body.email).toLowerCase();
  const password = req.body.password;
  console.log('password ', password)
  console.log('email ', email)

  //true 나오면 return
  let checkEmail = checkCode.checkEmail(email)
  let checkPassword = checkCode.checkPassword(password)

  if (checkEmail) {
    return res.render('./commuteMaster/login.ejs', {
      result: 'email'
    })
  }
  if (checkPassword) {
    return res.render('./commuteMaster/login.ejs', {
      result: 'password'
    })
  }

  //SQL 넘어가기
  knex('AutumnRain_Users').where({
      email: email,
      password: password,
      confirm: 'Y',
    })
    .then(rows => {
      console.log(rows.length)
      if (rows.length == 0) { //실패
        return res.render("./commuteMaster/login.ejs", {
          result: 'login'
        })
      } else { //성공
        console.log(rows.length)
        console.log('email ', email)
        console.log('password ', password)
        req.session.email = email
        req.session.password = password
        req.session.save(function(){
          return res.redirect("/commuteMaster/dashboard")
        });
        console.log('req.session.email ', req.session.email)

      }

    }); //then
});

//로그아웃
router.get('/logout', function(req, res) {
  console.log('logout')
  req.session.destroy(function() {
    req.session
  });
  res.clearCookie('sid'); // 세션 쿠키 삭제
  return res.render('./commuteMaster/login.ejs')

});


let async = require('async');
//대쉬보드
router.get('/dashboard', async function(req, res) {

  const email = req.session.email
  console.log(email)
  if (email == undefined) {
    return res.render('./commuteMaster/login.ejs')
  }

  async.waterfall([], async function(err, result) {
    if (req.session.email == undefined || result == undefined) {
      return res.render('./commuteMaster/index.ejs')
    } else {


    }

  });
});


// 암호 잊어먹었을때
router.get('/forgotPassword', function(req, res) {
  if (req.session.email == undefined) {
    return res.render('commuteMaster/forgot-password.ejs')
  } else {
    return res.render('commuteMaster/index.ejs', {
      email: req.session.email
    })

  }
});

// 암호 잊어먹었을때
router.post('/forgotPassword', function(req, res) {
  console.log('forgotPassword')

  const email = (req.body.email).toLowerCase();
  const name = req.body.name;
  //true 나오면 return
  let checkEmail = checkCode.checkEmail(email)
  let checkName = checkCode.checkName(name)
  if (checkEmail) {
    return res.render('commuteMaster/login.ejs', {
      result: 'emailError'
    })
  }
  if (checkName) {
    return res.render('commuteMaster/login.ejs', {
      result: 'nameError'
    })
  }

  knex('AutumnRain_Users').where({
      email: email,
      name: name
    })
    .then(rows => {
      console.log(rows.length)
      if (rows.length == 0) { //에러시
        return res.render('./commuteMaster/forgot-password.ejs', {
          result: 'error'
        })
      } else {

        var mailOptions = {
          from: emailinfo.email,
          to: email,
          subject: '암호입니다.',
          text: rows[0].password
        };

        //메일 보내기
        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });

        return res.render('./commuteMaster/login.ejs')
      }

    })

});

//회원가입 GET
router.get('/register', function(req, res) {
  return res.render('commuteMaster/register.html')
});

// 회원가입 POST
router.post('/register', function(req, res) {
  console.log('register')

  const name = req.body.name;
  const email = (req.body.email).toLowerCase();
  const password = req.body.password;
  const location = req.body.location;

  //true 나오면 return
  let checkEmail = checkCode.checkEmail(email)
  let checkPassword = checkCode.checkPassword(password)
  let checkName = checkCode.checkName(name)

  let flag = false
  flag = checkEmail
  flag = checkPassword
  flag = checkName

  if (flag == true) {
    return res.render('commuteMaster/login.ejs', {
      result: 'emailError'
    })
  } else {
    const authmailcode = randomCode(10000, 99999)
    //insert할 데이터 셋
    const insertValue = [{
      name: name,
      email: email,
      password: password,
      lat: '37.5347190', //한남동 동사무소
      lng: '127.000543', //한남동 동사무소
      product: 'B027', // 초기설정: 휘발유
      location: location, //미세먼지
      registercode: authmailcode, //인증코드 생성
      confirm: 'N',
      todaynow: 'N',
      bus: '{"list":[{"status": false, "arsId": "", "favorite": "","sido": "","use":"N" }]}',
      subway: '{"list":[{"status": false, "stationName": "", "stationCode": "", "favorite": "", "sido": "", "line": "","use":"N", "updown" : "1"}]}',
      traffic: '{"home": {"status": true, "centerLon":"126.983064", "centerLat": "37.580363", "cityname": "서울 종로구","use":"N" },"company": {"status": true, "centerLon":"126.983064", "centerLat": "37.580363", "cityname": "서울 종로구", "use":"N" },"etc": {"status": true, "centerLon":"126.983064", "centerLat": "37.580363", "cityname": "서울 종로구", "use":"N" }}'
    }]

    knex('AutumnRain_Users').insert(insertValue).then(() => console.log("Users data inserted"))
      .then(function() {

        ejs.renderFile('./camelia_web/email/emailFormCM.ejs', {
          email: email,
          authmailcode: authmailcode
        }, function(err, data) {
          if (err) {
            console.log(err);
          } else {
            transporter.sendMail({
              from: emailinfo.email,
              to: email,
              subject: '출근마스터 인증메일 입니다.',
              html: data
            }, (err, info) => {

            });
          }

        });

        return res.render('commuteMaster/login.ejs', {
          result: 'wait'
        });
      })
      .catch((err) => {
        console.log(err);
        if (err) {
          return res.render('commuteMaster/login.ejs', {
            result: 'duplication'
          });
          return;
        } else {


        }
        throw err;


      })

  }



});


//회원 계정 수정
router.get('/modify', function(req, res) {
  if (req.session.email == undefined) {
    return res.render('commuteMaster/login.ejs')
  } else {
    knex('AutumnRain_Users').where({
      email: req.session.email
    }).then((rows) => {
      return res.render('commuteMaster/modifyAccount.ejs', {
        email: rows[0].email,
        name: rows[0].name,
        location: rows[0].location,
        lat: rows[0].lat,
        lun: rows[0].lun
      })
    })

  }
});

//회원 계정 수정
router.post('/modify', function(req, res) {
  if (req.session.email == undefined) {
    return res.render('commuteMaster/login.ejs')
  } else {

    const password = req.body.password
    const location = req.body.location
    const name = req.body.name

    //true 나오면 return
    let checkPassword = checkCode.checkPassword(password)
    let checkName = checkCode.checkName(name)

    let flag = false
    flag = checkPassword
    flag = checkName

    if (flag == true) {
      return res.render('commuteMaster/modifyAccount.ejs', {
        result: 'email'
      })
    }


    knex('AutumnRain_Users').where({
        email: req.session.email
      }).update({
        password: password,
        location: location,
        name: name
      }).returning('email')
      .then((rows) => {
        if (rows > 0) {
          req.session.destroy() // 재로그인
          return res.render('commuteMaster/login.ejs', {
            result: 'modify'
          })
        } else {
          req.session.memo
          return res.render('commuteMaster/index.ejs', {
            result: 'modifyfail'
          })
        }

      })

  }
});


// 회원가입 post
router.get('/registerAuth', function(req, res) {
  console.log('registerAuth')

  const email = (req.query.email).toLowerCase();
  const registercode = req.query.code;

  if (typeof email === 'undefined' || typeof registercode === 'undefined') {
    return res.render('/')
  }

  // 찾아서 데이터 Y로 변경
  knex('AutumnRain_Users').where({
      email: email,
      registercode: registercode,
      confirm: 'N'
    }).update('confirm', 'Y') //confirm => Y
    .returning('email')
    .then(function(result) {
      //있으면 세션에 데이터 넣고 로그인
      if (result.length == 0) { // 데이터 없으면 실패
        return res.render("login.ejs", {
          result: false
        })
      } else {
        req.session.email = email
        return res.render("commuteMaster/ok.html")
      }

    })
    .catch((err) => {
      console.log(err);
      if (err) {
        return res.render("login.ejs", {
          result: false
        })
      } else {
        return res.render("index.ejs");
      }
      throw err;

    })


});


//myinfo=> 즐겨찾기 역 버스 지역위치
router.get('/myinfo', function(req, res) {
  console.log('myinfo ', req.session.email)
  if (req.session.email == undefined) {
    return res.render('commuteMaster/login.ejs')
  } else {
    knex('AutumnRain_Users').where({
      email: req.session.email
    }).then((rows) => {

      let busList = {}
      let subwayList = {}
      let trafficList = {}

      //json형태로 가공
      const subwayJson = JSON.parse(rows[0].subway);
      const busJson = JSON.parse(rows[0].bus);
      const trafficJson = JSON.parse(rows[0].traffic);

      busList = busJson.list
      subwayList = subwayJson.list
      //라인 코드명 -> 이름으로
      for (var i = 0; i < subwayList.length; i++) {
        subwayList[i].linecode = subwayList[i].line
        subwayList[i].line = commuteUtil.subwayCodeToLineStr(subwayList[i].line)
      }


      //그냥 써도 되는거
      const lat = rows[0].lat
      const lng = rows[0].lng
      const waitTimeSubway = rows[0].waitTimeSubway

      return res.render('./commuteMaster/myinfo.ejs', {
        busList: busList,
        subwayList: subwayList,
        traffic1: trafficJson.home,
        traffic2: trafficJson.company,
        traffic3: trafficJson.etc,
        trafficuse1: trafficJson.home.use,
        trafficuse2: trafficJson.company.use,
        trafficuse3: trafficJson.etc.use,
        timesetting: waitTimeSubway,
        todaynow: rows[0].todaynow,
        lat: lat,
        lng: lng,
        product: commuteUtil.productCodeToName(rows[0].product)
      })
    })

  }
});

//myinfo -> Post
router.post('/myinfo', function(req, res) {

  //리스트 받기
  const busList = req.body.busList
  const subwayList = req.body.subwayList;
  console.log(busList)
  console.log(subwayList)
  console.log(req.session.email)
  //busList
  for (var i = 0; i < busList.length; i++) {
    //빈칸이 아니고 무언가 저장 있다면

    if (!(busList[i].arsId).replace(/ /gi, "") == '' || !(busList[i].line) == 'sido') {

      //정류장 이름 숫자검사
      if (!checkForm.checkBusStation(busList[i].arsId)) {
        res.render('./commuteMaster/index.ejs', {
          result: 'busid',
          reason: '버스정류장 id가 잘못되었습니다.'
        })
        return;
      }
      //즐겨찾기 노선 검사
      if (!checkForm.checkBusFavorite(busList[i].favorite)) {

        res.render('./commuteMaster/index.ejs', {
          result: 'busfavorite',
          reason: '버스노선에 , 한글 영어 이외의 글자가 있습니다.'
        })
        return;
        console.log(busList[i].favorite)
      }

      busList[i].status = true;
      const favorite = (busList[i].favorite).replace(/ /gi, "").split(',')
      busList[i].favorite = favorite.toString() // String 형태로 저장



    } else {
      //둘중 하나라도 true라면 버스 리스트에서 삭제
      if (i == 0) {

      } else {
        busList.splice(i, i + 1)
      }

    }
  }
  //subwaylist
  for (var i = 0; i < subwayList.length; i++) {

    //빈칸이 아니고 무언가 저장 있다면
    if (!(subwayList[i].stationName).replace(/ /gi, "") == '' || !(subwayList[i].line) == 'none') {

      if (!checkForm.checkStationName(subwayList[i].stationName)) {
        res.render('./commuteMaster/index.ejs', {
          result: 'stationname',
          reason: '지하철 역은 한글 혹은 숫자만 허용됩니다.'
        })
        return;
      }

      if(subwayList[i].line == '' || subwayList[i].line == 'none'){
        res.render('./commuteMaster/index.ejs', {
          result: 'stationline',
          reason: '지하철 역 라인도 선택해 주세요.'
        })
      }
      console.log(subwayList[i].line)
      subwayList[i].sido = commuteUtil.subwayLineToSido(subwayList[i].line)
      console.log(subwayList[i].sido)

      if (subwayList[i].sido == '서울') {
        subwayList[i].stationCode = stationCodeBook.subwayCode(subwayList[i].stationName, subwayList[i].line) //역 코드 변환
        subwayList[i].status = true;
      } else if (subwayList[i].sido == '부산') {
        subwayList[i].stationCode = stationCodeBookBusan.nameToSubwayCodeBusan(subwayList[i].stationName, subwayList[i].line)
        subwayList[i].status = true;
      } else if (subwayList[i].sido == '인천') {

      }

    } else {
      //둘중 하나라도 true라면 지우기
      subwayList.splice(i, i + 1)

    }
  }

  const traffic1Cityname = req.body.traffic1; //좌표로 변환
  const traffic2Cityname = req.body.traffic2; //좌표로 변환
  const traffic3Cityname = req.body.traffic3; //좌표로 변환

  const traffic1 = commuteUtil.locationTolatlng(req.body.traffic1);
  const traffic2 = commuteUtil.locationTolatlng(req.body.traffic2);
  const traffic3 = commuteUtil.locationTolatlng(req.body.traffic3);

  const timesetting = req.body.timesetting;
  const lat = req.body.map01lat;
  const lng = req.body.map01lng;

  const busJsonList = {
    list: busList
  }
  const subwayJsonList = {
    list: subwayList
  }

  let trafficJsonList = {
    home: {
      centerLon: traffic1.lng,
      centerLat: traffic1.lat,
      status: false,
      cityname: traffic1Cityname,
      use: req.body.trafficuse1
    },
    company: {
      centerLon: traffic2.lng,
      centerLat: traffic2.lat,
      status: false,
      cityname: traffic2Cityname,
      use: req.body.trafficuse2
    },
    etc: {
      centerLon: traffic3.lng,
      centerLat: traffic3.lat,
      status: false,
      cityname: traffic3Cityname,
      use: req.body.trafficuse3
    },
  }

  if (traffic1 != 'none' || traffic1 != '') trafficJsonList.home.status = true
  if (traffic2 != 'none' || traffic2 != '') trafficJsonList.company.status = true
  if (traffic3 != 'none' || traffic3 != '') trafficJsonList.etc.status = true


  //db단 연결
  knex('AutumnRain_Users').where({
      email: req.session.email,
      confirm: 'Y'
    }).update({
      bus: JSON.stringify(busJsonList),
      subway: JSON.stringify(subwayJsonList),
      waitTimeSubway: parseInt(timesetting),
      traffic: JSON.stringify(trafficJsonList),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      todaynow: req.body.todaynow,
      product: commuteUtil.productNameToCode(req.body.product)
    }) //confirm => Y
    .then(function(result) {
      console.log(result)
      res.render('./commuteMaster/index.ejs')
    })

});

//busid 설명
router.get('/busid', function(req, res) {
  res.render('./commuteMaster/busid.html')
});

//accountLink 설명
router.get('/accountLink', function(req, res) {
  res.render('./commuteMaster/accountLink.html')
});

//accountLink 설명
router.get('/updown', function(req, res) {
  res.render('./commuteMaster/updown.html')
});

//계정 삭제
router.get('/deleteAccount', function(req, res) {
  console.log('deleteAccount')
  if (req.session.email) {
    return res.render('./commuteMaster/deleteAccount.ejs')
  } else {
    //redirct
    return res.redirect('/commuteMaster')
  }

});

//계정 삭제
router.post('/deleteAccount', function(req, res) {
  const email = req.session.email
  const password = req.body.password;

  knex('AutumnRain_Users').where({
      email: email,
      password: password
    })
    .del().then((rows) => {
      if (rows == 0) {
        return res.render('./commuteMaster/setting.ejs', {
          result: 'fail'
        })
      } else {
        req.session.destroy() //섹션 삭제
        return res.render('./commuteMaster/login.ejs', {
          result: 'deleteAccount'
        })
      }

    })
    .catch((err) => {
      console.log(err);
      if (err) {
        return res.render('/commuteMaster/setting.ejs', {
          result: 'fail'
        })
      } else {
        req.session.destroy() //섹션 삭제
        return res.render('/commuteMaster/login.ejs', {
          result: 'deleteAccount'
        })

      }
      throw err;

    })


});

//'N인 계정 삭제'
router.get('/deleteaccountCommute', function(req, res) {
  knex('AutumnRain_Users').where({
      confirm: 'N'
    })
    .del().then((rows) => {
      console.log('rows: ', rows)
      return res.render('index.ejs')
    })
    .catch((err) => {
      console.log(err);
      throw err;
    })


});

//테스트 모듈
/**
 * 앱엔진 시간 테스트 모듈
 */
router.get('/test', function(req, res) {

  let d = new Date(new Date().getTime() + 9 * 3600000);
  let arriveDate = new Date(d.getFullYear(), new Date().getMonth(), new Date().getDate(), 10, 02, 10)
  const waitTime = new Date(d.getTime() + 30 * 60000)

  return res.send({
    d: d,
    arriveDate: arriveDate,
    waitTime: waitTime
  })
  //return res.render('commuteMaster/test.html')
});

router.post('/test', function(req, res) {
  const buslist = req.body.buslist;
  console.log(JSON.stringify(buslist[0]))
  return res.render('commuteMaster/test.html')
});



module.exports = router;
