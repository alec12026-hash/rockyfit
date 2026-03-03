# Exercise Demo Rollout (Free + Professional)

## Target asset spec
- Format: MP4 (H.264)
- Resolution: 720x960 (4:5)
- FPS: 24
- Length: 3-8s seamless loop
- Audio: none
- Poster: JPG extracted at 0.75s
- Naming: `<exercise_id>.mp4` and `<exercise_id>.jpg`
- Location: `public/exercise-demos/`

## Source workflow
1. Put raw clips in `scripts/raw-demos/`
2. Normalize each clip:
   `scripts/normalize-exercise-demo.sh <exercise_id> <raw_file>`
3. Verify local playback in exercise sheet
4. Deploy

## Exercise IDs needed
- bench_press
- deadlift
- squat
- hack_squat
- meadows_row
- larson_press
- incline_smith
- egyptian_raise
- skull_crusher
- jm_press
- dips
- pullup_neutral
- straight_arm
- rear_delt_fly
- bayesian_curl
- waiter_curl
- bulgarian
- sldl
- seated_ham
- donkey_calf
