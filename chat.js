// chat.js

// دالة لتوليد مفتاح تشفير
async function generateKey() {
    try {
        return await crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    } catch (error) {
        console.error("خطأ في توليد المفتاح:", error);
        throw error; // إعادة الخطأ للتعامل معه في مكان آخر
    }
}

// دالة لتشفير الرسالة
async function encryptMessage(message, key) {
    try {
        const encodedMessage = new TextEncoder().encode(message);
        const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            encodedMessage
        );
        return { iv, encrypted };
    } catch (error) {
        console.error("خطأ في تشفير الرسالة:", error);
        throw error;
    }
}

// دالة لفك تشفير الرسالة
async function decryptMessage(encryptedMessage, key, iv) {
    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            encryptedMessage
        );
        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error("خطأ في فك تشفير الرسالة:", error);
        throw error;
    }
}

// دالة لحفظ الرسالة في localStorage
async function saveMessage(message, key, type = 'text') {
    try {
        const { iv, encrypted } = await encryptMessage(message, key);
        const messages = JSON.parse(localStorage.getItem('encryptedMessages') || '[]');
        messages.push({ iv: Array.from(iv), encrypted: Array.from(new Uint8Array(encrypted)), type });
        localStorage.setItem('encryptedMessages', JSON.stringify(messages));
    } catch (error) {
        console.error("خطأ في حفظ الرسالة:", error);
    }
}

// دالة لتحميل وعرض الرسائل من localStorage
async function loadMessages(key) {
    try {
        const messages = JSON.parse(localStorage.getItem('encryptedMessages') || '[]');
        const chatDiv = document.getElementById('chat');
        chatDiv.innerHTML = '';
        for (const message of messages) {
            const decryptedMessage = await decryptMessage(
                new Uint8Array(message.encrypted),
                key,
                new Uint8Array(message.iv)
            );
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            if (message.type === 'image') {
                messageElement.innerHTML = `<div class="bubble"><img src="${decryptedMessage}" style="max-width: 100%; border-radius: 10px;"></div>`;
            } else {
                messageElement.innerHTML = `<div class="bubble">${decryptedMessage}</div>`;
            }
            chatDiv.appendChild(messageElement);
        }
        // التمرير إلى الأسفل لعرض أحدث الرسائل
        chatDiv.scrollTop = chatDiv.scrollHeight;
    } catch (error) {
        console.error("خطأ في تحميل الرسائل:", error);
    }
}

// دالة لتهيئة التطبيق
async function init() {
    try {
        const key = await generateKey();
        window.chatKey = key; // حفظ المفتاح في متغير عام

        // تحميل الرسائل عند بدء التطبيق
        await loadMessages(key);

        // إرسال رسالة جديدة
        document.getElementById('sendButton').addEventListener('click', async () => {
            const messageInput = document.getElementById('messageInput');
            const message = messageInput.value;
            if (message) {
                await saveMessage(message, key);
                messageInput.value = '';
                await loadMessages(key);
            }
        });

        // إرسال الرسالة عند الضغط على Enter
        document.getElementById('messageInput').addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const messageInput = document.getElementById('messageInput');
                const message = messageInput.value;
                if (message) {
                    await saveMessage(message, key);
                    messageInput.value = '';
                    await loadMessages(key);
                }
            }
        });

        // إرسال صورة
        document.getElementById('fileInput').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    await saveMessage(event.target.result, key, 'image');
                    await loadMessages(key);
                };
                reader.readAsDataURL(file);
            }
        });

        // فتح منتقي الرموز التفاعلية
        document.getElementById('emojiButton').addEventListener('click', () => {
            const emojiPicker = document.getElementById('emojiPicker');
            emojiPicker.style.display = emojiPicker.style.display === 'flex' ? 'none' : 'flex';
        });

        // إضافة رمز تفاعلي إلى حقل الإدخال
        document.querySelectorAll('.emoji-picker span').forEach(emoji => {
            emoji.addEventListener('click', () => {
                const messageInput = document.getElementById('messageInput');
                messageInput.value += emoji.textContent;
            });
        });
    } catch (error) {
        console.error("خطأ في تهيئة التطبيق:", error);
    }
}

// تهيئة التطبيق
init();