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
const PORT = 3000;

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
  res.sendFile(path.resolve(__dirname, "public", "register.html"));
});

// ========== CADASTRO ==========
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
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
    if (!signupData?.user || !signupData?.session) {
      return res.status(200).json({
        ok: true,
        message: "Cadastro concluído! Faça login.",
        redirect: "/register.html",
      });
    }
    // Inserir na tabela do SUPABASE
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
    } // Salvar cookie

    res.cookie("access_token", signupData.session.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    return res.json({ ok: true, redirect: "/private" });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: "Erro interno não mapeado." });
  }
});

// ========== LOGIN ==========
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN REQ BODY:", req.body);

    // 1. Login usando Supabase Auth
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

    // 2. Salvar token no cookie
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: false, // coloque true em produção HTTPS
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    // 3. Buscar dados extras na tabela usuarios (opcional)
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
  let token = req.cookies.access_token;
  console.log("TOKEN:", req.cookies.access_token);

  if (!token) return res.redirect("/register.html");

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return res.redirect("/register.html");
  console.log("AUTH USER:", data.user);

  let userId = data.user.id;
  console.log("USER ID (auth):", userId);

  // Carregar dados do usuário
  const { data: userData, error: userError } = await supabase
    .from("usuarios")
    .select("name, saldo_vbucks, id_users, email")
    .eq("id", userId)
    .single();

  console.log("USER DATA (tabela usuarios):", userData);
  console.log("ERRO DA CONSULTA:", userError);

  if (userError) return res.status(500).send("Erro ao carregar dados");

  res.render("private", {
    name: userData.name,
    saldo_vbucks: userData.saldo_vbucks,
    id_users: userData.id_users,
    email: data.user.email,
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
  const { error: saveError } = await supabase.from("purchases").insert([
    {
      item_name: itemName,
      rarity: rarity,
      price_vbucks: price,
      image_url: image,
      user_id: userId,
    },
  ]);

  if (saveError) {
    console.log(saveError);
    return res
      .status(500)
      .json({ ok: false, message: "Error saving purchase" });
  }

  res.json({
    ok: true,
    novoSaldo: newBalance,
  });
});

// ========== INVENTÁRIO ==========
app.get("/inventory", async (req, res) => {
  const token = req.cookies.access_token;

  if (!token)
    return res.status(401).json({ ok: false, message: "Not authenticated" });

  const { data: userData } = await supabase.auth.getUser(token);
  const userId = userData.user.id;

  const { data: items } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId);

  res.json({ ok: true, items });
});

// ========== LOGOUT ==========
app.get("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/register.html");
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
app.use(express.static(path.join(__dirname, "public")));
