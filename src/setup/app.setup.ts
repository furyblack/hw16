import { INestApplication } from '@nestjs/common';
import { pipesSetup } from './pipes.setup';
import { globalPrefixSetup } from './global-prefix.setup';
import { swaggerSetup } from './swagger.setup';
import { validationConstraintSetup } from './validation-constraint.setup';

export function appSetup(app: INestApplication) {
  pipesSetup(app);
  globalPrefixSetup(app);
  swaggerSetup(app);
  validationConstraintSetup(app);
}
