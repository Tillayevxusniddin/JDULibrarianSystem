import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as channelService from './channel.service.js';

export const createChannelHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const channel = await channelService.createChannel(req.body, req.user!.id);
    res.status(201).json({ data: channel });
  },
);

export const getMyChannelHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const channel = await channelService.getMyChannel(req.user!.id);
    res.status(200).json({ data: channel });
  },
);

export const getChannelByLinkNameHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { linkName } = req.params;
    // --- O'ZGARISH: Foydalanuvchi ID'sini servisga uzatamiz ---
    // Agar foydalanuvchi tizimga kirmagan bo'lsa, req.user bo'lmaydi va bu undefined bo'ladi
    const currentUserId = req.user?.id;
    const channel = await channelService.getChannelByLinkName(
      linkName,
      currentUserId,
    );
    res.status(200).json({ data: channel });
  },
);

export const updateMyChannelHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const updateData = req.body;
    if (req.file) {
      const file = req.file as any;
      updateData.logoImage = file.location; // <-- S3 URL'ni olamiz
    }
    const channel = await channelService.updateMyChannel(
      req.user!.id,
      updateData,
    );
    res
      .status(200)
      .json({ message: 'Kanal muvaffaqiyatli yangilandi', data: channel });
  },
);

export const deleteMyChannelHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await channelService.deleteMyChannel(req.user!.id);
    res.status(204).send();
  },
);

// --- YANGI HANDLER ---
export const toggleFollowHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { channelId } = req.params;
    const userId = req.user!.id;
    const result = await channelService.toggleFollow(channelId, userId);
    res.status(200).json({ data: result });
  },
);

export const getFollowedChannelsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const channels = await channelService.getFollowedChannels(req.user!.id);
    res.status(200).json({ data: channels });
  },
);

export const getAllChannelsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const search = req.query.search as string | undefined;

    const { data, total } = await channelService.findAllChannels(
      { search },
      { page, limit },
    );

    res.status(200).json({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  },
);
