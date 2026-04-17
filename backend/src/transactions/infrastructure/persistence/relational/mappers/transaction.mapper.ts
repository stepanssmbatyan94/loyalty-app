import { Transaction } from '../../../../domain/transaction';
import { TransactionEntity } from '../entities/transaction.entity';

export class TransactionMapper {
  static toDomain(raw: TransactionEntity): Transaction {
    const domain = new Transaction();
    domain.id = raw.id;
    domain.cardId = raw.cardId;
    domain.type = raw.type;
    domain.points = raw.points;
    domain.cashierTelegramId = raw.cashierTelegramId
      ? Number(raw.cashierTelegramId)
      : null;
    domain.rewardId = raw.rewardId;
    domain.note = raw.note;
    domain.createdAt = raw.createdAt;
    return domain;
  }

  static toPersistence(domain: Transaction): TransactionEntity {
    const entity = new TransactionEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.cardId = domain.cardId;
    entity.type = domain.type;
    entity.points = domain.points;
    entity.cashierTelegramId = domain.cashierTelegramId;
    entity.rewardId = domain.rewardId;
    entity.note = domain.note;
    return entity;
  }
}
