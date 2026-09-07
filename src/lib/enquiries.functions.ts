import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const enquirySchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  mobile: z.string().trim().regex(/^[6-9][0-9]{9}$/),
  email: z.string().trim().email().max(120).or(z.literal("")),
  course: z.string().trim().min(1).max(120),
  batch: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().max(500).optional().default(""),
});

export type EnquiryInput = z.input<typeof enquirySchema>;

export type EnquiryResult = {
  saved: boolean;
  whatsappStatus: "sent" | "failed" | "not_configured";
};

function buildMessage(data: z.infer<typeof enquirySchema>) {
  return [
    "🔔 New Enquiry - Scopenet Computer Institute",
    "",
    `👤 Name: ${data.fullName}`,
    `📱 Mobile: ${data.mobile}`,
    `📧 Email: ${data.email || "-"}`,
    `📚 Course: ${data.course}`,
    `🕐 Preferred Batch: ${data.batch || "-"}`,
    `💬 Message: ${data.message || "-"}`,
  ].join("\n");
}

async function sendWhatsApp(data: z.infer<typeof enquirySchema>) {
  const token = process.env["WHATSAPP_ACCESS_TOKEN"];
  const phoneNumberId = process.env["WHATSAPP_PHONE_NUMBER_ID"];
  const admin = process.env["ADMIN_WHATSAPP_NUMBER"];
  if (!token || !phoneNumberId || !admin) {
    return { status: "not_configured" as const, error: "WhatsApp credentials are not configured." };
  }

  const to = admin.replace(/[^0-9]/g, "");
  const templateName = process.env["WHATSAPP_TEMPLATE_NAME"];
  const body = templateName
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: process.env["WHATSAPP_TEMPLATE_LANGUAGE"] ?? "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                data.fullName,
                data.mobile,
                data.email || "-",
                data.course,
                data.batch || "-",
                data.message || "-",
              ].map((text) => ({ type: "text", text })),
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body: buildMessage(data) },
      };

  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("WhatsApp Cloud API error", response.status, detail);
      return { status: "failed" as const, error: `${response.status}: ${detail.slice(0, 400)}` };
    }
    return { status: "sent" as const, error: null };
  } catch (error) {
    console.error("WhatsApp Cloud API request failed", error);
    return { status: "failed" as const, error: String(error).slice(0, 400) };
  }
}

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((input: EnquiryInput) => enquirySchema.parse(input))
  .handler(async ({ data }): Promise<EnquiryResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("enquiries")
      .insert({
        full_name: data.fullName,
        mobile: data.mobile,
        email: data.email || null,
        course: data.course,
        batch: data.batch || null,
        message: data.message || null,
        whatsapp_status: "pending",
      })
      .select("id")
      .single();

    if (error || !row) {
      console.error("Failed to save enquiry", error);
      throw new Error("Could not save enquiry");
    }

    const result = await sendWhatsApp(data);

    await supabaseAdmin
      .from("enquiries")
      .update({ whatsapp_status: result.status, whatsapp_error: result.error })
      .eq("id", row.id);

    return { saved: true, whatsappStatus: result.status };
  });
