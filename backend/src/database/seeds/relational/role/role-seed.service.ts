import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../../../../roles/infrastructure/persistence/relational/entities/role.entity';
import { RoleEnum } from '../../../../roles/roles.enum';

@Injectable()
export class RoleSeedService {
  constructor(
    @InjectRepository(RoleEntity)
    private repository: Repository<RoleEntity>,
  ) {}

  async run() {
    const countUser = await this.repository.count({
      where: {
        id: RoleEnum.user,
      },
    });

    if (!countUser) {
      await this.repository.save(
        this.repository.create({
          id: RoleEnum.user,
          name: 'User',
        }),
      );
    }

    const countAdmin = await this.repository.count({
      where: {
        id: RoleEnum.admin,
      },
    });

    if (!countAdmin) {
      await this.repository.save(
        this.repository.create({
          id: RoleEnum.admin,
          name: 'Admin',
        }),
      );
    }

    const countOwner = await this.repository.count({
      where: { id: RoleEnum.owner },
    });
    if (!countOwner) {
      await this.repository.save(
        this.repository.create({ id: RoleEnum.owner, name: 'Owner' }),
      );
    }

    const countCashier = await this.repository.count({
      where: { id: RoleEnum.cashier },
    });
    if (!countCashier) {
      await this.repository.save(
        this.repository.create({ id: RoleEnum.cashier, name: 'Cashier' }),
      );
    }

    const countSuperadmin = await this.repository.count({
      where: { id: RoleEnum.superadmin },
    });
    if (!countSuperadmin) {
      await this.repository.save(
        this.repository.create({ id: RoleEnum.superadmin, name: 'Superadmin' }),
      );
    }
  }
}
