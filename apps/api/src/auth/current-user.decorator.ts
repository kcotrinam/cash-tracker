import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => (context.switchToHttp().getRequest() as { user: { id: string } }).user);
