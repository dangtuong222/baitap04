import db from './src/models/index.js';
import bcrypt from 'bcryptjs';

const createUser = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('DB connected');

    const email = process.env.TEST_USER_EMAIL || 'testuser@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'Password123!';

    const existing = await db.User.findOne({ where: { email } });
    if (existing) {
      console.log('User already exists:', email);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.User.create({
      email,
      password: hashed,
      role: 'user',
      firstName: 'Test',
      lastName: 'User'
    });

    console.log('Created test user:', { email, password });
    process.exit(0);
  } catch (err) {
    console.error('Error creating user:', err);
    process.exit(1);
  }
};

createUser();
