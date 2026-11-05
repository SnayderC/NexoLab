# Imagen del backend para docker compose (perfil "app"). Ver README.md.
FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Aplica las migraciones pendientes y arranca el servidor de desarrollo.
# Los datos de demostración no se cargan solos: ver "seed_demo" en README.md.
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py runserver 0.0.0.0:8000"]
