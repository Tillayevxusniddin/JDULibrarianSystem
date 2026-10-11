import { Prisma, FineIntervalUnit } from '@prisma/client';
import prisma from '../../config/db.config.js';
import ApiError from '../../utils/ApiError.js';

/**
 * Get library settings (creates default if not exists)
 */
export const getSettings = async () => {
  let settings = await prisma.librarySettings.findFirst();
  
  if (!settings) {
    settings = await prisma.librarySettings.create({
      data: {
        enableFines: true,
        fineAmountPerDay: new Prisma.Decimal(5000),
        fineIntervalUnit: FineIntervalUnit.DAILY,
        fineIntervalDays: null,
      },
    });
  }
  
  return settings;
};

/**
 * Update library settings
 */
export const updateSettings = async (data: {
  enableFines?: boolean;
  fineAmountPerDay?: number;
  fineIntervalUnit?: FineIntervalUnit;
  fineIntervalDays?: number | null;
}) => {
  const settings = await getSettings();
  
  const updateData: Prisma.LibrarySettingsUpdateInput = {};
  
  if (data.enableFines !== undefined) {
    updateData.enableFines = data.enableFines;
  }
  
  if (data.fineAmountPerDay !== undefined) {
    if (data.fineAmountPerDay <= 0) {
      throw new ApiError(400, 'Jarima miqdori 0 dan katta bo\'lishi kerak.');
    }
    updateData.fineAmountPerDay = new Prisma.Decimal(data.fineAmountPerDay);
  }

  if (data.fineIntervalUnit !== undefined) {
    updateData.fineIntervalUnit = data.fineIntervalUnit;
  }

  if (data.fineIntervalDays !== undefined) {
    // Validate that fineIntervalDays is provided when unit is CUSTOM
    if (data.fineIntervalUnit === FineIntervalUnit.CUSTOM || settings.fineIntervalUnit === FineIntervalUnit.CUSTOM) {
      if (data.fineIntervalDays === null || data.fineIntervalDays === undefined) {
        throw new ApiError(400, 'CUSTOM interval uchun fineIntervalDays kiritilishi shart.');
      }
      if (data.fineIntervalDays <= 0) {
        throw new ApiError(400, 'Interval kunlari 0 dan katta bo\'lishi kerak.');
      }
    }
    updateData.fineIntervalDays = data.fineIntervalDays;
  }
  
  return prisma.librarySettings.update({
    where: { id: settings.id },
    data: updateData,
  });
};
