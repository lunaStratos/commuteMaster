exports.fisrtTransName = function(str) {
  let result = 1;

  switch (str) {
    case '첫 번째':
      result = 1
      break;
    case '두 번째':
      result = 2
      break;
    case '세 번째':
      result = 3
      break;
    case '네 번째':
      result = 4
      break;
    case '다섯 번째':
      result = 5
      break;
    case '여섯 번째':
      result = 6
      break;
    case '일곱 번째':
      result = 7
      break;
    case '여덜 번째':
      result = 8
      break;
    case '아홉 번째':
      result = 9
      break;
    case '열 번째':
      result = 10
      break;
    default:
    result = str
  }
  return result
}

/*
요금 계산
http://www.seoulmetro.co.kr/kr/page.do?menuIdx=354
[기본운임] 10km 이내 : 1,250원
[추가운임]
10~50km 이내 : 5km 까지 마다 100원 추가
50km 초과 : 8km 까지 마다 100원 추가
수도권 내,외를 연속하여 이용 시 수도권내 운임을 먼저 적용한 후 수도권 외(평택 ~ 신창, 가평 ~ 춘천) 구간은 4km 까지 마다 100원씩 추가
*/
exports.subwayPrice = function(meter) {
  let result = 1250;

  if (parseInt(meter) <= 10000) {

  } else if (10000 < parseInt(meter) && parseInt(meter) <= 50000) {
    const fiveN = parseInt(((parseInt(meter) - 10000) / 5000) + 1)
    result = 1250 + fiveN * 100
  } else if (parseInt(meter) > 50000) {
    const eightN = parseInt(((parseInt(meter) - 50000) / 8000) + 1)
    result = 2150 + eightN * 100
  }

  return result
}

/*
외선내선 숫자변경
숫자 -> 외선내선 변경
*/
exports.updn = function(str) {
  let result = '';

  switch (str) {
    case '외선':
      result = '1'
      break;
    case '내선':
      result = '2'
      break;
    case '상행':
      result = '1'
      break;
    case '하행':
      result = '2'
      break;
    case '1':
      result = '외선'
      break;
    case '2':
      result = '내선'
      break;
  }
  return result
}
/*
실시간 지하철 사용하는 코드 (서울만 사용)
경춘 우이 의정부 용산에버 인천호선 : 안됨
1~9호선 1001~1009
경의중앙선 1063
신분당선 1077
분당선 1075
공항철도 1065
수인선 1071
*/
exports.subwayLineToCode = function(str) {
  let line = '';

  switch (str) {
    case '공항철도':
      line = '65'
      break;
    case '분당선':
      line = '75'
      break;
    case '경의중앙선':
      line = '63'
      break;
    case '신분당선':
      line = '77'
      break;
    case '수인선':
      line = '71'
      break;
      //1~9호선
    case '1':
      line = '01'
      break;
    case '2':
      line = '02'
      break;
    case '3':
      line = '03'
      break;
    case '4':
      line = '04'
      break;
    case '5':
      line = '05'
      break;
    case '6':
      line = '06'
      break;
    case '7':
      line = '07'
      break;
    case '8':
      line = '08'
      break;
    case '9':
      line = '09'
      break;
      //여기서 부터는 저장된 코드 변환
    case 's01':
      line = '01'
      break;
    case 's02':
      line = '02'
      break;
    case 's03':
      line = '03'
      break;
    case 's04':
      line = '04'
      break;
    case 's05':
      line = '05'
      break;
    case 's06':
      line = '06'
      break;
    case 's07':
      line = '07'
      break;
    case 's08':
      line = '08'
      break;
    case 's09':
      line = '09'
      break;
      //공항철도:a   분당선b   용인경전철e  경춘선g   인천1호선I   인천2호선I2   경의중앙선K   경강선KK   신분당선S   수인선SU  의정부경전철U

    case 's0a': //인천공항철도
      line = '65'
      break;
    case 's0b': // 분당선
      line = '75'
      break;
    case 's0k': //경의중앙
      line = '63'
      break;
    case 's0s': // 신분당선
      line = '77'
      break;
    case 's0su': //수인선
      line = '71'
      break;


    default:
      line = str
  }
  return line
}


