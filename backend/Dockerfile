FROM python:3.12-slim AS builder

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

FROM builder AS prod

EXPOSE 8080

CMD ["python", "backend.py"]