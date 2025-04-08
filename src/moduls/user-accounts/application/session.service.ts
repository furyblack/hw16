import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from '../domain/session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async createSession(sessionData: {
    ip: string;
    title: string;
    deviceId: string;
    userId: string;
    lastActiveDate: string;
  }) {
    await this.sessionModel.create({
      ...sessionData,
    });
  }

  async findSessionByDeviceId(deviceId: string) {
    return this.sessionModel.findOne({ deviceId }).exec();
  }

  async deleteSessionByDeviceId(deviceId: string): Promise<void> {
    const result = await this.sessionModel.deleteOne({ deviceId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Session not found');
    }
  }

  async updateSessionLastActiveDate(deviceId: string) {
    await this.sessionModel
      .updateOne({ deviceId }, { $set: { lastActiveDate: new Date() } })
      .exec();
  }

  async findAllSessionsForUser(userId: string) {
    return this.sessionModel.find({ userId }).exec();
  }

  async deleteAllOtherSessions(userId: string, currentDeviceId: string) {
    await this.sessionModel
      .deleteMany({
        userId,
        deviceId: { $ne: currentDeviceId },
      })
      .exec();
  }
  async terminateSpecificSession(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    // Проверяем, что сессия принадлежит пользователю
    const session = await this.sessionModel
      .findOne({
        deviceId,
        userId,
      })
      .exec();

    if (!session) {
      throw new NotFoundException(
        'Session not found or does not belong to user',
      );
    }

    await this.sessionModel.deleteOne({ deviceId }).exec();
  }
}
