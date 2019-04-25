var express = require('express');
var randtoken = require('rand-token');

let jwt = require("jsonwebtoken");
var request = require('request');
const session = require('express-session');
const passport = require('passport');
var cookieparser = require('cookie-parser');
// store session state in browser cookie

let checkCode = require("../jscode/checkForm.js");

var router = express.Router();
router.use(cookieparser('asd'));
router.use(session({
  secret: '1q2w3e4r',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 120000
  }
}));

let secretObj = require("../config/CommuteMasterJwt");
var oauth = require('../jscode/CommuteMasterOauth.js');
let knex = require("../config/database");

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// oauth/login GET페이지
router.get('/login', function(req, res) {
  console.log('login get');
  console.log('req.headers', req.headers);
  console.log('req.query.redirect_uri',req.query.redirect_uri);
  console.log('req.query.state',req.query.state);
  //state save
  req.session.state = req.query.state
  //return
  return res.render('./commuteMaster/oauthlogin.ejs')
});

// oauth/login
router.post('/login', function(req, res) {
  console.log('login post')
  const email = (req.body.email).toLowerCase();
  const password = req.body.password;

  //true 나오면 return
  let checkEmail = checkCode.checkEmail(email)
  let checkPassword = checkCode.checkPassword(password)

  if (checkEmail) {
    return res.render('./commuteMaster/oauthlogin.ejs', {
      result: 'email'
    })
  }
  if (checkPassword) {
    return res.render('./commuteMaster/oauthlogin.ejs', {
      result: 'password'
    })
  }
  //DB에서 확인
  knex('AutumnRain_Users').where({
      email: email,
      password: password,
      confirm: 'Y'
    })
    .then(rows => {
      if (rows.length == 0) { //로그인 실패
        return res.render("./commuteMaster/oauthlogin.ejs", {
          result: 'login',
        })
      } else {//로그인 성공시

        //토큰생성
        let token = oauth.signToken(email);

        //토큰 업데이트
        knex('AutumnRain_Users').where(
            'email', email)
          .update({
            token: token
          })
          .catch((err) => {
            console.log(err);
            throw err
          })

        //redirect url
        const url = 'https://developers.nugu.co.kr/app/callback.html'
        const headers = {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
        const geturl = url + "?code=" + token +
          "&state=" + encodeURIComponent(req.session.state)
        res.setHeader('content-type', 'application/x-www-form-urlencoded');
        res.redirect(geturl);

      }
    })
});




// oauth/token => 인증코드 들어오면 accessToken 내보냄
router.post('/token', async function(req, res) {
  console.log('token post')
  let authHeader = req.body.code;
  const client_secret = req.body.client_secret;
  const client_id = req.body.client_id;
  console.log('authHeader', authHeader)
  console.log('client_secret', client_secret)
  console.log('client_id', client_id)
  // 인증으로 사용해야 할 값이 없다면 Deny
  if (client_id !== secretObj.client_id) {
    return res.json({
      error: 'invalid_client',
      description: 'Client id does not match.'
    });
  }
  // 인증으로 사용해야 할 값이 없다면 Deny
  if (client_secret !== secretObj.client_secret) {
    return res.json({
      error: 'unauthorized_client',
      description: 'Client secret does not match.'
    });
  }
  // 인증으로 사용해야 할 값이 없다면 Deny
  if (typeof authHeader == 'undefined') {
    return res.json({
      error: 'invalid_request',
      description: 'Need authHeader'
    });
  }
  var decoded = jwt.verify(authHeader, secretObj.client_secret);

  if (!decoded || decoded.auth !== 'AutumnRain') { //확인
    return res.json({
      error: 'unauthorized_client',
      description: 'JWT Code does not have Authorization.'
    });
  } else { // 정상실행
    const email = decoded.email;

    knex('AutumnRain_Users')
      .where('email', email.toLowerCase())
      .then(rows => {

        if (rows.length == 0) { //실패
          return res.json({
            error: 'unauthorized_client',
            description: 'Your  Email does not have Umbrella For Autumn Rain Project Site. Please sign in site first.'
          });

        } else { //이메일이 있다면

          const accessToken = randtoken.uid(32)
          knex('AutumnRain_Users')
            .where('email', email)
            .update({
              accessToken: accessToken
            }).then( resultRows=>{
              return res.json({
                access_token: accessToken,
                token_type: "bearer",
                expires: 9999999
              })
            })



        }

      })

  } //  (!decoded || decoded.auth !== 'camelia

});

// oauth/login
router.post('/request', function(req, res) {
  console.log('request')
  console.log(req.query)

  const token = req.query.token
  console.log('token ', token)

  if (typeof token == 'undefined') {
    return res.json({
      error: 'error'
    });
  }

  knex('AutumnRain_Users').where({
      accessToken: token
    })
    .then(rows => {
      console.log(rows.length)
      if (rows.length == 0) { //실패시
        return res.json({
          error: 'error'
        });
      } else {
        //나이 성별 이메일 이름
        return res.json({
          email: rows[0].email,
          name: rows[0].name
        })
      }

    })
});

module.exports = router;