exports.subwayCodeToLineName = function(str) {
  let line = '';

  switch (str) {

    case '1':
      line = '1호선'
      break;
    case '2':
      line = '2호선'
      break;
    case '3':
      line = '3호선'
      break;
    case '4':
      line = '4호선'
      break;
    case '5':
      line = '5호선'
      break;
    case '6':
      line = '6호선'
      break;
    case '7':
      line = '7호선'
      break;
    case '8':
      line = '8호선'
      break;
    case '9':
      line = '9호선'
      break;

    default:
      line = str
  }
  return line
}


exports.subwayLineToSido = function(str) {
  let result = '';

  switch (str.substring(0, 1)) {
    case 's':
      result = '서울'
      break;
    case 'i':
      result = '인천'
      break;
    case 'b':
      result = '부산'
      break;
  }
  return result
}

//휘발유:B027, 경유:D047, 고급휘발유: B034, 실내등유: C004, 자동차부탄: K015
exports.productCodeToName = function(str) {
  let result = '';
  switch (str) {
    case 'B027':
      result = '휘발유'
      break;
    case 'D047':
      result = '경유'
      break;
    case 'B034':
      result = '고급휘발유'
      break;
    case 'C004':
      result = '실내등유'
      break;
    case 'K015':
      result = '자동차부탄'
      break;
  }
  return result
}

//회사코드 -> 회사이름
exports.companyNameToOilCompany = function(str) {
  let returnText = '';
  switch (str) {

    case 'SKE':
      returnText = 'SK에너지'
      break;
    case 'GSC':
      returnText = 'GS칼텍스'
      break;
    case 'HDO':
      returnText = '오일뱅크'
      break;
    case 'SOL':
      returnText = 'S-OIL'
      break;
    case 'RTO':
      returnText = '자영업 알뜰주유소'
      break;
    case 'RTX':
      returnText = '고속도로 알뜰주유소'
      break;
    case 'NHO':
      returnText = '농협 알뜰주유소'
      break;
    case 'ETC':
      returnText = '기타 브랜드'
      break;
    case 'E1G':
      returnText = 'E1'
      break;
    case 'SKG':
      returnText = 'SK가스'
      break;
  }
  return returnText
}



//휘발유:B027, 경유:D047, 고급휘발유: B034, 실내등유: C004, 자동차부탄: K015
exports.productNameToCode = function(str) {
  let result = '';
  switch (str) {
    case '휘발유':
      result = 'B027'
      break;
    case '경유':
      result = 'D047'
      break;
    case '고급휘발유':
      result = 'B034'
      break;
    case '실내등유':
      result = 'C004'
      break;
    case '자동차부탄':
      result = 'K015'
      break;
  }
  return result
}



exports.congestion = function(num) {
  let text = '';
  //혼잡도 입니다. - 0: 정보없음 - 1: 원할 - 2: 서행 - 3: 지체 - 4: 정체
  if (0 < num && num < 1) {
    text = '원할'
  } else if (1 <= num && num < 1.5) {
    text = '원할'
  } else if (1.5 <= num && num < 2) {
    text = '서행'
  } else if (2 <= num && num < 2.5) {
    text = '서행'
  } else if (2.5 <= num && num < 3) {
    text = '서행과 지체 사이'
  } else if (3 <= num && num < 3.5) {
    text = '지체'
  } else if (3.5 <= num && num < 4) {
    text = '정체 사이'
  }

  return text;
} //congestion


/**
 * [날씨상태]
 * 숫자 -> 날씨상태 텍스트 출력
 */
exports.weatherStatus = function(num) {
  let text = '';
  switch (num) {
    case 0:
      text = '맑음 이며 '
      break;
    case 1:
      text = '비가 내리고 있으며 '
      break;
    case 2:
      text = '비나 눈이 내리고 있으며 '
      break;
    case 3:
      text = '눈이나 비가 내리고 있으며 '
      break;
    case 4:
      text = '눈이 내리고 있으며 '
      break;
  }
  return text;
} //weather

