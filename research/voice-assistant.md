# Offline voice assistant: speech, small LLMs and the minimal stack

Research for F25 "Local voice assistant" in [features.md](../ideas/features.md) (researched Nov 14, 2026). It covers offline speech-to-text, text-to-speech, small local LLMs with their runtimes, and the smallest stack one person can build in a few hours. Source tags like [S1] point to the Sources list at the end. "(derived)" means our arithmetic on a vendor number. "(unverified)" means we found no primary source.

## Key takeaways for the team

- **Browser speech recognition can run offline now, but only on desktop.** With `SpeechRecognition.processLocally = true`, recognition "MUST be performed locally" [S2]. Chrome/Edge 139 and Firefox 160 (released 2026-11-10) support it on desktop. Chrome and Firefox for Android don't, and Safari has no `processLocally` [S3][S7]. Chrome needs a one-time language pack download (~60 MB) through `SpeechRecognition.install()`, triggered by a click while online [S2][S5].
- **Read-aloud needs no model.** `speechSynthesis` voices with `localService === true` come from a local synthesizer [S8]. If the OS voices sound poor, Kokoro-82M runs in the browser (Apache-2.0) and Piper runs on a host (GPL-3.0) [S15][S16].
- **The check-in fields are simple.** They are numbers (heart rate, SpO2, sleep hours), a 1–5 mood scale and a fixed symptom list (`domain/checkIn.ts`). With a JSON schema built from the question, the LLM can only return a valid `{question_id, value}`. A pure parser in `domain` could do the same without the LLM (our design inference).
- **LLM: Qwen3.5-4B in `llama-server`** (2.7 GB at Q4_K_M [S23]); Qwen3.5-2B was not faithful enough (§4). Qwen3.5-2B is Apache-2.0, ~1.3 GB at Q4_K_M, and llama.cpp can constrain its output with a JSON schema [S17][S23][S24]. Gemma 4 E2B (Apache-2.0) is the alternative. It also takes audio input, but it is ~2.8 GB at Q4_0 [S18][S23]. A Raspberry Pi 5 is too slow as the host: Gemma 4 E2B decodes 8 tokens/s there, with 7.8 s to the first token [S19].
- **Host runtimes and WebLLM can all constrain output.** llama.cpp has `json_schema` and `grammar`, Ollama takes a JSON schema in `format`, and WebLLM takes a JSON schema or an EBNF grammar [S24][S25][S26]. Force `{inCorpus, answer, sources}`, so the app decides when to refuse, not the model.
- **No fine-tuning.** It is out of scope for a 2-day build. The LLM gets a fixed system prompt plus retrieval over our sourced `research/*.md` corpus, and it cites the section it used.
- **Chosen stack for the F25 spike: everything on the ship-local host**, because it can run larger models than the tablet. `whisper-server` (whisper.cpp, MIT) transcribes the audio the app records; Qwen3.5-4B in `llama-server` maps the transcript to one command or check-in values; Piper reads aloud over HTTP. The app words the spoken health briefing from the rules itself, and a check-in is saved only after the astronaut confirms. Built in issue #37. The host must be laptop-class. The browser's speech APIs are not used, because their offline recognition is desktop-only.

## 1. Speech-to-text, offline

### 1.1 Browser Web Speech API
- The spec is a Draft Community Group Report dated 27 Oct 2026 [S2]. `processLocally` defaults to false. When it is false, "user speech data might be sent to a remote server" [S2]. MDN warns that in Chrome without it, audio goes to a server and "won't work offline" [S1].
- `available({langs, processLocally})` resolves to `unavailable`, `downloadable`, `downloading` or `available`. `install()` downloads the language packs. The Permissions-Policy `on-device-speech-recognition` controls both [S2][S4]. `install()` "requires and consumes transient activation" when it would start a download, so call it from a click [S2]. To limit fingerprinting, the status stays masked as `downloadable` until the page has called `install()` once [S2].
- Optional `quality` hint: `command` (default), `dictation` or `conversation` [S4]. Chrome targets it for M150 on desktop [S6].
- The spec forbids training on-device models on user speech [S2].

