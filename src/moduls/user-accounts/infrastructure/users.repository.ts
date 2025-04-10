import { InjectModel } from '@nestjs/mongoose';
import { DeletionStatus, User, UserDocument } from '../domain/user.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';

@Injectable()
export class UsersRepository {
  //инжектирование модели через DI
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      _id: id,
      deletionStatus: { $ne: DeletionStatus.PermanentDeleted },
    });
  }

  async save(user: UserDocument) {
    await user.save();
  }

  async createUser(userData: {
    email: string;
    login: string;
    passwordHash: string;
  }): Promise<UserDocument> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findOrNotFoundFail(id: string): Promise<UserDocument> {
    console.log('id', id);
    const user = await this.findById(id);

    if (!user) {
      //TODO: replace with domain exception
      throw new NotFoundException('user not found');
    }

    return user;
  }
  findByLogin(login: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ login });
  }
  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }
  async loginIsExist(login: string): Promise<boolean> {
    return !!(await this.userModel.countDocuments({ login: login }));
  }
  async findByConfirmationCode(code: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ confirmationCode: code });
  }
}