exports.tempText = function(tempStr) {
  let tempText = ''
  if (tempStr < 13) { //13
    tempText = '' + tempStr + '도라 추울 거 같네요. 옷 충분히 입고 출근하시기를 추천할께요. '
  } else if (13 <= tempStr && tempStr <= 16) { //13~17
    tempText = '' + tempStr + '도라 약간 춥지만 무리가 없네요. 최소한 후드티나 갸벼운 외투를 입고 출근하시기를 추천할께요. '
  } else if (17 <= tempStr && tempStr <= 20) {
    tempText = '' + tempStr + '도라 적당한 온도 같네요. 좋은 출근이 될거 같아요. '
  } else if (21 <= tempStr && tempStr <= 25) {
    tempText = '' + tempStr + '도라 좋은 출근이 될거에요. '
  } else if (26 <= tempStr) {
    tempText = '' + tempStr + '도라 무더울 거 같아요. 더위 조심하세요. '
  }
  return tempText

}

/**
 * 부산의 경우 상행선은 0, 하행선은 1
 */
exports.sidoUpdown = function(sido, updown) {
  let result = updown;
  if (sido == '부산') {
    switch (updown) {
      case 1:
        result = 0
        break;
      case 2:
        result = 1
        break;
    }
  }
  return result
}
/*
 돌발 정보 분류 코드입니다.
isAccidentNode=Y일 때 응답되는 정보입니다.
- A: 사고
- B: 공사
- C: 행사
- D: 재해
- E: 통제
  */
exports.accidentShort = function(str) {
  let result = '';
  switch (str) {
    case 'A':
      result = '사고'
      break;
    case 'B':
      result = '공사'
      break;
    case 'C':
      result = '행사'
      break;
    case 'D':
      result = '재해'
      break;
    case 'E':
      result = '통제'
      break;

  }
  return result
}

exports.accidentHex = function(str) {
  //"description": "새문안로 서대문역 3,4번출입구 지하연결통로 설치공사로 우회전차로 1개차로 부분통제 2019/03/04~2020/05/31
  // 새문안로 서대문역 3,4번출입구 지하연결통로 설치공사로 우회전차로 1개차로 부분통제 2019/03/04~2020/05/31",
  const resultStr = str.substring(0, str.indexOf('/') - 4)
  return resultStr

}

