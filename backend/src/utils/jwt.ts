import jwt, { SignOptions } from 'jsonwebtoken';

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    expiresIn,
  };
  
  return jwt.sign({ userId }, secret, options);
};

export const verifyToken = (token: string): any => {
  const secret = process.env.JWT_SECRET || 'secret';
  return jwt.verify(token, secret);
};
