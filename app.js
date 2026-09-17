import { EMAILJS } from "./config.js";
const video = document.querySelector('#video');
const livePreview = document.querySelector('#livePreview');
const liveCtx = livePreview.getContext('2d');
const inputFrame = document.createElement('canvas');
inputFrame.width = livePreview.width; inputFrame.height = livePreview.height;
const inputCtx = inputFrame.getContext('2d');
const backgroundButton = document.querySelector('#background');
const stage = new Image(); stage.src = './stage.svg';
let backgroundOn = true;
let segmenter = null;
let cameraLoop = 0;
let rendering = false;
let lastProcessed = 0;
let hasLiveFrame = false;
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

function coverTo(context, source, width, height) {
  const sw = source.videoWidth || source.width;
  const sh = source.videoHeight || source.height;
  const scale = Math.max(width / sw, height / sh);
  context.drawImage(source, (sw - width / scale) / 2, (sh - height / scale) / 2,
    width / scale, height / scale, 0, 0, width, height);
}
function drawLive(results) {
  const width = livePreview.width, height = livePreview.height;
  liveCtx.clearRect(0, 0, width, height);
  if (backgroundOn && results?.segmentationMask && stage.complete && stage.naturalWidth) {
    liveCtx.drawImage(results.segmentationMask, 0, 0, width, height);
    liveCtx.globalCompositeOperation = 'source-in';
    coverTo(liveCtx, results.image, width, height);
    liveCtx.globalCompositeOperation = 'destination-over';
    coverTo(liveCtx, stage, width, height);
    liveCtx.globalCompositeOperation = 'source-over';
  } else if (video.videoWidth) coverTo(liveCtx, video, width, height);
  hasLiveFrame = true;
}
async function initBackground() {
  if (!window.SelfieSegmentation) throw new Error('배경 분리 프로그램을 불러오지 못했습니다.');
  segmenter = new window.SelfieSegmentation({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
  });
  segmenter.setOptions({ modelSelection: 1 });
  segmenter.onResults(drawLive);
}
async function updateCamera(time) {
  if (!stream) return;
  cameraLoop = requestAnimationFrame(updateCamera);
  if (rendering || video.readyState < 2 || time - lastProcessed < 85) return;
  rendering = true; lastProcessed = time;
  try {
    if (backgroundOn && segmenter) {
      coverTo(inputCtx, video, inputFrame.width, inputFrame.height);
      await segmenter.send({ image: inputFrame });
    } else drawLive();
  } catch {
    backgroundOn = false; backgroundButton.textContent = '공연장 배경 꺼짐';
    drawLive(); message('배경 분리가 지원되지 않아 기본 카메라로 촬영합니다.');
  } finally { rendering = false; }
}
backgroundButton.addEventListener('click', async () => {
  backgroundOn = !backgroundOn;
  if (backgroundOn && !segmenter) {
    try { await initBackground(); } catch { backgroundOn = false; message('배경 분리 프로그램을 불러오지 못했습니다. 네트워크를 확인해 주세요.'); }
  }
  backgroundButton.textContent = backgroundOn ? '공연장 배경 켜짐' : '공연장 배경 꺼짐';
  if (!backgroundOn) drawLive();
});

