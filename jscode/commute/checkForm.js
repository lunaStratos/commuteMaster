/**
 * 지하철역 입력시 한글만
 */
exports.checkStationName = function(objtext1) {
  var inText = objtext1;
  var deny_char = /^[가-힣|0-9|\*]+$/

  if (deny_char.test(inText)) {
    return true;
  }
  return false;
}
/**
 * 버스 노선 입력시 숫자 영어 한글 , 외 금지
 */
exports.checkBusFavorite = function (str) {
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
/**
 * 버스 정류장은 숫자만
 */
exports.checkBusStation = function (str) {
  var regExp = /^[0-9|\*]+$/
  if (!regExp.test(str)) {
    return false;
  } else {
    return true
  }
}
