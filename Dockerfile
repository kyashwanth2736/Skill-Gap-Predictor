# Production Dockerfile for Skill-Gap Predictor (Career Navigation AI)
# IEEE CS Bangalore Chapter | Project ID: P19 | GITAM University

FROM php:8.2-apache

# Install Python 3, pip, and SQLite dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_sqlite

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy requirements file first for layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Copy project files into container
COPY . /var/www/html/

# Create uploads directory if missing and set write permissions
RUN mkdir -p /var/www/html/scratch/uploads \
    && chmod -R 777 /var/www/html/scratch \
    && touch /var/www/html/career_navigation.db \
    && chmod 777 /var/www/html/career_navigation.db

# Expose HTTP port 80
EXPOSE 80

CMD ["apache2-foreground"]