exports.accidentLong = function(str) {
  let result = '';
  switch (str) {
    case 'A00':
      result = '사고'
      break;
    case 'A01':
      result = '차량단독사고'
      break;
    case 'A02':
      result = '추돌사고'
      break;
    case 'A03':
      result = '충돌사고'
      break;
    case 'A04':
      result = '도로시설물추돌사고'
      break;
    case 'A05':
      result = '차량고장'
      break;
    case 'A06':
      result = '낙하물적하'
      break;
    case 'A07':
      result = '보행자사고'
      break;
    case 'A08':
      result = '추락사고'
      break;
    case 'A09':
      result = '차량화재사고'
      break;
    case 'A10':
      result = '신호등고장'
      break;
    case 'A11':
      result = '도로시설물파손잔해'
      break;
    case 'A12':
      result = '사고조사및처리'
      break;
    case 'A13':
      result = '사고구경'
      break;
    case 'A14':
      result = '무단횡단'
      break;
    case 'A15':
      result = '차량전복사고'
      break;
    case 'A99':
      result = '기타'
      break;
      //B=====
    case 'B00':
      result = '공사'
      break;
    case 'B01':
      result = '도로확장및연결공사'
      break;
    case 'B02':
      result = '노면포장및유지보수'
      break;
    case 'B03':
      result = '차선도색'
      break;
    case 'B04':
      result = '도로시설물공사'
      break;
    case 'B05':
      result = '교통시설물공사'
      break;
    case 'B06':
      result = '맨홀공사'
      break;
    case 'B07':
      result = '지하철공사'
      break;
    case 'B08':
      result = '도로청소작업'
      break;
    case 'B99':
      result = '기타'
      break;
      //C=====
    case 'C00':
      result = '행사'
      break;
    case 'C01':
      result = '행사'
      break;
    case 'C02':
      result = '집회'
      break;
    case 'C03':
      result = '민방위훈련'
      break;
    case 'C04':
      result = '군사훈련'
      break;
    case 'C05':
      result = '주요인사통과'
      break;
    case 'C99':
      result = '기타'
      break;

      //D=====
    case 'D00':
      result = '재해'
      break;
    case 'D01':
      result = '폭우'
      break;
    case 'D02':
      result = '폭설'
      break;
    case 'D03':
      result = '노면침수'
      break;
    case 'D04':
      result = '노면결빙'
      break;
    case 'D05':
      result = '도로파손'
      break;
    case 'D06':
      result = '낙석'
      break;
    case 'D07':
      result = '토사유출'
      break;
    case 'D08':
      result = '재해예방작업'
      break;
    case 'D09':
      result = '재해복구작업'
      break;
    case 'D10':
      result = '화재'
      break;
    case 'D11':
      result = '산사태'
      break;
    case 'D12':
      result = '눈사태'
      break;
    case 'D13':
      result = '지진'
      break;
    case 'D14':
      result = '안개'
      break;
    case 'D99':
      result = '기타'
      break;

      //E=====
    case 'E00':
      result = '차단및통제'
      break;
    case 'E01':
      result = '부분통제'
      break;
    case 'E02':
      result = '전면통제'
      break;
    case 'E03':
      result = '부분차단'
      break;
    case 'E04':
      result = '전면차단'
      break;
    case 'E05':
      result = '진입로통제'
      break;
    case 'E06':
      result = '진입로차단'
      break;
    case 'E07':
      result = '진출로통제'
      break;
    case 'E08':
      result = '진출로차단'
      break;
    case 'E99':
      result = '기타'
      break;

  }
  return result
}

/**
 요일 -> 숫자로 변환
 월 : 0
 화 : 1
 수 : 2
 목 : 3
 금 : 4
 토 : 5
 일 : 6
 */
exports.sidoTime = function(day) {
  //서울: 1:평일 2:토요일 3:일요일,빨간날
  //인천: 1:평일 2:토요일, 일요일
  //부산: 1:평일,2:토요일, 3:일/공휴일

  let result = 1;

  // if (sido == '인천') {
  //   switch (parseInt(day)) {
  //     case 5:
  //       result = 2
  //       break;
  //     case 6:
  //       result = 2
  //       break;
  //     default:
  //   }
  // } else {

  switch (day) {
    case 5:
      result = 2
      break;
    case 6:
      result = 3
      break;
    default:
      result = 1
  }
  // }

  return result
}

/**
 * [집 회사 기타]
 * 숫자 -> 날씨상태 텍스트 출력
 */
exports.trafficLocation = function(str) {
  let text = 0;
  switch (str) {
    case '집':
      text = 1
      break;
    case '회사':
      text = 2
      break;
    case '기타':
      text = 3
      break;
  }
  return text;
} //congestion



/**
 * 지역이름 => lat lng json
 */
