let hasMessages = false;
let quickQuestions = {};

fetch('../quick-questions/quick-questions.json')
  .then((res) => res.json())
  .then((data) => {
    quickQuestions = data;
  })
  .catch((err) => {
    console.error('Error loading quick-questions.json:', err);
  });

document.getElementById('msg').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') send();
});

async function send() {
  const text = document.getElementById('msg').value.trim();
  if (!text) return;

  if (!hasMessages) {
    document.querySelector('.chat-header').style.display = 'none';
    document.querySelector('.sugerencias').style.display = 'none';
    document.getElementById('messages').classList.add('full-height');
    hasMessages = true;
  }

  addMessage(text, 'user');
  document.getElementById('msg').value = '';
  showTyping(true);

  let res;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    showTyping(false);
    addMessage('❌ No se pudo conectar con el servidor', 'bot');
    return;
  }

  if (!res.ok) {
    showTyping(false);
    addMessage('❌ Error ' + res.status, 'bot');
    return;
  }

  const data = await res.json();

  showTyping(false);

  let botText = 'Sin respuesta del agente';
  if (data.reply && data.reply.length > 0) {
    const msg = data.reply[0];
    if (msg.text?.text?.length > 0) {
      botText = msg.text.text[0];
    }
  }

  addMessage(botText, 'bot');
}

function addMessage(text, sender) {
  const messages = document.getElementById('messages');

  const bubble = document.createElement('div');
  bubble.className = 'msg ' + sender;

  const icon = document.createElement('img');
  icon.className = 'msg-icon';

  if (sender === 'user') {
    icon.src = 'icons/user-message.svg';
  } else {
    icon.src = 'icons/patroclo-message.svg';
  }

  icon.alt = sender;

  const textSpan = document.createElement('span');
  textSpan.innerHTML = text
    .split('\n')
    .map((line) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return line.replace(
        urlRegex,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      );
    })
    .join('<br>');

  bubble.appendChild(icon);
  bubble.appendChild(textSpan);

  messages.appendChild(bubble);

  messages.scrollTo({
    top: messages.scrollHeight,
    behavior: 'smooth',
  });
}

function showTyping(state) {
  document.getElementById('typing').style.display = state ? 'block' : 'none';
}

function sendQuick(tag) {
  const questions = quickQuestions[tag];
  if (questions && Array.isArray(questions) && questions.length > 0) {
    const randomIndex = Math.floor(Math.random() * questions.length);
    const question = questions[randomIndex];
    document.getElementById('msg').value = question;
  } else {
    document.getElementById('msg').value = tag;
  }
  send();
}
