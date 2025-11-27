var geolocation_api_key = '97c62498a168489898a05d474162b7ab';

function countdown() {
    var now = new Date();
    var eventDate = new Date(2025, 11, 6);
    var currentTiime = now.getTime();
    var eventTime = eventDate.getTime();
    var remTime = eventTime - currentTiime;
    var s = Math.floor(remTime / 1000);
    var m = Math.floor(s / 60);
    var h = Math.floor(m / 60);
    var d = Math.floor(h / 24);
    h %= 24;
    m %= 60;
    s %= 60;
    h = (h < 10) ? "0" + h : h;
    m = (m < 10) ? "0" + m : m;
    s = (s < 10) ? "0" + s : s;
    document.getElementById("days").textContent = d;
    document.getElementById("days").innerText = d;
    document.getElementById("hours").textContent = h;
    document.getElementById("minutes").textContent = m;
    document.getElementById("seconds").textContent = s;
    setTimeout(countdown, 1000);
}

function geolocate() {
    const myHeaders = new Headers();


    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    fetch("https://api.ipgeolocation.io/v2/ipgeo?apiKey=" + geolocation_api_key + "", requestOptions)
        .then((response) => response.text())
        .then((result) => {
            console.log(result)
        })
        .catch((error) => console.error(error));
}

function recordVisit() {
    var path = window.location.href.replace(window.location.origin, '');
    const myHeaders = new Headers();


    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    fetch("https://api.ipgeolocation.io/v2/ipgeo?apiKey=" + geolocation_api_key + "", requestOptions)
        .then((response) => response.text())
        .then((result) => {
            var geolocation = result;
            var data = {
                path: path,
                pathType: 'static',
                pathParam: 'comming-soon',
                geolocation: JSON.parse(geolocation)
            }
            var stringified = JSON.stringify(data);

            fetch('/api/submitVisitRecord', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: stringified
            })
                .then(async res => {
                    const result = res;
                    console.log("✅ visit recorded:", result);
                })
                .catch(err => {
                    console.error("❌ Visit record failed:", err);
                });

        })
        .catch((error) => console.error(error));
}

// ✅ Wait until jQuery loads
if (window.jQuery) {
    recordVisit();
    countdown();
} else {
    document.addEventListener("DOMContentLoaded", function () {
        setTimeout(() => {
            recordVisit();
            countdown();
        }, 100);
    });
}