exports.locationTolatlng = function(str) {
  let json = {};
  switch (str) {
    case '서울 종로구':
      json = {
        lat: 37.580363,
        lng: 126.983064
      }
      break;
    case '서울 중구':
      json = {
        lat: 37.559842,
        lng: 126.994510
      }
      break;
    case '서울 성동구':
      json = {
        lat: 37.551410,
        lng: 127.043470
      }
      break;

    case '서울 용산구':
      json = {
        lat: 37.535275,
        lng: 126.981141
      }
      break;
    case '서울 광진구':
      json = {
        lat: 37.545308,
        lng: 127.086557
      }
      break;

    case '서울 동대문구':
      json = {
        lat: 37.581388,
        lng: 127.052783
      }
      break;
    case '서울 중랑구':
      json = {
        lat: 37.596265,
        lng: 127.091758
      }
      break;
    case '서울 성북구':
      json = {
        lat: 37.599025,
        lng: 127.022486
      }
      break;
    case '서울 강북구':
      json = {
        lat: 37.628628,
        lng: 127.023434
      }
      break;
    case '서울 도봉구':
      json = {
        lat: 37.657931,
        lng: 127.037078
      }
      break;
    case '서울 노원구':
      json = {
        lat: 37.644266,
        lng: 127.070099
      }
      break;

    case '서울 은평구':
      json = {
        lat: 37.611490,
        lng: 126.918387
      }
      break;
    case '서울 서대문구':
      json = {
        lat: 37.576500,
        lng: 126.935485
      }
      break;
    case '서울 양천구':
      json = {
        lat: 37.520069,
        lng: 126.859823
      }
      break;
    case '서울 마포구':
      json = {
        lat: 37.558014,
        lng: 126.912759
      }
      break;
    case '서울 구로구':
      json = {
        lat: 37.498331,
        lng: 126.868700,
      }
      break;
    case '금천구':
      json = {
        lat: 37.463250,
        lng: 126.899551,
      }
      break;
    case '서울 영등포구':
      json = {
        lat: 37.519872,
        lng: 126.906802
      }
      break;

    case '서울 동작구':
      json = {
        lat: 37.503094,
        lng: 126.944552,
      }
      break;

    case '서울 관악구':
      json = {
        lat: 37.477679,
        lng: 126.936704
      }
      break;

    case '서울 서초구':
      json = {
        lat: 37.492074,
        lng: 127.005622,
      }
      break;

    case '서울 강남구':
      json = {
        lat: 37.506351,
        lng: 127.047688
      }
      break;

    case '서울 송파구':
      json = {
        lat: 37.504699,
        lng: 127.114465
      }
      break;

    case '서울 강동구':
      json = {
        lat: 37.544527,
        lng: 127.141448
      }
      break;

      //부산

    case '부산 중구':
      json = {
        lat: 35.103974,
        lng: 129.033288
      }
      break;
    case '부산 서구':
      json = {
        lat: 35.114791,
        lng: 129.013691
      }
      break;
    case '부산 동구':
      json = {
        lat: 35.126701,
        lng: 129.047143
      }
      break;
    case '부산 영도구':
      json = {
        lat: 35.084112,
        lng: 129.062737
      }
      break;
    case '부산 진구':
      json = {
        lat: 35.162962,
        lng: 129.045435
      }
      break;
    case '부산 동래구':
      json = {
        lat: 35.210789,
        lng: 129.074878
      }
      break;
    case '부산 남구':
      json = {
        lat: 35.128060,
        lng: 129.092455
      }
      break;
    case '부산 북구':
      json = {
        lat: 35.216542,
        lng: 129.012566
      }
      break;
    case '부산 해운대구':
      json = {
        lat: 35.167126,
        lng: 129.167411
      }
      break;
    case '부산 사하구':
      json = {
        lat: 35.086257,
        lng: 128.972814
      }
      break;
    case '부산 금정구':
      json = {
        lat: 35.256004,
        lng: 129.090389
      }
      break;
    case '부산 강서구':
      json = {
        lat: 35.107646,
        lng: 128.881868
      }
      break;
    case '부산 연제구':
      json = {
        lat: 35.185006,
        lng: 129.084571
      }
      break;
    case '부산 수영구':
      json = {
        lat: 35.159782,
        lng: 129.115014
      }
      break;
    case '부산 사상구':
      json = {
        lat: 35.160199,
        lng: 128.983935
      }
      break;
    case '부산 기장군':
      json = {
        lat: 35.323950,
        lng: 129.18689
      }
      break;

      //인천

    case '인천 중구':
      json = {
        lat: 37.503072,
        lng: 126.528971
      }
      break;
    case '인천 동구':
      json = {
        lat: 37.481044,
        lng: 126.643181
      }
      break;
    case '인천 미추홀구':
      json = {
        lat: 37.454883,
        lng: 126.666210
      }
      break;
    case '인천 연수구':
      json = {
        lat: 37.412155,
        lng: 126.660303
      }
      break;
    case '인천 남동구':
      json = {
        lat: 37.443989,
        lng: 126.730970
      }
      break;
    case '인천 부평구':
      json = {
        lat: 37.501843,
        lng: 126.721137
      }
      break;
    case '인천 계양구':
      json = {
        lat: 37.546984,
        lng: 126.735856
      }
      break;
    case '인천 서구':
      json = {
        lat: 37.551530,
        lng: 126.648969
      }
      break;
    case '인천 강화군':
      json = {
        lat: 37.740483,
        lng: 126.501828
      }
      break;
    case '인천 옹진군':
      json = {
        lat: 37.260861,
        lng: 126.466937
      }
      break;
      //광주
    case '광주 남구':
      json = {
        lat: 35.111677,
        lng: 126.897195
      }
      break;
    case '광주 북구':
      json = {
        lat: 35.197763,
        lng: 126.902999
      }
      break;
    case '광주 서구':
      json = {
        lat: 35.137163,
        lng: 126.854540
      }
      break;
    case '광주 동구':
      json = {
        lat: 35.132283,
        lng: 126.944641
      }
      break;
    case '광주 광산구':
      json = {
        lat: 35.163155,
        lng: 126.792627
      }
      break;

      //대구
    case '대구 중구':
      json = {
        lat: 35.866449,
        lng: 128.593746
      }
      break;
    case '대구 동구':
      json = {
        lat: 35.886807,
        lng: 128.639377
      }
      break;
    case '대구 서구':
      json = {
        lat: 35.874106,
        lng: 128.552082
      }
      break;
    case '대구 남구':
      json = {
        lat: 35.840482,
        lng: 128.584729
      }
      break;
    case '대구 북구':
      json = {
        lat: 35.900733,
        lng: 128.591239
      }
      break;
    case '대구 수성구':
      json = {
        lat: 35.846010,
        lng: 128.642778
      }
      break;
    case '대구 달서구':
      json = {
        lat: 35.833332,
        lng: 128.522069
      }
      break;
    case '대구 달성군':
      json = {
        lat: 35.690794,
        lng: 128.463314
      }
      break;

      //대전
    case '대전 동구':
      json = {
        lat: 36.332782,
        lng: 127.457472
      }
      break;
    case '대전 중구':
      json = {
        lat: 36.316080,
        lng: 127.409671
      }
      break;
    case '대전 서구':
      json = {
        lat: 36.340464,
        lng: 127.372126
      }
      break;
    case '대전 유성구':
      json = {
        lat: 36.367554,
        lng: 127.332260
      }
      break;
    case '대전 대덕구':
      json = {
        lat: 36.369685,
        lng: 127.424072
      }
      break;

      //울산
    case '울산 중구':
      json = {
        lat: 35.564601,
        lng: 129.313747
      }
      break;
    case '울산 남구':
      json = {
        lat: 35.522305,
        lng: 129.337144
      }
      break;
    case '울산 동구':
      json = {
        lat: 35.509224,
        lng: 129.429363
      }
      break;
    case '울산 북구':
      json = {
        lat: 35.580563,
        lng: 129.363638
      }
      break;
    case '울산 울주군':
      json = {
        lat: 35.434846,
        lng: 129.335441
      }
      break;


    default:
      json = {
        lat: 37.580363,
        lng: 126.983064
      }

  }
  return json;
} //locationTolatlng


