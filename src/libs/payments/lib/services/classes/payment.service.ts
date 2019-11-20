import { IPaymentService } from '../interfaces/payment.service.interface';
import { IPaymentMethod, IPaymentResult, PaymentStatus } from '../..';
import { EntityManager } from 'typeorm';
import { Transaction, ITransaction } from '../../models/transaction.model';
import { TransactionStatus } from '../../models/transaction.status';
import { Invoice } from '../../../../user-directory/classes/invoice';
import { IOnlinePaymentMethod } from '../../models/payment-method.model';
import { User, PaymentPlan } from '../../../../user-directory/classes/models';
import { IUser } from '../../../../user-directory';

export class PaymentService implements IPaymentService {
  constructor(private manager: EntityManager) {}

  /**
   * Buy functionality for a user who want to buy a product.
   * @param planId payment plan that want to buy.
   * @param userId id of user who want to buy the plan.
   * @param paymentMethod the method that is responsible for payment process.
   * @param callbackUrl url that is suppose to verify the payment. it is for online payment methods.
   */
  async buy(
    planId: string,
    userId: string,
    paymentMethod: IPaymentMethod,
    callbackUrl?: string
  ): Promise<IPaymentResult> {
    const plan = await this.loadPlan(planId);
    const user = await this.loadUser(userId);

    const invoice = new Invoice(user, plan);
    const transaction = new Transaction(invoice, TransactionStatus.pending);

    if (callbackUrl) {
      callbackUrl += '?transactionKey=' + transaction.transactionKey;
    }

    let paymentResult = await paymentMethod.pay(invoice, callbackUrl);

    if (paymentResult.status === PaymentStatus.paid) {
      invoice.paymentStatus = PaymentStatus.paid;
      user.upgrade(invoice.plan.dateRange);
    }

    try {
      await this.manager.transaction(async tManager => {
        await tManager.save('invoice', invoice);
        await tManager.save('transaction', transaction);
        await tManager.save('user' , user);
      });
    } catch (e) {
      paymentResult = await paymentMethod.unPay(paymentResult.transactionKey);
      console.log(e);
      throw new Error(`DATABASE_SAVING_FAILURE`);
    }

    return paymentResult;
  }

  /**
   * Verifies the payment.
   * @param params callback params.
   * @param paymentMethod the payment method that is responsible for verifying the payment.
   */
  async verify(params: any, paymentMethod: IOnlinePaymentMethod): Promise<IPaymentResult> {
    const transaction = await this.loadTransaction(params.transactionKey);

    /**
     * handle transaction failure.
     */
    if (!paymentMethod.isSuccessful(params)) {
      transaction.status = TransactionStatus.failed;
      await this.manager.save(transaction);
      throw new Error('PAYMENT_FAILURE');
    }

    // update invoice status.
    transaction.status = TransactionStatus.successful;
    transaction.invoice.paymentStatus = PaymentStatus.paid;
    // upgrade the user.
    const user = User.create(transaction.invoice.user);
    user.upgrade(transaction.invoice.plan.dateRange);

    let verifyResult: IPaymentResult;

    try {
      await this.manager.transaction(async tManager => {
        await tManager.save('invoice', transaction.invoice);
        await tManager.save('transaction', transaction);
        await tManager.save('user' , user);
      });
    } catch (e) {
      verifyResult = await paymentMethod.unPay(params.transactionKey);
      throw new Error(`DATABASE_SAVING_FAILURE`);
    }

    // commit the transaction in bank.
    verifyResult = await paymentMethod.verifyTransaction({...params, amount: transaction.invoice.payPrice});
    // didn't use await because it is not necessary to wait for result of this operation.
    this.manager.save('payment-result', {...verifyResult, thirdPartyData: JSON.stringify(params)});


    return verifyResult;
  }

  /**
   * load plan from DB.
   * @param planId Plan id
   */
  private async loadPlan(planId: string) {
    const plan = await this.manager.findOne<PaymentPlan>('plan', planId);

    if (!plan) {
      throw new Error('INVALID_PLAN_ID') as any;
    }
    return plan;
  }

  /**
   * load user from db.
   * @param userId
   */
  private async loadUser(userId: string) {
    const user = await this.manager.findOne<IUser>('user', userId);
  
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
  
    return User.create(user);
  }

  /**
   * loads the transaction from DB with transaction key.
   * @param key transaction key.
   */
  private async loadTransaction(key: any) {
    const transaction = await this.manager.findOne<ITransaction>('transaction' ,{where: {transactionKey: key}});
    if (!transaction) {
      throw new Error('TRANSACTION_KEY_NOT_FOUND');
    }

    return transaction;
  }
}
