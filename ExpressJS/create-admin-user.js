import db from './src/models/index.js';
import bcrypt from 'bcryptjs';

const createAdminUser = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('DB connected');

    const email = process.env.ADMIN_USER_EMAIL;
    const password = process.env.ADMIN_USER_PASSWORD;

    if (!email || !password) {
      throw new Error('ADMIN_USER_EMAIL and ADMIN_USER_PASSWORD must be set');
    }

    const existing = await db.User.findOne({ where: { email } });
    if (existing) {
      console.log('Admin user already exists:', email);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.User.create({
      email,
      password: hashed,
      role: 'admin',
      firstName: 'Vendor',
      lastName: 'Admin'
    });

    console.log('Created admin user:', { email, role: 'admin' });
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
};

createAdminUser();