exports.subwayCodeToLine = function(lineStr) {

  //역호선 -> 지정코드로 변환
  let line = '';
  switch (lineStr) {
    case '1':
      line = '1'
      break;
    case '2':
      line = '2'
      break;
    case '3':
      line = '3'
      break;
    case '4':
      line = '4'
      break;
    case '5':
      line = '5'
      break;
    case '6':
      line = '6'
      break;
    case '7':
      line = '7'
      break;
    case '8':
      line = '8'
      break;
    case '9':
      line = '9'
      break;
      //
    case 's01':
      line = '1'
      break;
    case 's02':
      line = '2'
      break;
    case 's03':
      line = '3'
      break;
    case 's04':
      line = '4'
      break;
    case 's05':
      line = '5'
      break;
    case 's06':
      line = '6'
      break;
    case 's07':
      line = '7'
      break;
    case 's08':
      line = '8'
      break;
    case 's09':
      line = '9'
      break;
      //공항철도:a   분당선b   용인경전철e  경춘선g   인천1호선I   인천2호선I2   경의중앙선K   경강선KK   신분당선S   수인선SU  의정부경전철U
    case 's0a':
      line = 'A'
      break;
    case 's0b':
      line = 'B'
      break;
    case 's0e':
      line = 'E'
      break;
    case 's0g':
      line = 'G'
      break;
    case 's0i':
      line = 'I'
      break;
    case 's0i2':
      line = 'I2'
      break;
    case 's0k':
      line = 'K'
      break;
    case 's0kk':
      line = 'KK'
      break;
    case 's0su':
      line = 'SU'
      break;
    case 's0u':
      line = 'U'
      break;
    case 's0s':
      line = 'S'
      break;
  }

  return line;
}

