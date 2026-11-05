// Loaded before the server modules so tests never touch a dev database.
process.env.DATABASE_URL = 'postgres://casedesk:casedesk@127.0.0.1:5432/casedesk_test';
process.env.SESSION_SECRET = 'test-secret-not-production';
process.env.NODE_ENV = 'test';
process.env.PUBLIC_BASE_URL = 'http://127.0.0.1:9';
process.env.ADMIN_EMAILS = 'owner@nextsteps.fun';
process.env.MOCK_COMMERCE = '1';
process.env.RESEND_API_KEY = '';
process.env.EMAIL_FROM = 'The Case Desk <no-reply@nextsteps.fun>';
process.env.ETSY_LISTING_URL = '';
