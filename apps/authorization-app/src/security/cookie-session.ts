import { REGISTERED_USERS } from '../db/users';
import yar, { YarOptions } from '@hapi/yar';
import { APIKeyAuthArg, APIKeyAuthDesign, KaapiPlugin, KaapiTools } from '@kaapi/kaapi';

const COOKIE_NAME = 'sid-auth-app';

const yarOptions: YarOptions = {
    name: COOKIE_NAME,
    maxCookieSize: 1024,
    storeBlank: false,
    cookieOptions: {
        password: 'the-password-must-be-at-least-32-characters-long',
        path: '/',
        isSameSite: 'Strict',
        isSecure: process.env.NODE_ENV === 'production',
        isHttpOnly: true,
        clearInvalid: true,
        ignoreErrors: true,
        ttl: 4.32e7, // 12 hours
    },
};

export const yarPlugin: KaapiPlugin = {
    async integrate(t) {
        t.server.register({
            plugin: yar,
            options: yarOptions,
        });
    },
};

export class CookieSessionAuthDesign extends APIKeyAuthDesign {
    constructor(settings: APIKeyAuthArg) {
        super(settings);
        this.inCookie();
    }
    /* @TODO: docs(): undefined */
    /**
     * @override
     * This method has no effect for this subclass.
     */
    inHeader(): this {
        return this;
    }
    /**
     * @override
     * This method has no effect for this subclass.
     */
    inQuery(): this {
        return this;
    }
    async integrateHook(t: KaapiTools): Promise<void> {
        await super.integrateHook(t);

        t.route({
            path: '/logout',
            method: 'GET',
            options: {
                cors: false,
                plugins: {
                    kaapi: {
                        docs: false,
                    },
                },
            },
            handler: (req, h) => {
                req.yar.reset();

                return h.redirect('/login');
            },
        });

        t.route<{ Payload: { username?: string; password?: string }; AuthUser: { id: string } }>({
            path: '/login',
            method: ['GET', 'POST'],
            options: {
                auth: {
                    mode: 'try',
                    strategy: this.strategyName,
                },
                cors: false,
                plugins: {
                    kaapi: {
                        docs: false,
                    },
                },
            },
            handler: (req, h) => {
                let errorMessage = '';
                let statusCode = 200;
                const successHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Login Successful</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #111827;
      --accent: #22c55e;
      --danger: #ef4444;
      --text: #e5e7eb;
      --muted: #9ca3af;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      background: radial-gradient(1200px 600px at 20% 0%, #1f2937, var(--bg));
      font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif;
      color: var(--text);
    }
    .card {
      width: 92%; max-width: 420px; padding: 32px 28px; border-radius: 18px;
      background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
      border: 1px solid rgba(255,255,255,.08);
      box-shadow: 0 20px 50px rgba(0,0,0,.35);
      backdrop-filter: blur(8px);
      text-align: center;
    }
    .icon {
      width: 64px; height: 64px; margin-bottom: 20px;
      color: var(--accent);
      filter: drop-shadow(0 4px 6px rgba(34,197,94,.35));
    }
    h1 { font-size: 1.6rem; margin: 0 0 12px; }
    p { font-size: 1rem; color: var(--muted); margin: 0 0 24px; }
    .btn {
      appearance: none; border: none; cursor: pointer;
      padding: 14px 20px; border-radius: 12px; font-weight: 600;
      box-shadow: 0 10px 20px rgba(0,0,0,.25); transition: transform .05s, filter .2s;
      margin: 6px;
    }
    .btn:hover { filter: brightness(1.05); }
    .btn:active { transform: translateY(1px); }
    .btn-success {
      background: linear-gradient(135deg, #16a34a, var(--accent));
      color: white;
      box-shadow: 0 10px 20px rgba(34,197,94,.35);
    }
    .btn-danger {
      background: linear-gradient(135deg, #dc2626, var(--danger));
      color: white;
      box-shadow: 0 10px 20px rgba(239,68,68,.35);
    }
  </style>
</head>
<body>
  <div class="card">
    <!-- Success checkmark icon -->
    <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1 15-5-5 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8Z"/>
    </svg>
    <h1>Login Successful 🎉</h1>
    <p>Welcome back! You’ve successfully signed in.</p>
    <div>
      <button class="btn btn-success" onclick="window.location.href='/docs/api'">Go to Dashboard</button>
      <button class="btn btn-danger" onclick="window.location.href='/logout'">Log Out</button>
    </div>
  </div>
</body>
</html>
`;
                if (req.auth.credentials?.user?.id) {
                    return successHtml;
                }

                if (req.method.toUpperCase() === 'POST') {
                    const user = REGISTERED_USERS.find((u) => u.username === req.payload.username);

                    if (user && user.password === req.payload.password) {
                        req.yar.set('userId', user.id);

                        return successHtml;
                    } else {
                        statusCode = 401;
                        errorMessage = 'Invalid username or password';
                    }
                }

                const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Sign in</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #111827;
      --accent: #6366f1;
      --text: #e5e7eb;
      --muted: #9ca3af;
      --ring: rgba(99,102,241,.35);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      background: radial-gradient(1200px 600px at 20% 0%, #1f2937, var(--bg));
      font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif;
      color: var(--text);
    }
    .card {
      width: 92%; max-width: 380px; padding: 26px 24px; border-radius: 16px;
      background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
      border: 1px solid rgba(255,255,255,.08);
      box-shadow: 0 20px 50px rgba(0,0,0,.35);
      backdrop-filter: blur(8px);
    }
    .error {
      background: rgba(239,68,68,.15);
      color: #f87171;
      border: 1px solid rgba(239,68,68,.4);
      padding: 10px 14px;
      border-radius: 10px;
      font-size: .9rem;
      margin-bottom: 14px;
    }
    .title { font-size: 1.25rem; font-weight: 600; letter-spacing: .2px; margin: 0 0 8px; }
    .subtitle { color: var(--muted); font-size: .95rem; margin: 0 0 18px; }
    label { display: block; font-size: .85rem; color: var(--muted); margin: 12px 0 8px; }
    .field {
      display: flex; align-items: center; gap: 8px;
      background: #0b1220; border: 1px solid rgba(255,255,255,.08);
      padding: 12px 14px; border-radius: 12px;
      transition: border-color .2s, box-shadow .2s, transform .05s;
    }
    .field:focus-within {
      border-color: var(--accent); box-shadow: 0 0 0 4px var(--ring);
    }
    .field input {
      all: unset; flex: 1; color: var(--text); caret-color: var(--accent);
    }
    .icon {
      width: 18px; height: 18px; opacity: .7;
      filter: drop-shadow(0 1px 0 rgba(0,0,0,.35));
    }
    .actions { margin-top: 18px; display: flex; align-items: center; justify-content: space-between; }
    .btn {
      appearance: none; border: none; cursor: pointer;
      background: linear-gradient(135deg, #7c3aed, var(--accent));
      color: white; padding: 12px 16px; border-radius: 12px; font-weight: 600;
      box-shadow: 0 10px 20px rgba(99,102,241,.35); transition: transform .05s, filter .2s;
    }
    .btn:hover { filter: brightness(1.05); }
    .btn:active { transform: translateY(1px); }
    .meta { font-size: .85rem; color: var(--muted); }
    .link { color: var(--text); text-decoration: none; border-bottom: 1px dashed rgba(255,255,255,.2); }
    .link:hover { color: var(--accent); border-bottom-color: var(--accent); }
  </style>
</head>
<body>
  <form class="card" action="/login" method="post">
    <h1 class="title">Welcome back</h1>
    <p class="subtitle">Sign in to continue</p>

    <!-- Error message placeholder --> 
    
    ${
        errorMessage
            ? `<p class="error" id="error-message">
        ${errorMessage}
    </p>`
            : ''
    }

    <label for="username">Username</label>
    <div class="field">
      <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.18-8 4.87V21h16v-2.13C20 16.18 16.42 14 12 14Z"/>
      </svg>
      <input id="username" name="username" type="text" placeholder="yourname" required autocomplete="username"/>
    </div>

    <label for="password">Password</label>
    <div class="field">
      <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17 8V7a5 5 0 0 0-10 0v1H5v12h14V8Zm-8 0V7a3 3 0 0 1 6 0v1Z"/>
      </svg>
      <input id="password" name="password" type="password" placeholder="••••••••" required autocomplete="current-password"/>
    </div>

    <div class="actions">
      <button class="btn" type="submit">Sign in</button>
      <span class="meta"><a class="link" href="#">Forgot password?</a></span>
    </div>
  </form>
</body>
</html>
            `;
                return h.response(html).code(statusCode);
            },
        });
    }
}

export const cookieSessionAuth = new CookieSessionAuthDesign({
    strategyName: 'cookie-session',
    key: COOKIE_NAME,
    auth: {
        /**
         *
         * @param req
         * @param _token cookie value
         * @returns
         */
        async validate(req, _token) {
            const value = req.yar.get('userId');

            const user = REGISTERED_USERS.find((u) => u.id === value);

            if (user) {
                return {
                    isValid: true,
                    credentials: {
                        user: { id: user.id },
                        scope: ['internal:session'],
                    },
                };
            }

            return { isValid: false };
        },
    },
}).setDescription(
    `Authentication is managed via a <u>secure</u>, HTTP-only session cookie.  
 The cookie is issued after login and must be included in subsequent requests.  
 It is automatically invalidated when the session expires or the user logs out.`
);
