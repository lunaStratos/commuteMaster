function checkStationName(objtext1) {
  var inText = objtext1;
  var deny_char = /^[가-힣|0-9|\*]+$/

  if (deny_char.test(inText)) {
    return true;
  }
  return false;
}

function checkBusFavorite(str) {
  var regExp = /[\{\}\[\]\/?.;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
  if (regExp.test(str)) {
    //특수문자가 있다면
    //var t = str.replace(regExp, "");
    return false;
  } else {
    //특수문자가 없다면
    return true
  }
}

function checkBusStation(str) {
  var regExp = /^[0-9|\*]+$/
  if (!regExp.test(str)) {
    return false;
  } else {
    return true
  }
}

//최초 클릭시 동작

$(document).ready(function() {

  //form submit
  $(document).on("click", "#submitForm", function() {
    // $("#submitForm").click( function() {
    var formData = $("#myinfoForm").serializeObject()
    //검증
    console.log(JSON.stringify(formData));

    var busList = formData.busList
    var subwayList = formData.subwayList

    for (var i = 0; i < busList.length; i++) {
      if (busList[i] === undefined) {

      } else {

        //버스 즐겨찾기 검사
        if (!checkBusFavorite(busList[i].favorite)) {

          $('.modal-title').text('버스 즐겨찾기 노선 에러');
          $('#modalText').text('버스 즐겨찾기 노선은 "," 로 구분하며, 한글 영어 숫자만 입력 가능합니다. ');
          $('.modal').modal('show');
          return;
        }
        //버스역 이름 검사
        if (!checkBusStation(busList[i].arsId)) {

          $('.modal-title').text('버스정류장 ID 에러');
          $('#modalText').text('버스정류장 ID는 숫자만 입력 가능합니다. ');
          $('.modal').modal('show');
          return;

        }
      }
    }

    //지하철 검사
    for (var i = 0; i < subwayList.length; i++) {
      if (subwayList[i] === undefined) {

      } else {
        //지하철 역 검사
        if (!checkStationName(subwayList[i].stationName)) {
          $('.modal-title').text('지하철역 입력 에러');
          $('#modalText').text('지하철역은 한글과 숫자만 입력 가능합니다. ');
          $('.modal').modal('show');
          return;

        }
        //지하철 라인 검사
        if (subwayList[i].line == '' || subwayList[i].line == 'none') {
          $('.modal-title').text('지하철 라인 입력 에러');
          $('#modalText').text('지하철 호선도 선택해주세요');
          $('.modal').modal('show');
          return;

        }
      }

    }

    //보내기 (자동으로 변환되어 보내짐)
    $("#myinfoForm").submit();
  });

  //버스 추가버튼
  $("#addBus").click(function() {
    //검증 => 0번부터 시작
    var nowNum = $("span#buslength").attr('busnum');
    var nowCount = $("span#buscount").attr('busnum');
    if (nowNum >= 10) {
      alert('더이상 추가할 수 없습니다')
      return;
    }
    //다음번 숫자로 이동
    nowNum++;
    nowCount++;

    var inneHtml = '<div class="form-label-group" id="busstation' + nowCount + '">'
    inneHtml += '<input type="text" id="bus' + nowCount + '" class="form-control" name="busList[' + nowCount + '][arsId]" placeholder="bus' + nowNum + '" autofocus="autofocus" >'
    inneHtml += '<label for="bus' + nowCount + '">버스정거장 코드(숫자만 입력)</label>'
    inneHtml += '<button type="button" class="deleteBusNum" busnum="' + nowCount + '" style="HEIGHT: 15pt;font-size:8pt">삭제하기</button>'
    inneHtml += '</div>'
    inneHtml += ''

    var inneHtml2 = '<div class="form-label-group" id="busstation' + nowCount + '">'
    inneHtml2 += '<input type="text" id="busnum' + nowCount + '" class="form-control" name="busList[' + nowCount + '][favorite]" placeholder="bus' + nowNum + 'temp" autofocus="autofocus">'
    inneHtml2 += '<label for="busnum' + nowCount + '">419버스 => 419</label>'
    inneHtml2 += '<b>종합정보 사용여부: </b>'
    // inneHtml2 += '<select name="busList[' + nowCount + '][sido]" id="buslocation' + nowCount + '">'
    // inneHtml2 += '<option value="none">'
    // inneHtml2 += '</option>'
    // inneHtml2 += '<option value="none">선택안함</option>'
    // inneHtml2 += '<option value="서울">서울</option>'
    // inneHtml2 += '<option value="대전">대전</option>'
    // inneHtml2 += '<option value="대구">대구</option>'
    // inneHtml2 += '<option value="부산">부산</option>'
    // inneHtml2 += '<option value="울산">울산</option>'
    // inneHtml2 += '<option value="광주">광주</option>'
    // inneHtml2 += '</select>'
    inneHtml2 += '<input type="radio" name="busList[' + nowCount + '][use]" value="Y"  /> Y'
    inneHtml2 += '<input type="radio" name="busList[' + nowCount + '][use]" value="N" checked="checked" /> N'
    inneHtml2 += '</div>'
    inneHtml2 += ''

    $("#addBusSpan").append(inneHtml);
    $("#addBusSpan2").append(inneHtml2);
    $("span#buslength").attr('busnum', nowNum);
    $("span#buscount").attr('busnum', nowCount);
  });

  //지하철 추가버튼
  $("#addSubway").click(function() {
    var nowNum = $("span#subwaylength").attr('subwaynum');
    var nowCount = $("span#subwaycount").attr('subwaynum');

    if (nowNum >= 10) {
      alert('더이상 추가할 수 없습니다')
      return;
    }
    //다음번 숫자로 이동
    nowNum++;
    nowCount++;

    var inneHtml = '<div class="form-label-group" id="subwaystation' + nowCount + '">'
    inneHtml += '<input type="text" id="subway' + nowCount + '" class="form-control" name="subwayList[' + nowCount + '][stationName]" placeholder="bus' + nowNum + '" autofocus="autofocus" value="">'
    inneHtml += '<label for="subway' + nowCount + '">지하철역 ' + nowCount + ' (예: 서울역 => 서울)</label>'
    inneHtml += '상행선 <input type="radio" name="subwayList[' + nowCount + '][updown]" value="1"  /> '
    inneHtml += '하행선 <input type="radio" name="subwayList[' + nowCount + '][updown]" value="2" checked="checked" /> '
    inneHtml += '</div>'


    var inneHtml2 = '<div class="form-label-group" id="subwaystation' + nowCount + '">'
    inneHtml2 += '<input type="text" id="subway' + nowCount + 'temp" class="form-control" name="name" placeholder="subway' + nowCount + 'temp" autofocus="autofocus">'
    inneHtml2 += '<label>'
    inneHtml2 += '<select name="subwayList[' + nowCount + '][line]" id="subwaylocation' + nowCount + '">'
    inneHtml2 += '<option value="">'
    inneHtml2 += '</option>'
    inneHtml2 += '<option value="none">호선설정 : 선택안함</option>'
    inneHtml2 += '<option value="s01">서울1호선</option>'
    inneHtml2 += '<option value="s02">서울2호선</option>'
    inneHtml2 += '<option value="s03">서울3호선</option>'
    inneHtml2 += '<option value="s04">서울4호선</option>'
    inneHtml2 += '<option value="s05">서울5호선</option>'
    inneHtml2 += '<option value="s06">서울6호선</option>'
    inneHtml2 += '<option value="s07">서울7호선</option>'
    inneHtml2 += '<option value="s08">서울8호선</option>'
    inneHtml2 += '<option value="s09">서울9호선</option>'
    inneHtml2 += '<option value="i01">인천1호선</option>'
    inneHtml2 += '<option value="i02">인천2호선</option>'
    inneHtml2 += '<option value="s0a">AREX공항철도</option>'
    inneHtml2 += '<option value="s0b">분당선</option>'
    inneHtml2 += '<option value="s0s">신분당선</option>'
    inneHtml2 += '<option value="s0u">의정부경전철</option>'
    inneHtml2 += '<option value="s0e">용인에버라인</option>'
    inneHtml2 += '<option value="s0g">경춘선</option>'
    inneHtml2 += '<option value="s0k">경의중앙선</option>'
    inneHtml2 += '<option value="s0kk">경강선</option>'
    inneHtml2 += '<option value="s0ui">우이신설</option>'
    inneHtml2 += '<option value="s0su">수인선</option>'
    inneHtml2 += '<option value="b01">부산1호선</option>'
    inneHtml2 += '<option value="b02">부산2호선</option>'
    inneHtml2 += '<option value="b03">부산3호선</option>'
    inneHtml2 += '<option value="b04">부산4호선</option>'
    inneHtml2 += '</select>'
    inneHtml2 += '</label>'
    inneHtml2 += '<button type="button" class="deleteSubwayNum" subwaynum="' + nowCount + '" style="HEIGHT: 15pt;font-size:8pt">삭제하기</button>'
    inneHtml2 += '<input type="radio" name="subwayList[' + nowCount + '][use]" value="Y"  /> Y'
    inneHtml2 += '<input type="radio" name="subwayList[' + nowCount + '][use]" value="N" checked="checked" /> N'
    inneHtml2 += '</div>'


    $("#addSubwaySpan").append(inneHtml);
    $("#addSubwaySpan2").append(inneHtml2);

    $("span#subwaylength").attr('subwaynum', nowNum);
    $("span#subwaycount").attr('subwaynum', nowCount);
  });

  //버스 선택 삭제 처리
  $(document).on("click", "button.deleteBusNum", function() {
    //검증처리
    var nowNum = $("span#buslength").attr('busnum');

    if (nowNum <= 1) {
      alert('더 이상 삭제할 수 없습니다')
      return;
    }

    //삭제처리
    var buttonNum = $(this).attr('busnum');
    $("div#busstation" + buttonNum + "").remove('.form-label-group');
    nowNum--; //삭제
    $("span#buslength").attr('busnum', nowNum);

  });

  //지하철 선택 삭제 처리
  $(document).on("click", "button.deleteSubwayNum", function() {
    //검증처리
    var nowNum = $("span#subwaylength").attr('subwaynum');

    if (nowNum <= 1) {
      alert('더 이상 삭제할 수 없습니다')
      return;
    }

    //삭제처리
    var buttonNum = $(this).attr('subwaynum');
    $("div#subwaystation" + buttonNum + "").remove('.form-label-group');
    nowNum--; //삭제
    $("span#subwaylength").attr('subwaynum', nowNum);

  });


});
