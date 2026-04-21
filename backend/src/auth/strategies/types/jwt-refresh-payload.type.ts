import { Session } from '../../../session/domain/session';

export type JwtRefreshPayloadType = {
  sessionId: Session['id'];
  hash: Session['hash'];
  businessId?: string;
  cardId?: string;
  iat: number;
  exp: number;
};
