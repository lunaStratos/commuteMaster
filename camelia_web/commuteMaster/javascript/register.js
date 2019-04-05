
    function chkPwd(str){
        var reg_pwd = /^.*(?=.{6,20})(?=.*[0-9])(?=.*[a-zA-Z]).*$/;
        if(!reg_pwd.test(str)){
          //틀리면
          return true;
        }
        //암호가 맞으면
        return false;
      }

  function verifyEmail (email) {
    // 이메일 검증 스크립트 작성
    var regExp = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
    // 검증에 사용할 정규식 변수 regExp에 저장
    if (email.match(regExp) != null) {
      //맞으면
      return false;
    }
    else {
      //이메일이 틀리면
      return true
    }
  }//function

  function checkLocation(text) {
    let flag = true;
    const arr = ['서울', '대전', '대구', '부산', '광주','세종', '울산', '경기', '경남', '경북', '전남', '전북', '제주', '강원', '충북', '충남']
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] == text) {
        flag = false;
      }
    }

    return flag;
  }

      //실행 부분
      function onclick(){
        var flag = true;

        var form = document.getElementById('registerForm');
        var email = document.getElementById('inputEmail').value;

        var location = document.getElementById('location').value;
        var name = document.getElementById('firstName').value;

        var password = document.getElementById('inputPassword').value;
        var confirmPassword = document.getElementById('confirmPassword').value;


        var pattern = /^[가-힣]{2,4}|[a-zA-Z]{2,10}\s[a-zA-Z]{2,10}$/;
        if(!pattern.test(name)){
        $('.modal-title').text('이름 에러');
          $('#modalText').text('이름을 제대로 입력해 주세요.');
            $('.modal').modal('show');
          flag = false;
            return;
        }


        if(password !== confirmPassword){
            $('.modal-title').text('암호 에러');
          $('#modalText').text('암호가 같지 않습니다. 다시한번 체크해주세요.');
            $('.modal').modal('show');
          flag = false;
            return;
        }

        if(verifyEmail(email)){
          flag = false;
            $('.modal-title').text('이메일 에러');
          $('#modalText').text('이메일을 제대로 입력해주세요.');
            $('.modal').modal('show');
              return;
        }

        if(chkPwd(password)){
            flag = false;
            $('.modal-title').text('암호 에러');
            $('#modalText').text('암호는 6~20자리 이며, 숫자가 하나 있어야 합니다.');
              $('.modal').modal('show');
              return;
        }


        if(checkLocation(location)){
          flag = false;
            $('.modal-title').text('지역 에러');
            $('#modalText').text('지역을 선택해 주세요.');
            $('.modal').modal('show');
            return;
        }
        console.log(flag);
        //마지막 flag체크후 보내기
        if(flag){
          form.submit();
        }else{

        }

      }
     $(document).ready(function() {
       $('#confirmPassword').keyup(function() {
        var inputpassword = $('#inputPassword').val();
        var confirmpsassword = $('#confirmPassword').val();
           if(inputpassword == confirmpsassword){
               $('#checkPasswordResult').text(''); //정상시 텍스트 표시 안함
           }else{
               $('#checkPasswordResult').text('암호가 같지 않습니다.'); // 암호가 같지 않음.
           }

        });//confirmPassword

        $('#inputPassword').keyup(function() {
        var inputpassword = $('#inputPassword').val();
        var confirmpsassword = $('#confirmPassword').val();
           if(inputpassword == confirmpsassword){
               $('#checkPasswordResult').text(''); //정상시 텍스트 표시 안함
           }else{
               $('#checkPasswordResult').text('암호가 같지 않습니다.'); // 암호가 같지 않음.
           }

        });//confirmPassword


      //이메일체크
      $('#checkemail').click( function(){
        var checkemail = $('#inputEmail').val();

        if(checkemail == ''){
           $('.modal-title').text('이메일을 입력해 주세요');
            $('#modalText').text('이메일을 입력해 주세요.');
            $('.modal').modal('show');
            return false;
        }

        if(verifyEmail(checkemail)){
            $('.modal-title').text('이메일 에러');
            $('#modalText').text('이메일을 제대로 입력해주세요.');
            $('.modal').modal('show');
            return;
        }

        $.ajax({
            url: '/commuteMaster/checkemail',
              dataType: 'json',
              type: 'POST',
              data: { email :checkemail },
              success: function(result) {
                  if ( result.result == true ) { //true
                        $('.modal-title').text('가입가능 이메일');
                        $('#modalText').text('가입가능한 이메일입니다.');
                        $('.modal').modal('show');
                  }else{ //false
                        $('.modal-title').text('가입불가 이메일');
                        $('#modalText').text('이미 가입한 메일입니다.');
                        $('.modal').modal('show');
                  }
              } //function끝
        });
      });//click

     });
