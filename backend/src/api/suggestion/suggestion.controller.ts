import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as suggestionService from './suggestion.service.js';

export const createSuggestionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const suggestionData = { ...req.validatedData!.body, userId };
    const suggestion = await suggestionService.createSuggestion(suggestionData);
    res.status(201).json(suggestion);
  },
);

export const getAllSuggestionsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const suggestions = await suggestionService.findAllSuggestions();
    res.status(200).json(suggestions);
  },
);

export const updateSuggestionStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.validatedData!.params;
    const { status } = req.validatedData!.body;
    const updatedSuggestion = await suggestionService.updateSuggestionStatus(
      id,
      status,
    );
    res.status(200).json(updatedSuggestion);
  },
);
