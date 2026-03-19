import { http, HttpResponse } from 'msw';

export const authHandlers = [
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email && body.password) {
      return HttpResponse.json({
        access_token: 'mock-access-token-' + Date.now(),
        refresh_token: 'mock-refresh-token-' + Date.now(),
        user: {
          id: 'user-001',
          email: body.email,
          name: 'Admin User',
          groups: ['admin'],
        },
      });
    }

    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
  }),

  http.post('/api/v1/auth/refresh', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token-refreshed-' + Date.now(),
      refresh_token: 'mock-refresh-token-refreshed-' + Date.now(),
    });
  }),
];