exports.subwayCodeToLineStr = function(lineStr) {

  //역호선 -> 지정코드로 변환
  let line = '';
  switch (lineStr) {

    case 's01':
      line = '서울1호선'
      break;
    case 's02':
      line = '서울2호선'
      break;
    case 's03':
      line = '서울3호선'
      break;
    case 's04':
      line = '서울4호선'
      break;
    case 's05':
      line = '서울5호선'
      break;
    case 's06':
      line = '서울6호선'
      break;
    case 's07':
      line = '서울7호선'
      break;
    case 's08':
      line = '서울8호선'
      break;
    case 's09':
      line = '서울9호선'
      break;
      //공항철도:a   분당선b   용인경전철e  경춘선g   인천1호선I   인천2호선I2   경의중앙선K   경강선KK   신분당선S   수인선SU  의정부경전철U
    case 's0a':
      line = 'AREX공항철도'
      break;
    case 's0b':
      line = '분당선'
      break;
    case 's0e':
      line = '용인에버라인'
      break;
    case 's0g':
      line = '경춘선'
      break;
    case 's0k':
      line = '경의중앙선'
      break;
    case 's0kk':
      line = '경강선'
      break;
    case 's0s':
      line = '신분당선'
      break;
    case 's0su':
      line = '수인선'
      break;
    case 's0u':
      line = '의정부경전철'
      break;
    case 's0ui':
      line = '우이신설'
      break;
      //인천
    case 'i01':
      line = '인천1호선'
      break;
    case 'i02':
      line = '인천2호선'
      break;
      //부산
    case 'b01':
      line = '부산1호선'
      break;
    case 'b02':
      line = '부산2호선'
      break;
    case 'b03':
      line = '부산3호선'
      break;
    case 'b04':
      line = '부산4호선'
      break;
  }
  return line;
}

exports.CodeToStr = function(lineStr) {

  //역호선 -> 지정코드로 변환
  let line = '';
  switch (lineStr) {
    case '1':
      line = '1호선'
      break;
    case '2':
      line = '2호선'
      break;
    case '3':
      line = '3호선'
      break;
    case '4':
      line = '4호선'
      break;
    case '5':
      line = '5호선'
      break;
    case '6':
      line = '6호선'
      break;
    case '7':
      line = '7호선'
      break;
    case '8':
      line = '8호선'
      break;
    case '9':
      line = '9호선'
      break;

      //공항철도:a   분당선b   용인경전철e  경춘선g   인천1호선I   인천2호선I2   경의중앙선K   경강선KK   신분당선S   수인선SU  의정부경전철U
    case 'A':
      line = '공항철도'
      break;
    case 'B':
      line = '분당선'
      break;
    case 'E':
      line = '용인에버라인'
      break;
    case 'G':
      line = '경춘선'
      break;
    case 'I':
      line = '인천 1호선'
      break;
    case 'I2':
      line = '인천 1호선'
      break;
    case 'K':
      line = '경의중앙선K'
      break;
    case 'KK':
      line = '경강선KK'
      break;
    case 'SU':
      line = '수인선SU'
      break;
    case 'U':
      line = '의정부경전철U'
      break;
    case 'S':
      line = '신분당선S'
      break;
    case 'UI':
      line = '우이신설'
      break;
  }
  return line;
}
