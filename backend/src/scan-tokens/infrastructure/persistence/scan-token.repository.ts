import { NullableType } from '../../../utils/types/nullable.type';
import { ScanToken } from '../../domain/scan-token';

export abstract class ScanTokenRepository {
  abstract create(
    data: Omit<ScanToken, 'id' | 'createdAt'>,
  ): Promise<ScanToken>;

  abstract findByCardIdAndToken(
    cardId: string,
    token: string,
  ): Promise<NullableType<ScanToken>>;

  abstract markUsed(id: string): Promise<void>;

  abstract deleteExpired(): Promise<void>;
}
