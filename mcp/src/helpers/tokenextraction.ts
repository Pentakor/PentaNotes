import  { Request } from 'express';


export const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};


