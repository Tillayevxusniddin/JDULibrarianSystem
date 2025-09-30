import prisma from '../../config/db.config.js';
import bcrypt from 'bcrypt';
import {
  fetchAllKintoneRecords,
  getValue,
} from '../../utils/kintone.client.js';
import { sendEmail } from '../../utils/sendEmail.js';

// Natijalarni qaytarish uchun interfeys
interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  totalFromKintone: number;
}

/**
 * Tasodifiy, xavfsiz parol generatsiya qiladi.
 * @param length Parol uzunligi (standart 12).
 * @returns Tasodifiy parol (string).
 */
function randomPassword(length = 12): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

/**
 * Kintone ma'lumotlar bazasidan talabalarni sinxronizatsiya qiladi.
 * Yangi talabalarga tasodifiy parol yaratib, email orqali jo'natadi.
 */
export async function syncStudentsFromKintone(): Promise<SyncResult> {
  console.log('🔄 Kintone bilan sinxronizatsiya boshlandi...');
  const records = await fetchAllKintoneRecords();
  console.log(`📊 Kintone'dan ${records.length} ta yozuv topildi.`);

  const result: SyncResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    totalFromKintone: records.length,
  };

  for (const rec of records) {
    const email =
      getValue<string>(rec, 'mail') || getValue<string>(rec, 'email');
    const firstName =
      getValue<string>(rec, 'studentFirstName') ||
      getValue<string>(rec, 'firstName') ||
      '';
    const lastName =
      getValue<string>(rec, 'studentLastName') ||
      getValue<string>(rec, 'lastName') ||
      '';

    if (!email) {
      result.skipped++;
      continue;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    // Agar foydalanuvchi bazada mavjud bo'lmasa, yangisini yaratamiz
    if (!existingUser) {
      try {
        const plainPassword = randomPassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const newUser = await prisma.user.create({
          data: {
            firstName: firstName || 'Student',
            lastName: lastName || 'User',
            email,
            password: hashedPassword,
            role: 'USER',
            status: 'ACTIVE',
          },
        });
        result.created++;
        console.log(`✅ Yangi foydalanuvchi yaratildi: ${email}`);

        // Yangi yaratilgan foydalanuvchiga parolni email orqali jo'natamiz
        await sendEmail({
          to: newUser.email,
          subject: 'Sizning kutubxona tizimidagi akkauntingiz yaratildi!',
          html: `
            <h1>Assalomu alaykum, ${newUser.firstName}!</h1>
            <p>Siz uchun universitet kutubxonasi tizimida avtomatik tarzda yangi akkaunt yaratildi.</p>
            <p>Tizimga kirish uchun quyidagi ma'lumotlardan foydalanishingiz mumkin:</p>
            <ul>
              <li><strong>Email:</strong> ${newUser.email}</li>
              <li><strong>Parol:</strong> ${plainPassword}</li>
            </ul>
            <p>Xavfsizlik maqsadida, tizimga birinchi marta kirganingizdan so'ng parolni o'zgartirishingizni tavsiya qilamiz.</p>
            <p>Hurmat bilan, <br>Kutubxona Ma'muriyati</p>
          `,
        });
      } catch (error) {
        console.error(
          `Xatolik: ${email} manzilidagi foydalanuvchini yaratish yoki email jo'natishda muammo yuz berdi.`,
          error,
        );
        result.skipped++;
      }
      continue;
    }

    // Agar foydalanuvchi mavjud bo'lsa, ism-familiyasini yangilaymiz
    const needsUpdate =
      (firstName && existingUser.firstName !== firstName) ||
      (lastName && existingUser.lastName !== lastName);
    if (needsUpdate) {
      await prisma.user.update({
        where: { email },
        data: {
          firstName: firstName || existingUser.firstName,
          lastName: lastName || existingUser.lastName,
        },
      });
      result.updated++;
      console.log(`🔄 Foydalanuvchi ma'lumotlari yangilandi: ${email}`);
    } else {
      result.skipped++;
    }
  }

  console.log(
    '✅ Kintone bilan sinxronizatsiya muvaffaqiyatli yakunlandi.',
    result,
  );
  return result;
}
