# NVIDIA Local AI

AI Desktop Builder now supports a local OpenAI-compatible LLM endpoint. This keeps the code-generation path on the user's own machine when a local model server is available.

## Recommended architecture

`AI Desktop Builder (Electron) -> localhost /v1/chat/completions -> local LLM server -> NVIDIA GPU`

The desktop app does not hard-code an NVIDIA API key. The endpoint, model name and optional key are stored in the user's local Electron settings.

## Local server contract

The builder expects:

- `POST /v1/chat/completions`
- `GET /v1/models`
- OpenAI-compatible JSON responses with `choices[0].message.content`

The generated response must be JSON with this shape:

```json
{
  "name": "My App",
  "files": [
    {"path": "index.html", "content": "..."},
    {"path": "app.js", "content": "..."}
  ],
  "previewFile": "index.html",
  "notes": "..."
}
```

## NVIDIA GPU path

Use an NVIDIA-compatible local serving stack such as vLLM or TensorRT-LLM that exposes an OpenAI-compatible endpoint. The exact model and runtime should be selected according to the user's GPU memory and operating system.

For a true offline product, download the model once and run the server locally. The Electron application itself does not require internet access to generate, edit, preview and save projects after the local model server is installed.

## Important

Do not put API keys, model files, credentials or personal data into this repository. The app stores only the endpoint/model configuration in the local Electron user-data directory.