| Browser | `SpeechRecognition` | `processLocally`, `available()`, `install()` | Offline recognition |
|---|---|---|---|
| Chrome desktop | 139 (webkit prefix since 33) | 139 | Yes on Windows, Mac and Linux after `install()`; ~60 MB per language [S3][S5] |
| Edge desktop | Same as Chrome in MDN data | Same as Chrome | Same as Chrome (unverified) [S3] |
| Firefox desktop | 160 | 160 | Yes, on-device only, 40 languages; no cloud recognition [S3][S7] |
| Chrome Android | Yes | No | No. "Android & ChromeOS currently do not support on-device Web Speech" [S3][S6] |
| Firefox Android | No | No | No [S7] |
| Safari macOS/iOS | webkit prefix since 14.1 | No | Not documented (unverified) [S3] |

### 1.2 Local engines (host or in-browser)

| Engine | Model and size | Memory | Speed (vendor numbers) | Licence | In browser |
|---|---|---|---|---|---|
| whisper.cpp | tiny 75 MiB, base 142 MiB, small 466 MiB [S9] | ~273 / ~388 / ~852 MB [S9] | small fp32: 13 min of audio in 2m05s on an i7-12700K, 8 threads [S10], about 0.16× real time (derived) | MIT [S9] | WASM build [S9] |
| faster-whisper | small int8 | 1,477 MB [S10] | 13 min in 1m42s on the same CPU [S10] | MIT [S10] | No (Python) |
| Moonshine Streaming | tiny 34M, small 123M, medium 245M params [S12] | Targets "sub-1GB memory budgets" [S12] | Average WER 12.01 / 7.84 / 6.65 on Open ASR sets [S12]. The vendor claims "higher accuracy than Whisper Large V3" (not checked) [S11] | MIT, English-only [S11][S12] | JS/WASM library [S11][S28] |
| Vosk | small-en-us-0.15: 40 MB, WER 9.85 on LibriSpeech clean | Not stated | "for mobile and Raspberry Pi" [S13] | Apache-2.0 [S13] | Not checked |
| Transformers.js | whisper-tiny.en int8 ≈ 41 MB, whisper-base.en ≈ 77 MB, moonshine-base ≈ 63 MB (encoder + merged decoder files) [S14] | Not stated | WebGPU via `device: 'webgpu'`, otherwise WASM [S14] | Apache-2.0 [S28] | Yes |

- whisper.cpp ships `whisper-server`, an "HTTP transcription server with OAI-like API", and a real-time microphone example [S9].
- Moonshine's non-English legacy models are under a non-commercial licence. The streaming models are MIT [S11].
- Gemma 4 E2B/E4B accept audio for speech recognition, up to 30 s per clip [S18]. One model could then do STT and the LLM, but it is much larger than a dedicated STT model.
- WebGPU reached about 85% of users globally as of March 2026, per Hugging Face [S14].

## 2. Text-to-speech, offline

| Option | Size | Licence | Where it runs | Notes |
|---|---|---|---|---|
| `speechSynthesis` | OS voices | Browser/OS | Browser | `localService` is true for "a local speech synthesizer", false for "a remote speech synthesizer service" [S8]. `getVoices()` can be empty until `voiceschanged` fires [S2] |
| Kokoro-82M | 82M params; ONNX q8 ≈ 86–92 MB [S16] | Apache-2.0 [S16] | Browser (`kokoro-js` on Transformers.js, wasm or webgpu) or Python [S16] | v1.0 covers 8 languages and 54 voices [S16] |
| Piper | One ONNX file per voice | GPL-3.0 code; each voice has its own licence in its `MODEL_CARD` [S15] | Host (CLI, Python, C/C++) | HTTP server: `python3 -m piper.http_server -m en_US-lessac-medium`, then POST `/synthesize` with `{"text": ...}` returns WAV [S15]. Says it is "intended for personal use and text to speech research only" [S15] |

Which voices are local depends on the browser and OS (not checked per browser). F25 uses the Piper voice `en_US-hfc_female-medium`, chosen by ear from eight voices on 2026-11-14; its dataset (Hi-Fi-CAPTAIN, NICT) is licensed CC BY-NC-SA 4.0, so it may be used non-commercially with attribution [S29]. Filter on `localService`, and fall back to text only when no local voice exists.

## 3. Small LLMs and runtimes

### 3.1 Models (latest vendor versions found on 2026-11-14)

