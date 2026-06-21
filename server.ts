import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON
app.use(express.json());

// MySQL Database configuration
const mysqlConfig = {
  host: "vivalocal.mysql.dbaas.com.br",
  user: "vivalocal",
  password: "Raimu19881020@",
  database: "vivalocal",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
};

let mysqlPool: mysql.Pool | null = null;
let mysqlStatus = { connected: false, error: "Ainda não inicializado" };

async function initMySQL() {
  try {
    console.log("Tentando conectar ao banco de dados MySQL VivaLocal na Locaweb...");
    mysqlPool = mysql.createPool(mysqlConfig);
    
    // Test connection with a quick ping
    const conn = await mysqlPool.getConnection();
    console.log("✅ Conectado com sucesso ao MySQL na Locaweb!");
    mysqlStatus.connected = true;
    mysqlStatus.error = "";
    
    // Create 'usuarios' table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        createdAt BIGINT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    // Create 'anuncios' table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS anuncios (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        subCategory VARCHAR(100),
        price DECIMAL(15,2),
        \`condition\` VARCHAR(50),
        locationState VARCHAR(10),
        locationCity VARCHAR(100),
        sellerName VARCHAR(255),
        sellerEmail VARCHAR(255),
        sellerPhone VARCHAR(50),
        sellerId VARCHAR(100),
        videoUrl TEXT,
        sellerPhotoUrl TEXT,
        views INT DEFAULT 0,
        featured TINYINT(1) DEFAULT 0,
        planType VARCHAR(50),
        \`status\` VARCHAR(50),
        tipo_plano VARCHAR(50),
        dias_destaque INT,
        data_expiracao VARCHAR(50),
        createdAt BIGINT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    // Create 'fotos_anuncios' table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS fotos_anuncios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        adId VARCHAR(100) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        createdAt BIGINT,
        INDEX idx_adId (adId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    // Create 'pagamentos' table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS pagamentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        adId VARCHAR(100) NOT NULL,
        adTitle VARCHAR(255) NOT NULL,
        planType VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        payerEmail VARCHAR(255) NOT NULL,
        payerName VARCHAR(255) NOT NULL,
        paymentMethod VARCHAR(50) NOT NULL,
        \`status\` VARCHAR(50) NOT NULL,
        createdAt BIGINT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create 'categorias' table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id VARCHAR(100) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default OLX-style categories
    const defaultCategories = [
      { id: "veiculos", nome: "Veículos" },
      { id: "imoveis", nome: "Imóveis" },
      { id: "empregos", nome: "Empregos" },
      { id: "compra_venda", nome: "Compra e Venda" },
      { id: "tecnologia", nome: "Tecnologia" },
      { id: "moda_beleza", nome: "Moda e Beleza" },
      { id: "animais", nome: "Animais" },
      { id: "cursos_educacao", nome: "Cursos e Educação" },
      { id: "construcao_reforma", nome: "Construção" },
      { id: "servicos", nome: "Serviços" },
      { id: "gastronomia", nome: "Gastronomia" },
      { id: "eventos", nome: "Eventos" },
      { id: "saude_bem_estar", nome: "Saúde e Bem-Estar" },
      { id: "turismo_viagens", nome: "Turismo e Viagens" },
      { id: "esportes_lazer", nome: "Esportes e Lazer" },
      { id: "livros_hobbies", nome: "Livros e Hobbies" },
      { id: "empresas_negocios", nome: "Empresas" },
      { id: "relacionamentos", nome: "Relacionamentos" }
    ];

    for (const cat of defaultCategories) {
      await conn.query(
        "INSERT INTO categorias (id, nome) VALUES (?, ?) ON DUPLICATE KEY UPDATE nome = VALUES(nome)",
        [cat.id, cat.nome]
      );
    }
    
    console.log("✅ Tabelas e categorias populadas/verificadas com sucesso no MySQL!");
    conn.release();
  } catch (err: any) {
    console.error("❌ Falha crítica ao conectar ao banco de dados MySQL:", err.message);
    mysqlStatus.connected = false;
    mysqlStatus.error = err.message || "Erro desconhecido";
  }
}

// Call MySQL bootstrapper on app startup
initMySQL().catch((err) => {
  console.error("Erro na carga do módulo MySQL:", err);
});

// API: MySQL Database state endpoint
app.get("/api/mysql/status", async (req, res) => {
  if (!mysqlPool) {
    return res.json({ connected: false, error: mysqlStatus.error || "Ainda conectando..." });
  }
  try {
    const [rows]: any = await mysqlPool.query("SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'vivalocal'");
    return res.json({
      connected: true,
      host: mysqlConfig.host,
      database: mysqlConfig.database,
      user: mysqlConfig.user,
      tablesCount: rows[0]?.table_count || 0
    });
  } catch (err: any) {
    return res.json({ connected: false, error: err.message });
  }
});

// API: Save Ad object into MySQL (dual-write backup & dynamic sync)
app.post("/api/mysql/save-ad", async (req, res) => {
  console.log("Recebendo requisição de salvar anúncio no MySQL...");
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: "MySQL não está inicializado.", details: mysqlStatus.error });
    }
    const {
      id, title, description, category, subCategory, price, condition,
      locationState, locationCity, sellerName, sellerEmail, sellerPhone,
      sellerId, videoUrl, sellerPhotoUrl, views, featured, planType,
      status, tipo_plano, dias_destaque, data_expiracao, createdAt, images
    } = req.body;

    if (!id || !title) {
      return res.status(400).json({ error: "Os campos ID e Título são obrigatórios." });
    }

    const parsedPrice = parseFloat(price) || 0;
    const isFeatured = featured ? 1 : 0;
    const viewsVal = parseInt(views) || 0;
    const dbCreatedAd = createdAt || Date.now();

    const adQuery = `
      INSERT INTO anuncios (
        id, title, description, category, subCategory, price, \`condition\`,
        locationState, locationCity, sellerName, sellerEmail, sellerPhone,
        sellerId, videoUrl, sellerPhotoUrl, views, featured, planType,
        \`status\`, tipo_plano, dias_destaque, data_expiracao, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title=?, description=?, category=?, subCategory=?, price=?, \`condition\`=?,
        locationState=?, locationCity=?, sellerName=?, sellerEmail=?, sellerPhone=?,
        sellerId=?, videoUrl=?, sellerPhotoUrl=?, views=?, featured=?, planType=?,
        \`status\`=?, tipo_plano=?, dias_destaque=?, data_expiracao=?
    `;

    const adParams = [
      id, title, description || null, category || null, subCategory || null, parsedPrice, condition || null,
      locationState || null, locationCity || null, sellerName || null, sellerEmail || null, sellerPhone || null,
      sellerId || null, videoUrl || null, sellerPhotoUrl || null, viewsVal, isFeatured, planType || "gratis",
      status || "approved", tipo_plano || null, dias_destaque || null, data_expiracao || null, dbCreatedAd,
      // ON DUPLICATE UPDATE Params
      title, description || null, category || null, subCategory || null, parsedPrice, condition || null,
      locationState || null, locationCity || null, sellerName || null, sellerEmail || null, sellerPhone || null,
      sellerId || null, videoUrl || null, sellerPhotoUrl || null, viewsVal, isFeatured, planType || "gratis",
      status || "approved", tipo_plano || null, dias_destaque || null, data_expiracao || null
    ];

    await mysqlPool.query(adQuery, adParams);
    console.log(`Anúncio ${id} salvo com sucesso no banco de dados MySQL (anuncios).`);

    // Handle photos inside fotos_anuncios table
    if (Array.isArray(images) && images.length > 0) {
      await mysqlPool.query("DELETE FROM fotos_anuncios WHERE adId = ?", [id]);
      for (const imgUrl of images) {
        if (imgUrl && imgUrl.trim()) {
          await mysqlPool.query(
            "INSERT INTO fotos_anuncios (adId, image_url, createdAt) VALUES (?, ?, ?)",
            [id, imgUrl.trim(), dbCreatedAd]
          );
        }
      }
      console.log(`Fotos salvas na tabela fotos_anuncios no MySQL para o anúncio ${id}.`);
    }

    return res.json({ success: true, message: "Anúncio e fotos gravados com sucesso no MySQL!" });
  } catch (error: any) {
    console.error("Erro ao salvar anúncio no MySQL:", error);
    return res.status(500).json({ error: "Falha ao salvar anúncio no MySQL.", details: error.message });
  }
});

