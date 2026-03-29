fetch("https://api.msg91.com/api/v5/otp", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "authkey": "a3862d92ae310247bc1790cc4f57d506b30969d8b7251ebaa4ffc421aa6fffe1"
    },
    body: JSON.stringify({
        mobile: "919493766213",
        otp: "123456",
        message: "Your OTP is 123456. Valid for 10 minutes. - one63"
    })
}).then(async res => {
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}).catch(console.error);
