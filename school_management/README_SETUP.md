# School Management System - Setup Guide

## Environment Configuration

### 1. Environment Variables

Copy the `.env.example` file to `.env` and configure your settings:

```bash
cp .env.example .env
```

### 2. Required Environment Variables

```env
# Django Configuration
DJANGO_SECRET_KEY=your-secure-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# Database Configuration
DATABASE_URL=sqlite:///db.sqlite3

# Redis Configuration (optional)
REDIS_URL=redis://127.0.0.1:6379/1
```

### 3. Redis Setup (Optional but Recommended)

#### Windows Installation:
1. Download Redis for Windows from: https://redis.io/download
2. Extract and run `redis-server.exe`
3. Redis will be available at `redis://127.0.0.1:6379`

#### Linux/Mac Installation:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server

# macOS
brew install redis
brew services start redis
```

#### Enable Redis in Django:
Uncomment the Redis cache configuration in `settings.py`:
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        # ... other settings
    }
}
```

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run database migrations:
```bash
python manage.py migrate
```

3. Create demo data (optional):
```bash
python manage.py create_demo_data
```

4. Start the development server:
```bash
python manage.py runserver
```

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique secret keys in production
- Set `DEBUG=False` in production
- Configure proper `ALLOWED_HOSTS` for your domain
- Use HTTPS in production
- Regularly update dependencies for security patches

## Cache Configuration

The system supports multiple cache backends:
- Database cache (default, always available)
- Redis cache (recommended for production)
- Local memory cache (for development)

Cache settings can be configured in the `CACHES` dictionary in `settings.py`.

## Demo Credentials

After running `create_demo_data`, you can use these credentials:

- **Principal**: principal@demo.com / demo123
- **Teacher**: teacher_class_1@demo.edu.in / demo123
- **Student**: student_class_1_1@demo.edu.in / demo123