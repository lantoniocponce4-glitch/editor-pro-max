#!/usr/bin/env npx tsx
/**
 * Transcribe audio using Whisper.cpp with word-level timestamps.
 * Usage: npx tsx scripts/transcribe.ts [audio-path]
 * Default audio: public/assets/audio.wav
 * Output: public/captions.json
 *
 * Idioma y modelo (opcionales, por variable de entorno):
 *   WHISPER_LANG=es (por defecto) | en | pt | fr | ... | auto
 *   WHISPER_MODEL=medium (por defecto, multilingüe) | small | base | large-v3-turbo | ...
 * Ejemplo: WHISPER_LANG=en npx tsx scripts/transcribe.ts
 */
import path from "path";
import {writeFileSync, existsSync} from "fs";

type WhisperModel = "tiny" | "tiny.en" | "base" | "base.en" | "small" | "small.en" | "medium" | "medium.en" | "large-v1" | "large-v2" | "large-v3" | "large-v3-turbo";
const model = (process.env.WHISPER_MODEL || "medium") as WhisperModel;
const language = process.env.WHISPER_LANG || "es";

const inputPath = process.argv[2] || path.join("public", "assets", "audio.wav");
const whisperPath = path.join(process.cwd(), "whisper.cpp");
const outputPath = path.join("public", "captions.json");

if (!existsSync(inputPath)) {
  console.error(`Audio file not found: ${inputPath}`);
  console.error("Run extract-audio.ts first.");
  process.exit(1);
}

async function main() {
  const {
    installWhisperCpp,
    downloadWhisperModel,
    transcribe,
    toCaptions,
  } = await import("@remotion/install-whisper-cpp");

  // Step 1: Install Whisper.cpp
  console.log("Installing Whisper.cpp (first time only)...");
  const {alreadyExisted} = await installWhisperCpp({
    to: whisperPath,
    version: "1.5.5",
  });
  console.log(alreadyExisted ? "Whisper.cpp already installed" : "Whisper.cpp installed");

  // Step 2: Download model
  console.log(`Downloading model (${model})...`);
  await downloadWhisperModel({
    model,
    folder: whisperPath,
  });
  console.log("Model ready");

  // Step 3: Transcribe
  console.log(`Transcribing: ${inputPath} (language: ${language})`);
  const whisperOutput = await transcribe({
    model,
    whisperPath,
    whisperCppVersion: "1.5.5",
    inputPath,
    tokenLevelTimestamps: true,
    language: language as any,
  });

  // Step 4: Convert to captions
  const {captions} = toCaptions({whisperCppOutput: whisperOutput});

  writeFileSync(outputPath, JSON.stringify(captions, null, 2));
  console.log(`\nCaptions saved to ${outputPath}`);
  console.log(`  ${captions.length} caption segments`);
  if (captions.length > 0) {
    console.log(`  First: "${captions[0].text.trim()}" (${captions[0].startMs}ms)`);
    const last = captions[captions.length - 1];
    console.log(`  Last: "${last.text.trim()}" (${last.endMs}ms)`);
  }
}

main().catch((err) => {
  console.error("Transcription failed:", err.message);
  process.exit(1);
});
