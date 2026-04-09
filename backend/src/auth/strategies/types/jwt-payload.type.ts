import { Session } from '../../../session/domain/session';
import { User } from '../../../users/domain/user';

export type JwtPayloadType = Pick<User, 'id' | 'role'> & {
  sessionId: Session['id'];
  telegramId?: number;
  businessId?: string;
  cardId?: string;
  iat: number;
  exp: number;
};