| Model | Params | Licence | Quantized size | WebLLM VRAM (q4f16) | Notes |
|---|---|---|---|---|---|
| Qwen3.5-0.8B | 0.8B | Apache-2.0 [S17] | Not checked | 1,629 MB [S26] | MMLU-Pro 29.7, non-thinking [S17] |
| **Qwen3.5-2B** | 2B | Apache-2.0 [S17] | 1.28 GB Q4_K_M (third-party unsloth quant) [S23] | 2,245 MB [S26] | Non-thinking by default. MMLU-Pro 55.3 non-thinking; IFEval 78.6 thinking. In thinking mode it is "more prone to entering thinking loops". Intended use: "prototyping, task-specific fine-tuning, and other research or development purposes" [S17] |
| Qwen3.5-4B | 4B | Apache-2.0 [S17] | 2.74 GB Q4_K_M (third-party unsloth quant) [S23] | 3,868 MB [S26] | Chosen for F25 (§4) |
| Gemma 4 E2B | 2.3B effective, 5.1B with embeddings | Apache-2.0 [S18] | 2.84 GB Q4_0 (ggml-org) [S23] | 3,387 MB [S26] | Audio input up to 30 s, 128K context, native tool use [S18]. LiteRT-LM decode: 42 tok/s on MacBook Pro M4 CPU, 8 tok/s on Raspberry Pi 5 [S19] |
| Gemma 4 E4B | 4.5B effective, 8B with embeddings | Apache-2.0 [S18] | 3.65 GB (LiteRT) [S19] | Not in WebLLM | LiteRT-LM decode: 3 tok/s on Raspberry Pi 5 [S19] |
| Llama 3.2 1B / 3B | 1.23B / 3.21B | Llama 3.2 Community License [S20] | SpinQuant 1.08 / 2.44 GB [S20] | 879 / 2,264 MB [S26] | Sept 2024. Decode 50.2 / 19.7 tok/s on a OnePlus 12. The EU restriction covers only the multimodal models [S20] |
| Phi-4-mini-instruct | 3.8B | MIT [S21] | Not checked | 3,438 MB [S26] | Feb 2025. The card counts health advice as a high-risk scenario [S21] |
| SmolLM3-3B | 3B | Apache-2.0 [S22] | Not checked | Not in WebLLM | 6 languages, 64K context [S22] |

- Qwen3.5 small models are newer than Qwen3. We found no Qwen3.6 model under 27B (via search).
- No vendor publishes llama.cpp tokens/s for these models on a laptop. Measure on the host.
- **Medical tune:** MedGemma 1.5 4B (13 Jan 2026) is based on Gemma 3 and falls under the Health AI Developer Foundations terms. Its card says outputs "are not intended to directly inform clinical diagnosis, patient management decisions, treatment recommendations" [S27]. We don't need it: our LLM never decides.

### 3.2 Runtimes

| Runtime | Runs on | API | Constrained output | Licence |
|---|---|---|---|---|
| llama.cpp `llama-server` | Host | OpenAI-compatible chat, completions and embeddings [S24] | `json_schema` and `grammar` request fields; "Schema-constrained JSON response format" [S24] | MIT |
| Ollama | Host | Native and OpenAI-compatible `/v1/chat/completions`, plus `/v1/audio/transcriptions` "with models that accept audio input" [S25] | `format` takes a JSON schema [S25] | MIT |
| WebLLM 0.2.88 | Browser, WebGPU | "fully compatible with OpenAI API", ServiceWorker support for offline use [S26] | `response_format` with `json_object` plus `schema`, or an EBNF `grammar`, through `@mlc-ai/web-xgrammar` [S26] | Apache-2.0 [S26] |
| Transformers.js 4.3.2 | Browser, WebGPU or WASM | Pipelines [S14] | Not checked | Apache-2.0 [S28] |

`llama-server` listens on 127.0.0.1 by default, so it needs `--host` to be reachable over the LAN. It reflects any `Origin` back for CORS unless `--cors-origins` is set [S24].

## 4. Architecture for a one-person spike

| Option | Offline | Works on | Adds | Fit with the PWA |
|---|---|---|---|---|
| **A. Browser-native:** on-device Web Speech + `speechSynthesis` | Yes, after one language pack download | Desktop Chrome/Edge 139+, Firefox 160+ | Nothing | Two adapters behind ports. Not usable on tablets |
| B. In-browser models: Transformers.js Moonshine or Whisper, optional WebLLM | Yes, after the first model download is cached | Any browser with WASM; WebGPU for speed | 1–2 npm packages, a 40–90 MB STT model, 1.6–2.2 GB of VRAM for an LLM [S14][S26] | Web Worker and model caching. Heavy for a tablet |
| C. Ship-local host: `whisper-server` + `llama-server` + Piper | Yes | Any browser on the cabin LAN | 3 processes, models, LAN address, CORS | Chosen: works on any tablet and allows larger models |

