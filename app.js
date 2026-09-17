import { EMAILJS } from "./config.js";
const video = document.querySelector('#video');
const canvas = document.querySelector('#preview');
const ctx = canvas.getContext('2d');
const status = document.querySelector('#status');
const countdown = document.querySelector('#countdown');
const progress = document.querySelector('#progress');
const start = document.querySelector('#start');
const shoot = document.querySelector('#shoot');
const retry = document.querySelector('#retry');
const download = document.querySelector('#download');
const send = document.querySelector('#send');
const form = document.querySelector('#mailForm');
const email = document.querySelector('#email');
let stream;
let busy = false;
let photos = [];
let ready = false;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const message = text => { status.textContent = text; };
function drawCover(source, x, y, w, h) {
  const sw = source.videoWidth || source.width;
  const sh = source.videoHeight || source.height;
  const scale = Math.max(w / sw, h / sh);
  const cw = w / scale, ch = h / scale;
  ctx.drawImage(source, (sw - cw) / 2, (sh - ch) / 2, cw, ch, x, y, w, h);
}
function render() {
  const w = canvas.width;
  const ink = '#181845', cream = '#fff8ed', coral = '#ff684d';
  const accents = ['#ff684d', '#c9f15c', '#66d7e8', '#ffa8d2'];
  ctx.fillStyle = ink; ctx.fillRect(0, 0, w, canvas.height);
  // 포스터의 모서리와 상단 리본
  ctx.fillStyle = coral; ctx.fillRect(0, 0, w, 24);
  ctx.fillStyle = '#c9f15c'; ctx.fillRect(0, 24, 170, 12);
  ctx.fillStyle = '#66d7e8'; ctx.fillRect(530, 24, 190, 12);
  ctx.textAlign = 'left'; ctx.fillStyle = cream;
  ctx.font = '900 66px system-ui, sans-serif'; ctx.fillText('FESTIVAL', 46, 104);
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.fillText('PHOTO BOOTH  /  FOUR CUTS', 50, 143);
  ctx.fillStyle = '#c9f15c'; ctx.fillRect(610, 62, 52, 52);
  ctx.save(); ctx.translate(635, 88); ctx.rotate(Math.PI / 4);
  ctx.fillStyle = ink; ctx.fillRect(-18, -18, 36, 36); ctx.restore();

  const x = 44, frameW = 632, frameH = 336, gap = 15, top = 168;
  for (let i = 0; i < 4; i++) {
    const y = top + i * (frameH + gap);
    ctx.fillStyle = accents[i]; ctx.fillRect(x - 5, y - 5, frameW + 10, frameH + 10);
    if (photos[i]) drawCover(photos[i], x, y, frameW, frameH);
    else {
      ctx.fillStyle = '#292953'; ctx.fillRect(x, y, frameW, frameH);
      ctx.fillStyle = '#ffffff88'; ctx.textAlign = 'center';
      ctx.font = '800 32px system-ui, sans-serif';
      ctx.fillText(`FRAME 0${i + 1}`, w / 2, y + 180);
    }
    ctx.fillStyle = accents[i]; ctx.fillRect(x + 14, y + 14, 56, 39);
    ctx.fillStyle = ink; ctx.textAlign = 'center';
    ctx.font = '900 21px system-ui, sans-serif';
    ctx.fillText(`0${i + 1}`, x + 42, y + 41);
  }

  // 하단 타이포그래피와 컨페티
  ctx.textAlign = 'left'; ctx.fillStyle = cream;
  ctx.font = '900 64px system-ui, sans-serif'; ctx.fillText('FOUR CUTS', 44, 1655);
  ctx.fillStyle = coral; ctx.fillRect(45, 1673, 420, 12);
  ctx.fillStyle = '#c9f15c'; ctx.fillRect(485, 1673, 190, 12);
  ctx.fillStyle = cream; ctx.font = '700 25px system-ui, sans-serif';
  ctx.fillText('SCHOOL FESTIVAL', 46, 1733);
  ctx.textAlign = 'right'; ctx.fillText(new Date().toLocaleDateString('ko-KR'), 674, 1733);
  for (const [cx, cy, color, angle] of [
    [56, 1770, coral, .3], [120, 1795, '#c9f15c', -.4],
    [555, 1782, '#66d7e8', .6], [645, 1794, '#ffa8d2', -.3]
  ]) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
    ctx.fillStyle = color; ctx.fillRect(-14, -4, 28, 8); ctx.restore();
  }
  progress.textContent = `${photos.length} / 4 촬영`;
}

