export interface FirebasePizzaData {
    id: string;
    name: string;
    price: number;
    description: string;
    photoUri?: string | null;
    available: boolean;
}

export const defaultFirebasePizzaData: FirebasePizzaData = {
    id: "",
    name: "",
    price: 0,
    description: "",
    photoUri: null,
    available: true,
};

export interface FirebaseOrderData {
    id: string;
    completed: boolean;
    confirmed: boolean;
    sum: number;
    consumerName: string;
    consumerEmail: string;
    consumerPhone: string;
    pizzaList: string[];
    additionalInfo: string;
    time: number;
}

export const defaultFirebaseOrderData: FirebaseOrderData = {
    id: "",
    completed: false,
    confirmed: false,
    sum: 0,
    consumerName: "",
    consumerEmail: "",
    consumerPhone: "",
    pizzaList: [],
    additionalInfo: "",
    time: 0,
};

export interface FirebaseOvenData {
    hot: boolean;
}

export const defaultFirebaseOvenData: FirebaseOvenData = {
    hot: false,
};

/**
 * Creates initial OrderData with a generated UUID
 * @returns FirebaseOrderData with a unique ID and default values
 */
export const createInitialOrderData = (): FirebaseOrderData => {
    return {
        id: crypto.randomUUID(),
        completed: false,
        confirmed: false,
        sum: 0,
        consumerName: "",
        consumerEmail: "",
        consumerPhone: "",
        pizzaList: [],
        additionalInfo: "",
        time: 0, 
    };
};

export interface FirebaseEmailMessage {
    subject: string;
    text: string;
    html: string;
}

export interface FirebaseEmailData {
    to: string[];
    message: FirebaseEmailMessage;
}

