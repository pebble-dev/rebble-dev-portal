function updateWatch() {
    let curentHour = new Date().getHours() % 12;
    let curentMinute = new Date().getMinutes();
    let hour = document.getElementsByClassName('hour')[0];
    let minute = document.getElementsByClassName('minute')[0];
    let offset = 60; // initialy watch arrows are on 2 o'clock.
    let degHour = 30;
    let degMinute = 6;
    let degMinuteInHour = 0.5;
    hour.style.transform = `rotate(${curentHour * degHour - offset + curentMinute * degMinuteInHour}deg)`;
    minute.style.transform = `rotate(${curentMinute * degMinute - offset}deg)`;
}

updateWatch();
setInterval(updateWatch, 5000)