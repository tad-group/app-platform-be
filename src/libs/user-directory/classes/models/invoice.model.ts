import { IEntity } from '../../typeorm/entities/interfaces/entity.interface';
import { PaymentPlan } from '../../typeorm/entities/payment-plan.entity';
import { IInvoice } from '../../interfaces/models/invoice.interface';
import { PaymentStatus } from '../../../payments';
import { IUser } from '../..';

export class Invoice implements IEntity, IInvoice {
  id?: number;
  payPrice: number;
  createDate?: Date;
  paymentStatus?: PaymentStatus;
  user: IUser;
  plan: PaymentPlan;
  description?: string;
}
