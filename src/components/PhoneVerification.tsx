import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './PhoneVerification.css';
import { useAuth } from '../context/AuthContext';

interface PhoneVerificationProps {
  phoneNumber: string;
  onVerificationSuccess: () => void;
  onClose: () => void;
}

const PhoneVerification: React.FC<PhoneVerificationProps> = ({
  phoneNumber,
  onVerificationSuccess,
  onClose
}) => {
  const { sendPhoneOTP, verifyPhoneOTP, initializeRecaptcha } = useAuth();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const toE164 = (raw: string): string | null => {
    let digits = raw.replace(/\D/g, '');
    if (!digits) return null;
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11);
    if (digits.length !== 11) return null;
    return `+${digits}`;
  };

  // Initialize reCAPTCHA when component mounts
  useEffect(() => {
    try {
      initializeRecaptcha('recaptcha-container');
    } catch (error) {
      console.error('Failed to initialize reCAPTCHA:', error);
    }
  }, []);

  // Send OTP when component mounts
  useEffect(() => {
    const sendOTP = async () => {
      const e164 = toE164(phoneNumber);
      if (!e164) {
        setError('Некорректный номер телефона');
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        await sendPhoneOTP(e164, 'recaptcha-container');
        setOtpSent(true);
        setCountdown(60); // 60 seconds countdown
      } catch (error: any) {
        setError(error.message || 'Не удалось отправить код');
        setOtpSent(false);
      } finally {
        setIsLoading(false);
      }
    };

    sendOTP();
  }, [phoneNumber]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await verifyPhoneOTP(otp);
      onVerificationSuccess();
    } catch (error: any) {
      setError(error.message || 'Неверный код');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    const e164 = toE164(phoneNumber);
    if (!e164) {
      setError('Некорректный номер телефона');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await sendPhoneOTP(e164, 'recaptcha-container');
      setOtpSent(true);
      setCountdown(60);
    } catch (error: any) {
      setError(error.message || 'Не удалось отправить код повторно');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  const modal = (
    <div className="phone-verification-backdrop" onClick={handleBackdropClick}>
      <div className="phone-verification-modal" role="dialog" aria-modal="true">
        <div className="phone-verification-content">
          <div className="phone-verification-header">
            <h3>Подтверждение номера телефона</h3>
            <button 
              className="phone-verification-close" 
              onClick={onClose}
              disabled={isLoading}
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>

          <div className="phone-verification-body">
            <div className="phone-verification-info">
              <p>Мы отправили SMS с кодом подтверждения на номер:</p>
              <div className="phone-verification-number">{phoneNumber}</div>
            </div>

            {!otpSent ? (
              <div className="phone-verification-loading">
                <div className="phone-verification-spinner"></div>
                <p>Отправляем код...</p>
              </div>
            ) : (
              <div className="phone-verification-form">
                <div className="phone-verification-field">
                  <label>Код подтверждения</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="phone-verification-otp-input"
                    disabled={isLoading}
                  />
                  <div className="phone-verification-helper">
                    Введите 6-значный код из SMS
                  </div>
                </div>

                {error && (
                  <div className="phone-verification-error">{error}</div>
                )}

                <div className="phone-verification-actions">
                  <button
                    className="phone-verification-btn phone-verification-btn-primary"
                    onClick={handleVerifyOTP}
                    disabled={!otp.trim() || otp.length !== 6 || isLoading}
                  >
                    {isLoading ? 'Проверяем...' : 'Подтвердить'}
                  </button>

                  <button
                    className="phone-verification-btn phone-verification-btn-secondary"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || isLoading}
                  >
                    {countdown > 0 ? `Отправить повторно (${countdown}с)` : 'Отправить повторно'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      {isLoading && (
        <div className="phone-verification-loading-backdrop">
          <div className="phone-verification-spinner"></div>
        </div>
      )}
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default PhoneVerification;
