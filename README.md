# 해솔 네컷: GitHub Pages + Google Apps Script

카메라 원본 배경으로 네 장을 촬영해 사진첩형 종이 프레임의 JPG를 만듭니다. 공연장 가상 배경과 인물 분리 기능은 제거했습니다. 촬영 시점의 기기 날짜가 프레임에 표시됩니다. 다운로드는 브라우저에서 처리하고, 이메일 전송 때만 사진과 주소를 Google Apps Script 웹 앱으로 보냅니다.

## 1. Google Apps Script 메일 웹 앱 만들기

1. 메일 발송에 사용할 Google 계정으로 [script.google.com](https://script.google.com/)에 접속해 **새 프로젝트**를 만듭니다. 학교 계정이라면 관리자가 외부 웹 앱 공개나 외부 메일 전송을 제한할 수 있습니다.
2. 편집기의 `Code.gs` 내용을 이 폴더의 `Code.gs` 전체 내용으로 바꾸고 **저장**합니다. 이 파일은 GitHub Pages에서 실행하지 않습니다. 메일 발송 권한은 Apps Script 프로젝트 안에만 둡니다.
3. 편집기에서 함수 선택 목록에 `doPost`만 보인다면 빈 인수로 직접 실행해 테스트하지 마세요. 먼저 메일 권한 승인이 필요하면 아래 함수를 임시로 추가해 선택 후 **실행**하고 Google 권한 화면에서 승인하세요. 실행 뒤 함수는 지워도 됩니다.

   ```javascript
   function authorizeMail() {
     console.log(MailApp.getRemainingDailyQuota());
   }
   ```

4. 우측 상단 **배포 → 새 배포 → 유형 선택(톱니바퀴) → 웹 앱**을 선택합니다. **다음 사용자로 실행: 나(배포자)**, **액세스 권한이 있는 사용자: 모든 사용자**로 설정합니다. 승인 화면이 나타나면 소유자 계정으로 승인합니다. `모든 사용자`가 없다면 계정 또는 조직 정책을 확인하세요. 수신 학생이 각자 Google 계정으로 승인하지 않도록 배포자 실행으로 설정합니다.
5. 배포 후 표시되는 `https://script.google.com/macros/s/.../exec` 주소를 복사하여 `config.js`의 `MAIL_WEB_APP_URL` 값에 넣습니다. 개발용 `/dev` 주소는 사용하지 않습니다. URL 끝에 `/exec`가 와야 합니다. Apps Script 코드를 수정했다면 **배포 → 배포 관리 → 수정 → 새 버전**을 선택하여 공개 버전을 갱신하세요.
6. `Code.gs`는 웹 앱의 서버 코드입니다. 공개 GitHub 저장소에 올릴 필요가 없습니다. 이 예제에 비밀 토큰은 없지만, 공개 웹 앱 주소만으로도 누구나 발송 요청을 할 수 있습니다.

## 2. 사이트 게시

1. `index.html`, `app.js`, `style.css`, `config.js`와 필요하다면 `.nojekyll`을 GitHub 저장소 루트에 올립니다. 이전 버전의 `stage.svg`는 삭제하세요. MediaPipe나 EmailJS 설정도 필요 없습니다.
2. 저장소의 **Settings → Pages → Build and deployment**에서 **Deploy from a branch**, `main`, `/ (root)`를 선택합니다.
3. 게시된 `https://사용자명.github.io/저장소명/`을 태블릿에서 열고 카메라 권한을 허용합니다. 카메라에는 HTTPS가 필요합니다.
4. 네 장 촬영 후 메일 주소를 입력하고 **이메일로 보내기**를 누릅니다. **새 탭**에 Apps Script의 전송 결과가 표시됩니다. 성공 메시지가 나와도 실제 수신은 받은편지함 또는 스팸함에서 확인하세요. 새 탭이 차단되면 브라우저의 팝업 허용 설정을 확인하세요. 원래 탭의 사진은 유지되며 다음 팀 전에 **다시 찍기**를 누르면 사진과 이메일 입력이 지워집니다.

## 전송 방식과 현장 점검

- 브라우저가 사진 JPG를 base64 문자열로 변환해 일반 HTML 폼 POST로 웹 앱에 제출합니다. `doPost(e)`가 `email`과 `photoData`를 받고 JPG 첨부로 `MailApp.sendEmail`을 실행합니다. 브라우저에서 다른 출처의 응답을 직접 읽는 `fetch` 방식은 사용하지 않습니다. 새 결과 탭에서 서버가 표시한 성공/실패를 확인합니다.
- 실제 기기와 외부 수신 주소로 카메라 방향, JPG 첨부, 수신함과 스팸함을 시험하세요. 오류가 나면 Apps Script 편집기의 **실행 기록**도 확인하세요. 네트워크가 끊겼거나 메일 한도를 넘겼다면 **사진 저장**을 사용합니다.
- 공개 웹 앱은 호출자가 누구인지 이 코드에서 확인하지 않습니다. 행사 시간 밖에는 배포를 중단하거나 액세스 권한을 줄이고, 남용 가능성과 발송 계정의 일일 한도를 확인하세요. `MailApp.getRemainingDailyQuota()` 검사만으로 남용이 막히지는 않습니다. 큰 행사나 강한 접근 통제가 필요하다면 별도의 인증된 서버가 적합합니다.
- 사진과 메일 주소는 Google을 통해 전송됩니다. 공용 태블릿에서는 다음 팀 전에 다시 찍기를 누르고, 사진과 연락처 처리에 관한 행사 안내 및 동의 절차를 확인하세요. 메일 발송은 계정별 일일 수신자 할당량 및 첨부 크기 제한을 따릅니다.

참고: [Apps Script 웹 앱 배포와 `doPost`](https://developers.google.com/apps-script/guides/web), [MailApp 첨부파일 및 발송](https://developers.google.com/apps-script/reference/mail/mail-app), [서비스 할당량](https://developers.google.com/apps-script/guides/services/quotas).
