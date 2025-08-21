# Migration Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=cake_system

# Application Environment
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1d
```

## Migration Commands

The following npm scripts are available for managing database migrations:

- `npm run migration:generate` - Generate a new migration based on entity changes
- `npm run migration:create` - Create an empty migration file
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert the last migration
- `npm run migration:show` - Show migration status

## Usage Examples

1. **Generate a migration after entity changes:**
   ```bash
   npm run migration:generate -- InitialMigration
   ```

2. **Create a custom migration:**
   ```bash
   npm run migration:create -- AddIndexes
   ```

3. **Run migrations:**
   ```bash
   npm run migration:run
   ```

4. **Revert last migration:**
   ```bash
   npm run migration:revert
   ```

## Important Notes

- In production, set `NODE_ENV=production` to enable automatic migration runs
- Synchronize is disabled in production and when using migrations
- Migration files are stored in `src/migrations/` directory
- Compiled migration files are expected in `dist/migrations/` for runtime execution
