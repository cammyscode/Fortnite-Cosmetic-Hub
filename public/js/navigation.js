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

      // CHAVE DO INVENTÁRIO DO USUÁRIO ATUAL
      window.getUserInventoryKey = () => {
        const id = (window.USER_DATA && window.USER_DATA.name) || "guest";
        return `inventory_${id}`;
      };

      // CHAVE DA FOTO DO USUÁRIO ATUAL
      window.getUserPhotoKey = (name) => {
        return `photo_${name || window.USER_DATA.name}`;
      };

      // INVENTÁRIO
      window.getInventory = () => {
        const key = window.getUserInventoryKey();
        return JSON.parse(localStorage.getItem(key)) || [];
      };

      window.saveInventory = (list) => {
        const key = window.getUserInventoryKey();
        localStorage.setItem(key, JSON.stringify(list));
      };

      // LISTA DE TODOS OS USUÁRIOS
      window.getAllUsers = () => {
        return JSON.parse(localStorage.getItem("allUsers")) || [];
      };

      window.saveAllUsers = (usersList) => {
        localStorage.setItem("allUsers", JSON.stringify(usersList));
      };

      // SALVA O USUÁRIO ATUAL NA LISTA DE USUÁRIOS
      window.registerUser = () => {
        const currentName = window.USER_DATA.name;
        const allUsers = window.getAllUsers();
        const userExists = allUsers.some((user) => user.name === currentName);

        if (!userExists) {
          allUsers.push({ name: currentName });
          window.saveAllUsers(allUsers);
        }
      };

      // FUNÇÕES DE FOTO DE PERFIL

      // Carrega a foto salva do localStorage
      window.loadProfilePhoto = () => {
        const userPhotoKey = window.getUserPhotoKey();
        const savedPhoto = localStorage.getItem(userPhotoKey);

        if (savedPhoto) {
          profilePhotoElement.src = savedPhoto;
        } else {
          profilePhotoElement.src = "https://i.imgur.com/6VBx3io.png";
        }
      };

      // Alterna visibilidade dos controles de foto
      document
        .getElementById("btn-change-photo")
        .addEventListener("click", () => {
          photoControls.classList.toggle("visible");
          if (!photoControls.classList.contains("visible")) {
            tempPhotoData = null;
            btnSavePhoto.disabled = true;
            photoInput.value = "";
            window.loadProfilePhoto();
          }
        });

      // Pré-visualiza a foto selecionada
      photoInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (!file) {
          btnSavePhoto.disabled = true;
          return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
          tempPhotoData = e.target.result;
          profilePhotoElement.src = tempPhotoData;
          btnSavePhoto.disabled = false;
        };
        reader.readAsDataURL(file);
      });

      // Salva a foto no localStorage
      btnSavePhoto.addEventListener("click", () => {
        if (tempPhotoData) {
          const userPhotoKey = window.getUserPhotoKey();
          localStorage.setItem(userPhotoKey, tempPhotoData);
          alert("Foto de perfil salva com sucesso!");

          // Esconde os controles e reseta o estado
          photoControls.classList.remove("visible");
          tempPhotoData = null;
          btnSavePhoto.disabled = true;
          photoInput.value = "";
        }
      });

      // FUNÇÕES DE RENDERIZAÇÃO

      // Renderiza a lista de itens do inventário
      window.renderInventory = () => {
        const inventoryList = document.querySelector(".item-list");
        if (!inventoryList) return;

        const inventory = window.getInventory();
        inventoryList.innerHTML = "";

        inventory.forEach((item) => {
          const li = document.createElement("li");

          li.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div style="margin-left:10px;">
                <strong>${item.name
                  .replace(/([a-z])([A-Z])/g, "$1 $2")
                  .trim()}</strong><br>
                <span style="color:gray;">${item.rarity}</span>
            </div>
            `;
          inventoryList.appendChild(li);
        });
      };

      // Renderiza a lista pública de usuários
      window.renderPublicUsers = () => {
        const usersListContainer = document.getElementById("users-list");
        const allUsers = window.getAllUsers();
        usersListContainer.innerHTML = "";

        if (allUsers.length === 0) {
          usersListContainer.innerHTML =
            "<p style='color: lightgray;'>Nenhum usuário cadastrado ainda.</p>";
          return;
        }

        allUsers.forEach((user) => {
          const userKey = `inventory_${user.name}`;
          const inventory = JSON.parse(localStorage.getItem(userKey)) || [];
          const userPhoto =
            localStorage.getItem(window.getUserPhotoKey(user.name)) ||
            "https://i.imgur.com/6VBx3io.png";

          const card = document.createElement("div");
          card.classList.add("user-card-public");
          card.setAttribute("data-username", user.name);

          let inventoryPreviewHtml = "";
          const previewItems = inventory.slice(0, 4);
          if (previewItems.length > 0) {
            previewItems.forEach((item) => {
              inventoryPreviewHtml += `<img src="${
                item.image
              }" class="inventory-item-small" alt="${
                item.name.split(" ")[0]
              }">`;
            });
          } else {
            inventoryPreviewHtml =
              "<p style='font-size: 0.8em; margin: 0;'>Inventário Vazio</p>";
          }

          card.innerHTML = `
            <img src="${userPhoto}" class="user-photo-public" alt="${
            user.name
          }">
            <h3>${user.name.split(" ")[0]}</h3>
            <div class="user-inventory-preview">${inventoryPreviewHtml}</div>
          `;

          // Listener para abrir o modal
          card.addEventListener("click", () => {
            window.openPublicInventoryModal(user.name, inventory, userPhoto);
          });

          usersListContainer.appendChild(card);
        });
      };

      // Abre modal de inventário público
      window.openPublicInventoryModal = (username, inventory, userPhoto) => {
        const modal = document.getElementById("public-inventory-modal");
        const modalContent = document.createElement("div");
        modalContent.classList.add("public-modal-content");
        modal.innerHTML = "";

        let inventoryGridHtml = "";
        if (inventory.length > 0) {
          inventory.forEach((item) => {
            inventoryGridHtml += `
                      <div class="modal-inventory-item">
                          <img src="${item.image}" alt="${item.name}">
                          <span>${item.rarity}</span>
                      </div>
                  `;
          });
        } else {
          inventoryGridHtml = "<p>O inventário deste usuário está vazio.</p>";
        }

        modalContent.innerHTML = `
              <div class="modal-header">
                  <h3>Inventário de ${username}</h3>
                  <span class="close-btn">&times;</span>
              </div>
              <img src="${userPhoto}" class="user-photo-public" style="width: 100px; height: 100px; margin-bottom: 20px;" alt="${username}">
              <div class="modal-inventory-grid">
                  ${inventoryGridHtml}
              </div>
          `;

        modal.appendChild(modalContent);
        modal.style.display = "flex";

        // Fechar o modal
        modalContent
          .querySelector(".close-btn")
          .addEventListener("click", () => {
            modal.style.display = "none";
          });

        // Fechar clicando fora
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            modal.style.display = "none";
          }
        });
      };

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
        hideAllViews();
        profileContainer.style.display = "flex";
        window.renderInventory();
        window.loadProfilePhoto();

        // Esconde os controles de foto ao voltar para o perfil
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

      // Ir para a Lista de Usuários (NOVO)
      btnPublic.addEventListener("click", () => {
        hideAllViews();
        publicContainer.style.display = "block";
        window.renderPublicUsers();
      });

      // Fazer logout
      logoutButton.addEventListener("click", () => {
        window.location.href = "/logout";
      });

      // Inicialização
      document.addEventListener("DOMContentLoaded", () => {
        window.registerUser();
        window.renderInventory();
        window.loadProfilePhoto();
      });
 
