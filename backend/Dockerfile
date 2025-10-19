FROM python:3.12-slim AS builder

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

COPY . .

FROM builder AS prod

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "backend:app"]
# CMD ["python", "backend.py"]