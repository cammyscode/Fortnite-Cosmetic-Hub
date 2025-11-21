// ------------------------------
// FUNÇÃO PRINCIPAL
// ------------------------------
async function loadGallery() {
  const gallery = document.getElementById("gallery");
  const url = "https://fortnite-api.com/v2/cosmetics";
  const shopUrl = "https://fortnite-api.com/v2/shop";
  const newInShop = "https://fortnite-api.com/v2/cosmetics/new";

  try {
    // Pega os preços da loja
    const responseShop = await fetch(shopUrl);
    const shopData = await responseShop.json();

    // Pega todos os cosméticos
    const responseCosmetics = await fetch(url);
    const itens = await responseCosmetics.json();

    // Pega todos os cosméticos novos
    const responseNewCosmetics = await fetch(newInShop);
    const newCosmetics = await responseNewCosmetics.json();

    let newItemIds = new Set();
    if (newCosmetics?.data?.items) {
      const categories = Object.values(newCosmetics.data.items);
      const allNewItems = categories.flat().filter((n) => n?.id);
      newItemIds = new Set(allNewItems.map((n) => n.id));
    }

    if (responseCosmetics.status !== 200) {
      gallery.innerHTML = `<p style="color:white;"><span style="color:yellow;" class="material-symbols-outlined">
brightness_alert
</span> API temporariamente indisponível (${itens.status})</p>`;
      console.warn("Erro da API:", itens.error);
      return;
    }

    console.log("Todos os Cosméticos:", itens);
    console.log("Todos os Preços:", shopData);
    // ------------------------------
    // MAPA DE PREÇOS
    // ------------------------------
    const shopItemsMap = new Map();
    if (shopData.data && shopData.data.entries) {
      shopData.data.entries.forEach((entry) => {
        const finalPrice = entry.finalPrice;
        const itemsList =
          entry.beans ||
          entry.lego ||
          entry.legoKits ||
          entry.brItems ||
          entry.tracks ||
          entry.cars ||
          entry.instruments ||
          entry.companions;

        if (itemsList) {
          itemsList.forEach((item) => {
            shopItemsMap.set(item.id, {
              finalPrice: finalPrice,
              regularPrice: item.price || finalPrice,
              currentlyInShop: true,
            });
          });
        }
      });
    }

    // ------------------------------
    // FILTRA OS QUE TEM IMAGEM
    // ------------------------------
    const allCosmeticsRaw = [
      ...(itens?.data ? Object.values(itens.data).flat() : []),
      ...(Array.isArray(newCosmetics?.data?.items)
        ? newCosmetics.data.items
        : []),
    ];
    const validItems = allCosmeticsRaw.filter(
      (item) =>
        item?.images &&
        (item.images.icon ||
          item.images.smallIcon ||
          item.images.small ||
          item.images.large)
    );

    // ------------------------------
    // FILTROS
    // ------------------------------
    const filterType = document.getElementById("filter-type");
    const filterRarity = document.getElementById("filter-rarity");
    const filterNew = document.getElementById("filter-new");
    const filterOnSale = document.getElementById("filter-on-sale");
    const filterForSale = document.getElementById("filter-for-sale");
    const searchName = document.getElementById("search-name");
    const searchDate = document.getElementById("search-date");

    const typesSet = new Set(
      validItems.map((item) => item.type?.value).filter(Boolean)
    );
    typesSet.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      filterType.appendChild(option);
    });

    const raritySet = new Set(
      validItems.map((item) => item.rarity?.value).filter(Boolean)
    );
    raritySet.forEach((rarity) => {
      const option = document.createElement("option");
      option.value = rarity;
      option.textContent = rarity;
      filterRarity.appendChild(option);
    });

    // ------------------------------
    // PAGINAÇÃO
    // ------------------------------
    let currentPage = 1;
    let perPage = parseInt(document.getElementById("per-page").value);

    const renderPage = () => {
      gallery.innerHTML = "";

      // Filtros selecionados
      const selectedType = filterType.value;
      const selectedRarity = filterRarity.value;

      // Aplica filtros
      console.log(
        "Exemplo de nomes:",
        validItems.slice(0, 5).map((i) => i.name)
      );
      const filteredItems = validItems.filter((item) => {
        const shopStatus = shopItemsMap.get(item.id);

        if (filterNew.checked && !newItemIds.has(item.id)) return false;
        if (
          searchName.value &&
          !(
            item.name &&
            item.name
              .replace(/[_-]/g, " ")
              .toLowerCase()
              .includes(searchName.value.toLowerCase())
          )
        )
          return false;

        if (
          filterForSale.checked &&
          (!shopStatus || shopStatus.finalPrice == null)
        )
          return false;
        if (
          filterOnSale.checked &&
          (!shopStatus ||
            !shopStatus.currentlyInShop ||
            shopStatus.finalPrice >= shopStatus.regularPrice)
        )
          return false;
        if (selectedType && item.type?.value !== selectedType) return false;
        if (selectedRarity && item.rarity?.value !== selectedRarity)
          return false;
        if (searchDate.value) {
          let filterInputDate;

          if (searchDate.value.includes("-")) {
            const parts = searchDate.value.split("-");
            if (parts[0].length === 4) {
              // yyyy-mm-dd
              filterInputDate = new Date(searchDate.value);
            } else {
              // dd-mm-yyyy
              const [day, month, year] = parts;
              filterInputDate = new Date(`${year}-${month}-${day}`);
            }
          } else {
            filterInputDate = new Date(searchDate.value);
          }

          const itemDate = new Date(item.added || 0);

          // Comparar apenas ano, mês e dia
          const sameDay =
            itemDate.getFullYear() === filterInputDate.getFullYear() &&
            itemDate.getMonth() === filterInputDate.getMonth() &&
            itemDate.getDate() === filterInputDate.getDate();

          if (!sameDay) return false;
        }

        return true;
      });

      // Paginação
      const start = (currentPage - 1) * perPage;
      const end = start + perPage;
      const itemsToShow = filteredItems.slice(start, end);

      // Renderiza cards
      itemsToShow.forEach((item) => {
        const div = document.createElement("div");
        div.classList.add("card");

        const section = document.createElement("section");
        section.classList.add("data-card");

        const img = document.createElement("img");
        img.src =
          item.images.icon || item.images.smallIcon || item.images.small;
        img.alt = item.name;
        img.title = item.name;
        img.width = 100;
        img.height = 100;

        const name = document.createElement("p");
        name.textContent = item.name
          .replace(/[_-]/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .trim();
        name.style.fontSize = "17px";
        name.style.fontWeight = "bold";
        name.style.textAlign = "left";

        const rarity = document.createElement("p");
        rarity.textContent = item.rarity.value;
        rarity.style.fontSize = "15px";
        rarity.style.color = "gray";

        // Novo badge
        if (newItemIds.has(item.id)) {
          const newBadge = document.createElement("span");
          newBadge.classList.add("status-badge");
          newBadge.textContent = "Novo";
          div.appendChild(newBadge);
        }

        // Preço
        const shopStatus = shopItemsMap.get(item.id);
        const divPrice = document.createElement("div");
        const price = document.createElement("p");
        const modal = document.createElement("div");
        divPrice.classList.add("price-container");
        modal.classList.add("modal");

        if (shopStatus && shopStatus.currentlyInShop) {
          // Ícone V-BUCK
          const vbuckImg = document.createElement("img");
          vbuckImg.id = "vbuck";
          vbuckImg.src = "./images/v-buck.png";
          vbuckImg.alt = "v-buck";

          // Preço
          const priceValue = document.createElement("span");
          priceValue.classList.add("price-value");
          priceValue.textContent = shopStatus.finalPrice;

          // Botão do carrinho
          const inShopBadge = document.createElement("span");
          inShopBadge.classList.add("in-shop-cosmetics");
          inShopBadge.innerHTML = '<i class="fa-solid fa-cart-shopping"></i>';

          divPrice.appendChild(vbuckImg);
          divPrice.appendChild(priceValue);
          divPrice.appendChild(inShopBadge);

          divPrice.addEventListener("click", () => {
            const isNew = newItemIds.has(item.id);
            const modal = document.createElement("div");
            modal.classList.add("modal-item");

            modal.innerHTML = `
      <div class="modal-card">
        <span class="close-btn">&times;</span>
        <img src="${img.src}" class="modal-img">
        <h2>${name.textContent}</h2>
        <p style="color:gray;">${item.rarity.value}</p>
        ${isNew ? `<div class="status-badge">Novo</div>` : ""}
        <div class="modal-price">
          <img src="./images/v-buck.png" class="modal-vbuck">
          <span>${shopStatus.finalPrice}</span>
          <i class="fa-solid fa-cart-shopping modal-cart"></i>
        </div>
        <button class="buy-btn">Comprar</button>
      </div>
    `;

            document.body.appendChild(modal);

            modal.querySelector(".close-btn").addEventListener("click", () => {
              modal.remove();
            });

            modal.querySelector(".buy-btn").addEventListener("click", () => {
              alert("Compra realizada com sucesso!");
              modal.remove();
            });
          });
        } else {
          divPrice.addEventListener("click", () => {
            const isNew = newItemIds.has(item.id);
            const modal = document.createElement("div");
            modal.classList.add("modal-item");

            modal.innerHTML = `
      <div class="modal-card">
        <span class="close-btn">&times;</span>
        <img src="${img.src}" class="modal-img">
        <h2>${name.textContent}</h2>
        <p style="color:gray;">${item.rarity.value}</p>
        ${isNew ? `<div class="status-badge">Novo</div>` : ""}
        <p class="buy-btn" id="un">Indispnível</p>
      </div>
    `;
            document.body.appendChild(modal);
            modal.querySelector(".close-btn").addEventListener("click", () => {
              modal.remove();
            });
            const unavailable = document.querySelector("#un");
            unavailable.style.color = "lightgray";
          });
          divPrice.textContent = "Indisponível";
          divPrice.style.color = "lightgray";
        }

        section.appendChild(name);
        section.appendChild(rarity);

        div.appendChild(img);
        div.appendChild(section);
        div.appendChild(divPrice);
        gallery.appendChild(div);
      });

      // Atualiza info da página
      const pageInfo = document.getElementById("page-info");
      if (pageInfo)
        pageInfo.textContent = `Página ${currentPage} / ${Math.ceil(
          filteredItems.length / perPage
        )}`;
    };

    // ------------------------------
    // LISTENERS DE FILTRO
    // ------------------------------
    [
      filterType,
      filterRarity,
      filterNew,
      filterOnSale,
      filterForSale,
      searchDate,
    ].forEach((el) =>
      el.addEventListener("change", () => {
        currentPage = 1;
        renderPage();
      })
    );
    searchName.addEventListener("input", () => {
      currentPage = 1;
      renderPage();
    });

    // ------------------------------
    // LISTENERS DE PAGINAÇÃO
    // ------------------------------
    document.getElementById("next-page").addEventListener("click", () => {
      currentPage++;
      renderPage();
    });

    document.getElementById("prev-page").addEventListener("click", () => {
      if (currentPage > 1) currentPage--;
      renderPage();
    });

    document.getElementById("per-page").addEventListener("change", (e) => {
      perPage = parseInt(e.target.value);
      currentPage = 1;
      renderPage();
    });

    // Renderiza primeira página
    renderPage();
  } catch (error) {
    gallery.innerHTML = `<p style="color:red;"><i class="fa-solid fa-x"></i> Erro ao carregar cosméticos.</p>`;
    console.error(error);
  }
}

loadGallery();
