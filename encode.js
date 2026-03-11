import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';

console.log(`Using ffmpeg at: ${ffmpegStatic}`);
ffmpeg.setFfmpegPath(ffmpegStatic);

console.log('Starting encoding... This might take a minute...');

ffmpeg('public/assets/vedio.mp4')
  .outputOptions([
    '-g 1',               // Keyframe every single frame (crucial for scrubbing backwards)
    '-keyint_min 1',
    '-c:v libx264',       // H.264 codec
    '-preset veryfast',   // Quick encoding
    '-crf 28',            // Good quality, slightly smaller size to offset the keyframes
    '-an'                 // Remove audio tracks
  ])
  .on('progress', (progress) => {
    console.log('Processing: ' + progress.percent + '% done');
  })
  .on('end', () => {
    console.log('Finished encoding! Saved to public/assets/vedio_scrub.mp4');
  })
  .on('error', (err) => {
    console.error('Error:', err);
  })
  .save('public/assets/vedio_scrub.mp4');
