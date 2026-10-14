import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const VERIFY_SECRET = Deno.env.get("WHATSAPP_WEBHOOK_SECRET")!;

function normalizePhone(phone: string): string {
  let number = phone.replace(/\D/g, "");

  if (number.startsWith("0")) {
    number = "92" + number.slice(1);
  } else if (number.startsWith("3") && number.length === 10) {
    number = "92" + number;
  }

  if (!/^92\d{10}$/.test(number)) {
    throw new Error("Invalid Pakistani patient phone number");
  }

  return number;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (req.headers.get("x-webhook-secret") !== VERIFY_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { appointment_id, event } = await req.json();

    if (!appointment_id ||
        !["pending", "booked"].includes(event)) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointment_id)
      .single();

    if (error || !appointment) {
      return Response.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Only send the notification that matches the current appointment status.
    if (String(appointment.status).toLowerCase() !== event) {
      return Response.json({ error: "Appointment status mismatch" }, { status: 409 });
    }

    const patientPhone = normalizePhone(
      appointment.phone ?? appointment.patient_phone ?? ""
    );

    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (!accessToken || !phoneNumberId) {
      throw new Error("WhatsApp API credentials are not configured");
    }

    const patientName = appointment.patient_name ?? appointment.name ?? "Patient";
    const doctorName = appointment.doctor_name ?? "Your doctor";
    const date = appointment.appointment_date ?? appointment.date ?? "As booked";
    const time = appointment.appointment_time ?? appointment.time ?? "As booked";

    const templateName =
      event === "pending" ? "appointment_received" : "appointment_confirmed";

    // Templates must be approved in WhatsApp Manager.
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: patientPhone,
          type: "template",
          template: {
            name: templateName,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: String(patientName) },
                  { type: "text", text: String(doctorName) },
                  { type: "text", text: String(date) },
                  { type: "text", text: String(time) },
                  { type: "text", text: String(appointment.id) }
                ]
              }
            ]
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API failed", response.status, result);
      return Response.json(
        { status: "failed", details: result },
        { status: 502 }
      );
    }

    return Response.json({
      status: "accepted",
      recipient: patientPhone,
      event,
      message_id: result.messages?.[0]?.id
    });
  } catch (error) {
    console.error("Appointment WhatsApp error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
});
