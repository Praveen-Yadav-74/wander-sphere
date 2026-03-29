fetch("https://api.msg91.com/api/v5/otp", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "authkey": "super_random_invalid_key_12345"
    },
    body: JSON.stringify({
        mobile: "919493766213",
        otp: "123456",
        message: "Your OTP is 123456"
    })
}).then(async res => {
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}).catch(console.error);
