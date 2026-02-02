'use strict';

// Google Apps Script web app endpoint
const API_URL = 'https://script.google.com/macros/s/AKfycbyOwGozphXtTYN9RxqeT4eYp2z5BnVWjQgQ0Jinl65FyrlyDO_ce_0_F-Wu2zPJTWH-/exec';

// Pre-fill referrer from URL
const urlParams = new URLSearchParams(window.location.search);
const referralEmail = urlParams.get('ref');
if (referralEmail) {
    document.getElementById('referrer').value = decodeURIComponent(referralEmail);
}

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const messageDiv = document.getElementById('message');
    const email = document.getElementById('email').value.trim();
    const referrer = document.getElementById('referrer').value.trim();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    submitBtn.classList.remove('submit-success');

    messageDiv.classList.remove('show', 'success', 'error');

    try {
        // Use text/plain to avoid CORS preflight (Apps Script doesn't respond to OPTIONS)
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'signup',
                email: email,
                referrer: referrer || null
            })
        });

        const data = await response.json();

        if (data.success) {
            messageDiv.textContent = data.message;
            messageDiv.classList.add('success', 'show');
            submitBtn.classList.add('submit-success');
            submitBtn.textContent = 'Entry recorded';

            document.getElementById('email').value = '';
            document.getElementById('referrer').value = '';
        } else {
            messageDiv.textContent = data.message || 'An error occurred. Please try again.';
            messageDiv.classList.add('error', 'show');
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = 'Connection error. Please check your internet and try again.';
        messageDiv.classList.add('error', 'show');
    } finally {
        submitBtn.disabled = false;
        if (!submitBtn.classList.contains('submit-success')) {
            submitBtn.textContent = 'Enter Competition';
        }
    }
});
