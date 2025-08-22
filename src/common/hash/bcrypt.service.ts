import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptService {
    private readonly rounds = 12;
    hash(data: string) { return bcrypt.hash(data, this.rounds); }
    compare(data: string, hash: string) { return bcrypt.compare(data, hash); }
}