function tornPath(x, y, w, h, notch = 4) {
  ctx.beginPath(); ctx.moveTo(x, y);
  for (let px = 0; px <= w; px += 18) ctx.lineTo(x + px, y + ((px / 18) % 3 - 1) * notch);
  for (let py = 0; py <= h; py += 18) ctx.lineTo(x + w + ((py / 18) % 3 - 1) * notch, y + py);
  for (let px = w; px >= 0; px -= 18) ctx.lineTo(x + px, y + h + ((px / 18) % 3 - 1) * notch);
  for (let py = h; py >= 0; py -= 18) ctx.lineTo(x + ((py / 18) % 3 - 1) * notch, y + py);
  ctx.closePath();
}
function flower(x, y, scale, color = '#f8a848') {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    ctx.save(); ctx.rotate(i * Math.PI * 2 / 5);
    ctx.beginPath(); ctx.ellipse(0, -13, 8, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  ctx.fillStyle = '#fff0a9'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawPhoto(i, x, y, angle) {
  const w = 575, h = 315;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(angle); ctx.translate(-w / 2, -h / 2);
  ctx.shadowColor = '#554c3d44'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 11;
  tornPath(-12, -12, w + 24, h + 24);
  ctx.fillStyle = '#f6f3eb'; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.save(); tornPath(0, 0, w, h, 2); ctx.clip();
  if (photos[i]) drawCover(photos[i], 0, 0, w, h);
  else {
    ctx.fillStyle = ['#e4ebd8', '#fbe5d3', '#e5ede5', '#f5e7d7'][i]; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#78947e'; ctx.font = '700 30px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText(`PHOTO 0${i + 1}`, w / 2, h / 2 + 10);
  }
  ctx.restore();
  ctx.fillStyle = '#fffdf5bb'; ctx.fillRect(w / 2 - 61, -25, 122, 30); // 마스킹테이프
  ctx.fillStyle = '#426951'; ctx.font = '700 18px system-ui, sans-serif';
  ctx.textAlign = 'right'; ctx.fillText(`0${i + 1}`, w - 10, h - 12);
  ctx.restore();
}
function render() {
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = '#fbf7ed'; ctx.fillRect(0, 0, w, h);
  // 종이의 잔잔한 점무늬
  ctx.fillStyle = '#c4bda622';
  for (let py = 28; py < h; py += 43) for (let px = 22; px < w; px += 41) {
    ctx.beginPath(); ctx.arc(px + (py % 4), py, 1.3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.textAlign = 'center'; ctx.fillStyle = '#327158';
  ctx.font = '900 58px system-ui, sans-serif'; ctx.fillText('해솔 네컷', w / 2, 89);
  ctx.strokeStyle = '#ec8c56'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(178, 106); ctx.quadraticCurveTo(360, 118, 542, 105); ctx.stroke();
  ctx.fillStyle = '#9c886d'; ctx.font = '700 19px system-ui, sans-serif';
  ctx.fillText('HAESOL  PHOTO DIARY', w / 2, 142);
  flower(80, 86, 1.1); flower(640, 120, .7, '#eaa777');

  drawPhoto(0, 69, 185, -.035);
  drawPhoto(1, 76, 555, .035);
  drawPhoto(2, 65, 928, -.028);
  drawPhoto(3, 78, 1300, .028);

  flower(59, 515, .68); flower(653, 903, .85, '#f4a384');
  flower(61, 1286, .63, '#ebad63');
  ctx.fillStyle = '#327158'; ctx.font = '700 26px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('우리의 축제, 네 장의 기록', w / 2, 1695);
  ctx.fillStyle = '#9c886d'; ctx.font = '21px system-ui, sans-serif';
  ctx.fillText(new Date().toLocaleDateString('ko-KR'), w / 2, 1734);
  ctx.strokeStyle = '#568568'; ctx.lineWidth = 3;
  for (let x = 0; x < w; x += 16) {
    const height = 13 + ((x * 7) % 22);
    ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x - 5, h - height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + 6, h - height * .8); ctx.stroke();
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
    cancelAnimationFrame(cameraLoop); stream?.getTracks().forEach(track => track.stop());
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
    hasLiveFrame = false; video.srcObject = stream;
    await video.play(); start.disabled = true; shoot.disabled = false; backgroundButton.disabled = false;
    if (backgroundOn && !segmenter) {
      try { message('공연장 배경을 준비하고 있어요…'); await initBackground(); }
      catch { backgroundOn = false; backgroundButton.textContent = '공연장 배경 꺼짐'; message('배경 기능을 불러오지 못해 기본 카메라를 사용합니다.'); }
    }
    cameraLoop = requestAnimationFrame(updateCamera);
    document.querySelector('#cameraHint').textContent = '화면에는 거울처럼 보이고 사진도 같은 방향으로 저장돼요.';
    message('준비됐어요. 네 장 촬영을 눌러 주세요.');
  } catch { message('카메라를 열 수 없어요. 브라우저 권한과 HTTPS 연결을 확인해 주세요.'); }
});
shoot.addEventListener('click', async () => {
  if (busy || !stream || video.videoWidth === 0 || !hasLiveFrame) return;
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
      coverTo(shotCtx, livePreview, 600, 340);
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
window.addEventListener('pagehide', () => { cancelAnimationFrame(cameraLoop); stream?.getTracks().forEach(track => track.stop()); });
render();
