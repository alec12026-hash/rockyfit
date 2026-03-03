#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: scripts/normalize-exercise-demo.sh <exercise_id> <input_video>"
  echo "Example: scripts/normalize-exercise-demo.sh bench_press scripts/raw-demos/bench_press.mov"
  exit 1
fi

EXERCISE_ID="$1"
INPUT_VIDEO="$2"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/public/exercise-demos"

mkdir -p "$OUT_DIR"

OUT_MP4="$OUT_DIR/${EXERCISE_ID}.mp4"
OUT_JPG="$OUT_DIR/${EXERCISE_ID}.jpg"

# Professional normalized output:
# - 720x960 (4:5)
# - H.264 + yuv420p for broad device support
# - 24fps for smooth but small files
# - faststart for streaming
# - muted in app player (audio stripped here)
ffmpeg -y -i "$INPUT_VIDEO" \
  -vf "fps=24,scale=720:960:force_original_aspect_ratio=increase,crop=720:960" \
  -an -c:v libx264 -pix_fmt yuv420p -profile:v main -level 4.0 -movflags +faststart \
  "$OUT_MP4"

# Poster frame at 0.75s
ffmpeg -y -ss 00:00:00.750 -i "$OUT_MP4" -frames:v 1 "$OUT_JPG"

echo "✅ Created: $OUT_MP4"
echo "✅ Created: $OUT_JPG"
