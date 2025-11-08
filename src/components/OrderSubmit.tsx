import React from 'react';
import ReactDOM from 'react-dom';
import './PizzaCart.css';
import './OrderSubmit.css';
import InfoBanner from './InfoBanner';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FirebaseOrderData, getEmailData, getBossEmailData } from '../firebase/FirebaseData';
import { uploadOrderData, uploadEmailMessage } from '../firebase/FirebaseFirestore';
import { useOvenUseCase } from '../menu/OvenUseCase';
import PhoneVerification from './PhoneVerification';

interface OrderSubmitProps {
  onClose: () => void;
}

const pad2 = (num: number): string => num.toString().padStart(2, '0');

const toLocalDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
};

const getTomorrowLocalDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toLocalDateString(d);
};

const getDayAfterTomorrowLocalDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return toLocalDateString(d);
};

const getAllowedStartDate = (hot: boolean): string => {
  const now = new Date();
  const isAfterSeventeen = now.getHours() > 17 || (now.getHours() === 17 && now.getMinutes() > 0);
  
  // If hot = true, allow today's date
  if (hot) {
    return toLocalDateString(now);
  }
  
  // Start date: if > 17:00 then +2 days, else +1 day
  const start = new Date();
  start.setDate(start.getDate() + (isAfterSeventeen ? 2 : 1));
  return toLocalDateString(start);
};

const getAllowedHours = (hot: boolean, selectedDate: string): string[] => {
  // Default hours: 12-16
  const defaultHours = ['12', '13', '14', '15', '16'];
  
  // If hot = false, return default hours
  if (!hot) {
    return defaultHours;
  }
  
  // If hot = true, check if selected date is today
  const today = toLocalDateString(new Date());
  if (selectedDate === today) {
    // For today: hours from current hour to 20:00
    const now = new Date();
    const currentHour = now.getHours();
    const hours: string[] = [];
    
    // Start from current hour + 1 (at least 1 hour ahead), but not less than 12
    const startHour = Math.max(currentHour + 1, 12);
    // End at 20:00
    const endHour = 20;
    
    for (let h = startHour; h <= endHour; h++) {
      hours.push(pad2(h));
    }
    
    // If no hours available (e.g., it's after 20:00), return default
    return hours.length > 0 ? hours : defaultHours;
  }
  
  // For other days, return default hours
  return defaultHours;
};

const combineDateTimeToEpoch = (dateStr: string, timeStr: string): number => {
  // Build local datetime from inputs like 2025-09-10 and 18:30
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const dt = new Date(y, (m - 1), d, hh, mm, 0, 0);
  return dt.getTime();
};

