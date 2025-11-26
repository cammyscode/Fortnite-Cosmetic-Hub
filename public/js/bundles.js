async function loadGallery() {
  const gallery = document.getElementById("gallery-bundles");
  const shopUrl = "https://fortnite-api.com/v2/shop";

  try {
    // -------------------------
    // BUSCA A LOJA
    // -------------------------
    const responseShop = await fetch(shopUrl);
    const shopData = await responseShop.json();

    // Debug
    const entries = shopData?.data?.entries ?? [];

    // -------------------------
    //  FILTRA SOMENTE BUNDLES
    // -------------------------
    const bundles = entries.filter(
      (entry) => entry.bundle && entry.bundle.image
    );

    console.log("Bundles encontrados:", bundles);
    console.log("Total bundles:", bundles.length);

    // -------------------------
    // RENDERIZA NA TELA
    // -------------------------
    bundles.forEach((entry) => {
      const card = document.createElement("div");
      card.classList.add("card-bundle");
      const containerBundle = document.createElement("div");
      containerBundle.classList.add("container-bundle");

      const img = document.createElement("img");
      img.src = entry.bundle.image;
      img.alt = entry.bundle.name;
      img.title = entry.bundle.name;

      const priceC = document.createElement("div");
      priceC.classList.add("price-container-bundle");

      const title = document.createElement("h1");
      title.textContent = entry.bundle.name;

      const price = document.createElement("p");
      price.classList.add("final");
      price.textContent = `${entry.finalPrice}`;

      priceC.appendChild(title);
      priceC.appendChild(price);

      if (entry.finalPrice < entry.regularPrice) {
        const priceRegular = document.createElement("p");
        priceRegular.classList.add("regular");
        priceRegular.textContent = `${entry.regularPrice}`;

        const disccount = document.createElement("p");
        disccount.classList.add("disc");
        disccount.textContent = entry.banner?.value ?? "";

        priceC.appendChild(priceRegular);
        priceC.appendChild(disccount);
      } else if (entry.finalPrice == entry.regularPrice) {
        const priceRegular = document.createElement("p");
        priceRegular.classList.add("regular");
        priceRegular.textContent = "-";
        priceC.appendChild(priceRegular);
      }

      // Ícone V-BUCK
      const spanVbuck = document.createElement("span");
      spanVbuck.classList.add("icon-vbuck");
      const vbuckImg = document.createElement("img");

      const inShopBadge = document.createElement("button");
      inShopBadge.classList.add("in-shop");
      inShopBadge.innerHTML = " ";

      vbuckImg.id = "vbuck";
      vbuckImg.src = "./images/v-buck.png";
      vbuckImg.alt = "v-buck";

      // Monta o card
      containerBundle.appendChild(card);
      card.appendChild(img);
      card.appendChild(priceC);
      priceC.appendChild(price);
      price.appendChild(spanVbuck);
      price.appendChild(inShopBadge);
      spanVbuck.appendChild(vbuckImg);

      // ------------------------------------------------------
      //  ITENS DO BUNDLE
      // ------------------------------------------------------
      const itemsContainer = document.createElement("div");
      itemsContainer.classList.add("bundle-items");

      const bundleItems = entry.brItems || entry.cars;

      if (bundleItems && bundleItems.length >= 0) {
        bundleItems.forEach((item) => {
          const itemDiv = document.createElement("div");
          itemDiv.classList.add("bundle-item");

          const itemName = document.createElement("p");

          itemName.textContent = item.name
            .replace(/[_-]/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .trim();
          itemName.style.fontSize = "17px";
          itemName.style.fontWeight = "bold";
          itemName.style.textAlign = "left";

          const itemId = document.createElement("p");

          const itemImg = document.createElement("img");
          itemImg.src =
            item.images?.icon ||
            item.images?.smallIcon ||
            item.images?.small ||
            item.images?.large;
          itemImg.alt = item.name;

          itemDiv.appendChild(itemImg);
          itemDiv.appendChild(itemName);
          itemDiv.appendChild(itemId);

          itemsContainer.appendChild(itemDiv);
        });
      }

      // BOTÃO DE COMPRAR PACOTE COMPLETO
      const btnComprarBundle = document.createElement("button");
      const spanBuy = document.createElement("span");
      spanBuy.classList.add("icon-buy");
      spanBuy.innerHTML = '<i class="fa-solid fa-cart-shopping"></i>';
      btnComprarBundle.textContent = "Comprar pacote completo ";

      btnComprarBundle.classList.add("btn-comprar-bundle");

      btnComprarBundle.addEventListener("click", async () => {
        const bundleItems = entry.brItems || entry.cars || [];

        if (bundleItems.length === 0) {
          alert("Nenhum item encontrado no bundle.");
          return;
        }

        let novoSaldoFinal = null;

        for (const item of bundleItems) {
          const itemName = item.name
            .replace(/[_-]/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .trim();
          const rarity = item.rarity.value || "Desconhecida";
          const price = entry.finalPrice / bundleItems.length;
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
            alert(`Erro ao comprar ${itemName}: ${data.message}`);
            return;
          }

          novoSaldoFinal = data.novoSaldo;
        }

        alert(`Compra concluída! Novo saldo: ${novoSaldoFinal} V-Bucks`);
        location.reload();
      });

      // adiciona o botão ao container
      itemsContainer.appendChild(btnComprarBundle);
      btnComprarBundle.appendChild(spanBuy);
      containerBundle.appendChild(itemsContainer);
      gallery.appendChild(containerBundle);
    });
  } catch (error) {
    gallery.innerHTML = `<p style="color:red;">Erro ao carregar bundles.</p>`;
    console.error(error);
  }
}

loadGallery();
