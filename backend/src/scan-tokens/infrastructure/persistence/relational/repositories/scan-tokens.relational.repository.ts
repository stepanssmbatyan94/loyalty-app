import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { NullableType } from '../../../../../utils/types/nullable.type';
import { ScanToken } from '../../../../domain/scan-token';
import { ScanTokenRepository } from '../../scan-token.repository';
import { ScanTokenEntity } from '../entities/scan-token.entity';
import { ScanTokenMapper } from '../mappers/scan-token.mapper';

@Injectable()
export class ScanTokensRelationalRepository implements ScanTokenRepository {
  constructor(
    @InjectRepository(ScanTokenEntity)
    private readonly repo: Repository<ScanTokenEntity>,
  ) {}

  async create(data: Omit<ScanToken, 'id' | 'createdAt'>): Promise<ScanToken> {
    const entity = this.repo.create(
      ScanTokenMapper.toPersistence(data as ScanToken),
    );
    const saved = await this.repo.save(entity);
    return ScanTokenMapper.toDomain(saved);
  }

  async findByCardIdAndToken(
    cardId: string,
    token: string,
  ): Promise<NullableType<ScanToken>> {
    const entity = await this.repo.findOne({ where: { cardId, token } });
    return entity ? ScanTokenMapper.toDomain(entity) : null;
  }

  async markUsed(id: string): Promise<void> {
    await this.repo.update(id, { usedAt: new Date() });
  }

  async deleteExpired(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}
