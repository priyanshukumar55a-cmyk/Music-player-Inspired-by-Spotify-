console.log("Script loaded successfully");

let currFolder;
let currentSong = new Audio();
let currentLi = null;
let songs;
let lastVolume = 1;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return "00:00";

    let mins = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);

    if (secs < 10) secs = "0" + secs;

    return `${mins}:${secs}`;
}


async function getSongs(folder) {
    currFolder=folder;
    let res = await fetch(`http://127.0.0.1:3000/songs/${folder}/`);
    let html = await res.text();

    let div = document.createElement("div");
    div.innerHTML = html;

    let links = div.getElementsByTagName("a");
    songs = [];

    for (let a of links) {
        if (a.href.endsWith(".mp3")) {
            songs.push(a.href);
        }
    }

    let songUL = document.querySelector(".song-list ul");

    songUL.innerHTML = "";
    for (let song of songs) {
        let songName = decodeURIComponent(song)
            .replace(/^.*[\\/]/, "")
            .replace(".mp3", "");

        songUL.innerHTML += 
        `<li data-src="${song}">
            <img class="invert" src="svgs/music.svg">
            <div class="info">
                <div class="song-name">${songName}</div>
                <div>Priyanshu</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="svgs/play-foot.svg">
            </div>
        </li>`;
    }

    // ✅ ONE click handler (event delegation)
    songUL.addEventListener("click", (e) => {
        let li = e.target.closest("li");
        if (!li) return;

        if (currentLi) currentLi.classList.remove("active");
        currentLi = li;
        currentLi.classList.add("active");

        playMusic(li.dataset.src);
    });
    return songs;
}

function playMusic(src,pause=false) {
    currentSong.src =src;
    if(!pause){
        currentSong.play();
        play.src = "svgs/pause-foot.svg";
    }

    document.querySelector(".songinfo").innerHTML=decodeURIComponent(src)
        .replace(/^.*[\\/]/, "")
        .replace(".mp3", "");
    document.querySelector(".playbar").classList.remove("hidden");
    document.querySelector(".songtime").innerHTML="00:00 / 00:00";
}

async function displayAlbums(){
    let a=await fetch(`http://127.0.0.1:3000/songs/`)
    let response=await a.text();
    let div=document.createElement("div")
    div.innerHTML=response;
    let anchors=div.getElementsByTagName("a")

    const card_container = document.querySelector(".card_container");
    let array=Array.from(anchors)
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        
        if(e.href.includes("songs")){
            let folder=e.href.split("C").slice(-1)

            //Get the meta data of the folder
            let a=await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`)
            let response=await a.json();
            card_container.innerHTML=card_container.innerHTML+`<div data-folder="${folder}" class="card">
                    <img class="play-icon" src="svgs/play.svg" alt="Play-Button">
                    <img src="/songs/${folder}/cover.jpg" alt="Error">
                    <h3 style="font-size:16px">${response.title}</h3>
                    <p style="font-size: small;">${response.description}</p>
                </div>`
        }
    }
    //load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click",async item=>{
            songs=await getSongs(`${item.currentTarget.dataset.folder}`)
            playMusic(songs[0])
        })
    });
}

async function main() {
    await getSongs("cs");
    
    playMusic(songs[0],true);

    //Display all the albums on the page
    displayAlbums() 

    // ✅ Play / Pause button (only once)
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "svgs/pause-foot.svg";
        } else {
            currentSong.pause();
            play.src = "svgs/play-foot.svg";
        }
    });

    currentSong.addEventListener("ended", () => {
        play.src = "svgs/play-foot.svg";
    });

    const progress = document.querySelector(".progress");
    let isDragging = false;

    //Listen to timeupdate event to update the seekbar and time display
    currentSong.addEventListener("timeupdate", () => {
        if (!isDragging) {
            circle.style.left =
                (currentSong.currentTime / currentSong.duration) * 100 + "%";
            progress.style.width =
                (currentSong.currentTime / currentSong.duration) * 100 + "%";

        }

        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentSong.currentTime)} / 
            ${secondsToMinutesSeconds(currentSong.duration)}`;
    });


    //Add seekbar functionality
    document.querySelector(".seekbar").addEventListener("click",(e)=>{
        let percent=(e.offsetX/e.target.getBoundingClientRect().width)*100;
        document.querySelector(".circle").style.left=percent + "%";
        currentSong.currentTime=(percent/100)*currentSong.duration;
        progress.style.width = percent + "%";
    });

    //Drag functionality for seekbar
    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".circle");

    // Start dragging
    circle.addEventListener("mousedown", (e) => {
        isDragging = true;
        e.preventDefault();
    });

    // Drag movement
    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const rect = seekbar.getBoundingClientRect();
        let percent = ((e.clientX - rect.left) / rect.width) * 100;

        percent = Math.max(0, Math.min(100, percent));

        circle.style.left = percent + "%";
        currentSong.currentTime = (percent / 100) * currentSong.duration;

        progress.style.width = percent + "%";
    });

    // Stop dragging
    document.addEventListener("mouseup", () => {
        isDragging = false;
    });

    // Touch events for mobile devices
    circle.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        const rect = seekbar.getBoundingClientRect();
        let touch = e.touches[0];
        let percent = ((touch.clientX - rect.left) / rect.width) * 100;
        percent = Math.max(0, Math.min(100, percent));
        circle.style.left = percent + "%";
        currentSong.currentTime = (percent / 100) * currentSong.duration;

        progress.style.width = percent + "%";
    });

    circle.addEventListener("touchstart", (e) => {
        isDragging = true;
        e.preventDefault();
    });
    document.addEventListener("touchend", () => {
        isDragging = false;
    });

    const playbar = document.querySelector(".playbar");
    const leftSidebar = document.querySelector(".left");

    //add an event listener for hamburger menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        leftSidebar.style.left="0";
        playbar.classList.add("hidden");  //hide playbar when sidebar is open
    });

    //add an event listener for cross menu to close sidebar
    document.querySelector(".cross").addEventListener("click", () => {
        document.querySelector(".left").style.left="-110%";
        playbar.classList.remove("hidden"); //show playbar when sidebar is closed
    });

    //Add an event listener to previous
    previous.addEventListener("click",()=>{
        let index=songs.indexOf(currentSong.src)
        if(index>0) playMusic(songs[index-1]);
    })
    //Add an event listener to next 
    next.addEventListener("click",()=>{
        let index=songs.indexOf(currentSong.src)
        if(index<songs.length-1) playMusic(songs[index+1]);
    })

    //Add an event listener in volume
    const volumeIcon = document.querySelector(".volume > img");
    const volumeRange = document.querySelector(".vol-range input");

    volumeRange.addEventListener("input", (e) => {
        currentSong.volume = e.target.value / 100;

        if (currentSong.volume === 0) {
            volumeIcon.src = "svgs/mute.svg";
        } else {
            volumeIcon.src = "svgs/volume.svg";
            lastVolume = currentSong.volume;
        }
    });

    //Add an event listener in volume svg to mute it
    volumeIcon.addEventListener("click", () => {

        if (currentSong.volume === 0) {
            // UNMUTE
            currentSong.volume = lastVolume || 0.5;
            volumeRange.value = lastVolume * 100;
            volumeIcon.src = "svgs/volume.svg";
        } else {
            // MUTE
            lastVolume = currentSong.volume;
            currentSong.volume = 0;
            volumeRange.value = 0;
            volumeIcon.src = "svgs/mute.svg";
        }
    });

}

window.addEventListener("DOMContentLoaded", main);

