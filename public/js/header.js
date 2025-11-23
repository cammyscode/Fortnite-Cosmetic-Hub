document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------
    // SELEÇÃO DE VARIÁVEIS 
    // ------------------------------
    const login = document.querySelector("#open-auth-btn");
    const btnAllCosmetics = document.querySelector("#all-cosmetics");
    const btnBundles = document.querySelector("#pack");
    const dropdownMenu = document.getElementById("menu-popup");
    const storeBtn = document.querySelector(".store-btn");

    // ------------------------------
    // LÓGICA DO DROPDOWN
    // ------------------------------

    if (storeBtn && dropdownMenu) {
        storeBtn.addEventListener("click", (event) => {
            console.log("CLIQUE NO BOTÃO LOJA DETECTADO.");
            dropdownMenu.classList.toggle("show");
            event.stopPropagation();
        });
        document.addEventListener("click", (event) => {
            if (
                !dropdownMenu.contains(event.target) &&
                dropdownMenu.classList.contains("show")
            ) {
                dropdownMenu.classList.remove("show");
            }
        });
    }

    // ------------------------------
    // EVENTOS DE NAVEGAÇÃO
    // ------------------------------

    // Ir para a Loja de Cosmetics
    if (btnAllCosmetics) {
        btnAllCosmetics.addEventListener("click", () => {
            window.location.href = "/store.html";
        });
    }

    // Ir para a Loja de Bundles
    if (btnBundles) {
        btnBundles.addEventListener("click", () => {
            window.location.href = "/bundles.html";
        });
    }

    // Fazer login / cadastrar 
    if (login) {
        login.addEventListener("click", () => {
            window.location.href = "/register.html";
        });
    }
});