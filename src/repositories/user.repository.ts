import { AppDataSource } from '../config/database';
import { User, UserStatus } from '../entities/User';
import { BankAccount } from '../entities/BankAccount';

export const UserRepository = AppDataSource.getRepository(User).extend({
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  },

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  },

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.findOne({ where: { googleId } });
  },

  async findByIdWithRelations(id: string): Promise<User | null> {
    return this.findOne({
      where: { id },
      relations: ['bankAccounts'],
    });
  },

  async countByRole(): Promise<Record<string, number>> {
    const results = await this.createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('user.status != :status', { status: UserStatus.SUSPENDED })
      .groupBy('user.role')
      .getRawMany();

    const countMap: Record<string, number> = {};
    results.forEach((r) => {
      countMap[r.role] = parseInt(r.count);
    });
    return countMap;
  },

  async findActiveUsers(page: number, limit: number): Promise<[User[], number]> {
    return this.findAndCount({
      where: { status: UserStatus.ACTIVE },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  },
});

export const BankAccountRepository = AppDataSource.getRepository(BankAccount).extend({
  async findByUserId(userId: string): Promise<BankAccount[]> {
    return this.find({ where: { userId }, order: { isDefault: 'DESC', createdAt: 'DESC' } });
  },

  async findDefaultByUserId(userId: string): Promise<BankAccount | null> {
    return this.findOne({ where: { userId, isDefault: true } });
  },
});