const escapeHtml = (value: string): string => {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const formatOrderTime = (epochMs: number): string => {
    const d = new Date(epochMs);
    if (isNaN(d.getTime())) return "—";
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${hh}:${mi} ${dd}-${mm}-${yyyy}`;
};

const formatPhoneForTel = (phone: string): string => {
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('8')) {
        digits = '7' + digits.slice(1);
    }
    if (!digits.startsWith('7')) {
        digits = '7' + digits;
    }
    digits = digits.slice(0, 11);
    return '+' + digits;
};

export const getEmailSubject = (_order: FirebaseOrderData): string => {
    return "Заказ получен";
};

export const getEmailText = (order: FirebaseOrderData): string => {
    const orderTime = formatOrderTime(order.time);
    const sumStr = `${order.sum.toFixed(2)} ₽`;
    return [
        `Здравствуйте, ${order.consumerName}!`,
        "",
        "Мы получили ваш заказ:",
        "",
        `Заказ: ${order.pizzaList.join(', ')}`,
        `Сумма заказа: ${sumStr}`,
        `Время готовности к: ${orderTime}`,
        "",
        "Через некоторое время мы подтвердим сможем ли мы выполнить ваш заказ, и отправим уведомление на вашу почту.",
        "",
        "Спасибо за ваш заказ!",
        "",
        "Paolo Pizzaiolo",
        "Pizzeria Numerо 161 - Vera Pizza Italiana",
        "",
        "Если у вас возникли вопросы — ответьте на это письмо или свяжитесь с нами с 12:00 до 16:00 по телефону +7 (903) 739-77-00."
    ].join('\n');
};

const EMAIL_TEMPLATE_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
  </head>
  <body style="margin:0;padding:0;background:#f4f4f6;font-family:Arial,Helvetica,sans-serif;color:#222;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:20px 24px;background:#d32f2f;color:#ffffff;">
                <h1 style="margin:0;font-size:20px;">Pizzeria No.161</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 12px;font-size:16px;color:#222;">Здравствуйте, <strong>{{name}}</strong>!</p>
                <p style="margin:0 0 18px;font-size:15px;color:#444;">
                  Мы получили ваш заказ:
                </p>
                <p style="margin:0 0 10px;font-size:15px;color:#222;">
                  <strong>Заказ:</strong> <br>
                  {{items}}
                </p>
                <p style="margin:0 0 10px;font-size:15px;color:#222;">
                  <strong>Сумма заказа:</strong> <br>
                  {{sum}}
                </p>
                <p style="margin:0 0 10px;font-size:15px;color:#222;">
                  <strong>Время готовности к:</strong> <br>
                  {{orderTime}}
                </p>
                <p style="margin:0 0 12px;font-size:14px;color:#666;">
                  Через некоторое время мы подтвердим сможем ли мы выполнить ваш заказ, и отправим уведомление на вашу почту.
                </p>
                <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:24px;">
                  <tr>
                    <td style="padding-right:12px;" valign="top">
                      <img src="{{imageUrl}}" alt="Paolo Pizzaiolo" width="72" style="border-radius:8px;display:block;" />
                    </td>
                    <td valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333;">
                      <div style="font-weight:700;">Paolo Pizzaiolo</div>
                      <div style="font-size:13px;color:#777;">Pizzeria Numero 161 - Vera Pizza Italiana</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
            <td style="padding:12px 24px;background:#fafafa;border-top:1px solid #eee;font-size:12px;color:#888;">
              <div style="margin-top:6px;">
              Если у вас возникли вопросы — вы можете ответить на это письмо или позвонить нам с 12:00 до 16:00 по телефону 
              <a href="tel:+79037397700" style="color:#1a73e8; text-decoration:none;">+7 (903) 739-77-00</a>.
              </div>
            </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const EMAIL_TEMPLATE_HTML_WITH_COMMENT = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
  </head>
  <body style="margin:0;padding:0;background:#f4f4f6;font-family:Arial,Helvetica,sans-serif;color:#222;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:20px 24px;background:#d32f2f;color:#ffffff;">
                <h1 style="margin:0;font-size:20px;">Pizzeria No.161</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 12px;font-size:16px;color:#222;">Здравствуйте, <strong>{{name}}</strong>!</p>
                <p style="margin:0 0 18px;font-size:15px;color:#444;">
                  Мы получили ваш заказ:
                </p>
                <p style="margin:0 0 10px;font-size:15px;color:#222;">
                  <strong>Заказ:</strong> <br>
                  {{items}}
                </p>
                <p style="margin:0 0 10px;font-size:15px;color:#222;">
                  <strong>Сумма заказа:</strong> <br> 
                  {{sum}}
                </p>
                <p style="margin:0 0 10px;font-size:15px;color:#222;">
                  <strong>Время готовности к:</strong> <br>
                  {{orderTime}}
                </p>
                <p style="margin:0 0 10px;font-size:15px;color:#222;">
                  <strong>Комментарий:</strong> <br>
                  {{comment}}
                </p>
                <p style="margin:0 0 12px;font-size:14px;color:#666;">
                  Через некоторое время мы подтвердим сможем ли мы выполнить ваш заказ, и отправим уведомление на вашу почту.
                </p>
                <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:24px;">
                  <tr>
                    <td style="padding-right:12px;" valign="top">
                      <img src="{{imageUrl}}" alt="Paolo Pizzaiolo" width="72" style="border-radius:8px;display:block;" />
                    </td>
                    <td valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333;">
                      <div style="font-weight:700;">Paolo Pizzaiolo</div>
                      <div style="font-size:13px;color:#777;">Pizzeria Numero 161 - Vera Pizza Italiana</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
            <td style="padding:12px 24px;background:#fafafa;border-top:1px solid #eee;font-size:12px;color:#888;">
              <div style="margin-top:6px;">
              Если у вас возникли вопросы — вы можете ответить на это письмо или позвонить нам с 12:00 до 16:00 по телефону 
              <a href="tel:+79037397700" style="color:#1a73e8; text-decoration:none;">+7 (903) 739-77-00</a>.
              </div>
            </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const getEmailHtml = (order: FirebaseOrderData): string => {
    const orderTime = formatOrderTime(order.time);
    const sumStr = `${order.sum.toFixed(2)} ₽`;
    const itemsInline = escapeHtml(order.pizzaList.join(', '));
    const template = order.additionalInfo === "" ? EMAIL_TEMPLATE_HTML : EMAIL_TEMPLATE_HTML_WITH_COMMENT;
    
    return template
        .replace('{{name}}', escapeHtml(order.consumerName))
        .replace('{{items}}', itemsInline)
        .replace('{{sum}}', escapeHtml(sumStr))
        .replace('{{orderTime}}', escapeHtml(orderTime))
        .replace('{{comment}}', escapeHtml(order.additionalInfo))
        .replace('{{imageUrl}}', 'https://firebasestorage.googleapis.com/v0/b/pizzeria-161.firebasestorage.app/o/pizzeria_161-playstore%20-%20round%20-%20200-200.png?alt=media&token=428b17a3-d7c1-4ae2-a124-f751f4d1a2f2');
};

export class FirebaseEmailDataFromOrder implements FirebaseEmailData {
    to: string[];
    message: FirebaseEmailMessage;

    constructor(order: FirebaseOrderData) {
        this.to = [order.consumerEmail];
        this.message = {
            subject: getEmailSubject(order),
            text: getEmailText(order),
            html: getEmailHtml(order),
        };
    }
}

export const getEmailData = (order: FirebaseOrderData): FirebaseEmailData => {
    return new FirebaseEmailDataFromOrder(order);
};

// Main app data stored in Firestore to control availability
export interface FirebaseMainData {
    open: boolean;
}

export const defaultFirebaseMainData: FirebaseMainData = {
    open: true,
};

export const MAIN_COLLECTION_PATH = "main";
export const MAIN_DOCUMENT_ID = "pizzeria-161";

export const OVEN_COLLECTION_PATH = "oven";
export const OVEN_DOCUMENT_ID = "pizzeria-161";


// Boss notification email templates
const BOSS_EMAIL_TEMPLATE_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
  </head>
  <body style="margin:0;padding:20px;font-family:Arial,Helvetica,sans-serif;color:#222;background:#f9f9f9;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:auto;background:#ffffff;border:1px solid #ddd;border-radius:6px;">
      <tr>
        <td style="padding:20px;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#d32f2f;">Paolo Pizzaiolo, у вас новый заказ!</h2>
          
          <p style="margin:0 0 10px;font-size:15px;color:#222;">
            <strong>Имя клиента:</strong><br>
            {{name}}
          </p>
          <p style="margin:0 0 10px;font-size:15px;color:#222;">
            <strong>Email клиента:</strong><br>
            {{email}}
          </p>
          <p style="margin:0 0 10px;font-size:15px;color:#222;">
            <strong>Телефон клиента:</strong><br>
            <a href="tel:{{phone_tel}}" style="color:#1a73e8; text-decoration:none;">{{phone}}</a>
          </p>
          <p style="margin:0 0 10px;font-size:15px;color:#222;">
            <strong>Заказ:</strong><br>
            {{items}}
          </p>
          <p style="margin:0 0 10px;font-size:15px;color:#222;">
            <strong>Сумма заказа:</strong><br>
            {{sum}}
          </p>
          <p style="margin:0 0 10px;font-size:15px;color:#222;">
            <strong>Время готовности к:</strong><br>
            {{orderTime}}
          </p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">
          <p style="margin:0;font-size:13px;color:#666;">
            Это автоматическое уведомление. Пожалуйста, свяжитесь с клиентом для подтверждения заказа.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const BOSS_EMAIL_TEMPLATE_HTML_WITH_COMMENT = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
  </head>
  <body style="margin:0;padding:20px;font-family:Arial,Helvetica,sans-serif;color:#222;background:#f9f9f9;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:auto;background:#ffffff;border:1px solid #ddd;border-radius:6px;">
      <tr>
        <td style="padding:20px;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#d32f2f;">Paolo Pizzaiolo, у вас новый заказ!</h2>
          
          <p style="margin:0 0 10px;font-size:15px;color:#222;">
            <strong>Имя клиента:</strong><br>
            {{name}}
          </p>
          <p style="margin:0 0 10px;font-size:15px;color:#222;">
            <strong>Email клиента:</strong><br>
            {{email}}
          </p>
          <p style="margin:0 0 10px;font-size:15px;color:#222;">
            <strong>Телефон клиента:</strong><br>
            <a href="tel:{{phone_tel}}" style="color:#1a73e8; text-decoration:none;">{{phone}}</a>
          </p>
          <p style="margin:0 0 10px;font-size:15px;color:#222;">
            <strong>Заказ:</strong><br>
            {{items}}
          </p>
          <p style="margin:0 0 10px;font-size:15px;color:#222;">
            <strong>Сумма заказа:</strong><br>
            {{sum}}
          </p>
          <p style="margin:0 0 10px;font-size:15px;color:#222;">
            <strong>Время готовности к:</strong><br>
            {{orderTime}}
          </p>
          <p style="margin:0 0 10px;font-size:15px;color:#222;">
            <strong>Комментарий:</strong><br>
            {{comment}}
          </p>

          <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">
          <p style="margin:0;font-size:13px;color:#666;">
            Это автоматическое уведомление. Пожалуйста, свяжитесь с клиентом для подтверждения заказа.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const getBossEmailSubject = (_order: FirebaseOrderData): string => {
    return "Новый заказ в Pizzeria No.161";
};

export const getBossEmailText = (order: FirebaseOrderData): string => {
    const orderTime = formatOrderTime(order.time);
    const sumStr = `${order.sum.toFixed(2)} ₽`;
    const itemsText = order.pizzaList.join(', ');
    
    return [
        "Paolo Pizzaiolo, У вас новый заказ!",
        "",
        `Имя клиента: ${order.consumerName}`,
        `Email клиента: ${order.consumerEmail}`,
        `Телефон клиента: ${order.consumerPhone}`,
        `Заказ: ${itemsText}`,
        `Сумма заказа: ${sumStr}`,
        `Время готовности к: ${orderTime}`,
        order.additionalInfo ? `Комментарий: ${order.additionalInfo}` : "",
        "",
        "Это автоматическое уведомление. Пожалуйста, свяжитесь с клиентом для подтверждения заказа."
    ].filter(line => line !== "").join('\n');
};

export const getBossEmailHtml = (order: FirebaseOrderData): string => {
    const orderTime = formatOrderTime(order.time);
    const sumStr = `${order.sum.toFixed(2)} ₽`;
    const itemsInline = escapeHtml(order.pizzaList.join(', '));
    const phoneTel = formatPhoneForTel(order.consumerPhone);
    const template = order.additionalInfo === "" ? BOSS_EMAIL_TEMPLATE_HTML : BOSS_EMAIL_TEMPLATE_HTML_WITH_COMMENT;
    
    return template
        .replace('{{name}}', escapeHtml(order.consumerName))
        .replace('{{email}}', escapeHtml(order.consumerEmail))
        .replace('{{phone}}', escapeHtml(order.consumerPhone))
        .replace('{{phone_tel}}', phoneTel)
        .replace('{{items}}', itemsInline)
        .replace('{{sum}}', escapeHtml(sumStr))
        .replace('{{orderTime}}', escapeHtml(orderTime))
        .replace('{{comment}}', escapeHtml(order.additionalInfo));
};

export class FirebaseBossEmailDataFromOrder implements FirebaseEmailData {
    to: string[];
    message: FirebaseEmailMessage;

    constructor(order: FirebaseOrderData) {
        this.to = ["pizzeria.no.161@gmail.com"];
        this.message = {
            subject: getBossEmailSubject(order),
            text: getBossEmailText(order),
            html: getBossEmailHtml(order),
        };
    }
}

export const getBossEmailData = (order: FirebaseOrderData): FirebaseEmailData => {
    return new FirebaseBossEmailDataFromOrder(order);
};