import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './cont.css';

function ConfirmCodePage() {
    const [code, setCode] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleConfirm = async () => {
        try {
            const response = await fetch('https://nukesul-backend-1bde.twc1.net/api/confirm-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    // Сохранение токена в localStorage
                    localStorage.setItem('token', data.token);

                    // Перенаправление на страницу кабинета
                    navigate('/cabinet');
                } else {
                    setErrorMessage('Ошибка при подтверждении. Пожалуйста, попробуйте снова.');
                }
            } else {
                setErrorMessage('Неверный код. Пожалуйста, попробуйте снова.');
            }
        } catch (error) {
            setErrorMessage('Ошибка при подтверждении кода.');
        }
    };

    return (
        <div className='tety'>
            <div className="confirm-code-container1">
                <h2 className="tt1">Подтверждение аккаунта</h2>
                <div className="form-container5">
                    <input
                        type="text"
                        placeholder="Введите код подтверждения"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="input-field"
                    />
                    {errorMessage && <div className="error-message">{errorMessage}</div>}
                    <button className="confirm-button" onClick={handleConfirm}>
                        Подтвердить
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmCodePage;
