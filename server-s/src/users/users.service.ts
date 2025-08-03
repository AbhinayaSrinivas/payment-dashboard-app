// src/users/users.service.ts - Updated with seed method
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'username', 'role', 'createdAt', 'updatedAt'], // Exclude password
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { username: createUserDto.username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user with default role if not provided
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.VIEWER,
    });

    const savedUser = await this.usersRepository.save(user);
    
    // Return user without password
    const { password, ...result } = savedUser;
    return result as User;
  }

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { id },
      select: ['id', 'username', 'role', 'createdAt', 'updatedAt']
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  // NEW: Seed method for creating default users
  async seedDefaultUsers(): Promise<void> {
    console.log('🔧 Seeding default users...');

    // Check if users already exist
    const userCount = await this.usersRepository.count();
    if (userCount > 0) {
      console.log('Users already exist, skipping user seeding');
      return;
    }

    const defaultUsers = [
      {
        username: 'admin',
        password: 'admin123', // This will be hashed
        role: UserRole.ADMIN,
      },
      {
        username: 'viewer',
        password: 'viewer123', // This will be hashed
        role: UserRole.VIEWER,
      },
      {
        username: 'demo_admin',
        password: 'demo123',
        role: UserRole.ADMIN,
      },
      {
        username: 'test_user',
        password: 'test123',
        role: UserRole.VIEWER,
      },
    ];

    for (const userData of defaultUsers) {
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Create and save user
        const user = this.usersRepository.create({
          username: userData.username,
          password: hashedPassword,
          role: userData.role,
        });

        await this.usersRepository.save(user);
        console.log(`✅ Created user: ${userData.username} (${userData.role})`);
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.username}:`, error.message);
      }
    }

    console.log('✅ Default users seeded successfully');
  }

  // Helper method to create a user without duplicate checking (for seeding)
  async createSeedUser(username: string, password: string, role: UserRole): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = this.usersRepository.create({
      username,
      password: hashedPassword,
      role,
    });

    return this.usersRepository.save(user);
  }
}