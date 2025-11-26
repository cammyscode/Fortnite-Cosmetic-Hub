async function loadGallery() {
  const gallery = document.getElementById("gallery-bundles");
  const shopUrl = "https://fortnite-api.com/v2/shop";

  try {
    // -------------------------
    // BUSCA A LOJA
    // -------------------------
    const responseShop = await fetch(shopUrl);
    const shopData = await responseShop.json();

    const entries = shopData?.data?.entries ?? [];

    // -------------------------
    // FILTRA SOMENTE BUNDLES
    // -------------------------
    const bundles = entries.filter(
      (entry) => entry.bundle && entry.bundle.image
    );

    console.log("Bundles encontrados:", bundles);

    // -------------------------
    // FUNÇÃO PARA PEGAR ITENS
    // -------------------------
    function extractBundleItems(entry) {
      if (Array.isArray(entry.items) && entry.items.length > 0) {
        return entry.items;
      }

      if (Array.isArray(entry.items) && entry.items[0]?.items) {
        return entry.items.flatMap((x) => x.items);
      }

      if (entry.brItems?.length > 0) return entry.brItems;
      if (entry.cars?.length > 0) return entry.cars;
      if (entry.granted?.length > 0) return entry.granted;

      return [];
    }

    // -------------------------
    // RENDERIZA NA TELA
    // -------------------------
    bundles.forEach((entry) => {
      const containerBundle = document.createElement("div");
      containerBundle.classList.add("container-bundle");

      const card = document.createElement("div");
      card.classList.add("card-bundle");

      const img = document.createElement("img");
      img.src = entry.bundle.image;
      img.alt = entry.bundle.name;
      img.title = entry.bundle.name;

      const priceC = document.createElement("div");
      priceC.classList.add("price-container-bundle");

      const title = document.createElement("h3");
      title.textContent = entry.bundle.name;

      priceC.appendChild(title);

      if (entry.finalPrice < entry.regularPrice) {
        const priceRegular = document.createElement("p");
        priceRegular.classList.add("regular");
        priceRegular.textContent = `${entry.regularPrice}`;

        const discount = document.createElement("p");
        discount.classList.add("disc");
        discount.textContent = entry.banner?.value ?? "";

        priceC.appendChild(priceRegular);
        priceC.appendChild(discount);
      } else {
        const priceRegular = document.createElement("p");
        priceRegular.classList.add("regular");
        priceRegular.textContent = "-";
        priceC.appendChild(priceRegular);
      }
      const price = document.createElement("p");
      price.classList.add("final");
      price.textContent = `${entry.finalPrice}`;
      priceC.appendChild(price);

      const spanVbuck = document.createElement("span");
      spanVbuck.classList.add("icon-vbuck");

      const vbuckImg = document.createElement("img");
      vbuckImg.id = "vbuck";
      vbuckImg.src = "./images/v-buck.png";
      vbuckImg.alt = "v-buck";

      spanVbuck.appendChild(vbuckImg);
      price.appendChild(spanVbuck);

      card.appendChild(img);
      card.appendChild(priceC);
      containerBundle.appendChild(card);

      // ------------------------------------------------------
      // ITENS DO BUNDLE
      // ------------------------------------------------------
      const itemsContainer = document.createElement("div");
      itemsContainer.classList.add("bundle-items");

      const bundleItems = extractBundleItems(entry);

      bundleItems.forEach((item) => {
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("bundle-item");

        const itemName = document.createElement("p");
        itemName.style.fontSize = "17px";
        itemName.style.fontWeight = "bold";
        itemName.style.textAlign = "left";
        itemName.textContent = item.name;

        const itemImg = document.createElement("img");
        itemImg.src =
          item.images?.icon ||
          item.images?.smallIcon ||
          item.images?.small ||
          item.images?.large ||
          "";
        itemImg.alt = item.name;

        itemDiv.appendChild(itemImg);
        itemDiv.appendChild(itemName);

        itemsContainer.appendChild(itemDiv);
      });

      // ------------------------------------------------------
      // BOTÃO DE COMPRAR PACOTE
      // ------------------------------------------------------

      const btnComprarBundle = document.createElement("button");
      btnComprarBundle.classList.add("btn-comprar-bundle");
      btnComprarBundle.textContent = "Comprar pacote completo";

      const spanBuy = document.createElement("span");
      spanBuy.classList.add("icon-buy");
      spanBuy.innerHTML = '<i class="fa-solid fa-cart-shopping"></i>';

      btnComprarBundle.appendChild(spanBuy);

      btnComprarBundle.addEventListener("click", async () => {
        const bundleItems = extractBundleItems(entry);

        if (bundleItems.length === 0) {
          alert("Nenhum item encontrado neste bundle.");
          return;
        }

        let novoSaldoFinal = null;

        for (const item of bundleItems) {
          const itemName = item.name;
          const rarity = item.rarity?.value || item.rarity || "Desconhecida";
          const rawPrice = entry.finalPrice / bundleItems.length;
          const price = Math.round(rawPrice);

          const image =
            item.images?.icon ||
            item.images?.smallIcon ||
            item.images?.small ||
            item.images?.large ||
            "";

          const response = await fetch("/buy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemName, rarity, price, image }),
          });

          const data = await response.json();

          if (!data.ok) {
            alert("Erro ao comprar: " + data.message);
            return;
          }

          novoSaldoFinal = data.novoSaldo;
        }

        alert(`Compra concluída! Novo saldo: ${novoSaldoFinal} V-Bucks`);
        location.reload();
      });

      itemsContainer.appendChild(btnComprarBundle);

      containerBundle.appendChild(itemsContainer);
      gallery.appendChild(containerBundle);
    });
  } catch (error) {
    gallery.innerHTML = `<p style="color:red;">Erro ao carregar bundles.</p>`;
    console.error(error);
  }
}

loadGallery();
