document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------------
  // SELEÇÃO DE VARIÁVEIS ÚNICA
  // -------------------------------------

  // Desktop / Links Gerais
  const login = document.querySelector("#open-auth-btn");
  const btnAllCosmetics = document.querySelector("#all-cosmetics");
  const btnBundles = document.querySelector("#pack");
  const dropdownMenu = document.getElementById("menu-popup");
  const storeBtn = document.querySelector(".store-btn");

  // Mobile / Menu Lateral
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  const sideMenu = document.getElementById("side-menu");
  const closeSideMenu = document.getElementById("close-side-menu");
  const storeBtnMobile = document.querySelector(".store-btn-mobile");
  const dropdownMenuMobile = document.querySelector(".dropdown-menu-mobile");

  // Links de navegação mobile (Mapeamento)
  const linksMobile = {
    allCosmetics: document.getElementById("all-cosmetics-mobile"),
    bundles: document.getElementById("pack-mobile"),
    profile: document.getElementById("btn-profile-mobile"),
    users: document.getElementById("btn-public-mobile"),
    login: document.getElementById("open-auth-btn-mobile"),
  };

  // -------------------------------------
  // FUNÇÕES
  // -------------------------------------
  const closeMobileMenu = () => {
    if (sideMenu && sideMenu.classList.contains("open")) {
      sideMenu.classList.remove("open");
    }
  };

  // -------------------------------------
  // LÓGICA DO DROPDOWN (Desktop)
  // -------------------------------------
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

  // -------------------------------------
  // LÓGICA DO MENU LATERAL (Mobile)
  // -------------------------------------
  // Abrir menu ao clicar no bars
  if (mobileMenuToggle && sideMenu) {
    mobileMenuToggle.addEventListener("click", (event) => {
      sideMenu.classList.add("open");
      event.stopPropagation();
    });

    // Fechar menu (Clique no X)
    if (closeSideMenu) {
      closeSideMenu.addEventListener("click", closeMobileMenu);
    }

    // Fechar menu (Clique FORA do menu)
    document.addEventListener("click", (event) => {
      // Verifica se o clique não foi dentro do menu lateral E o menu está aberto
      if (
        !sideMenu.contains(event.target) &&
        sideMenu.classList.contains("open")
      ) {
        if (
          event.target !== mobileMenuToggle &&
          !mobileMenuToggle.contains(event.target)
        ) {
          closeMobileMenu();
        }
      }
    });

    // Fechar menu (Tecla ESC)
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && sideMenu.classList.contains("open")) {
        closeMobileMenu();
      }
    });
  }

  // Dropdown mobile (dentro do side menu)
  if (storeBtnMobile && dropdownMenuMobile) {
    storeBtnMobile.addEventListener("click", (event) => {
      dropdownMenuMobile.classList.toggle("show");
      event.stopPropagation();
    });
  }

  // -------------------------------------
  // EVENTOS DE NAVEGAÇÃO (Desktop & Mobile)
  // -------------------------------------
  // Função helper para lidar com navegação de links 
  const handleNavigation = (linkElement, path, isMobile = false) => {
    if (linkElement) {
      linkElement.addEventListener("click", () => {
        if (isMobile) {
          closeMobileMenu();
        }
        window.location.href = path;
      });
    }
  };

  // Desktop
  handleNavigation(btnAllCosmetics, "/store.html");
  handleNavigation(btnBundles, "/bundles.html");
  handleNavigation(login, "/register.html");

  // Mobile (URLs são as mesmas, mas com fechamento de menu)
  handleNavigation(linksMobile.allCosmetics, "/store.html", true);
  handleNavigation(linksMobile.bundles, "/bundles.html", true);
  handleNavigation(linksMobile.profile, "/register.html", true);
  handleNavigation(linksMobile.login, "/register.html", true);
});
