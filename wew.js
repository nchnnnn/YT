const express = require('express');
const app = express();
const ytdl = require('@distube/ytdl-core');
const cp = require('child_process');

const ffmpegPath = require('ffmpeg-static');
const readline = require('readline');

 
    const url = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";

    const tracker = {
      start: Date.now(),
      audio: { downloaded: 0, total: Infinity },
      video: { downloaded: 0, total: Infinity },
      merged: { frame: 0, speed: "0x", fps: 0 },
    };


    const audio = ytdl(url, { quality: "highestaudio" }).on(
      "progress",
      (_, downloaded, total) => {
        tracker.audio = { downloaded, total };
      }
    );

    const video = ytdl(url, { quality: "highestvideo" }).on(
      "progress",
      (_, downloaded, total) => {
        tracker.video = { downloaded, total };
      }
    );

    
   let progressbarHandle = null;
   const progressbarInterval = 1000;
   const showProgress = () => {
     readline.cursorTo(process.stdout, 0);
     const toMB = (i) => (i / 1024 / 1024).toFixed(2);

     process.stdout.write(
       `Audio  | ${(
         (tracker.audio.downloaded / tracker.audio.total) *
         100
       ).toFixed(2)}% processed `
     );
     process.stdout.write(
       `(${toMB(tracker.audio.downloaded)}MB of ${toMB(
         tracker.audio.total
       )}MB).${" ".repeat(10)}\n`
     );

     process.stdout.write(
       `Video  | ${(
         (tracker.video.downloaded / tracker.video.total) *
         100
       ).toFixed(2)}% processed `
     );
     process.stdout.write(
       `(${toMB(tracker.video.downloaded)}MB of ${toMB(
         tracker.video.total
       )}MB).${" ".repeat(10)}\n`
     );

     process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
     process.stdout.write(
       `(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${" ".repeat(
         10
       )}\n`
     );

     process.stdout.write(
       `running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(
         2
       )} Minutes.`
     );
     readline.moveCursor(process.stdout, 0, -3);
   };

   // Start the ffmpeg child process
   const ffmpegProcess = cp.spawn(
     ffmpegPath,
     [
       // Remove ffmpeg's console spamming
       "-loglevel",
       "8",
       "-hide_banner",
       // Redirect/Enable progress messages
       "-progress",
       "pipe:3",
       // Set inputs
       "-i",
       "pipe:4",
       "-i",
       "pipe:5",
       // Map audio & video from streams
       "-map",
       "0:a",
       "-map",
       "1:v",
       // Keep encoding
       "-c:v",
       "copy",
       // Define output file
       "out.mkv",
     ],
     {
       windowsHide: true,
       stdio: [
         /* Standard: stdin, stdout, stderr */
         "inherit",
         "inherit",
         "inherit",
         /* Custom: pipe:3, pipe:4, pipe:5 */
         "pipe",
         "pipe",
         "pipe",
       ],
     }
   );
   ffmpegProcess.on("close", () => {
     console.log("done");
     // Cleanup
     process.stdout.write("\n\n\n\n");
     clearInterval(progressbarHandle);
   });

   // Link streams
   // FFmpeg creates the transformer streams and we just have to insert / read data
   ffmpegProcess.stdio[3].on("data", (chunk) => {
     // Start the progress bar
     if (!progressbarHandle)
       progressbarHandle = setInterval(showProgress, progressbarInterval);
     // Parse the param=value list returned by ffmpeg
     const lines = chunk.toString().trim().split("\n");
     const args = {};
     for (const l of lines) {
       const [key, value] = l.split("=");
       args[key.trim()] = value.trim();
     }
     tracker.merged = args;
   });
   audio.pipe(ffmpegProcess.stdio[4]);
   video.pipe(ffmpegProcess.stdio[5]);