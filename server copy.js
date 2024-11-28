
const express = require('express')
const app = express()
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const port = 3000
const fs = require('fs')
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const options = {}

ffmpeg.setFfmpegPath(ffmpegPath);

app.use(express.json())
app.use(express.static('public'))

app.post('/request', (req, res) =>{
    const {url} = req.body
    
    if (!url) {
        console.log("FAILED")
    }
    ytdl.getInfo(url, options)
    
        .then((pogi) => { 
            res.send({pogi})
            
        })
        .catch(error => {
            console.error('Error fetching video information:', error.message);
    
            res.status(500).send('Error fetching video information');
    });

})


app.post('/download', async (req, res) =>{
    const {itag, url} = req.body
    console.log(`Itag: ${itag}, Url:${url} `)
    try {

        const pogi = await ytdl.getInfo(url);
        const videoTitle = pogi.videoDetails.title.replace(/[<>:"/\\|?!*]/g, "").replace(/  +/g, " ");
        const audioORvideo = ytdl.chooseFormat(pogi.formats, { quality: itag });

        if (!audioORvideo.hasVideo && audioORvideo.hasAudio){
            const audioStream = ytdl(url, { format: audioORvideo });
            const audioPath = path.resolve(__dirname, `audio.${audioORvideo.container}`);
            
            await new Promise((resolve, reject) => {
                const audioFile = fs.createWriteStream(audioPath);
                audioStream.pipe(audioFile);
                audioFile.on('finish', resolve);
                audioFile.on('error', reject);
            });
            const outputPath = path.resolve(__dirname, `${videoTitle}.mp3`);
            await convertToMp3(audioPath, outputPath);


        }else {
            
            
            const outputFile = path.resolve(__dirname, `${videoTitle}.mp4`);
            const videoFormat = ytdl.chooseFormat(pogi.formats, { quality: itag });
            const audioFormat = ytdl.chooseFormat(pogi.formats, { quality: 'highestaudio' });

            const videoStream = ytdl(url, { format: videoFormat });
            const audioStream = ytdl(url, { format: audioFormat });

            const videoPath = path.resolve(__dirname, `video.${videoFormat.container}`);
            const audioPath = path.resolve(__dirname, `audio.${audioFormat.container}`);

            await Promise.all([
                new Promise((resolve, reject) => {
                    const videoFile = fs.createWriteStream(videoPath);
                    videoStream.pipe(videoFile);
                    videoFile.on('finish', resolve);
                    videoFile.on('error', reject);
                }),
                new Promise((resolve, reject) => {
                    const audioFile = fs.createWriteStream(audioPath);
                    audioStream.pipe(audioFile);
                    audioFile.on('finish', resolve);
                    audioFile.on('error', reject);
                })
            ]);

            
            
            await combineStreams(videoPath, audioPath, outputFile);

            // Send the combined file as a response
            res.download(outputFile, `${videoTitle}.mp4`, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).send('Error downloading file');
                } else {
                    // Clean up temporary files
                    console.log("Downloaded.")
                    fs.unlinkSync(videoPath);
                    fs.unlinkSync(audioPath);
                }
            });
        }


        
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error processing download');
    }
}) 


async function convertToMp3(audioPath, outputPath) {
    
    return new Promise((resolve, reject) => {
        
        ffmpeg()
            .input(audioPath)
            .outputOptions('-c:a libmp3lame') // Set audio codec to MP3
            .save(outputPath)
            .on('end', resolve)
            .on('error', reject)

            
    });
    
}
async function combineStreams(videoPath, audioPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .input(audioPath)
            .outputOptions('-c:v copy')
            .outputOptions('-c:a aac')
            .save(outputPath)
            .on('end', resolve)
            .on('error', reject);
    });
}



app.listen(port, ()=> {
    console.log(`Server started on port ${port}`)
})

