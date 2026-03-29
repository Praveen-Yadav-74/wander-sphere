console.log("MSG91 WhatsApp OTP Hook function initialized");

Deno.serve(async (req: Request) => {
  try {
    // 1. Parse the payload from Supabase Auth
    const payload = await req.json();

    const phone = payload.user?.phone;
    const otp = payload.sms?.otp;

    if (!phone || !otp) {
      return new Response(JSON.stringify({ error: "Missing phone or otp in payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Fetch MSG91 Auth key from Supabase Secrets
    const authKey = Deno.env.get("MSG91_AUTH_KEY");
    if (!authKey) {
      console.error("Missing MSG91_AUTH_KEY environment variable");
      return new Response(JSON.stringify({ error: "Configuration Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Format payload for MSG91 WhatsApp OTP
    // MSG91 usually expects numbers without the leading '+' sign
    const mobile = phone.startsWith("+") ? phone.substring(1) : phone;

    // Requested exact message
    const message = `Your OTP is ${otp}. Valid for 10 minutes. - one63`;

    const msg91Payload: Record<string, string> = {
      mobile: mobile,
      otp: otp,
      message: message,
      channel: "whatsapp",   // Explicitly setting channel to WhatsApp to bypass DLT
      otp_expiry: "10"       // Validity of the OTP in minutes
    };

    // If using a template in MSG91, it is mapped here
    const templateId = Deno.env.get("MSG91_TEMPLATE_ID");
    if (templateId) {
      msg91Payload.template_id = templateId;
    }

    // 4. Hit MSG91's Send OTP endpoint
    // MSG91 v5 OTP POST expects many parameters (like mobile) in query parameters.
    const url = new URL("https://api.msg91.com/api/v5/otp");
    url.searchParams.append("mobile", mobile);
    url.searchParams.append("otp", otp);
    url.searchParams.append("channel", "whatsapp");
    url.searchParams.append("otp_expiry", "10");
    if (templateId) {
      url.searchParams.append("template_id", templateId);
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authkey": authKey
      },
      // Keep JSON payload as well since some params can live here depending on whether it is custom payload or not
      body: JSON.stringify(msg91Payload)
    });

    const result = await response.json();

    // 5. Handle potential MSG91 errors
    if (!response.ok || (result.type && result.type === "error")) {
      console.error("Failed to send WhatsApp OTP via MSG91:", result);
      return new Response(JSON.stringify({ error: "Failed to send WhatsApp OTP" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Successfully sent WhatsApp OTP to ${phone}`);

    // 6. Return specific success object with 200 HTTP status
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing Hook execution:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
