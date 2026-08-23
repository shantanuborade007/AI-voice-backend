import 'reflect-metadata';
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import dataSource from './data-source';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';

const DEFAULT_PLANS = [
  {
    code: 'starter',
    name: 'Starter',
    priceMonthly: '999',
    features: { maxLocations: 1, maxCatalogItems: 20, appointmentBooking: false, aiMinutesIncluded: 100 },
    sortOrder: 1,
  },
  {
    code: 'growth',
    name: 'Growth',
    priceMonthly: '2499',
    features: { maxLocations: 3, maxCatalogItems: 100, appointmentBooking: true, aiMinutesIncluded: 400 },
    sortOrder: 2,
  },
  {
    code: 'pro',
    name: 'Pro',
    priceMonthly: '4999',
    features: { maxLocations: 10, maxCatalogItems: 500, appointmentBooking: true, aiMinutesIncluded: 1200 },
    sortOrder: 3,
  },
];

async function run() {
  const ds = await dataSource.initialize();

  const plansRepository = ds.getRepository(SubscriptionPlan);
  for (const plan of DEFAULT_PLANS) {
    const existing = await plansRepository.findOne({ where: { code: plan.code } });
    if (!existing) {
      await plansRepository.save(plansRepository.create(plan));
      console.log(`Created plan: ${plan.code}`);
    }
  }

  const usersRepository = ds.getRepository(User);
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const existingAdmin = await usersRepository.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'ChangeMe123!', 10);
    await usersRepository.save(
      usersRepository.create({
        email: adminEmail,
        passwordHash,
        fullName: 'Platform Admin',
        role: UserRole.ADMIN,
      }),
    );
    console.log(`Created admin user: ${adminEmail}`);
  }

  await ds.destroy();
  console.log('Seed complete.');
}

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
