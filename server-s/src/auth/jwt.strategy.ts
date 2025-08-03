import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'e4d98cba7986da4064392aa822a1e1f5bf01bdaa008f7745349f2efc61fcd3a4e3abbbbe748c8c550b9ae5475492ec31ddb35f34f0a4382e468de6bae7e21ec8',
    });
  }

  async validate(payload: any) {
    return { 
      userId: payload.sub, 
      username: payload.username, 
      role: payload.role 
    };
  }
}