// VARIÁVEIS DE NAVEGAÇÃO / SELEÇÃO
const profileContainer = document.querySelector(".user-panel");
const storeContainer = document.querySelector(".hidden-store");
const bundlesContainer = document.querySelector(".hidden-bundles");
const publicContainer = document.querySelector(".hidden-public");

const btnAllCosmetics = document.querySelector("#all-cosmetics");
const btnBundles = document.querySelector("#pack");
const logoutButton = document.querySelector("#logout");
const btnProfile = document.querySelector("#btn-profile");
const btnPublic = document.querySelector("#btn-public");
const dropdownMenu = document.getElementById("menu-popup");
const storeBtn = document.querySelector(".store-btn");
const list = document.getElementById("inventory-list");
const modalInv = document.querySelector(".public-modal-inventory");

const photoInput = document.getElementById("photoInput");
const btnSavePhoto = document.getElementById("btn-save-photo");
const photoControls = document.querySelector(".photo-controls");
const profilePhotoElement = document.getElementById("profilePhoto");

// ================================
storeContainer.style.display = "none";
bundlesContainer.style.display = "none";
publicContainer.style.display = "none";
profileContainer.style.display = "flex";

// Armazena a foto temporariamente antes de salvar
let tempPhotoData = null;

// Função para carregar o inventário do usuário
async function carregarInventario() {
  const response = await fetch("/inventory");
  const data = await response.json();

  if (!data.ok) {
    console.error("Erro ao carregar inventário");
    return;
  }

  list.innerHTML = "";

  data.items.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${item.image_url}" width="60">
      <strong>${item.item_name}</strong>  
      <span> (${item.rarity})</span>
    `;
    list.appendChild(li);
  });
}
document.addEventListener("DOMContentLoaded", carregarInventario);

// Abrir modal do inventário ao clicar em um item
list.addEventListener("click", (event) => {
  const divCard = document.createElement("div");
  divCard.classList.add("element-inventory");
  divCard.innerHTML = `
    <div class="modal-inventory-card">
      <span class="close-button">x</span>  
      ${event.target.innerHTML}
      <button class="buy-btn">Devolver Item</button>
    </div>
  `;
  document.body.appendChild(divCard);
});

// EVENT LISTENERS DE NAVEGAÇÃO
function hideAllViews() {
  profileContainer.style.display = "none";
  bundlesContainer.style.display = "none";
  storeContainer.style.display = "none";
  publicContainer.style.display = "none";
  dropdownMenu.classList.remove("show");
}

// Abrir/Fechar dropdown
storeBtn.addEventListener("click", (event) => {
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

// Ir para o Perfil
btnProfile.addEventListener("click", () => {
  window.location.href = "/private";
  photoControls.classList.remove("visible");
  tempPhotoData = null;
  btnSavePhoto.disabled = true;
  photoInput.value = "";
});

// Ir para a Loja de Cosmetics
btnAllCosmetics.addEventListener("click", () => {
  hideAllViews();
  storeContainer.style.display = "block";
});

// Ir para a Loja de Bundles
btnBundles.addEventListener("click", () => {
  hideAllViews();
  bundlesContainer.style.display = "flex";
});

// Ir para a Lista de Usuários
btnPublic.addEventListener("click", () => {
  hideAllViews();
  publicContainer.style.display = "block";
  window.renderPublicUsers();
});

// Fazer logout
logoutButton.addEventListener("click", () => {
  window.location.href = "/logout";
});

