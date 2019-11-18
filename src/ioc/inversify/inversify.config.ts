import { Container, inject, injectable } from 'inversify';
import {
  ApplicationService,
  PaymentPlanService,
  InvoiceService,
  PaymentService
} from '../../services';

import { PaymentPlansController, ApplicationController, AuthController, PaymentController } from '../../express/controllers';
// import { UserController } from '../../express/controllers/user.controller';
import { AuthService } from '../../services/auth.service';
import { TYPES } from '../types';


const identityConfig = require('../../config/identity.config.json');
const tenant = require('../../config/tenant.json');

const iocContainer = new Container({skipBaseClassChecks: true});


iocContainer.bind(TYPES.IApplicationService).to(ApplicationService).inSingletonScope();
iocContainer.bind(TYPES.IInvoiceService).to(InvoiceService).inSingletonScope();
iocContainer.bind(TYPES.IPaymentPlanService).to(PaymentPlanService).inSingletonScope();
iocContainer.bind(TYPES.IAuthService).to(AuthService).inSingletonScope();
iocContainer.bind(TYPES.IIdentityConfig).toConstantValue(identityConfig);
iocContainer.bind(TYPES.ITenant).toConstantValue(tenant);
iocContainer.bind(TYPES.IPaymentService).to(PaymentService).inSingletonScope();


iocContainer.bind(PaymentPlansController).toSelf().inSingletonScope();
iocContainer.bind(ApplicationController).toSelf().inSingletonScope();
iocContainer.bind(PaymentController).toSelf().inSingletonScope();
// iocContainer.bind(UserController).toSelf().inSingletonScope();
iocContainer.bind(AuthController).toSelf().inSingletonScope();

export { iocContainer, inject, injectable };
