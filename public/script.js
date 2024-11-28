const baseURL = "http://localhost:3000/"
var emvideo = $("#emvideo")
var tiTle = $("#title")
var audioOnly = $(".audio-content")
var videoOnly = $(".video-content")
var anchors = $("#anchors")




function get_Url(){
    const inputs = document.getElementsByName("url");
    let value = "";

    for (let input of inputs) {
        if (input.value) {
            return input.value;
            break;
        }
    }
}




function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    let queryParams = {};
    for (const [key, value] of params.entries()) {
      queryParams[key] = value;
    }
    return queryParams;
  }

window.addEventListener('DOMContentLoaded', (event) => {
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', postInfo);
    });
    
    const params = getQueryParams();
    

    if(params.url){
        checkingUrl();
    }

   
    
    function ytInfo(url){
        fetch('/request', {
            method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url: url })
        })
            .then(res => res.json())
            .then(data => {
                var all = data.info;
                console.log(all);
                tiTle.textContent = all.videoDetails.title;
                emvideo.src = `https://www.youtube.com/embed/${all.videoDetails.videoId}`;
                audioOnly.innerHTML = "";
                videoOnly.innerHTML = "";
    
            function computeFileSize(fileSizeBytes) {
                let fileSize = fileSizeBytes;
                let typeSize = null;
                if (fileSize < 1024) {
                  typeSize = " bytes";
                  fileSize = fileSize;
                } else if (fileSize < 1048576) {
                  typeSize = " KB";
                  fileSize = (fileSize / 1024).toFixed(2);
                } else if (fileSize < 1073741824) {
                  typeSize = " MB";
                  fileSize = (fileSize / 1048576).toFixed(2);
                } else {
                  typeSize = " GB";
                  fileSize = (fileSize / 1073741824).toFixed(2);
                }
                return [fileSize, typeSize];
            }
    
            // VIDEO
            var videoO = [];
            const uniqueFormats = new Set();
            const formatsWithVideo = all.formats.filter(format => {
                // Ensure the format is unique based on itag
                if (!format.hasAudio && format.hasVideo && format.contentLength){
                    if (uniqueFormats.has(format.itag)) {
                        return false;  // Skip if itag is already present
                    } else {
                        uniqueFormats.add(format.itag);
                        return true;  // Include if itag is unique
                    }
                    
                }
            });
    
            formatsWithVideo.forEach((format) => {
                videoO.push(format);
                const fileSize = computeFileSize(format.contentLength);

                const onlyVideo = `<button class="DlBtn" value="${format.itag}">${format.qualityLabel}<span>${fileSize[0]}${fileSize[1]}</span></button>`;
                videoOnly.innerHTML += onlyVideo;
            });
            console.log(videoO)
    
            // AUDIO
            var audioO = [];
            const formatsWithAudio = all.formats.filter(format => {
                if (format.hasAudio && !format.hasVideo && format.contentLength){
                    if (uniqueFormats.has(format.itag)) {
                        return false;  // Skip if itag is already present
                    } else {
                        uniqueFormats.add(format.itag);
                        return true;  // Include if itag is unique
                    }
                    
                }
            
    
            });
            
    
            formatsWithAudio.forEach((format) => {
                audioO.push(format.url);
                const fileSize = computeFileSize(format.contentLength);
                const onlyAudio = `<button class="DlBtn" value="${format.itag}">${format.audioBitrate}kbps<span>${fileSize[0]}${fileSize[1]}</span></button>`;
                audioOnly.innerHTML += onlyAudio;
            });
    
            document.querySelectorAll('.DlBtn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const itag = this.value; // Get itag from button value
            
                    const links = getQueryParams()
                    window.location.href = `/download-file/${itag}?url=${encodeURIComponent(links.url)}`;
                });
            })
           
        })
        .catch(err => alert(err));

    }
    

    function postInfo(e){
        e.preventDefault()
        const formData = new FormData(this);
        const params = new URLSearchParams(formData).toString();
        const newUrl = `${window.location.pathname}?${params}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
        checkingUrl()
    }
    
    
    function checkingUrl(){
        const link = getQueryParams()
        console.log(link.url)
        if (!link.url) {
            showErrorMessage('url-input', 'Input cannot be empty');
            windowReset();
        } else if (link.url.indexOf("youtu.be") === -1 && link.url.indexOf("youtube.com") === -1 || !link.url.includes("www.youtube.com/watch?v=")) {
            showErrorMessage('url-input', 'Invalid YouTube URL. Please try again.');
            windowReset();
        } else {
            clearErrorMessage('url-input');
            windowScroll()
            ytInfo(link.url)
        }
    }
});


 
  function $(s) {
    return document.querySelector(s);
}


