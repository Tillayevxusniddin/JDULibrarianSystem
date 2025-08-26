import prisma from '../../config/db.config.js';
import bcrypt from 'bcrypt';
import { fetchAllKintoneRecords, getValue } from '../../utils/kintone.client.js';

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  totalFromKintone: number;
}

function randomPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function syncStudentsFromKintone(): Promise<SyncResult> {
  const records = await fetchAllKintoneRecords();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const rec of records) {
    // Try multiple likely field codes used in the reference project
    const email =
      getValue<string>(rec, 'mail') ||
      getValue<string>(rec, 'email') ||
      undefined;
    const firstName =
      getValue<string>(rec, 'studentFirstName') ||
      getValue<string>(rec, 'firstName') ||
      '';
    const lastName =
      getValue<string>(rec, 'studentLastName') ||
      getValue<string>(rec, 'lastName') ||
      '';

    if (!email) {
      skipped++;
      continue;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const plain = randomPassword(12);
      const hash = await bcrypt.hash(plain, 10);
      await prisma.user.create({
        data: {
          firstName: firstName || 'Student',
          lastName: lastName || 'User',
          email,
          password: hash,
          role: 'USER',
          status: 'ACTIVE',
        },
      });
      created++;
      continue;
    }

    // If name fields changed, update minimal fields (don’t touch password)
    const newFirst = firstName || existing.firstName;
    const newLast = lastName || existing.lastName;
    if (newFirst !== existing.firstName || newLast !== existing.lastName) {
      await prisma.user.update({
        where: { email },
        data: { firstName: newFirst, lastName: newLast },
      });
      updated++;
    } else {
      skipped++;
    }
  }

  return { created, updated, skipped, totalFromKintone: records.length };
}

