# Docker Deployment Guide

This guide explains how to deploy the SEO Content Cluster application using Docker and Docker Compose.

## Prerequisites

- Docker installed (v20.10+)
- Docker Compose installed (v2.0+)
- At least 2GB of free disk space

## Quick Start

### 1. Environment Configuration

Create a `.env` file based on the example:

```bash
cp .env.example .env
```

**Required environment variables:**

```bash
# Database (automatically configured for Docker)
DATABASE_URL=postgresql://seocontent:seocontent_password@postgres:5432/seocontent

# Better Auth (REQUIRED - generate a secure secret)
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Anthropic API (REQUIRED for AI content generation)
ANTHROPIC_API_KEY=your-anthropic-api-key
```

**Optional environment variables:**

- `RESEND_API_KEY` - For email notifications
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `PESAPAL_*` - For Pesapal payment integration
- `MPESA_*` - For M-Pesa payment integration

### 2. Build and Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Check service status
docker-compose ps
```

### 3. Database Setup

Run database migrations:

```bash
# Generate migration files
docker-compose exec app npm run db:generate

# Push schema to database
docker-compose exec app npm run db:push
```

### 4. Access the Application

- **Application**: http://localhost:3000
- **PostgreSQL**: localhost:5432 (credentials in `.env`)

## Docker Commands

### Basic Operations

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f app
docker-compose logs -f postgres
```

### Database Management

```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U seocontent -d seocontent

# Backup database
docker-compose exec postgres pg_dump -U seocontent seocontent > backup.sql

# Restore database
docker-compose exec -T postgres psql -U seocontent seocontent < backup.sql

# Open Drizzle Studio (database GUI)
docker-compose exec app npm run db:studio
```

### Development

```bash
# Rebuild the app after code changes
docker-compose build app
docker-compose up -d app

# Run commands inside the container
docker-compose exec app npm run build
docker-compose exec app npm run lint

# Access shell inside app container
docker-compose exec app sh
```

### Cleanup

```bash
# Stop and remove containers, networks
docker-compose down

# Stop and remove containers, networks, and volumes (⚠️ destroys database data)
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a
```

## Production Deployment

### Security Checklist

Before deploying to production:

1. **Change default passwords** in `.env`:
   - `POSTGRES_PASSWORD`
   - `BETTER_AUTH_SECRET` (use `openssl rand -base64 32`)

2. **Update URLs** to your production domain:
   - `BETTER_AUTH_URL`
   - `NEXT_PUBLIC_BETTER_AUTH_URL`
   - `PESAPAL_CALLBACK_URL` / `PESAPAL_IPN_URL`
   - `MPESA_CALLBACK_URL`

3. **Set production API keys**:
   - Use production keys for Anthropic, Resend, Pesapal, M-Pesa
   - Change `PESAPAL_ENVIRONMENT` and `MPESA_ENVIRONMENT` to `"live"`

4. **Disable database port exposure** in `docker-compose.yml`:
   ```yaml
   # Comment out or remove this line:
   # ports:
   #   - "${POSTGRES_PORT:-5432}:5432"
   ```

5. **Use HTTPS** with a reverse proxy (nginx, Caddy, Traefik)

### Reverse Proxy Example (nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Scaling

To run multiple app instances:

```bash
docker-compose up -d --scale app=3
```

## Troubleshooting

### App won't start

```bash
# Check logs
docker-compose logs app

# Common issues:
# 1. Missing environment variables - check .env file
# 2. Database not ready - wait for postgres healthcheck
# 3. Port already in use - change APP_PORT in .env
```

### Database connection errors

```bash
# Verify postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U seocontent -d seocontent -c "SELECT 1;"
```

### Build failures

```bash
# Clear build cache and rebuild
docker-compose build --no-cache app

# Remove old containers and volumes
docker-compose down -v
docker-compose up -d
```

### Permission errors

```bash
# The app runs as user 'nextjs' (uid 1001)
# If you have permission issues with volumes, fix ownership:
sudo chown -R 1001:1001 /path/to/app/directory
```

## Architecture

The Docker setup includes:

- **Multi-stage Dockerfile** for optimized image size
- **PostgreSQL 16** database with persistent volume
- **Healthchecks** to ensure services start in correct order
- **Non-root user** for improved security
- **Standalone Next.js build** for minimal runtime dependencies

## Performance Optimization

### Resource Limits

Add resource limits to `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M
```

### Caching

The Dockerfile uses layer caching for faster rebuilds:
- Dependencies are cached separately from source code
- Only rebuilds when `package.json` changes

## Support

For issues related to:
- **Docker setup**: Check this guide and troubleshooting section
- **Application features**: See main README.md
- **Bug reports**: Open an issue on GitHub

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
