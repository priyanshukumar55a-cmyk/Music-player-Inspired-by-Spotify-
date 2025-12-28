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
    let res = await fetch(`/api/songs/${folder}`);
    let files = await res.json();

    songs = files.map(f => `/songs/${folder}/${f}`);

    let songUL = document.querySelector(".song-list ul");
    if (!songUL) return;

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
    let a = await fetch(`/api/songs/albums`);
    let folders = await a.json();

    const card_container = document.querySelector(".card_container");
    card_container.innerHTML = "";

    for (let folder of folders) {
        let meta = await fetch(`/songs/${folder}/info.json`);
        let response = await meta.json();

        card_container.innerHTML += `
        <div data-folder="${folder}" class="card">
            <img class="play-icon" src="svgs/play.svg">
            <img src="/songs/${folder}/cover.jpg">
            <h3>${response.title}</h3>
            <p>${response.description}</p>
        </div>`;
    }

    // ✅ Add click listeners AFTER cards are rendered
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async item => {
            songs = await getSongs(item.currentTarget.dataset.folder);
            playMusic(songs[0]);
        });
    });
}


async function main() {
    const play = document.getElementById("play");
    const previous = document.getElementById("previous");
    const next = document.getElementById("next");

    await getSongs("chill music");
    
    playMusic(songs[0],true);

    //Display all the albums on the page
    displayAlbums() 

    document.querySelector(".song-list ul").addEventListener("click", (e) => {
        let li = e.target.closest("li");
        if (!li) return;

        if (currentLi) currentLi.classList.remove("active");
        currentLi = li;
        currentLi.classList.add("active");

        playMusic(li.dataset.src);
    });


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

    //Add an event listener to previous & next
    previous.addEventListener("click",()=>{
        let index=songs.indexOf(currentSong.src)
        if(index>0) playMusic(songs[index-1]);
    })
    next.addEventListener("click",()=>{
        let index=songs.indexOf(currentSong.src)
        if(index<songs.length-1) playMusic(songs[index+1]);
    })

    currentSong.addEventListener("ended", () => {
        play.src = "svgs/play-foot.svg";
    });

    const progress = document.querySelector(".progress");
    let isDragging = false;

    //Drag functionality for seekbar
    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".circle");

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

