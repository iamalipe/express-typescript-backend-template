import { Request, Response } from 'express';
import { lookupIp, updateDatabase } from './ipLookup.service';
import { lookupSchemaType } from './ipLookup.schema';

const lookupController = async (req: Request, res: Response) => {
  const query = req.query as unknown as lookupSchemaType['query'];
  
  // Extract query IP or fall back to client IP from headers/connection
  const rawIp = query.ip ||
    (req.headers['cf-connecting-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '';

  // Normalize loopback IPs
  let ip = rawIp.trim();
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  const data = await lookupIp(ip);
  if (!data) {
    throw new AppError('Geolocation data not found. It might be a private, local, or invalid IP address.', { status: 404 });
  }

  res.status(200).json({
    success: true,
    data,
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'success',
  });
};

const updateController = async (req: Request, res: Response) => {
  const version = await updateDatabase();
  res.status(200).json({
    success: true,
    data: { version },
    errors: [],
    timestamp: new Date().toISOString(),
    message: 'IP database updated successfully',
  });
};

export default {
  lookupController,
  updateController,
};
