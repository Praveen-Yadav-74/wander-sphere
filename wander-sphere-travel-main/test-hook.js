fetch("https://gserzaenfrmrqoffzcxr.supabase.co/functions/v1/sms-hook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: { phone: "+919493766213" }, sms: { otp: "123456" } })
}).then(async res => {
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}).catch(console.error);
