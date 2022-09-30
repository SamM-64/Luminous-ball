var song = new Audio();
var muted = false;
var vol = 1;
song.type = "audio/mpeg";
song.src = "https://www.bensound.com/bensound-music/bensound-summer.mp3"; //Audio file source url

function playpause() {
  if (!song.paused) {
    song.pause();
  } else {
    song.play();
  }
}
function stop() {
  song.pause();
  song.currentTime = 0;
  document.getElementById("seek").value = 0;
}
