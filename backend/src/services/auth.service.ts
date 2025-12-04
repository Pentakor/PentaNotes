import { User } from '../models';
import { generateToken } from '../utils/jwt';

export const registerUserService = async (email: string, name: string, password: string) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return { exists: true as const, user: null, token: null };
  }

  const user = await User.create({ email, name, password });

  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  return {
    exists: false as const,
    user,
    token,
  };
};

export const loginUserService = async (email: string, password: string) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return null;
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return null;
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  return { user, token };
};

export const getProfileService = async (userId: number) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'email', 'name', 'createdAt', 'updatedAt'],
  });

  return user;
};