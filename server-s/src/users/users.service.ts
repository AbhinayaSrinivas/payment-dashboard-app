// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'username', 'role', 'isActive', 'createdAt'],
    });
  }

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'username', 'role', 'isActive', 'createdAt'],
    });
  }

  async create(userData: { username: string; password: string; role?: UserRole }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = this.usersRepository.create({
      username: userData.username,
      password: hashedPassword,
      role: userData.role || UserRole.VIEWER,
    });

    const savedUser = await this.usersRepository.save(user);
    const { password, ...result } = savedUser;
    return result as User;
  }

  async seedDefaultUsers(): Promise<void> {
    const adminExists = await this.usersRepository.findOne({
      where: { username: 'admin' },
    });

    if (!adminExists) {
      await this.create({
        username: 'admin',
        password: 'admin123',
        role: UserRole.ADMIN,
      });
      console.log('Default admin user created: admin/admin123');
    }

    const viewerExists = await this.usersRepository.findOne({
      where: { username: 'viewer' },
    });

    if (!viewerExists) {
      await this.create({
        username: 'viewer',
        password: 'viewer123',
        role: UserRole.VIEWER,
      });
      console.log('Default viewer user created: viewer/viewer123');
    }
  }
}

// src/users/users.controller.ts


// src/users/dto/create-user.dto.ts
