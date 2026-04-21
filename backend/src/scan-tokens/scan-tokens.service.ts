import * as crypto from 'crypto';

import { Injectable } from '@nestjs/common';

import { NullableType } from '../utils/types/nullable.type';
import { ScanToken } from './domain/scan-token';
import { ScanTokenRepository } from './infrastructure/persistence/scan-token.repository';

@Injectable()
export class ScanTokensService {
  constructor(private readonly scanTokenRepository: ScanTokenRepository) {}

  async generate(cardId: string, businessId: string): Promise<string> {
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await this.scanTokenRepository.create({
      cardId,
      businessId,
      token,
      expiresAt,
      usedAt: null,
    });
    return token;
  }

  async consume(
    cardId: string,
    token: string,
  ): Promise<NullableType<ScanToken>> {
    const record = await this.scanTokenRepository.findByCardIdAndToken(
      cardId,
      token,
    );
    if (!record) return null;
    if (record.usedAt) return null;
    if (record.expiresAt < new Date()) return null;
    await this.scanTokenRepository.markUsed(record.id);
    return record;
  }
}