function reset() {
  photos = []; ready = false; busy = false; email.value = '';
  shoot.disabled = !stream; retry.disabled = true; send.disabled = true; download.disabled = true;
  render(); message('준비됐어요. 네 장 촬영을 눌러 주세요.');
}
start.addEventListener('click', async () => {
  try {
    stream?.getTracks().forEach(track => track.stop());
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
    video.srcObject = stream;
    await video.play(); start.disabled = true; shoot.disabled = false;
    document.querySelector('#cameraHint').textContent = '화면에는 거울처럼 보이고 사진도 같은 방향으로 저장돼요.';
    message('준비됐어요. 네 장 촬영을 눌러 주세요.');
  } catch { message('카메라를 열 수 없어요. 브라우저 권한과 HTTPS 연결을 확인해 주세요.'); }
});
shoot.addEventListener('click', async () => {
  if (busy || !stream || video.videoWidth === 0) return;
  busy = true; shoot.disabled = true; retry.disabled = true; send.disabled = true;
  photos = []; ready = false; render();
  try {
    for (let i = 0; i < 4; i++) {
      message(`${i + 1}번째 사진 준비!`);
      for (let n = 3; n > 0; n--) { countdown.textContent = n; await pause(1000); }
      countdown.textContent = '찰칵!';
      const shot = document.createElement('canvas'); shot.width = 600; shot.height = 340;
      const shotCtx = shot.getContext('2d');
      shotCtx.translate(600, 0); shotCtx.scale(-1, 1);
      const sw = video.videoWidth, sh = video.videoHeight;
      const scale = Math.max(600 / sw, 340 / sh);
      shotCtx.drawImage(video, (sw - 600 / scale) / 2, (sh - 340 / scale) / 2, 600 / scale, 340 / scale, 0, 0, 600, 340);
      photos.push(shot); render(); await pause(400); countdown.textContent = '';
    }
    ready = true; send.disabled = false; download.disabled = false; message('완성! 이메일을 입력해 사진을 보내세요.');
  } finally { countdown.textContent = ''; busy = false; retry.disabled = false; }
});
retry.addEventListener('click', reset);
download.addEventListener('click', () => {
  if (!photos.length) return;
  const link = document.createElement('a');
  link.download = 'festival-four-cuts.jpg';
  link.href = canvas.toDataURL('image/jpeg', .85);
  link.click();
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!ready || busy || !form.reportValidity()) return;
  if (Object.values(EMAILJS).some(value => !value || value.startsWith('YOUR_'))) {
    message('관리자 설정이 필요합니다. config.js의 EmailJS 값을 입력해 주세요.'); return;
  }
  busy = true; send.disabled = true; retry.disabled = true; message('이메일을 보내고 있어요…');
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS.serviceId, template_id: EMAILJS.templateId, user_id: EMAILJS.publicKey,
        template_params: { to_email: email.value.trim(), content: canvas.toDataURL('image/jpeg', .85) }
      })
    });
    if (!response.ok) throw new Error('메일 전송에 실패했습니다. 담당자에게 알려 주세요.');
    message('전송 완료! 받은편지함을 확인해 주세요. 다음 팀은 다시 찍기를 눌러 주세요.');
    email.value = ''; ready = false;
  } catch (error) { message(error.message); send.disabled = false; }
  finally { busy = false; retry.disabled = false; }
});
window.addEventListener('pagehide', () => stream?.getTracks().forEach(track => track.stop()));
render();