const OrderSubmit: React.FC<OrderSubmitProps> = ({ onClose }) => {
  const { cartItems, getTotalPrice, getPizzaNames, clearCart } = useCart();
  const { signOut, signInAnonymously } = useAuth();
  const { ovenData } = useOvenUseCase();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('+7 ');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('12:00');
  const [additionalInfo, setAdditionalInfo] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPhoneVerification, setShowPhoneVerification] = React.useState(false);

  const total = getTotalPrice();
  const pizzaNames = getPizzaNames();

  const allowedStartDate = React.useMemo(() => getAllowedStartDate(ovenData.hot), [ovenData.hot]);
  const nextDays = React.useMemo(() => {
    // 8 days window: start date + 7 days
    const days: { value: string; label: string }[] = [];
    const base = new Date(allowedStartDate);
    base.setHours(0,0,0,0);
    for (let i = 0; i <= 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const value = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      const label = d.toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: 'short' });
      days.push({ value, label });
    }
    return days;
  }, [allowedStartDate]);

  // Set initial date when allowedStartDate changes or update if current date is invalid
  React.useEffect(() => {
    if (allowedStartDate) {
      if (!date) {
        // Set initial date
        setDate(allowedStartDate);
      } else {
        // Check if current date is still valid, if not, update to allowedStartDate
        const currentDate = new Date(date);
        const startDate = new Date(allowedStartDate);
        if (currentDate < startDate || !nextDays.some(d => d.value === date)) {
          setDate(allowedStartDate);
        }
      }
    }
  }, [allowedStartDate, date, nextDays]);

  const allowedHours = React.useMemo(() => getAllowedHours(ovenData.hot, date), [ovenData.hot, date]);
  const minutes = React.useMemo(() => ['00', '15', '30', '45'], []);

  // Update time if current time is not in allowed hours
  React.useEffect(() => {
    if (allowedHours.length > 0 && date) {
      const currentHour = time.split(':')[0];
      if (!allowedHours.includes(currentHour)) {
        // Set to first available hour
        setTime(`${allowedHours[0]}:00`);
      }
    }
  }, [allowedHours, date, time]);

  const onBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (submitting) return;
    if (e.target === e.currentTarget) onClose();
  };

  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  const isEmailValid = (value: string) => /.+@.+\..+/.test(value);
  const isPhoneValid = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 11 && digits.startsWith('7');
  };

  const isFormValid = (
    !!name.trim() &&
    isEmailValid(email) &&
    isPhoneValid(phone) &&
    // date within allowed window
    date >= nextDays[0].value && date <= nextDays[nextDays.length - 1].value &&
    allowedHours.includes(time.split(':')[0])
  );

  const formatPhoneInput = (raw: string): string => {
    // Mask: +7 XXX XXX-XX-XX
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11);
    const get = (i: number) => digits[i] ?? '';
    const a = `${get(1)}${get(2)}${get(3)}`;
    const b = `${get(4)}${get(5)}${get(6)}`;
    const c = `${get(7)}${get(8)}`;
    const d = `${get(9)}${get(10)}`;
    let out = '+7';
    if (a) out += ` ${a}`;
    if (b) out += ` ${b}`;
    if (c) out += `-${c}`;
    if (d) out += `-${d}`;
    return out;
  };

  const handleSubmit = async () => {
    if (!isFormValid || cartItems.length === 0) return;
    setShowPhoneVerification(true);
  };

  const processOrder = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const scheduledEpoch = combineDateTimeToEpoch(date, time);
      const order: Omit<FirebaseOrderData, 'id'> = {
        completed: false,
        confirmed: false,
        sum: total,
        consumerName: name.trim(),
        consumerEmail: email.trim(),
        consumerPhone: phone.trim(),
        pizzaList: pizzaNames,
        additionalInfo: additionalInfo.trim(),
        time: scheduledEpoch,
      };
      const id = await uploadOrderData(order);
      console.log('Order created with id', id);

      // Build full order with generated id to compose emails
      const orderWithId: FirebaseOrderData = { id, ...order } as FirebaseOrderData;
      
      // Send customer confirmation email
      const customerEmailData = getEmailData(orderWithId);
      try {
        await uploadEmailMessage(customerEmailData);
      } catch (emailError) {
        console.error('Failed to queue customer email message:', emailError);
      }

      // Send boss notification email
      const bossEmailData = getBossEmailData(orderWithId);
      try {
        await uploadEmailMessage(bossEmailData);
      } catch (emailError) {
        console.error('Failed to queue boss email message:', emailError);
      }

      // After successful order: sign out and then sign in anonymously
      try {
        await signOut();
      } catch {}
      try {
        await signInAnonymously();
      } catch {}

      clearCart();
      onClose();
      alert('Спасибо! Заказ оформлен.');
    } catch (e: any) {
      setError(e?.message || 'Не удалось оформить заказ');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhoneVerificationSuccess = async () => {
    setShowPhoneVerification(false);
    await processOrder();
  };

  const handlePhoneVerificationClose = () => {
    setShowPhoneVerification(false);
  };

  const modal = (
    <div className="cart-backdrop" onClick={onBackdropClick}>
      <div className="cart-modal order-modal" role="dialog" aria-modal="true" aria-label="Оформление заказа">
        <div className="cart-body">
          <div className="order-content">
            <div className="order-header">
              <h3 style={{ margin: 0 }}>Оформление заказа</h3>
              <button className="cart-close" onClick={() => { if (!submitting) onClose(); }} aria-label="Закрыть">✕</button>
            </div>
            <div className="order-summary">
              <div><strong>Пиццы:</strong> {pizzaNames.join(', ')}</div>
              <div><strong>Сумма:</strong> {total.toFixed(2)} ₽</div>
            </div>

            <div className="order-grid">
              <div className="order-field">
                <label>Ваше имя</label>
                <input
                  className="order-input-narrow"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                />
              </div>
              <div className="order-field">
                <label>Email для уведомления о заказе</label>
                <input
                  className="order-input-narrow"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="order-field">
                <label>Телефон для подтверждения заказа</label>
                <input
                  className="order-input-narrow"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                  placeholder="+7 XXX XXX-XX-XX"
                />
                <div className="order-helper">Формат: +7 XXX XXX-XX-XX</div>
              </div>

              <div className="order-date-time">
                <div className="order-field order-picker">
                  <label>Дата готовности заказа</label>
                  <select
                    className="order-select order-input-narrow"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  >
                    {nextDays.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="order-field order-picker">
                  <label>Время готовности заказа</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: 'min(180px, 100%)' }}>
                    <select
                      className="order-select"
                      value={time.split(':')[0]}
                      onChange={(e) => setTime(`${pad2(Number(e.target.value))}:${time.split(':')[1]}`)}
                    >
                      {allowedHours.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <select
                      className="order-select"
                      value={time.split(':')[1]}
                      onChange={(e) => setTime(`${time.split(':')[0]}:${e.target.value}`)}
                    >
                      {minutes.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="order-field" style={{ gridColumn: '1 / -1' }}>
                <label>Комментарий к заказу</label>
                <textarea
                  className="order-textarea"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value.slice(0, 200))}
                  placeholder="Оставьте пустое поле, если нет комментариев (макс. 200 символов)"
                  maxLength={200}
                />
                <div className="order-helper">{additionalInfo.length}/200</div>
              </div>

              {error && (
                <div className="order-error">{error}</div>
              )}
              <button
                className="order-btn"
                onClick={handleSubmit}
                disabled={!isFormValid || submitting}
                style={{ marginTop: 8 }}
              >
                {submitting ? 'Отправка...' : 'Заказать'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {submitting && (
        <div className="order-loading-backdrop" aria-label="Идет оформление заказа">
          <div className="order-spinner" />
        </div>
      )}
    </div>
  );

  const portalRoot = document.body;
  
  if (showPhoneVerification) {
    return (
      <PhoneVerification
        phoneNumber={phone.trim()}
        onVerificationSuccess={handlePhoneVerificationSuccess}
        onClose={handlePhoneVerificationClose}
      />
    );
  }
  
  return ReactDOM.createPortal(modal, portalRoot);
};

export default OrderSubmit;


