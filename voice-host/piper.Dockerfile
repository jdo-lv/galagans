FROM python:3.12-slim
RUN pip install --no-cache-dir "piper-tts[http]==1.8.0"
WORKDIR /voices
RUN python3 -m piper.download_voices en_US-hfc_female-medium
EXPOSE 5000
ENTRYPOINT ["python3", "-m", "piper.http_server", "--data-dir", "/voices", "-m", "en_US-hfc_female-medium", "--host", "0.0.0.0", "--port", "5000"]
