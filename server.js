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

app.use(express.static(path.join(__dirname, "public")));

// ---------- MIDDLEWARES ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.static("public"));

// ---------- ROTA INICIAL ----------
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "index.html"));
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
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ ok: false, message: error.message });
  }

  res.cookie("access_token", data.session.access_token, { httpOnly: true });
  res.redirect("/private");
});

// ========== ROTA PRIVADA ==========
app.get("/private", async (req, res) => {
  const token = req.cookies.access_token;

  if (!token) return res.redirect("/register.html");

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) return res.redirect("/register.html");

  const userId = data.user.id;

  // Carregar dados na tabela correta
  const { data: userData, error: userError } = await supabase
    .from("usuarios")
    .select("id, name, saldo_vbucks")
    .eq("id", userId)
    .single();

  if (userError) return res.status(500).send("Erro ao carregar dados");

  res.render("private", {
    name: userData.name,
    vbucks: userData.saldo_vbucks,
  });
});

// ========== COMPRAR ==========
app.post("/buy", async (req, res) => {
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(401).json({ ok: false, message: "Não autenticado" });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(
      token
    );
    if (userError || !userData?.user) {
      return res
        .status(401)
        .json({ ok: false, message: "Token inválido ou sessão expirada" });
    }

    const userId = userData.user.id;

    // Busca saldo do usuário
    const { data: usuario, error: fetchBalanceError } = await supabase
      .from("usuarios")
      .select("saldo_vbucks")
      .eq("id", userId)
      .single();

    if (fetchBalanceError || !usuario) {
      return res
        .status(500)
        .json({ ok: false, message: " Erro ao buscar dados do usuário." });
    }

    const { itemId, price } = req.body;
    const itemPrice = parseInt(price, 10);

    if (usuario.saldo_vbucks < itemPrice) {
      return res
        .status(400)
        .json({ ok: false, message: " Saldo insuficiente de V-Bucks." });
    }

    const novoSaldo = usuario.saldo_vbucks - itemPrice;

    const { error: updateError } = await supabase
      .from("usuarios")
      .update({ saldo_vbucks: novoSaldo })
      .eq("id", userId);

    if (updateError) {
      console.error(" Erro ao atualizar saldo:", updateError);
      return res
        .status(500)
        .json({ ok: false, message: " Erro ao deduzir saldo." });
    }

    res.json({
      ok: true,
      message: "Compra realizada com sucesso!",
      novoSaldo: novoSaldo,
    });
  } catch (err) {
    console.error("Erro interno no /buy:", err);
    res.status(500).json({ ok: false, message: "Erro interno do servidor." });
  }
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
