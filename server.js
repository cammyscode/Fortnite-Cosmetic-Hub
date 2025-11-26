require("dotenv").config();

const express = require("express");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs").promises;
const cors = require("cors");

dotenv.config();
const app = express();
const PORT = 4000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

console.log("URL:", process.env.SUPABASE_URL);
console.log("KEY:", process.env.SUPABASE_KEY ? "Carregada" : "Vazia");

// ---------- CONFIGURA EJS ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------- MIDDLEWARES ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
};
app.use(cors(corsOptions));

// ---------- ROTA INICIAL ----------
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "index.html"));
});

// ========== CADASTRO ==========
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1. Criar usuário
    const { data: signupData, error: signupError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: { data: { name } },
      }
    );

    if (signupError) {
      return res.status(400).json({
        ok: false,
        message: signupError.message,
      });
    }

    if (!signupData?.user) {
      return res.status(500).json({
        ok: false,
        message: "Erro inesperado ao criar usuário.",
      });
    }

    // 2. Inserir perfil no banco (com 10k V-Bucks)
    const VBUCKS_INICIAL = 10000;

    const { error: insertError } = await supabase.from("usuarios").insert([
      {
        id: signupData.user.id,
        name: name,
        email: email,
        ativo: true,
        saldo_vbucks: VBUCKS_INICIAL,
        id_users: signupData.user.id,
      },
    ]);

    if (insertError) {
      return res.status(500).json({
        ok: false,
        message: "Erro ao criar perfil no banco: " + insertError.message,
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Cadastro concluído! Faça login.",
      redirect: "/login.html",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: "Erro interno não mapeado.",
    });
  }
});

// ========== LOGIN ==========
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN REQ BODY:", req.body);

    // Login usando Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return res.status(401).json({
        ok: false,
        message: "Email ou senha inválidos.",
      });
    }

    const token = data.session.access_token;

    // Salvar token no cookie
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });

    // Buscar na tabela usuarios
    const userId = data.user.id;

    const { data: userDataLog, error: userErr } = await supabase
      .from("usuarios")
      .select("id, name, email")
      .eq("id", userId)
      .single();

    if (userErr) {
      return res.status(500).json({
        ok: false,
        message: "Falha ao buscar dados do usuário",
      });
    }

    return res.json({
      ok: true,
      message: "Login realizado com sucesso!",
      user: userDataLog,
    });
  } catch (err) {
    console.error("Erro interno no /login:", err);
    res.status(500).json({
      ok: false,
      message: "Erro interno do servidor.",
    });
  }
});
// ========== ROTA PRIVADA ==========
app.get("/private", async (req, res) => {
  const token = req.cookies.access_token;

  if (!token) return res.redirect("/register.html");

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return res.redirect("/register.html");

  const userId = data.user.id;

  // Carregar dados do usuário
  const { data: userData, error: userError } = await supabase
    .from("usuarios")
    .select("name, id_users, saldo_vbucks, email, user_pic")
    .eq("id", userId)
    .single();

  if (userError) return res.status(500).send("Erro ao carregar dados");

  res.render("private", {
    name: userData.name,
    saldo_vbucks: userData.saldo_vbucks,
    id_users: userData.id_users,
    email: data.user.email,
    user_pic: userData.user_pic,
  });
});

// ========== COMPRAR ==========
app.post("/buy", async (req, res) => {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json({ ok: false, message: "Not authenticated" });
  }

  // Pega o usuário pelo token
  const { data: userData, error: userError } = await supabase.auth.getUser(
    token
  );

  if (userError || !userData.user) {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }

  const userId = userData.user.id;
  const { itemName, rarity, price, image } = req.body;

  // Verifica saldo do usuário
  const { data: userRow } = await supabase
    .from("usuarios")
    .select("saldo_vbucks")
    .eq("id", userId)
    .single();

  if (!userRow || userRow.saldo_vbucks < price) {
    return res.status(400).json({
      ok: false,
      message: "Saldo insuficiente",
    });
  }

  // Desconta saldo
  const newBalance = userRow.saldo_vbucks - price;

  await supabase
    .from("usuarios")
    .update({ saldo_vbucks: newBalance })
    .eq("id", userId);

  // Salva a compra
  const { data: purchaseData, error: saveError } = await supabase
    .from("purchases")
    .insert([
      {
        item_name: itemName,
        rarity: rarity,
        price_vbucks: price,
        image_url: image,
        user_id: userId,
      },
    ])
    .select("id")
    .single();

  if (saveError) {
    console.log(saveError);
    return res
      .status(500)
      .json({ ok: false, message: "Error saving purchase" });
  }

  res.json({
    ok: true,
    novoSaldo: newBalance,
    purchaseId: purchaseData.id,
  });
});

