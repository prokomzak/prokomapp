FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PROKOM_HOST=0.0.0.0 \
    PROKOM_DATA_DIR=/data

WORKDIR /app

COPY outputs/prokom-panel-prototype /app/outputs/prokom-panel-prototype

RUN mkdir -p /data /app/outputs/prokom-panel-prototype/uploads

EXPOSE 4173

CMD ["python", "-u", "outputs/prokom-panel-prototype/backend/server.py"]
