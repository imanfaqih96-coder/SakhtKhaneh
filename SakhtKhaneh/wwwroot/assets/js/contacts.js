const geolocation_api_key = '97c62498a168489898a05d474162b7ab';

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
                pathParam: 'contacts',
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

function isPhoneValid(phone) {
    if (!isNaN(phone)) {

        if (phone.length == 11) {
            if (phone.startsWith('09')) {
                return true;
            }
            else {
                Swal.fire({
                    icon: 'warning',
                    title: 'هشدار',
                    text: 'مقدار ورودی به ازای تلفن همراه باید 11 با 09 شروع شود.',
                    confirmButtonText: 'فهمیدم'
                })
                return false;
            }
        }
        else {
            Swal.fire({
                icon: 'warning',
                title: 'هشدار',
                text: 'طول ورودی به ازای تلفن همراه باید 11 کاراکتر باشد.',
                confirmButtonText: 'فهمیدم'
            });
            return false;
        }
    }
    else {
        Swal.fire({
            icon: 'warning',
            title: 'هشدار',
            text: 'مقدار ورودی به ازای تلفن همراه باید فقط از اعداد باشد.',
            confirmButtonText: 'فهمیدم'
        });
        return false;
    }
}

recordVisit();

$('#sendMessage').click(() => {

    // data collection
    var name = $('input[name=name]').val();
    var email = $('input[name=email]').val();
    var phone = $('input[name=phone]').val();
    var subject = $('input[name=subject]').val();
    var content = $('textarea[name=message]').val();

    var data = {
        name: name,
        email: email,
        phone: phone,
        subject: subject,
        content: content
    };

    //  validation

    // phone validation

    if (isPhoneValid(phone)) {
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            url: '/api/SendMessage',
            contentType: 'application/json',
            success: (response) => {
                console.log('success sending message', response);
            },
            error: (err) => {
                console.warn('error occured', err);
            }
        })
    }

})