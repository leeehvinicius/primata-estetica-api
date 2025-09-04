import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // Mapear campos do JWT payload para campos esperados
    const mappedUser = {
      id: user.sub,
      email: user.email,
      profile: user.profile,
      ...user
    };

    return data ? mappedUser?.[data] : mappedUser;
  },
);
