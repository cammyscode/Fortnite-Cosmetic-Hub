require("dotenv").config();

const express = require("express");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const bodyParser = require("body-parser");
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

// ---------- ROTA INICIAL (HTML NORMAL) ----------
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "index.html"));
});

// ========== CADASTRO ==========
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const { data: signupData, error: signupError } =
      await supabase.auth.signUp({
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

    // Se o Supabase não criar uma sessão direta
    if (!signupData?.user || !signupData?.session) {
      return res.status(200).json({
        ok: true,
        message: "Cadastro concluído! Faça login.",
        redirect: "/register.html",
      });
    }

    // INSERIR PERFIL NA TABELA
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
    }

    // Salvar cookie
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

// ========== ROTA PRIVADA (AGORA USA EJS!) ==========
app.get("/private", async (req, res) => {
  const token = req.cookies.access_token;

  if (!token) return res.redirect("/register.html");

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return res.redirect("/register.html");

  const userId = data.user.id;

  try {
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("name, saldo_vbucks")
      .eq("id", userId)
      .single();

    if (userError || !userData)
      return res.status(500).send("Erro ao buscar dados do usuário.");

    // Agora renderiza o PRIVATE.EJS !!!
    res.render("private", {
      name: userData.name,
      vbucks: userData.saldo_vbucks,
      userData: JSON.stringify(userData),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro interno ao carregar página privada.");
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
