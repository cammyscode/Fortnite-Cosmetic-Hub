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

const profilePhotoElement = document.getElementById("profilePhoto");
const btnChangePhoto = document.getElementById("btn-change-photo");
const photoInput = document.getElementById("photoInput");
const btnSavePhoto = document.getElementById("btn-save-photo");
const photoControls = document.querySelector(".photo-controls");

const usersListContainer = document.getElementById("users-list");
// ================================
storeContainer.style.display = "none";
bundlesContainer.style.display = "none";
publicContainer.style.display = "none";
profileContainer.style.display = "flex";

//Função para salvar a foto de perfil
let tempPhotoData = null;

btnChangePhoto.addEventListener("click", () => {
  photoInput.click();
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) return;

  tempPhotoData = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    profilePhotoElement.src = e.target.result;
  };
  reader.readAsDataURL(file);

  photoControls.classList.add("visible");
  btnSavePhoto.disabled = false;
});

// Enviar a imagem ao backend
btnSavePhoto.addEventListener("click", async () => {
  if (!tempPhotoData) return;

  const formData = new FormData();
  formData.append("photo", tempPhotoData);

  const response = await fetch("/update-photo", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  console.log(data);

  if (data.ok) {
    profilePhotoElement.src = data.url;
    alert("Foto atualizada!");
  } else {
    alert("Erro ao salvar foto.");
  }

  tempPhotoData = null;
  btnSavePhoto.disabled = true;
  photoControls.classList.remove("visible");
  photoInput.value = "";
});

// Função para carregar o inventário do usuário
async function carregarInventario() {
  const response = await fetch("/inventory");
  const data = await response.json();

  console.log(data);

  if (!data.ok) {
    console.error("Erro ao carregar inventário");
    return;
  }

  list.innerHTML = "";

  data.items.forEach((item) => {
    const li = document.createElement("li");
    li.dataset.purchaseId = item.id;
    li.dataset.price = item.price_vbucks;

    li.innerHTML = `
  <img src="${item.image_url}" width="60">
  <strong>${item.item_name}</strong>  
  <span> (${item.rarity})</span>
  <span style="display:none;" class="price">${item.price_vbucks}</span>
`;

    list.appendChild(li);
  });
}
if (window.location.pathname === "/private") {
  document.addEventListener("DOMContentLoaded", carregarInventario);
}

// Abrir modal do inventário ao clicar em um item
list.addEventListener("click", (event) => {
  const item = event.target.closest("li");
  if (!item) return;

  const divCard = document.createElement("div");
  divCard.classList.add("element-inventory");
  divCard.innerHTML = `
    <div class="modal-inventory-card">
      <button class="close-button">x</button>  
      ${item.innerHTML}
      <button class="buy-btn" id="btn-return">Devolver Item</button>
    </div>
  `;

  document.body.appendChild(divCard);

  const returnButton = divCard.querySelector("#btn-return");
  returnButton.addEventListener("click", async () => {
    const purchaseId = item.dataset.purchaseId;
    const priceItem = item.dataset.price;

    const responseReturn = await fetch("/return", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ purchaseId, priceItem }),
    });

    const result = await responseReturn.json();

    if (result.ok) {
      alert("Item devolvido!");
      divCard.remove();
      carregarInventario();
    } else {
      alert("Erro ao devolver item");
    }
  });

  const cardsContainer = divCard;
  const closeButton = divCard.querySelector(".close-button");

  // Fechar clicando no X
  closeButton.addEventListener("click", () => {
    cardsContainer.remove();
  });

  // Fechar clicando fora
  cardsContainer.addEventListener("click", (e) => {
    if (e.target === cardsContainer) {
      cardsContainer.remove();
    }
  });
});

// Função principal de renderização de usuários
async function renderPublicUsers() {
  usersListContainer.innerHTML = `<p style="color: lightgray">Carregando dados dos usuários...</p>`;

  try {
    const response = await fetch("/public-users");
    const data = await response.json();

    if (!data.ok) {
      usersListContainer.innerHTML = `<p style="color:red;">Erro ao carregar usuários: ${data.message}</p>`;
      return;
    }

    usersListContainer.innerHTML = ""; // Limpa a mensagem de carregamento

    data.users.forEach((user) => {
      const card = document.createElement("div");
      card.classList.add("user-card-public");
      card.dataset.userId = user.id;

      // Prévia dos 6 primeiros itens
      const previewHtml = user.preview
        .map(
          (item) =>
            `<img src="${item.image}" alt="${item.name}" class="inventory-item-small" title="${item.name} (${item.rarity})">`
        )
        .join("");

      // Se não houver itens, mostra uma mensagem
      const inventoryPreview =
        user.preview.length > 0
          ? previewHtml
          : `<p>Sem itens no inventário.</p>`;

      card.innerHTML = `
                <img src="${user.user_pic}" alt="${user.name}" class="user-photo-public">
                <h3>${user.name}</h3>
                <div class="user-inventory-preview">
                    ${inventoryPreview}
                </div>
                <p style="margin-top: 10px; font-size: 0.8rem; color: var(--highlight-color);">Ver inventário</p>
            `;

      card.addEventListener("click", () => openPublicInventoryModal(user));
      usersListContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Erro no fetch de usuários públicos:", error);
    usersListContainer.innerHTML = `<p style="color:red;">Erro ao conectar com o servidor.</p>`;
  }
}

// Função para abrir o modal de inventário completo
function openPublicInventoryModal(user) {
  const inventoryGridHtml = user.inventory
    .map(
      (item) => `
        <div class="modal-inventory-item">
            <img src="${item.image}" alt="${item.name}">
            <span style="font-weight: bold;">${item.name}</span>
            <span>${item.rarity}</span>
        </div>
    `
    )
    .join("");

  // Conteúdo do modal
  modalInv.innerHTML = `
        <div class="public-modal-content">
            <div class="modal-header">
                <h3>Inventário de ${user.name}</h3>
            </div>
            <div class="modal-inventory-grid">
                ${
                  user.inventory.length > 0
                    ? inventoryGridHtml
                    : '<p style="color: lightgray;">Este usuário ainda não possui itens.</p>'
                }
            </div>
            <button class="close-btn" id="close-public-modal">x</button>
        </div>
    `;

  // Exibir o modal
  modalInv.style.display = "flex";

  // Adicionar listener para fechar o modal
  const closeButton = document.getElementById("close-public-modal");
  closeButton.addEventListener(
    "click",
    () => (modalInv.style.display = "none")
  );

  // Fechar clicando fora
  modalInv.addEventListener("click", (e) => {
    if (e.target.id === "public-inventory-modal") {
      modalInv.style.display = "none";
    }
  });
}

// Expõe a função para ser chamada pelo navigation.js
window.renderPublicUsers = renderPublicUsers;

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