// ========== INVENTÁRIO ==========
app.get("/inventory", async (req, res) => {
  const token = req.cookies.access_token;

  if (!token)
    return res.status(401).json({ ok: false, message: "Not authenticated" });

  const { data: userData, error: authErr } = await supabase.auth.getUser(token);

  if (authErr || !userData?.user) {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }

  const userId = userData.user.id;

  const { data: items } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId);

  res.json({ ok: true, items });
});
// ========== DEVOLUÇÃO ==========
app.post("/return", async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ ok: false, message: "Not authenticated" });
    }

    // Autentica usuário
    const { data: dataUser, error: dataUserError } =
      await supabase.auth.getUser(token);

    if (dataUserError || !dataUser.user) {
      return res.status(401).json({ ok: false, message: "Invalid token" });
    }

    const userId = dataUser.user.id;
    const { priceItem, purchaseId } = req.body;

    // Busca saldo atual
    const { data: rowUser, error: rowUserError } = await supabase
      .from("usuarios")
      .select("saldo_vbucks")
      .eq("id", userId)
      .single();

    if (rowUserError || !rowUser) {
      return res.status(400).json({ ok: false, message: "User not found" });
    }

    // Devolve valor ao saldo
    const returnBalance = rowUser.saldo_vbucks + Number(priceItem);

    const { error: updateError } = await supabase
      .from("usuarios")
      .update({ saldo_vbucks: returnBalance })
      .eq("id", userId);

    if (updateError) {
      return res
        .status(500)
        .json({ ok: false, message: "Error updating balance" });
    }

    // Remove item do inventário
    const { error: deleteError } = await supabase
      .from("purchases")
      .delete()
      .eq("id", purchaseId);

    if (deleteError) {
      return res
        .status(500)
        .json({ ok: false, message: "Error removing item" });
    }

    return res.json({
      ok: true,
      novoSaldo: returnBalance,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ ok: false, message: "Internal server error" });
  }
});

const multer = require("multer");
const upload = multer();

// ========== ATUALIZAR FOTO ==========
app.post("/update-photo", upload.single("photo"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.json({ ok: false, message: "Nenhuma foto enviada" });
  }

  const token = req.cookies.access_token;

  const { data: userData, error: userError } = await supabase.auth.getUser(
    token
  );
  if (userError || !userData.user) {
    return res.json({ ok: false, message: "Usuário não autenticado" });
  }

  const userId = userData.user.id;

  // Nome único para a foto
  const fileName = `${userId}-${Date.now()}.jpg`;

  // Enviar para Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("user_photos")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    console.log(uploadError);
    return res.json({ ok: false, message: "Erro no upload" });
  }

  // Gerar URL pública
  const { data: urlData } = supabase.storage
    .from("user_photos")
    .getPublicUrl(fileName);

  // Salvar no banco
  const { error: updateError } = await supabase
    .from("usuarios")
    .update({ user_pic: urlData.publicUrl })
    .eq("id", userId);

  if (updateError) {
    console.error("ERRO SUPABASE RLS/UPDATE:", updateError);
    return res.json({ ok: false, message: "Erro ao atualizar banco" });
  }

  res.json({ ok: true, url: urlData.publicUrl });
});

// ========== LOGOUT ==========
app.get("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/register.html");
});

// ========== INICIAR SERVIDOR ==========
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
