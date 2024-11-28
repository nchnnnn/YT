const express = require("express");
const ffmpegPath = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const app = express();
const ytdl = require("@distube/ytdl-core")
const { StreamInput, StreamOutput } = require("fluent-ffmpeg-multistream");

const MultiStream = require("multistream");
ffmpeg.setFfmpegPath(ffmpegPath);
const videoUrl = "https://www.youtube.com/watch?v=mBg8ToHfvco&t=319s";
app.get("/merge", (req, res) => {
  const videoStream = ytdl(videoUrl, { quality: "lowestvideo" });
  const audioStream = ytdl(videoUrl, { quality: "lowestaudio" }); 
  const combinedStream = new MultiStream([videoStream, audioStream]);
  
  // Use fluent-ffmpeg to merge audio and video
  ffmpeg()
  .input(StreamInput(videoStream))
  .input(StreamInput(audioStream))
    .audioCodec("aac")
    .videoCodec("libx264")
    .format("mp4")
    .save("output.mp4")
    .outputOptions("-movflags frag_keyframe+empty_moov")
    .on("progress", (progress) => {
      console.log(
        `Processing: ${progress.percent ? progress.percent : "unknown"}% done`
      );
      // If progress.percent is undefined, you may want to inspect other properties.
      console.log("Progress details:", progress);
    }) // for proper streaming format
    .on("error", (err) => {
      console.error("Error occurred: " + err.message);
      res.status(500).send("Error processing video and audio.");
    })
    .on("end", () => {
      res.setHeader("Content-Disposition", `attachment; filename="output.mp4"`);
    })
    .run();
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