// API: Sync multiple ads in real-time (called when app mounts)
app.post("/api/mysql/sync-ads", async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: "MySQL não está inicializado." });
    }
    const { ads } = req.body;
    if (!Array.isArray(ads)) {
      return res.status(400).json({ error: "Dados inválidos: array de anúncios esperado." });
    }

    console.log(`Sincronizando lote de ${ads.length} anúncios com o MySQL...`);

    for (const ad of ads) {
      const {
        id, title, description, category, subCategory, price, condition,
        locationState, locationCity, sellerName, sellerEmail, sellerPhone,
        sellerId, videoUrl, sellerPhotoUrl, views, featured, planType,
        status, tipo_plano, dias_destaque, data_expiracao, createdAt, images
      } = ad;

      if (!id || !title) continue;

      const parsedPrice = parseFloat(price) || 0;
      const isFeatured = featured ? 1 : 0;
      const viewsVal = parseInt(views) || 0;
      const dbCreatedAd = createdAt || Date.now();

      const adQuery = `
        INSERT INTO anuncios (
          id, title, description, category, subCategory, price, \`condition\`,
          locationState, locationCity, sellerName, sellerEmail, sellerPhone,
          sellerId, videoUrl, sellerPhotoUrl, views, featured, planType,
          \`status\`, tipo_plano, dias_destaque, data_expiracao, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title=?, description=?, category=?, subCategory=?, price=?, \`condition\`=?,
          locationState=?, locationCity=?, sellerName=?, sellerEmail=?, sellerPhone=?,
          sellerId=?, videoUrl=?, sellerPhotoUrl=?, views=?, featured=?, planType=?,
          \`status\`=?, tipo_plano=?, dias_destaque=?, data_expiracao=?
      `;

      const adParams = [
        id, title, description || null, category || null, subCategory || null, parsedPrice, condition || null,
        locationState || null, locationCity || null, sellerName || null, sellerEmail || null, sellerPhone || null,
        sellerId || null, videoUrl || null, sellerPhotoUrl || null, viewsVal, isFeatured, planType || "gratis",
        status || "approved", tipo_plano || null, dias_destaque || null, data_expiracao || null, dbCreatedAd,
        // ON DUPLICATE UPDATE
        title, description || null, category || null, subCategory || null, parsedPrice, condition || null,
        locationState || null, locationCity || null, sellerName || null, sellerEmail || null, sellerPhone || null,
        sellerId || null, videoUrl || null, sellerPhotoUrl || null, viewsVal, isFeatured, planType || "gratis",
        status || "approved", tipo_plano || null, dias_destaque || null, data_expiracao || null
      ];

      await mysqlPool.query(adQuery, adParams);

      const imgList = Array.isArray(images) ? images : [];
      if (imgList.length > 0) {
        await mysqlPool.query("DELETE FROM fotos_anuncios WHERE adId = ?", [id]);
        for (const imgUrl of imgList) {
          if (imgUrl && imgUrl.trim()) {
            await mysqlPool.query(
              "INSERT INTO fotos_anuncios (adId, image_url, createdAt) VALUES (?, ?, ?)",
              [id, imgUrl.trim(), dbCreatedAd]
            );
          }
        }
      }
    }

    return res.json({ success: true, message: `Sincronizados ${ads.length} anúncios com sucesso!` });
  } catch (error: any) {
    console.error("Erro na sincronização em lote de anúncios:", error);
    return res.status(500).json({ error: "Falha ao sincronizar anúncios.", details: error.message });
  }
});

