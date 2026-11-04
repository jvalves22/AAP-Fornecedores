import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL:'http://127.0.0.1:5173', channel:'msedge', viewport:{width:1920,height:1080} },
  webServer: { command:'npm run dev', url:'http://127.0.0.1:5173', reuseExistingServer:!process.env.CI },
});
