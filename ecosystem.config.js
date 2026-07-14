module.exports = {
  apps: [
    {
      name: "zeilalink-backend",
      cwd: "/home/deploy/apps/ZeilaLink/backend",
      script: "node",
      args: "dist/src/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 7000,
      },
    },
    {
      name: "zeilalink-frontend",
      cwd: "/home/deploy/apps/ZeilaLink/frontend",
      script: "pnpm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
