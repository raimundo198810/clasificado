import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON
app.use(express.json());

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

// API: Enhance Advertisement Details
app.post("/api/gemini/enhance", async (req, res) => {
  try {
    const { title, category, details, condition } = req.body;
    if (!title) {
      return res.status(400).json({ error: "O título do anúncio é obrigatório." });
    }

    const client = getGeminiClient();
    const prompt = `Você é um especialista em marketing digital e classificados. Melhorar o anúncio a seguir para ser atraente e profissional, em português brasileiro.
Título: ${title}
Categoria: ${category || "Não especificado"}
Condição: ${condition || "Não especificado"}
Detalhes inseridos pelo usuário: ${details || "Nenhum detalhe adicional"}

Por favor, gere uma resposta JSON estrita com o seguinte formato, sem formatação markdown extra fora do JSON (não inclua marcações de código como \`\`\`json):
{
  "enhancedTitle": "Título otimizado para SEO",
  "enhancedDescription": "Descrição longa, persuasiva e profissional com formatação em parágrafos e marcadores/bullets claros para destacar benefícios.",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "marketingHook": "Frase de efeito curta para atrair compradores rapidamente"
}`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text ? response.text.trim() : "{}";
    const cleanedText = text.replace(/^```json/, "").replace(/```$/, "").trim();
    let data;
    try {
      data = JSON.parse(cleanedText);
    } catch {
      data = {
        enhancedTitle: title,
        enhancedDescription: details || "Não foi possível melhorar a descrição, utilize os detalhes informados.",
        suggestedTags: [category || "classificados"],
        marketingHook: "Excelente oportunidade!"
      };
    }
    return res.json(data);
  } catch (error: any) {
    console.error("Erro no Gemini Enhance:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
});

// API: Suggest Realistic Price and Market Sentiment
app.post("/api/gemini/price-suggest", async (req, res) => {
  try {
    const { title, category, condition, location } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Título é obrigatório para sugestão de preço." });
    }

    const client = getGeminiClient();
    const prompt = `Analise o seguinte item para venda no portal VivaLocal (Brasil) e estime o valor de mercado atual em Reais (R$).
Título: ${title}
Categoria: ${category || "Geral"}
Condição: ${condition || "Usado"}
Localização: ${location || "Brasil"}

Por favor, gere uma estimativa de preço realista em Reais e uma breve análise de mercado.
Responda APENAS em formato JSON estrito, sem formatação markdown externa ou blocos de código:
{
  "minPrice": 120,
  "maxPrice": 180,
  "recommendedPrice": 150,
  "sentiment": "Alta demanda / Baixa demanda / Estável",
  "reasoning": "Breve justificativa explicativa em português sobre por que esse preço é praticado."
}`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text ? response.text.trim() : "{}";
    const cleanedText = text.replace(/^```json/, "").replace(/```$/, "").trim();
    let data;
    try {
      data = JSON.parse(cleanedText);
    } catch {
      data = {
        minPrice: 50,
        maxPrice: 200,
        recommendedPrice: 100,
        sentiment: "Estável",
        reasoning: "Estimativa geral baseada no mercado de classificados."
      };
    }
    return res.json(data);
  } catch (error: any) {
    console.error("Erro no Gemini Price-Suggest:", error);
    return res.status(500).json({ error: error.message || "Erro interno no servidor." });
  }
});

// Mercado Pago API integration endpoints
app.post("/api/mercadopago/create-pix", async (req, res) => {
  try {
    const { title, email, name } = req.body;
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "APP_USR-6555001016271930-062104-64666a7d77b890a9bf54ebbee7fdde17-1139008774";
    
    // Mercado Pago API payment request - Real PIX Payment creation
    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Idempotency-Key": `pix-${Date.now()}-${Math.floor(Math.random() * 100000)}`
      },
      body: JSON.stringify({
        transaction_amount: parseFloat(req.body.price) || 14.90,
        description: `Destaque Premium: ${title || "Anúncio VivaLocal"}`,
        payment_method_id: "pix",
        payer: {
          email: email || "comprador@viva-local.com",
          first_name: name ? name.split(" ")[0] : "Cliente",
          last_name: name ? name.split(" ").slice(1).join(" ") || "VivaLocal" : "VivaLocal",
          identification: {
            type: "CPF",
            number: "19119119100" // Formatted dummy CPF
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Mercado Pago API error details:", data);
      return res.status(400).json({ error: data.message || "Erro ao conectar com a API do Mercado Pago." });
    }

    // Extract QR code content and image source
    const transactionData = data.point_of_interaction?.transaction_data;
    return res.json({
      paymentId: data.id,
      qrCodeBase64: transactionData?.qr_code_base64,
      qrCode: transactionData?.qr_code,
      status: data.status,
      statusDetail: data.status_detail
    });
  } catch (error: any) {
    console.error("Erro ao gerar PIX Mercado Pago:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor ao gerar PIX." });
  }
});

app.post("/api/mercadopago/create-preference", async (req, res) => {
  try {
    const { title, email, clientOrigin } = req.body;
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "APP_USR-6555001016271930-062104-64666a7d77b890a9bf54ebbee7fdde17-1139008774";
    const origin = clientOrigin || req.headers.referer || "http://localhost:3000";

    const response = await fetch("https://api.mercadopago.com/v1/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        items: [
          {
            title: `Destaque Premium - ${title || "Anúncio VivaLocal"}`,
            quantity: 1,
            unit_price: parseFloat(req.body.price) || 14.90,
            currency_id: "BRL"
          }
        ],
        payer: {
          email: email || "comprador@viva-local.com"
        },
        back_urls: {
          success: `${origin}?payment_callback=success`,
          failure: `${origin}?payment_callback=failure`,
          pending: `${origin}?payment_callback=pending`
        },
        auto_return: "approved"
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Mercado Pago Preference Error details:", data);
      return res.status(400).json({ error: data.message || "Erro ao gerar link de pagamento." });
    }

    return res.json({
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point
    });
  } catch (error: any) {
    console.error("Erro ao criar preferência do Mercado Pago:", error);
    return res.status(500).json({ error: error.message || "Erro interno ao processar preferência de pagamento." });
  }
});

app.get("/api/mercadopago/check-payment/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "APP_USR-6555001016271930-062104-64666a7d77b890a9bf54ebbee7fdde17-1139008774";

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Mercado Pago Check-Payment Error:", data);
      return res.status(400).json({ error: data.message || "Erro ao verificar transação de pagamento." });
    }

    return res.json({
      id: data.id,
      status: data.status, // approved, pending, in_process, rejected, cancelled, etc.
      statusDetail: data.status_detail,
      amount: data.transaction_amount
    });
  } catch (error: any) {
    console.error("Erro ao checar status de pagamento Mercado Pago:", error);
    return res.status(500).json({ error: error.message || "Erro interno ao verificar transação." });
  }
});

// Configure Vite integration
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting node in development with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting node in production serving static app...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Web application running on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to boot Express server:", err);
});
