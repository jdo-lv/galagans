# whisper-server built from source: the official ghcr.io/ggml-org/whisper.cpp:main image has no arm64 build.
FROM debian:bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential cmake git ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 --branch v1.9.5 https://github.com/ggml-org/whisper.cpp /src
WORKDIR /src
RUN cmake -B build -DGGML_NATIVE=OFF -DBUILD_SHARED_LIBS=OFF \
  && cmake --build build -j --config Release --target whisper-server
RUN mkdir /models && ./models/download-ggml-model.sh base.en /models

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /src/build/bin/whisper-server /usr/local/bin/
COPY --from=build /models/ggml-base.en.bin /models/
WORKDIR /tmp
EXPOSE 8080
# --convert runs ffmpeg, so the browser's MediaRecorder audio (webm/opus) is accepted as is.
ENTRYPOINT ["whisper-server", "--host", "0.0.0.0", "--port", "8080", "-m", "/models/ggml-base.en.bin", "--convert"]
