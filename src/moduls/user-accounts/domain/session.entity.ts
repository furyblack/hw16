import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Session {
  @Prop({ required: true })
  ip: string;

  @Prop({ required: true })
  title: string; // из User-Agent

  @Prop({ required: true })
  lastActiveDate: Date;

  @Prop({ required: true })
  deviceId: string;

  @Prop({ required: true })
  userId: string;
}

export type SessionDocument = Session & Document;
export const SessionSchema = SchemaFactory.createForClass(Session);
