# Backend dev/prod-shape image: PHP 8.4 CLI + pgsql + zip + gd (Excel),
# composer binary included for in-container artisan/composer runs.
FROM php:8.4-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev libzip-dev libpng-dev libjpeg-dev libfreetype6-dev \
    git unzip \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install -j2 pdo_pgsql zip gd \
 && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Overridden per service in docker-compose.yml (serve vs queue:work).
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
