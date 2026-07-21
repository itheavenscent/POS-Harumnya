# ================================
# Stage 1: Build frontend assets
# ================================
FROM node:20-alpine AS node-builder

WORKDIR /var/www

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ================================
# Stage 2: PHP application
# ================================
FROM php:8.4-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    libpq-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install \
    pdo_pgsql \
    pgsql \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    opcache

# Install phpredis extension via PECL
RUN pecl install redis \
    && docker-php-ext-enable redis

# Copy custom PHP configs
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf
COPY docker/php/custom.ini /usr/local/etc/php/conf.d/custom.ini

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy application source
COPY . /var/www

# Copy Vite build output from node-builder stage
COPY --from=node-builder /var/www/public/build /var/www/public/build

# Set permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Install PHP dependencies (production only)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Entrypoint: sinkronkan public -> shared volume untuk nginx
COPY docker/scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh \
    && mkdir -p /var/www/public-shared

RUN chown -R www-data:www-data /var/www
USER www-data

EXPOSE 9000
CMD ["/usr/local/bin/entrypoint.sh"]