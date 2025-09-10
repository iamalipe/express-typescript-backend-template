import { Request, Response } from 'express';

export const rootController = async (req: Request, res: Response) => {
  res.send('Hello World');
};
export const healthCheckController = async (req: Request, res: Response) => {
  res.sendStatus(200);
};
