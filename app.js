'use strict';

var express = require('express');
var bodyParser = require('body-parser');
const prompt = require('prompt');
//database
let knex = require('./config/database');
var chatbotNuguHealthMaster = require('./chatbot/nugu.js')
var chatbotNuguCommuteMaster = require('./chatbot/commute.js')
var timetables = require('./uploadTime.js')
//경로 모듈
var oauthRouter = require('./routes/oauth');
var commonRouter = require('./routes/common');
var apiRouter = require('./routes/api');

//New
var commuteMasterOauth = require('./routes/commuteMasterOauth');
var commuteMaster = require('./routes/commuteMasterCommon');

//router
var app = express();
//json body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

//ejs
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile)
//view 위치
app.set('views', __dirname + '/camelia_web');
app.use(express.static(__dirname + '/camelia_web'));

//건강마스터 설정
app.use('/oauth', oauthRouter);
//출근 마스터
app.use('/commuteMasterOauth', commuteMasterOauth);
app.use('/commuteMaster', commuteMaster);

app.use('/', commonRouter);
app.use('/api', apiRouter);


//home
app.get('/', function(req, res) {
  return res.render('index.ejs')
});

//누구 챗봇용 =>
app.post('/', function(req, res) {
  return chatbotNuguHealthMaster.nugu_chatbot(knex, req, res)
});

//누구 챗봇용 : 출근마스터
app.post('/commuteMasterChatbot/:tagId', function(req, res) {
  console.log(req.params.tagId)
  return chatbotNuguCommuteMaster.nugu_chatbot(knex, req, res, req.params.tagId)
});

//누구 챗봇용 : 건강마스터
app.post('/healthMasterChatbot/:tagId', function(req, res) {
  console.log(req.params.tagId)
  //return chatbotNuguHealthMaster.nugu_chatbot(knex, req, res, req.params.tagId)
});


//누구 Health 체크용
app.get('/nugu/health', function(req, res) {
  res.send('<p><img src="https://storage.googleapis.com/finalrussianroulette.appspot.com/yahan.png"></p><p>뭘 보러 오셨나요?</p>')
});

// //The 404 Route (ALWAYS Keep this as the last route)
// app.get('*', function(req, res){
//   res.render('./404.html');
// });

//포트설정 (앱엔진에서는 8080만 허용)
const port = 8080;
app.listen(port, function() {
  console.log("Server Online. Port is " + port);
});
