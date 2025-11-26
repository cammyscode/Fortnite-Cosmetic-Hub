require("dotenv").config();

const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cookieParser = require("cookie-parser");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const upload = multer();

// ======================
// CONFIGURAÇÕES INICIAIS
// ======================
const app = express();
const PORT = 4000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ======================
// CONFIGURA EJS
// ======================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ======================
// MIDDLEWARES
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

// arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// ======================
// ROTAS PÚBLICAS
// ======================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ========== CADASTRO ==========
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (signupError) {
    return res.status(400).json({
      ok: false,
      message: signupError.message,
    });
  }

  const VBUCKS_INICIAL = 10000;

  await supabase.from("usuarios").insert([
    {
      id: signupData.user.id,
      name,
      email,
      ativo: true,
      saldo_vbucks: VBUCKS_INICIAL,
      id_users: signupData.user.id,
    },
  ]);

  res.json({
    ok: true,
    message: "Cadastro concluído! Faça login.",
  });
});

// ========== LOGIN ==========
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res
      .status(401)
      .json({ ok: false, message: "Email ou senha inválidos" });
  }

  const token = data.session.access_token;

  res.cookie("access_token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  });

  res.json({ ok: true, message: "Login realizado!" });
});

// ========== LOGOUT ==========
app.get("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/register.html");
});

// ======================
// ROTA PRIVADA
// ======================
app.get("/private", async (req, res) => {
  const token = req.cookies.access_token;

  if (!token) return res.redirect("/index.html");

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return res.redirect("/register.html");

  const userId = data.user.id;

  const { data: userData } = await supabase
    .from("usuarios")
    .select("name, saldo_vbucks, id_users, email, user_pic")
    .eq("id", userId)
    .single();

  res.render("private", {
    name: userData.name,
    saldo_vbucks: userData.saldo_vbucks,
    id_users: userData.id_users,
    email: userData.email,
    user_pic: userData.user_pic,
  });
});

// ======================
// COMPRAR / INVENTÁRIO
// ======================
app.post("/buy", async (req, res) => {
  const token = req.cookies.access_token;

  const { data: userData } = await supabase.auth.getUser(token);

  const userId = userData.user.id;
  const { itemName, rarity, price, image } = req.body;

  const { data: userRow } = await supabase
    .from("usuarios")
    .select("saldo_vbucks")
    .eq("id", userId)
    .single();

  if (userRow.saldo_vbucks < price) {
    return res.json({ ok: false, message: "Saldo insuficiente" });
  }

  const newBalance = userRow.saldo_vbucks - price;

  await supabase
    .from("usuarios")
    .update({ saldo_vbucks: newBalance })
    .eq("id", userId);

  await supabase.from("purchases").insert([
    {
      item_name: itemName,
      rarity,
      price_vbucks: price,
      image_url: image,
      user_id: userId,
    },
  ]);

  res.json({ ok: true, novoSaldo: newBalance });
});

app.get("/inventory", async (req, res) => {
  const token = req.cookies.access_token;

  const { data: userData } = await supabase.auth.getUser(token);

  const userId = userData.user.id;

  const { data: items } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId);

  res.json({ ok: true, items });
});

// ======================
// DEVOLVER ITEM
// ======================
app.post("/return", async (req, res) => {
  const { priceItem, purchaseId } = req.body;
  const token = req.cookies.access_token;

  const { data: authUser } = await supabase.auth.getUser(token);

  const userId = authUser.user.id;

  const { data: rowUser } = await supabase
    .from("usuarios")
    .select("saldo_vbucks")
    .eq("id", userId)
    .single();

  const newBalance = rowUser.saldo_vbucks + Number(priceItem);

  await supabase
    .from("usuarios")
    .update({ saldo_vbucks: newBalance })
    .eq("id", userId);

  await supabase.from("purchases").delete().eq("id", purchaseId);

  res.json({ ok: true, novoSaldo: newBalance });
});

// ======================
// ATUALIZAR FOTO
// ======================
app.post("/update-photo", upload.single("photo"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.json({ ok: false, message: "Nenhuma foto enviada" });
  }

  const token = req.cookies.access_token;

  const { data: userData } = await supabase.auth.getUser(token);
  const userId = userData.user.id;

  const fileName = `${userId}-${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("user_photos")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    return res.json({ ok: false, message: "Erro no upload" });
  }

  const { data: urlData } = supabase.storage
    .from("user_photos")
    .getPublicUrl(fileName);

  await supabase
    .from("usuarios")
    .update({ user_pic: urlData.publicUrl })
    .eq("id", userId);

  res.json({ ok: true, url: urlData.publicUrl });
});

// ======================
// INICIAR SERVIDOR
// ======================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
