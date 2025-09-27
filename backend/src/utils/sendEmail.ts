import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import dotenv from 'dotenv';

dotenv.config();

// SES klientini to'g'ridan-to'g'ri sozlash
const sesClient = new SESv2Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * AWS SDK v3 yordamida to'g'ridan-to'g'ri email jo'natadi.
 * @param options Email ma'lumotlari (kimga, mavzu, kontent)
 */
export const sendEmail = async (options: EmailOptions) => {
  // `SendEmailCommand` uchun kerakli parametrlarni tayyorlaymiz
  const params = {
    Destination: {
      ToAddresses: [options.to],
    },
    Content: {
      Simple: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: 'UTF-8',
          },
        },
      },
    },
    FromEmailAddress: process.env.SES_FROM_EMAIL,
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log(
      `✅ Email muvaffaqiyatli jo'natildi: ${options.to}. Message ID: ${response.MessageId}`,
    );
  } catch (error) {
    console.error("❌ AWS SES orqali email jo'natishda xatolik:", error);
    // Xatolik bo'lsa ham, dastur to'xtab qolmasligi uchun uni shu yerda "yutib yuboramiz".
    // Ammo kelajakda bu xatoliklarni maxsus log tizimiga yozish muhim.
  }
};
