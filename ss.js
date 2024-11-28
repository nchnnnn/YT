const ffmpeg = require('fluent-ffmpeg');
const http = require('http');
const stream = require('stream');
const ytdl = require('@distube/ytdl-core');

const videoUrl = 'https://rr6---sn-bavcx-hoaed.googlevideo.com/videoplayback?expire=1726517129&ei=KTvoZoraLq2ZvcAPw-bykQs&ip=110.54.166.245&id=o-AFeWFfEWEEYGMfDlHmVn_a1z12pQmDbcDArITpI0jIQU&itag=137&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&mh=CH&mm=31%2C26&mn=sn-bavcx-hoaed%2Csn-npoe7ner&ms=au%2Conr&mv=m&mvi=6&pcm2cms=yes&pl=24&initcwndbps=312500&spc=54MbxW8Qniec3Coai-byXnxtmIGyQ955k9jN7uULdc7SRin7x5Q0oLXSZQ&vprv=1&svpuc=1&mime=video%2Fmp4&rqh=1&gir=yes&clen=49390687&dur=228.458&lmt=1725118066650653&mt=1726495078&fvip=4&keepalive=yes&c=ANDROID&txp=5535434&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Crqh%2Cgir%2Cclen%2Cdur%2Clmt&sig=AJfQdSswRAIgI_AEdSM_UeEWKo97pBeVdcMd_pzjHSs2g3-dfUBpDSYCIGHuckn6OgLUNo4Z-g-FOsZNnrV9dJaenPM08jzS7_kv&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpcm2cms%2Cpl%2Cinitcwndbps&lsig=ABPmVW0wRgIhAPVp620sxaxABOgzrzMUFKzvT5vdsAd41o0T2mvhpWYaAiEA5nOPb6AytizSNi1ZE0OJjNHij3LbgQX2Ub1nvUxuD9Q%3D'; // Replace with your video URL
const audioUrl = 'https://rr6---sn-bavcx-hoaed.googlevideo.com/videoplayback?expire=1726517099&ei=CzvoZpL_KtGws8IPrY61gAo&ip=110.54.166.245&id=o-AGUP4fyEwNiU5iPltPm8moUmK5kjGU6vnAd897rx2PYy&itag=251&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&mh=CH&mm=31%2C26&mn=sn-bavcx-hoaed%2Csn-npoeene6&ms=au%2Conr&mv=m&mvi=6&pl=24&initcwndbps=312500&spc=54MbxfZHW6armwhC9hPlccjC3eZ0SBuyaDSBgI96GVoBS_-h8LphhkwP5w&vprv=1&svpuc=1&mime=audio%2Fwebm&rqh=1&gir=yes&clen=3664623&dur=228.481&lmt=1725111627201308&mt=1726495078&fvip=1&keepalive=yes&c=ANDROID&txp=5532434&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Crqh%2Cgir%2Cclen%2Cdur%2Clmt&sig=AJfQdSswRQIhAIlmexYrp3pWxJCBAJ8a0lSbQ2QTxs3xoNQsSA0uHb-6AiBkhLEjvVMSCYdjwocGiMhIn9ribWlwZfw1D1dCQpRouw%3D%3D&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Cinitcwndbps&lsig=ABPmVW0wRgIhAJKJPKQ2MSR2mVifl7felpwvYwMCvPTne4HFVXIcXDkMAiEA8d5VotapUg4hi3XVgbsOEyR6ugL9mtoCN_WaP7HRqoI%3D'; // Replace with your audio URL

http.createServer((req, res) => {
  const videoTitle = 'merged_video';

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="${videoTitle}.mp4"`);

  const videoStream = ytdl(videoUrl, { quality: 'highestvideo' });
  const audioStream = ytdl(audioUrl, { quality: 'highestaudio' });

  const videoPassThrough = new stream.PassThrough();
  const audioPassThrough = new stream.PassThrough();

  videoStream.pipe(videoPassThrough);
  audioStream.pipe(audioPassThrough);

  ffmpeg()
    .input(videoPassThrough)
    .input(audioPassThrough)
    .videoCodec('copy')
    .audioCodec('aac')
    .format('mp4')
    .on('error', (err) => {
      console.error('Error processing file:', err);
      if (!res.headersSent) {
        res.status(500).send('Error processing file');
      }
    })
    .on('end', () => {
      console.log('Merging finished!');
    })
    .pipe(res, { end: true });
}).listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
