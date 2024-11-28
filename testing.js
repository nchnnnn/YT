const readline = require("readline");
const ytdl = require("@distube/ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require('fs')
ffmpeg.setFfmpegPath(ffmpegPath);
let id = "7wNb0pHyGuI";

let stream = ytdl(id, {
  quality: "highestaudio",
});

let fileRead = 'text.txt';

let start = Date.now();
var passOutput = fs.createReadStream(`${__dirname}/${id}.mp3`, {
  highWaterMark: 3 * 1024 * 1024,
  
});

passOutput.on('data', (chunk) =>{
  console.log("Chunk: ", chunk.toString())

})

ffmpeg()
  .input(stream)
  .audioCodec('aac')
  .on("progress", (p) => {
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${p.targetSize}kb downloaded`);
  })
  .on("end", () => {
    console.log(`\nFinished Download- ${(Date.now() - start) / 1000}s`);
  });