**As built for option C (issue #37):** ports `SpeechInput`, `SpeechOutput` and `VoiceInterpreter` in `domain/ports.ts`; adapters `WhisperSpeechInput` (records with `MediaRecorder`, POSTs to `whisper-server`, which accepts webm/opus when started with `--convert`, tested 2026-11-14), `PiperSpeechOutput` (POSTs `{"text": ...}` to `/synthesize` [S15]) and `LlamaVoiceInterpreter` (JSON schema output [S24]); `HealthBriefing` and `VoiceSession` in `application`. With the host down, the check-in works by touch as today.
- Measured with `voice-host/` (2026-11-14, Podman VM with 4 CPUs on an M4 Pro, CPU only): `whisper-server` base.en transcribes a 5 s webm clip in ~1 s; Qwen3.5-2B decodes ~55 tokens/s, so one JSON answer takes 0.4–1.2 s. llama.cpp turns thinking on for this model unless started with `--reasoning off`: without it, one answer ran past 2,000 tokens. With `-hf` it also loads the image encoder unless `--no-mmproj` is set, which pushed a 3.7 GB VM out of memory.
- Faithfulness of the spoken briefing (same facts, temperature 0): Qwen3.5-2B called a CO₂ caution "safe", said "you are clear to go", dropped readings and copied facts from a prompt example. Qwen3.5-4B (Q4_K_M, 2.7 GB, ~45 tokens/s in an 8-CPU VM) reported all nine readings with the right numbers and added nothing, once the prompt had no example and said "when there is only one fact, say only that one". Asked only to phrase what needs attention, the 4B model turned "No data: Respiratory" into "no abnormalities in your respiratory function" and offered a "mission log" the app doesn't have. So the app words the whole briefing from the rules and the routine, and the model only maps speech to commands: Qwen3.5-2B got 8 of 8 with the final prompt (7 of 9 before body-word examples were added), Qwen3.5-4B 9 of 9, 1.0–1.2 s each; 4B is kept as the more robust of the two. With a JSON schema, llama.cpp rewrites a number outside an integer field's `minimum`/`maximum` into a different number inside it ("Oxygen 45 percent" → 95, "Heart rate 15" → 150; measured 2026-11-14), so the app's schema has no limits and the app checks them after parsing. With `-np 1`, the 4B server used 3.6 GB in a Podman VM with 8 GB and 8 CPUs (`podman stats`, 2026-11-14); a 3.7 GB VM had no room for it next to Whisper and Piper.
- Host: `llama-server` listens on 127.0.0.1 unless `--host` is set [S24]; the official image sets `LLAMA_ARG_HOST=0.0.0.0` (checked with `podman image inspect`, 2026-11-14). CORS doesn't matter while the Vite dev server proxies `/voice/*`. None of this goes on the Spring backend (ground station).
- Later, without editing the use case: a corpus answerer adapter that calls `llama-server` with the top few `research/*.md` sections (keyword match), a fixed system prompt and a JSON schema `{inCorpus, answer, sources}`. The app shows its own refusal text ("Not in our sources. Ask the CMO.") when `inCorpus` is false or `sources` is empty.

## Open leads

- Safari and iPadOS `webkitSpeechRecognition`: whether audio leaves the device. MDN data shows no `processLocally` [S3].
- Edge: on-device behaviour beyond the MDN data that mirrors Chrome.
- Real-time factor of whisper.cpp and Moonshine on a Raspberry Pi 5 or Jetson: no vendor numbers found. whisper.cpp links a benchmark issue we did not read [S9].
- Whether llama.cpp or Ollama accept Gemma 4 audio for transcription. Ollama documents the endpoint, but we did not check its model list [S25].
- `SpeechRecognition.phrases` (contextual biasing toward symptom words): browser support not checked [S1].

## Sources

- [S1] MDN, SpeechRecognition: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition (verified 2026-11-14)
- [S2] W3C Audio CG, Web Speech API, Draft Community Group Report 27 Oct 2026: https://webaudio.github.io/web-speech-api/ (verified 2026-11-14)
- [S3] MDN browser-compat-data, api/SpeechRecognition.json: https://github.com/mdn/browser-compat-data/blob/main/api/SpeechRecognition.json (verified 2026-11-14)
- [S4] MDN, SpeechRecognition.install(): https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/install_static (verified 2026-11-14)
- [S5] blink-dev, Intent to Ship: On-device Web Speech API: https://groups.google.com/a/chromium.org/g/blink-dev/c/VNOok2dbmHM (verified 2026-11-14)
- [S6] blink-dev, Intent to Ship: Web Speech API On-Device Recognition Quality: https://groups.google.com/a/chromium.org/g/blink-dev/c/P8P-x7AnC6I (verified 2026-11-14)
- [S7] MDN, Firefox 160 release notes for developers: https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/160 (verified 2026-11-14)
- [S8] MDN, SpeechSynthesisVoice.localService: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService (verified 2026-11-14)
- [S9] whisper.cpp README: https://github.com/ggml-org/whisper.cpp (verified 2026-11-14)
- [S10] faster-whisper README (benchmarks): https://github.com/SYSTRAN/faster-whisper (verified 2026-11-14)
- [S11] Moonshine README: https://github.com/moonshine-ai/moonshine (verified 2026-11-14)
- [S12] Moonshine Streaming Small model card: https://huggingface.co/moonshine-ai/moonshine-streaming-small (verified 2026-11-14)
- [S13] Vosk models: https://alphacephei.com/vosk/models (verified 2026-11-14)
- [S14] Transformers.js WebGPU guide: https://huggingface.co/docs/transformers.js/en/guides/webgpu ; ONNX file sizes: https://huggingface.co/onnx-community/whisper-tiny.en/tree/main/onnx , https://huggingface.co/onnx-community/whisper-base.en/tree/main/onnx , https://huggingface.co/onnx-community/moonshine-base-ONNX/tree/main/onnx (verified 2026-11-14)
- [S15] Piper (piper1-gpl) README, HTTP API and voice docs: https://github.com/OHF-Voice/piper1-gpl , https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/API_HTTP.md , https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/VOICES.md (verified 2026-11-14)
- [S16] Kokoro-82M model card: https://huggingface.co/hexgrad/Kokoro-82M ; kokoro.js: https://github.com/hexgrad/kokoro/tree/main/kokoro.js ; ONNX sizes: https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/tree/main/onnx (verified 2026-11-14)
- [S17] Qwen3.5-2B model card (0.8B/2B benchmarks): https://huggingface.co/Qwen/Qwen3.5-2B (verified 2026-11-14)
- [S18] Gemma 4 model card: https://ai.google.dev/gemma/docs/core/model_card_4 ; https://huggingface.co/google/gemma-4-E2B-it (verified 2026-11-14)
- [S19] Google LiteRT-LM, Gemma 4 benchmarks: https://developers.google.com/edge/litert-lm/models/gemma-4 (verified 2026-11-14)
- [S20] Llama 3.2 1B Instruct model card: https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct (verified 2026-11-14)
- [S21] Phi-4-mini-instruct model card: https://huggingface.co/microsoft/Phi-4-mini-instruct (verified 2026-11-14)
- [S22] SmolLM3-3B model card: https://huggingface.co/HuggingFaceTB/SmolLM3-3B (verified 2026-11-14)
- [S23] GGUF file listings: https://huggingface.co/unsloth/Qwen3.5-2B-GGUF , https://huggingface.co/unsloth/Qwen3.5-4B-GGUF , https://huggingface.co/ggml-org/gemma-4-E2B-it-GGUF (verified 2026-11-14)
- [S24] llama.cpp server README: https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md (verified 2026-11-14)
- [S25] Ollama structured outputs: https://docs.ollama.com/capabilities/structured-outputs ; OpenAI compatibility: https://docs.ollama.com/api/openai-compatibility (verified 2026-11-14)
- [S26] WebLLM README, model config and chat API: https://github.com/mlc-ai/web-llm , https://github.com/mlc-ai/web-llm/blob/main/src/config.ts , https://github.com/mlc-ai/web-llm/blob/main/src/openai_api_protocols/chat_completion.ts (verified 2026-11-14)
- [S27] MedGemma model card: https://developers.google.com/health-ai-developer-foundations/medgemma/model-card (verified 2026-11-14)
- [S28] npm registry: https://www.npmjs.com/package/@huggingface/transformers (4.3.2), https://www.npmjs.com/package/kokoro-js (1.2.1), https://www.npmjs.com/package/@moonshine-ai/moonshine-js (0.1.29) (verified 2026-11-14)
- [S29] Piper voice model card, hfc_female (medium): https://huggingface.co/rhasspy/piper-voices/raw/main/en/en_US/hfc_female/medium/MODEL_CARD (verified 2026-11-14)
