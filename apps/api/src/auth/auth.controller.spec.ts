import assert from 'node:assert/strict';
import test from 'node:test';
import type { Response } from 'express';
import { AuthController } from './auth.controller';

const session = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: new Date('2026-09-19T00:00:00.000Z'),
  user: {
    id: 'user-1',
    email: 'ana@example.com',
    displayName: 'Ana Pérez',
    settings: null,
  },
};

function response() {
  const cookies: Array<{ name: string; value: string }> = [];
  return {
    cookies,
    response: {
      cookie(name: string, value: string) {
        cookies.push({ name, value });
        return this;
      },
    } as unknown as Response,
  };
}

function controller() {
  return new AuthController(
    {
      register: async () => session,
      login: async () => session,
    } as never,
    { get: () => undefined } as never,
  );
}

test('register returns portable session tokens as well as setting web cookies', async () => {
  const { response: res, cookies } = response();

  const result = await controller().register(
    { email: 'ana@example.com', password: 'password123', displayName: 'Ana Pérez' },
    res,
  );

  assert.deepEqual(result, {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user,
  });
  assert.deepEqual(cookies, [
    { name: 'cashtracker_access', value: session.accessToken },
    { name: 'cashtracker_refresh', value: session.refreshToken },
  ]);
});

test('login returns portable session tokens as well as setting web cookies', async () => {
  const { response: res, cookies } = response();

  const result = await controller().login(
    { email: 'ana@example.com', password: 'password123' },
    res,
  );

  assert.deepEqual(result, {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user,
  });
  assert.deepEqual(cookies, [
    { name: 'cashtracker_access', value: session.accessToken },
    { name: 'cashtracker_refresh', value: session.refreshToken },
  ]);
});
