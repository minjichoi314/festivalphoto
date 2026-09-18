// Google Apps Script 프로젝트에 붙여 넣고 웹 앱으로 배포합니다.
// 공개 웹 앱은 URL을 아는 누구나 소유자 계정으로 메일을 요청할 수 있습니다.
function doPost(e) {
  try {
    const params = (e && e.parameter) || {};
    const address = String(params.email || '').trim();
    const encoded = String(params.photoData || '');
    if (!/^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/.test(address) || address.length > 254) {
      throw new Error('이메일 주소를 확인해 주세요.');
    }
    // 원본 JPEG 약 3 MB 이하. base64 전송 본문은 약 4 MB 이하로 제한합니다.
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length > 4 * 1024 * 1024) {
      throw new Error('사진 데이터가 없거나 너무 큽니다. 사진 저장 기능을 이용해 주세요.');
    }
    if (MailApp.getRemainingDailyQuota() < 1) throw new Error('오늘의 메일 발송 한도를 초과했습니다.');
    const bytes = Utilities.base64Decode(encoded);
    if (bytes.length < 4 || bytes.length > 3 * 1024 * 1024 ||
        (bytes[0] & 255) !== 255 || (bytes[1] & 255) !== 216) {
      throw new Error('JPEG 사진 데이터가 올바르지 않습니다.');
    }
    const attachment = Utilities.newBlob(bytes, 'image/jpeg', 'festival-four-cuts.jpg');
    MailApp.sendEmail({
      to: address,
      subject: '해솔 네컷 사진',
      body: '촬영한 네컷 사진을 첨부했습니다. 즐거운 추억으로 간직해 주세요.',
      attachments: [attachment],
      name: '해솔 네컷'
    });
    return ContentService.createTextOutput('전송 요청이 완료되었습니다. 받은편지함과 스팸함을 확인해 주세요. 이 탭을 닫고 다음 팀을 위해 다시 찍기를 눌러 주세요.');
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput('메일 발송에 실패했습니다: ' + err.message + ' 사진 저장을 이용하거나 담당자에게 알려 주세요.');
  }
}
