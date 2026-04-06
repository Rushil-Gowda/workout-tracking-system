import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models.js';
import { SignupSchema, LoginSchema } from '../schemas.js';

const router = Router();

// POST /signup
router.post('/signup', async (req, res) => {
  try {
    const validatedData = SignupSchema.parse(req.body);
    
    // Check email uniqueness
    const existingUser = await User.findOne({ where: { email: validatedData.email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Create user
    const user = await User.create({
      ...validatedData,
      password: hashedPassword,
    });

    res.status(201).json({ message: 'User created successfully', user_id: user.user_id });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Signup failed' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    
    // Find user
    const user = await User.findOne({ where: { email: validatedData.email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user_id: user.user_id });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Login failed' });
  }
});

export default router;
