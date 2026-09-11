# NVIDIA Local AI — AI Desktop Builder

AI Desktop Builder is designed to use a local OpenAI-compatible inference server so application generation can run on the user's own machine and NVIDIA GPU.

## Recommended architecture

`AI Desktop Builder (Electron) → http://127.0.0.1:8000/v1 → vLLM / TensorRT-LLM → NVIDIA GPU`

The desktop app stores its endpoint/model settings locally and never requires an API key for a local server.

## vLLM example

NVIDIA documents vLLM with an OpenAI-compatible `/v1/chat/completions` endpoint. A typical local server is exposed on port 8000.

Example model server:

```bash
docker run --gpus all -p 8000:8000 vllm/vllm-openai:latest \
  --model Qwen/Qwen3-0.6B
```

For production code generation, choose a coding-capable model that fits the user's GPU memory. The model name in AI Desktop Builder can be changed from the Settings panel.

## TensorRT-LLM / Triton

The application can also target an OpenAI-compatible Triton frontend. Change the endpoint to the compatible `/v1/chat/completions` address and set the model name exposed by the server.

## Security

- Keep local inference bound to `127.0.0.1` unless a protected network endpoint is explicitly required.
- Never commit API keys to GitHub.
- API keys entered into the desktop app are stored in the application's local user-data settings file.

## What the builder does

1. User describes an application in Turkish or natural language.
2. Local AI returns a structured JSON project with multiple files.
3. The builder saves the files and selects an HTML preview file.
4. Electron renders the application in a sandboxed preview.
5. The project can be saved and reopened locally.
6. GitHub Actions can package the desktop builder as a Windows installer.

## Next implementation stages

- Real project file tree/editor
- Automated HTML/JS validation
- Runtime console/error capture from preview
- AI-driven error repair loop
- One-click test → repair → retest loop
- Build generated applications into Windows `.exe` / `Setup.exe`
- Optional local model installer/manager for NVIDIA machines
