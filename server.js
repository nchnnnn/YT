const express = require("express");
const app = express();
const ffmpeg = require("fluent-ffmpeg");
const port = 3000;
const ytdl = require("@distube/ytdl-core");
const rangeParser = require("range-parser");
const path = require('path')
const mime = require('mime-types')
const cp = require("child_process");
const fs = require("fs");
const tmp = require("tmp");
const ffmpegPath = require("ffmpeg-static");
const readline = require("readline");


ffmpeg.setFfmpegPath(ffmpegPath);

app.use(express.json());
app.use(express.static("public"));

app.post("/request", (req, res) => {
  const { url } = req.body;

  if (!url) {
    console.log("FAILED");
  }
  ytdl
    .getInfo(url)
    .then((info) => {
      res.send({ info });
    })
    .catch((error) => {
      console.error("Error fetching video information:", error.message);
      res.status(500).send("Error fetching video information");
    });
});

app.get("/download-file/:itag", async (req, res) => {
  let currentProgress = 0;
  const { itag } = req.params;
  const { url } = req.query;
  const info = await ytdl.getInfo(url);
  const videoTitle = info.videoDetails.title
    .replace(/[<>:"/\\|?!*]/g, "")
    .replace(/  +/g, " ");
  
  
  const audioORvideo = ytdl.chooseFormat(info.formats, { quality: itag });

  let fileSize = audioORvideo.contentLength;
  var result = fileSizeConvert(fileSize);

  if (!audioORvideo.hasVideo && audioORvideo.hasAudio) {
    onlyAudio();
  } else {
    onlyVideo();
  }
 
  function onlyAudio() {
    const audioStream = ytdl(url, { format: audioORvideo });
    const output = `${videoTitle}${audioORvideo.container}`;
    console.log("File Size: ", result.fileSize, result.typeSize);

    const writeStream = fs.createWriteStream(output, {
      highWaterMark: 1 * 1024 * 1024,
    });

    audioStream.once("response", () => {
      starttime = Date.now();
    });

    audioStream.pipe(writeStream);
    audioStream.on("progress", (chunkLength, downloaded, total) => {
      currentProgress = (downloaded / total) * 100;
      const percent = downloaded / total;
      const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
      const estimatedDownloadTime =
        downloadedMinutes / percent - downloadedMinutes;
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`${(percent * 100).toFixed(2)}% Downloaded `);
      process.stdout.write(
        `(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(
          total /
          1024 /
          1024
        ).toFixed(2)}MB)\n`
      );
      process.stdout.write(
        `Running for: ${downloadedMinutes.toFixed(2)} Minutes`
      );
      process.stdout.write(
        ` Estimated time left: ${estimatedDownloadTime.toFixed(2)}minutes `
      );
      readline.moveCursor(process.stdout, 0, -1);
    });

    audioStream.on("end", () => {
      const mimeType = "audio/mpeg";
      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${videoTitle}.mp3"`
      );

      ffmpeg()
        .input(output)
        .format("mp3")
        .save("output")
        .on("progress", (p) => {
          let byte = p.targetSize * 1024;
          result = fileSizeConvert(byte);
          console.log(`${result.fileSize}${result.typeSize} Downloaded`);
          
        })
        .on("end", () => {
          const downloadPrompt = fs.createReadStream("output");

          fs.unlinkSync(output);
          downloadPrompt.pipe(res);
          downloadPrompt.on("end", () => {
            fs.unlinkSync("output");
            console.log("\n\nFile Download completed.");
          });

          downloadPrompt.on("error", (err) => {
            console.error("Error during file read:", err);
            if (!res.headersSent) {
              res.status(500).send("Error processing file.");
            }
          });

          console.log("FFmpeg finished processing the file.");
        });
    });

    // res.setHeader(
    //   "Content-Disposition",
    //   `attachment; filename="${videoTitle}.mp3"`
    // );

    // const downloadPrompt = fs.createReadStream(output);

    // downloadPrompt.on("end", () => {
    //   fs.unlinkSync(output);
    //   console.log("\nFile Download completed.");
    // });

    // downloadPrompt.on("error", (err) => {
    //   console.error("Error during file read:", err);
    //   if (!res.headersSent) {
    //     res.status(500).send("Error processing file.");
    //   }
    //   fs.unlinkSync(output);
    // });

    // downloadPrompt.pipe(res);

    //
    // const tmpFile =  `${videoTitle}.mp3`;
    // const mimeType = mime.lookup(tmpFile) ;
    // console.log(audioORvideo.container)
    // console.log("MIME TYPE: ", mimeType)
    // const writeStream = fs.createWriteStream(tmpFile, {highWaterMark: 2 * 1024 * 1024});

    // try{
    //   await new Promise((resolve, reject) => {
    //     ffmpeg(audioStream)
    //       .format("mp3")
    //       .save(output)
    //       .on("progress", (p) => {
    //         readline.cursorTo(process.stdout, 0);
    //         process.stdout.write(`${p.targetSize}KB Downloaded`);
    //       })
    //       .on("end", () => {
    //         console.log("Streaming conversion completed.");
    //         resolve();
    //       })
    //       .on("error", (err) => {
    //         console.error("Error during conversion:", err);
    //         reject(err);
    //       });

    //       res.setHeader(
    //         "Content-Disposition",
    //         `attachment; filename="${videoTitle}.mp3"`
    //       );
    //       const readStream = fs.createReadStream(tmpFile);
    //       console.log(readStream);
    //       readStream.on("end", () => {
    //         fs.unlinkSync(tmpFile);
    //         console.log("\nFile Download completed.");
    //       });

    //       readStream.on("error", (err) => {
    //         console.error("Error during file read:", err);
    //         if (!res.headersSent) {
    //           res.status(500).send("Error processing file.");
    //         }
    //         fs.unlinkSync(tmpFile);
    //       });

    //   });
    //   readStream.pipe(res);
    // } catch (error) {
    //   if (!res.headersSent) {
    //     res.status(500).send("Error processing audio stream.");
    //   }
    // }
  }


  function onlyVideo() {
    var audioFormats = ytdl.chooseFormat(info.formats, {
      quality: "highestaudio",
    });
    const downloadVideo = ytdl(url, { format: audioORvideo });
    const downloadAudio = ytdl(url, { format: audioFormats });
    console.log("File Size: ", result.fileSize, result.typeSize);

    const outputVideo = `${videoTitle}.mp4`;
    const outputAudio = `${videoTitle}.mp3`;


    const audioWriteStream = fs.createWriteStream(outputAudio, {
      highWaterMark: 2 * 1024 * 1024,
    });

    const videoWriteStream = fs.createWriteStream(outputVideo, {
      highWaterMark: 2 * 1024 * 1024,
    });

    downloadVideo.pipe(videoWriteStream);
    downloadAudio.pipe(audioWriteStream);
    
  }
});





 function fileSizeConvert(fileSize) {
   let typeSize = null;

   if (fileSize >= 1099511627776) {
     typeSize = " TB";
     fileSize = (fileSize / 1099511627776).toFixed(2); // convert to TB
   } else if (fileSize >= 1073741824) {
     typeSize = " GB";
     fileSize = (fileSize / 1073741824).toFixed(2); // convert to GB
   } else if (fileSize >= 1048576) {
     typeSize = " MB";
     fileSize = (fileSize / 1048576).toFixed(2); // convert to MB
   } else if (fileSize >= 1024) {
     typeSize = " KB";
     fileSize = (fileSize / 1024).toFixed(2); // convert to KB
   } else {
     typeSize = " bytes";
     fileSize = fileSize; // remains in bytes
   }

   return { fileSize, typeSize };
 }

    


 
    
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