// API: Write logged/registered user into MySQL
app.post("/api/mysql/save-user", async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: "MySQL não está inicializado." });
    }
    const { id, name, email, phone } = req.body;
    if (!id || !email) {
      return res.status(400).json({ error: "ID de usuário e e-mail são obrigatórios." });
    }

    const userQuery = `
      INSERT INTO usuarios (id, name, email, phone, createdAt)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        email = VALUES(email),
        phone = VALUES(phone)
    `;
    await mysqlPool.query(userQuery, [id, name || "Usuário VivaLocal", email, phone || null, Date.now()]);
    console.log(`Usuário ${name} (${id}) cadastrado/atualizado no MySQL.`);
    return res.json({ success: true, message: "Cadastro/Login atualizado no MySQL do site!" });
  } catch (error: any) {
    console.error("Erro ao salvar usuário no MySQL:", error);
    return res.status(500).json({ error: "Falha ao registrar usuário.", details: error.message });
  }
});

// API: Write Payment Logs inside MySQL
app.post("/api/mysql/save-payment", async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: "MySQL não está inicializado." });
    }
    const { adId, adTitle, planType, amount, payerEmail, payerName, paymentMethod, status } = req.body;
    if (!adId || !adTitle) {
      return res.status(400).json({ error: "AdId e AdTitle são obrigatórios." });
    }

    const payQuery = `
      INSERT INTO pagamentos (adId, adTitle, planType, amount, payerEmail, payerName, paymentMethod, \`status\`, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await mysqlPool.query(payQuery, [
      adId, adTitle, planType || "destaque_7", parseFloat(amount) || 0,
      payerEmail || "cliente@viva-local.com", payerName || "Cliente",
      paymentMethod || "pix", status || "approved", Date.now()
    ]);
    console.log(`Pagamento registrado no MySQL para o plano ${planType} do anúncio ${adTitle}.`);
    return res.json({ success: true, message: "Pagamento registrado com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao salvar pagamento no MySQL:", error);
    return res.status(500).json({ error: "Erro ao salvar pagamento.", details: error.message });
  }
});

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
