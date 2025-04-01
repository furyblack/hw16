import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { HydratedDocument, Model } from 'mongoose';

export enum DeletionStatus {
  NotDeleted = 'not-deleted',
  PermanentDeleted = 'permanent-deleted',
}

export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
};

export const passwordConstraints = {
  minLength: 6,
  maxLength: 20,
};

export const emailConstraints = {
  match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
};

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, unique: true, ...loginConstraints })
  login: string;

  @Prop({ type: String, required: true, ...emailConstraints })
  email: string;

  @Prop({ type: String, required: true })
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: Boolean, required: true, default: false })
  isEmailConfirmed: boolean;

  @Prop({ enum: DeletionStatus, default: DeletionStatus.NotDeleted })
  deletionStatus: DeletionStatus;

  @Prop({ type: String, default: null }) // Указываем, что может быть строкой или null
  confirmationCode: string | null;

  @Prop({ type: Date, default: null }) // Указываем, что может быть датой или null
  confirmationCodeExpiration: Date | null;

  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.login = dto.login;
    user.isEmailConfirmed = false;
    return user as UserDocument;
  }

  makeDeleted() {
    if (this.deletionStatus !== DeletionStatus.NotDeleted) {
      throw new Error('Entity already deleted');
    }
    this.deletionStatus = DeletionStatus.PermanentDeleted;
  }
  setConfirmationCode(code: string) {
    this.confirmationCode = code;
    this.confirmationCodeExpiration = new Date(Date.now() + 1000 * 60 * 60); // код истекает через 1 час
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

//регистрирует методы сущности в схем
UserSchema.loadClass(User);

//Типизация документа
export type UserDocument = HydratedDocument<User>;

//Типизация модели + статические методы
export type UserModelType = Model<UserDocument> & typeof User;
