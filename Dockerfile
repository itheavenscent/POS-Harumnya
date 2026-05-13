FROM node:20-alpine AS node-builder

WORKDIR /var/www

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ================================

FROM php:8.4-fpm

RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev \
    zip unzip libzip-dev libpq-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo_pgsql pgsql pdo_mysql mbstring exif pcntl bcmath gd zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . /var/www

# Copy hasil build Vite dari stage sebelumnya
COPY --from=node-builder /var/www/public/build /var/www/public/build

RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

RUN composer install --no-dev --optimize-autoloader

EXPOSE 9000
CMD ["php-fpm"]