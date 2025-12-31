<script>
// URL вашего голосового Worker'а (замените на реальный, например wss://divine-flower-a0ae.nncdedcg.workers.dev)
const VOICE_WORKER_URL = 'wss://albamen-voice.nncdecdgc.workers.dev'; // <-- Измените!

let ws = null;
let mediaRecorder = null;
let stream = null;

const voiceBtn = document.querySelector('.ai-voice-btn'); // Кнопка вызова голоса
const voiceModal = document.querySelector('.ai-panel-voice'); // Модальное окно голоса
const avatarImg = voiceModal.querySelector('.ai-chat-avatar-large img'); // Аватар для свечения

if (voiceBtn) {
  voiceBtn.addEventListener('click', async () => {
    // Открываем модалку
    voiceModal.classList.add('ai-open');

    // Запрос микрофона
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      alert('Mikrofon erişimi reddedildi. Lütfen izin verin.');
      return;
    }

    // Подключаемся к Worker'у (можно добавить ?name=...&age=... если нужно)
    ws = new WebSocket(VOICE_WORKER_URL);

    ws.onopen = () => {
      console.log('WebSocket открыт — начинаем запись');

      // MediaRecorder для отправки аудио чанков (opus — оптимально для Gemini)
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(event.data);
        }
      };
      mediaRecorder.start(250); // Чанки каждые 250 мс — низкая задержка
    };

    ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        // Получаем аудио от Gemini — проигрываем
        event.data.arrayBuffer().then(buffer => {
          const audioBlob = new Blob([buffer], { type: 'audio/wav' }); // Gemini отправляет PCM или WAV
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();

          // Свечение аватара при речи
          avatarImg.classList.add('ai-glow');
          audio.onended = () => avatarImg.classList.remove('ai-glow');
        });
      }
    };

    ws.onclose = () => {
      console.log('WebSocket закрыт');
      stopRecording();
    };

    ws.onerror = (err) => {
      console.error('WebSocket ошибка:', err);
      stopRecording();
    };
  });
}

// Функция остановки записи
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  if (stream) stream.getTracks().forEach(track => track.stop());
}

// Кнопка закрытия модалки (X)
document.querySelector('.ai-close-icon')?.addEventListener('click', () => {
  voiceModal.classList.remove('ai-open');
  if (ws) ws.close();
  stopRecording();
});
</script>
