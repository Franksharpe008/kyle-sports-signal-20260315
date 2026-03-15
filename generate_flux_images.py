from __future__ import annotations

import json
import os
import time
from pathlib import Path

import torch
from diffusers import Flux2KleinPipeline

MODEL_ID = "black-forest-labs/FLUX.2-klein-4B"
ROOT = Path("/Users/franksharpe/Documents/New project/output/kyle-sports-signal")
IMAGES_DIR = ROOT / "images"
MANIFEST_PATH = ROOT / "image-manifest.json"

PROMPTS = [
    {
        "slug": "sports-hero",
        "prompt": (
            "Premium futuristic sports arena at night, massive stadium bowl, electric blue and hot magenta "
            "broadcast light beams, gold accents, charged crowd atmosphere, cinematic photoreal, high detail, "
            "no text, no logos"
        ),
        "seed": 41,
    },
    {
        "slug": "sports-arena",
        "prompt": (
            "Heroic arena tunnel opening into a sold out championship game, bright orange and blue light sweep, "
            "fog, confetti haze, premium sports broadcast style, cinematic photoreal, high detail, no text, no logos"
        ),
        "seed": 57,
    },
    {
        "slug": "sports-commerce",
        "prompt": (
            "Sports business command center with athlete silhouettes, media walls, sponsorship energy, data pulses, "
            "luxury suite atmosphere, electric lime blue and gold palette, cinematic photoreal, high detail, no text, no logos"
        ),
        "seed": 73,
    },
]


def resolve_device() -> tuple[str, torch.dtype]:
    if torch.backends.mps.is_available():
        return "mps", torch.float16
    return "cpu", torch.float32


def main() -> None:
    os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    device, dtype = resolve_device()
    started_at = time.time()

    pipe = Flux2KleinPipeline.from_pretrained(
        MODEL_ID,
        torch_dtype=dtype,
        local_files_only=True,
    )
    if hasattr(pipe, "enable_attention_slicing"):
        pipe.enable_attention_slicing()
    pipe = pipe.to(device)

    manifest: list[dict[str, object]] = []
    for item in PROMPTS:
        prompt = str(item["prompt"])
        seed = int(item["seed"])
        slug = str(item["slug"])
        output_path = IMAGES_DIR / f"{slug}.png"
        generator_device = "cpu" if device == "mps" else device
        generator = torch.Generator(device=generator_device).manual_seed(seed)
        image_started = time.time()
        result = pipe(
            prompt=prompt,
            width=768,
            height=432,
            num_inference_steps=8,
            guidance_scale=3.0,
            generator=generator,
            max_sequence_length=192,
        )
        image = result.images[0]
        image.save(output_path)
        meta = {
            "slug": slug,
            "prompt": prompt,
            "seed": seed,
            "width": 768,
            "height": 432,
            "steps": 8,
            "guidance_scale": 3.0,
            "device": device,
            "dtype": str(dtype).replace("torch.", ""),
            "seconds": round(time.time() - image_started, 2),
            "output": str(output_path),
        }
        manifest.append(meta)
        output_path.with_suffix(".png.json").write_text(json.dumps(meta, indent=2))
        print(json.dumps(meta))

    summary = {
        "model": MODEL_ID,
        "device": device,
        "dtype": str(dtype).replace("torch.", ""),
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_seconds": round(time.time() - started_at, 2),
        "images": manifest,
    }
    MANIFEST_PATH.write_text(json.dumps(summary, indent=2))
    print(json.dumps({"ok": True, "manifest": str(MANIFEST_PATH)}, indent=2))


if __name__ == "__main__":
    main()
