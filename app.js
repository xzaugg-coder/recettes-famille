(function () {
  "use strict";

  const STORAGE_KEY = "recettes-famille-v1";
  const STORE_STATE_PREFIX = "recettes-famille-store-";
  const STORE_LAST_KEY = "recettes-famille-store-last";
  const app = document.getElementById("app");
  const defaultShopping = { items: [], entries: [], availableKeys: {}, selectedServings: 4, qrBaseUrl: "" };
  const state = loadState();
  const searchQueries = { recipeSearch: "", cookingSearch: "", shoppingSearch: "" };
  const navStack = [];
  let currentRoute = "home";
  let editingRecipeId = null;
  let selectedCookingId = null;
  let selectedShoppingId = null;
  let toastTimer = null;
  let confirmAction = null;

  init();

  function init() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(function () {});
    }

    window.addEventListener("beforeunload", saveState);
    window.addEventListener("hashchange", handleHash);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("click", handleClick);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);

    handleHash();
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        recipes: Array.isArray(saved.recipes) ? saved.recipes : [],
        shopping: normalizeShopping(saved.shopping)
      };
    } catch (error) {
      return { recipes: [], shopping: cloneDefaultShopping() };
    }
  }

  function cloneDefaultShopping() {
    return { items: [], entries: [], availableKeys: {}, selectedServings: defaultShopping.selectedServings, qrBaseUrl: "" };
  }

  function normalizeShopping(shopping) {
    const normalized = cloneDefaultShopping();
    if (!shopping || typeof shopping !== "object") return normalized;
    normalized.items = Array.isArray(shopping.items) ? shopping.items : [];
    normalized.entries = Array.isArray(shopping.entries) ? shopping.entries : [];
    normalized.availableKeys = shopping.availableKeys && typeof shopping.availableKeys === "object" ? shopping.availableKeys : {};
    normalized.selectedServings = Number(shopping.selectedServings) || defaultShopping.selectedServings;
    normalized.qrBaseUrl = String(shopping.qrBaseUrl || "");
    return normalized;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function navigate(route, push) {
    saveState();
    if (push !== false && currentRoute !== route) navStack.push(currentRoute);
    currentRoute = route;
    location.hash = route === "home" ? "" : route;
    render();
  }

  function goBack() {
    saveState();
    const previous = navStack.pop() || "home";
    currentRoute = previous;
    location.hash = previous === "home" ? "" : previous;
    render();
  }

  function handleHash() {
    const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (hash === "store" || hash.startsWith("store?data=")) {
      currentRoute = hash;
      renderStoreMode(hash.startsWith("store?data=") ? hash.slice("store?data=".length) : "");
      return;
    }

    currentRoute = ["recipes", "cooking", "shopping"].includes(hash) ? hash : "home";
    render();
  }

  function render() {
    if (currentRoute.startsWith("store?data=")) return;
    app.className = "app-shell";
    app.innerHTML = topbar() + '<main class="main">' + routeBody() + "</main>" + toastMarkup() + modalMarkup();
  }

  function renderPreservingFocus(id, selectionStart, selectionEnd) {
    render();
    const element = document.getElementById(id);
    if (!element) return;
    element.focus();
    if (typeof element.setSelectionRange === "function" && selectionStart !== null) {
      element.setSelectionRange(selectionStart, selectionEnd);
    }
  }

  function topbar() {
    const showBack = currentRoute !== "home";
    return `
      <header class="topbar">
        <button class="nav-button" data-action="back" ${showBack ? "" : "disabled"} title="Retour">← <span>Retour</span></button>
        <button class="nav-button" data-action="home" title="Accueil">⌂ <span>Accueil</span></button>
        <div class="brand">Recettes Famille</div>
        <button class="icon-button close-button" data-action="quit" title="Quitter">×</button>
      </header>
    `;
  }

  function routeBody() {
    if (currentRoute === "recipes") return recipesView();
    if (currentRoute === "cooking") return cookingView();
    if (currentRoute === "shopping") return shoppingView();
    return homeView();
  }

  function homeView() {
    return `
      <section class="home">
        <div>
          <h1 class="home-title">Recettes Famille</h1>
          <p class="home-subtitle">Recettes locales, cuisine lisible, liste de courses prête à scanner.</p>
        </div>
        <div class="home-actions">
          <button class="home-card" data-route="recipes"><strong>Mes recettes</strong><span>Créer, chercher, modifier, sauvegarder.</span></button>
          <button class="home-card" data-route="cooking"><strong>Mode cuisine</strong><span>Quantités ajustées et étapes cochables.</span></button>
          <button class="home-card" data-route="shopping"><strong>Liste de courses</strong><span>Assembler une liste et générer un QR code.</span></button>
        </div>
      </section>
    `;
  }

  function recipesView() {
    const query = searchQueries.recipeSearch;
    const recipes = filterRecipes(query);
    const selected = editingRecipeId ? findRecipe(editingRecipeId) : null;
    return `
      <section class="panel">
        <div class="page-head">
          <div>
            <h1>Mes recettes</h1>
            <p class="muted">${state.recipes.length} recette${state.recipes.length > 1 ? "s" : ""} sauvegardée${state.recipes.length > 1 ? "s" : ""} dans ce navigateur.</p>
          </div>
          <div class="actions">
            <button class="secondary" data-action="new-recipe">Nouvelle recette</button>
            <button class="secondary" data-action="export-json">Exporter JSON</button>
            <label class="file-button">Importer JSON<input type="file" accept="application/json,.json" data-action="import-json"></label>
          </div>
        </div>
        <div class="grid-two">
          <div class="box">
            <div class="search-row">
              <input id="recipeSearch" type="search" placeholder="Rechercher par nom ou ingrédient" value="${escapeAttr(query)}">
            </div>
            <div class="list" aria-live="polite">
              ${recipes.length ? recipes.map(recipeRow).join("") : '<div class="empty">Aucune recette trouvée.</div>'}
            </div>
          </div>
          <div class="box">
            ${recipeForm(selected)}
          </div>
        </div>
      </section>
    `;
  }

  function recipeRow(recipe) {
    return `
      <article class="recipe-row">
        <div>
          <div class="row-title">${escapeHtml(recipe.name || "Sans nom")}</div>
          <div class="row-meta">${escapeHtml(recipe.category || "Sans catégorie")} · ${recipe.servings || 1} personne${Number(recipe.servings) > 1 ? "s" : ""}</div>
        </div>
        <div class="inline-actions">
          <button class="secondary" data-action="edit-recipe" data-id="${recipe.id}">Modifier</button>
          <button class="danger" data-action="ask-delete-recipe" data-id="${recipe.id}">Supprimer</button>
        </div>
      </article>
    `;
  }

  function recipeForm(recipe) {
    const isEdit = Boolean(recipe);
    return `
      <form id="recipeForm" class="form-grid" action="javascript:void(0)" method="post">
        <input type="hidden" name="id" value="${escapeAttr(recipe?.id || "")}">
        <div class="field full">
          <label for="name">Nom de la recette</label>
          <input id="name" name="name" required value="${escapeAttr(recipe?.name || "")}">
        </div>
        <div class="field">
          <label for="category">Catégorie</label>
          <input id="category" name="category" value="${escapeAttr(recipe?.category || "")}">
        </div>
        <div class="field">
          <label for="servings">Personnes original</label>
          <input id="servings" name="servings" type="number" min="1" step="1" required value="${escapeAttr(recipe?.servings || 4)}">
        </div>
        <div class="field full">
          <label for="youtube">Lien YouTube</label>
          <input id="youtube" name="youtube" type="url" value="${escapeAttr(recipe?.youtube || "")}">
        </div>
        <div class="field full">
          <label for="ingredients">Ingrédients, un par ligne</label>
          <textarea id="ingredients" name="ingredients" required>${escapeHtml(lines(recipe?.ingredients))}</textarea>
        </div>
        <div class="field full">
          <label for="steps">Étapes de préparation, une par ligne</label>
          <textarea id="steps" name="steps" required>${escapeHtml(lines(recipe?.steps))}</textarea>
        </div>
        <div class="field full">
          <label for="notes">Notes</label>
          <textarea id="notes" name="notes">${escapeHtml(recipe?.notes || "")}</textarea>
        </div>
        <div class="actions full">
          <button class="primary" type="button" data-action="save-recipe">${isEdit ? "Enregistrer" : "Créer la recette"}</button>
          ${isEdit ? '<button class="ghost" type="button" data-action="new-recipe">Annuler</button>' : ""}
        </div>
      </form>
    `;
  }

  function cookingView() {
    const query = searchQueries.cookingSearch;
    const matches = filterRecipes(query);
    const recipe = selectedCookingId ? findRecipe(selectedCookingId) : null;
    const people = Number(getValue("cookingServings")) || recipe?.servings || 4;
    return `
      <section class="panel">
        <div class="page-head">
          <div>
            <h1>Mode cuisine</h1>
            <p class="muted">Choisis une recette, ajuste les personnes, puis coche les étapes au fil de la préparation.</p>
          </div>
        </div>
        <div class="grid-two">
          <div class="box">
            <div class="search-row">
              <input id="cookingSearch" type="search" placeholder="Rechercher une recette" value="${escapeAttr(query)}">
            </div>
            <div class="list">
              ${matches.length ? matches.map(function (r) {
                return `<button class="recipe-row" data-action="select-cooking" data-id="${r.id}">
                  <span><span class="row-title">${escapeHtml(r.name)}</span><br><span class="row-meta">${escapeHtml(shortIngredients(r))}</span></span>
                  <span>Ouvrir</span>
                </button>`;
              }).join("") : '<div class="empty">Aucune recette à afficher.</div>'}
            </div>
          </div>
          <div class="box">
            ${recipe ? cookingRecipe(recipe, people) : '<div class="empty">Sélectionne une recette pour commencer.</div>'}
          </div>
        </div>
      </section>
    `;
  }

  function cookingRecipe(recipe, people) {
    const ingredients = recipe.ingredients.map(function (line) {
      return `<li class="ingredient-line">${escapeHtml(scaleIngredient(line, people, recipe.servings).display)}</li>`;
    }).join("");
    const steps = recipe.steps.map(function (step, index) {
      const id = "cook-" + recipe.id + "-" + index;
      return `<label class="step-row"><input type="checkbox" id="${id}"><span>${escapeHtml(step)}</span></label>`;
    }).join("");
    return `
      <div class="panel">
        <div>
          <h2>${escapeHtml(recipe.name)}</h2>
          <p class="muted">Recette originale pour ${recipe.servings} personne${recipe.servings > 1 ? "s" : ""}.</p>
        </div>
        ${recipe.youtube ? `<a class="primary" href="${escapeAttr(recipe.youtube)}" target="_blank" rel="noopener">Ouvrir la vidéo</a>` : ""}
        <div class="field">
          <label for="cookingServings">Nombre de personnes</label>
          <input id="cookingServings" type="number" min="1" step="1" value="${people}" data-recipe-id="${recipe.id}">
        </div>
        <div>
          <h3>Ingrédients</h3>
          <ul class="ingredients-list">${ingredients}</ul>
        </div>
        <div>
          <h3>Préparation</h3>
          <div class="steps">${steps}</div>
        </div>
      </div>
    `;
  }

  function shoppingView() {
    const query = searchQueries.shoppingSearch;
    const recipe = selectedShoppingId ? findRecipe(selectedShoppingId) : null;
    const selectedServings = Number(state.shopping.selectedServings || recipe?.servings || 4);
    const matches = filterRecipes(query);
    const shoppingItems = buildShoppingItems();
    return `
      <section class="panel">
        <div class="page-head">
          <div>
            <h1>Liste de courses</h1>
            <p class="muted">Ajoute des recettes, coche ce que tu as déjà, puis génère un QR code pour le téléphone.</p>
          </div>
        </div>
        <div class="grid-two">
          <div class="box panel">
            <div class="search-row">
              <input id="shoppingSearch" type="search" placeholder="Rechercher par nom ou ingrédient" value="${escapeAttr(query)}">
            </div>
            <div class="list">
              ${matches.length ? matches.map(function (r) {
                return `<button class="recipe-row" data-action="select-shopping" data-id="${r.id}">
                  <span><span class="row-title">${escapeHtml(r.name)}</span><br><span class="row-meta">Original: ${r.servings} personne${r.servings > 1 ? "s" : ""}</span></span>
                  <span>Sélectionner</span>
                </button>`;
              }).join("") : '<div class="empty">Aucune recette trouvée.</div>'}
            </div>
            ${recipe ? shoppingSelector(recipe, selectedServings) : '<div class="empty">Sélectionne une recette pour l’ajouter à la liste.</div>'}
          </div>
          <div class="box panel">
            <div>
              <h2>Recettes ajoutées</h2>
              <div class="list">
                ${state.shopping.entries.length ? state.shopping.entries.map(shoppingEntryRow).join("") : '<div class="empty">Aucune recette ajoutée.</div>'}
              </div>
            </div>
            <div class="page-head">
              <div>
                <h2>Ma liste</h2>
                <p class="muted">${shoppingItems.length} article${shoppingItems.length > 1 ? "s" : ""}</p>
              </div>
              <div class="actions">
                <button class="ghost" data-action="clear-shopping" ${state.shopping.entries.length || shoppingItems.length ? "" : "disabled"}>Vider</button>
              </div>
            </div>
            <div class="list">
              ${shoppingItems.length ? shoppingItems.map(shoppingItemRow).join("") : '<div class="empty">La liste est vide.</div>'}
            </div>
            <div class="qr-wrap">
              <button class="primary" data-action="generate-qr" ${shoppingQrItems().length ? "" : "disabled"}>Générer QR code</button>
              <div class="field">
                <label for="qrBaseUrl">Adresse de l’application pour le QR</label>
                <input id="qrBaseUrl" placeholder="https://mon-compte.github.io/recettes-famille/ ou http://192.168.1.124:4173" value="${escapeAttr(state.shopping.qrBaseUrl || "")}">
              </div>
              <div id="qrDiagnostics" class="qr-diagnostics">Diagnostic QR : en attente de génération.</div>
              <div id="qrWarning" class="muted"></div>
              <div id="qrCode"></div>
              <div id="qrLinkBox"></div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function shoppingSelector(recipe, selectedServings) {
    return `
      <div class="box panel">
        <h3>${escapeHtml(recipe.name)}</h3>
        <p class="muted">Original: <span class="original-hint">${recipe.servings} personne${recipe.servings > 1 ? "s" : ""}</span></p>
        <div class="selector-grid">
          <div class="field">
            <label for="shoppingServings">Nombre de personnes</label>
            <select id="shoppingServings">
              ${servingOptions(recipe.servings, selectedServings)}
            </select>
          </div>
          <button class="primary" data-action="add-shopping" data-id="${recipe.id}">Ajouter à ma liste de courses</button>
        </div>
      </div>
    `;
  }

  function servingOptions(original, selected) {
    const values = Array.from(new Set([1, 2, 3, original, 5, 6, 8, selected])).sort(function (a, b) { return a - b; });
    return values.map(function (value) {
      const label = value === original ? value + " ← original" : String(value);
      return `<option value="${value}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
    }).join("");
  }

  function shoppingItemRow(item) {
    return `
      <label class="shopping-row ${item.available ? "checked" : ""}">
        <span>
          <input type="checkbox" data-action="toggle-available" data-key="${escapeAttr(item.key)}" ${item.available ? "checked" : ""}>
          <span class="shopping-text">${escapeHtml(item.display)}</span>
        </span>
      </label>
    `;
  }

  function shoppingEntryRow(entry) {
    return `
      <article class="recipe-row">
        <div>
          <div class="row-title">${escapeHtml(entry.recipeName)}</div>
          <div class="row-meta">${entry.servings} personne${Number(entry.servings) > 1 ? "s" : ""}</div>
        </div>
        <button type="button" class="ghost" data-action="remove-shopping-entry" data-id="${entry.id}">Retirer</button>
      </article>
    `;
  }

  function renderStoreMode(encoded) {
    let payload;
    let loadedFromQr = false;
    let savedPayload = getSavedStorePayload();
    if (encoded) {
      try {
        payload = JSON.parse(decodeBase64Url(encoded));
        loadedFromQr = true;
      } catch (error) {
        payload = { id: "invalid", items: [] };
      }
    } else {
      payload = savedPayload || { id: "last", items: [] };
    }
    if (!Array.isArray(payload.items)) payload.items = [];
    if (loadedFromQr) {
      localStorage.setItem(STORE_LAST_KEY, JSON.stringify(payload));
      savedPayload = payload;
      window.__toast = "Liste chargée sur ce téléphone.";
    }
    const hasSavedList = Boolean(savedPayload && Array.isArray(savedPayload.items) && savedPayload.items.length);
    const openedWithoutData = !encoded;
    const key = STORE_STATE_PREFIX + (payload.id || "list");
    const checked = new Set(JSON.parse(localStorage.getItem(key) || "[]"));
    const hidden = localStorage.getItem(key + "-hidden") === "1";
    app.className = "app-shell store-mode";
    app.innerHTML = `
      <header class="topbar">
        <div class="brand">Mode magasin</div>
      </header>
      <main class="main">
        <section class="panel">
          <div>
            <h1>Liste de courses</h1>
            <p class="muted">${payload.items.length} article${payload.items.length > 1 ? "s" : ""}</p>
            <p class="muted">Liste chargée sur ce téléphone. Tu peux l’utiliser aux commissions tant que cette page reste ouverte. Ne rafraîchis pas la page hors de la maison, car l’application est servie depuis ton PC.</p>
            <p class="muted">Avant de partir aux commissions, vérifie que la liste s’ouvre bien sur ton téléphone. Ne vide pas les données du navigateur.</p>
          </div>
          ${storeSavedNotice(openedWithoutData, hasSavedList)}
          <div class="store-tools">
            <button class="secondary" data-action="toggle-hide-store" data-key="${key}">${hidden ? "Afficher les cochés" : "Masquer les articles cochés"}</button>
            <button class="secondary" data-action="uncheck-store" data-key="${key}">Tout décocher</button>
            <button class="danger" data-action="ask-empty-store" data-key="${key}">Vider la liste</button>
          </div>
          <div class="list" id="storeList">
            ${payload.items.filter(function (item) { return !(hidden && checked.has(item.id)); }).map(function (item) {
              const isChecked = checked.has(item.id);
              return `<label class="store-row ${isChecked ? "checked" : ""}">
                <input type="checkbox" data-action="toggle-store" data-id="${item.id}" data-key="${key}" ${isChecked ? "checked" : ""}>
                <span class="store-text">${escapeHtml(item.display)}</span>
              </label>`;
            }).join("") || '<div class="empty">La liste est vide.</div>'}
          </div>
        </section>
      </main>
      ${toastMarkup()}
    `;
  }

  function getSavedStorePayload() {
    try {
      const payload = JSON.parse(localStorage.getItem(STORE_LAST_KEY) || "null");
      if (payload && Array.isArray(payload.items)) return payload;
    } catch (error) {}
    return null;
  }

  function storeSavedNotice(openedWithoutData, hasSavedList) {
    if (!openedWithoutData) return "";
    if (hasSavedList) {
      return `
        <div class="empty">
          <p>Dernière liste sauvegardée trouvée.</p>
        </div>
      `;
    }
    return '<div class="empty">Aucune liste sauvegardée sur ce téléphone.</div>';
  }

  function handleSubmit(event) {
    if (event.target.id !== "recipeForm") return;
    event.preventDefault();
    saveRecipeFromForm(event.target);
  }

  function saveRecipeFromForm(form) {
    if (!form) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const id = data.get("id") || createId();
    const recipe = {
      id,
      name: String(data.get("name") || "").trim(),
      category: String(data.get("category") || "").trim(),
      servings: Math.max(1, Number(data.get("servings")) || 1),
      youtube: String(data.get("youtube") || "").trim(),
      ingredients: splitLines(data.get("ingredients")),
      steps: splitLines(data.get("steps")),
      notes: String(data.get("notes") || "").trim()
    };
    const existing = state.recipes.findIndex(function (r) { return r.id === id; });
    if (existing >= 0) state.recipes[existing] = recipe;
    else state.recipes.push(recipe);
    editingRecipeId = id;
    saveState();
    showToast("Recette sauvegardée");
    render();
  }

  function handleClick(event) {
    const target = event.target.closest("[data-action], [data-route]");
    if (!target) return;
    const action = target.dataset.action;
    const route = target.dataset.route;

    if (route) navigate(route);
    if (action === "back") goBack();
    if (action === "home") navigate("home");
    if (action === "quit") quitApp();
    if (action === "save-recipe") {
      event.preventDefault();
      saveRecipeFromForm(document.getElementById("recipeForm"));
    }
    if (action === "new-recipe") {
      editingRecipeId = null;
      render();
    }
    if (action === "edit-recipe") {
      editingRecipeId = target.dataset.id;
      render();
    }
    if (action === "ask-delete-recipe") askDeleteRecipe(target.dataset.id);
    if (action === "confirm-delete") confirmDelete();
    if (action === "cancel-confirm") {
      confirmAction = null;
      render();
    }
    if (action === "export-json") exportJson();
    if (action === "select-cooking") {
      selectedCookingId = target.dataset.id;
      render();
    }
    if (action === "select-shopping") {
      selectedShoppingId = target.dataset.id;
      const recipe = findRecipe(selectedShoppingId);
      state.shopping.selectedServings = recipe?.servings || 4;
      saveState();
      render();
    }
    if (action === "add-shopping") addRecipeToShopping(target.dataset.id);
    if (action === "toggle-available") toggleAvailable(target.dataset.key, event.target.checked);
    if (action === "remove-shopping-entry") removeShoppingEntry(target.dataset.id);
    if (action === "clear-shopping") clearShopping();
    if (action === "generate-qr") generateQr();
    if (action === "copy-list-link") copyListLink(target.dataset.url);
    if (action === "test-list-link") testListLink();
    if (action === "show-qr-diagnostics") setQrDiagnosticsOpen(true);
    if (action === "hide-qr-diagnostics") setQrDiagnosticsOpen(false);
    if (action === "toggle-store") toggleStore(target.dataset.key, target.dataset.id, event.target.checked);
    if (action === "toggle-hide-store") toggleHideStore(target.dataset.key);
    if (action === "uncheck-store") {
      localStorage.setItem(target.dataset.key, "[]");
      handleHash();
    }
    if (action === "ask-empty-store") askEmptyStore(target.dataset.key);
    if (action === "confirm-empty-store") confirmEmptyStore();
  }

  function handleInput(event) {
    if (["recipeSearch", "cookingSearch", "shoppingSearch"].includes(event.target.id)) {
      searchQueries[event.target.id] = event.target.value;
      renderPreservingFocus(event.target.id, event.target.selectionStart, event.target.selectionEnd);
    }
    if (event.target.id === "cookingServings") {
      renderPreservingFocus(event.target.id, event.target.selectionStart, event.target.selectionEnd);
    }
    if (event.target.id === "qrBaseUrl") {
      state.shopping.qrBaseUrl = event.target.value.trim();
      saveState();
    }
  }

  function handleChange(event) {
    const action = event.target.dataset.action;
    if (event.target.id === "shoppingServings") {
      state.shopping.selectedServings = Number(event.target.value);
      saveState();
      render();
    }
    if (action === "import-json") importJson(event.target.files[0]);
  }

  function askDeleteRecipe(id) {
    confirmAction = { type: "delete-recipe", id };
    render();
  }

  function confirmDelete() {
    if (!confirmAction || confirmAction.type !== "delete-recipe") return;
    state.recipes = state.recipes.filter(function (recipe) { return recipe.id !== confirmAction.id; });
    if (editingRecipeId === confirmAction.id) editingRecipeId = null;
    if (selectedCookingId === confirmAction.id) selectedCookingId = null;
    if (selectedShoppingId === confirmAction.id) selectedShoppingId = null;
    confirmAction = null;
    saveState();
    showToast("Recette supprimée.");
    render();
  }

  function addRecipeToShopping(id) {
    const recipe = findRecipe(id);
    if (!recipe) return;
    const servings = Number(state.shopping.selectedServings || recipe.servings);
    state.shopping.entries.push({
      id: createId(),
      recipeId: recipe.id,
      recipeName: recipe.name,
      servings
    });
    state.shopping.items = buildShoppingItems();
    saveState();
    showToast("Recette ajoutée à la liste.");
    render();
  }

  function toggleAvailable(key, checked) {
    if (!key) return;
    if (checked) state.shopping.availableKeys[key] = true;
    else delete state.shopping.availableKeys[key];
    state.shopping.items = buildShoppingItems();
    saveState();
    render();
  }

  function removeShoppingEntry(id) {
    state.shopping.entries = state.shopping.entries.filter(function (entry) { return entry.id !== id; });
    state.shopping.items = buildShoppingItems();
    saveState();
    render();
  }

  function clearShopping() {
    state.shopping.items = [];
    state.shopping.entries = [];
    state.shopping.availableKeys = {};
    saveState();
    render();
  }

  function shoppingQrItems() {
    return buildShoppingItems()
      .filter(function (item) { return !item.available; })
      .map(function (item) { return { id: item.key, display: item.display }; });
  }

  function buildShoppingItems() {
    if (!state.shopping.entries.length) {
      return state.shopping.items.map(function (item) {
        const key = item.key || shoppingItemKey(item.display, item.parsed);
        return {
          id: key,
          key,
          display: item.display,
          parsed: item.parsed || null,
          available: Boolean(state.shopping.availableKeys[key] || item.available)
        };
      });
    }

    const rawItems = [];
    state.shopping.entries.forEach(function (entry) {
      const recipe = findRecipe(entry.recipeId);
      if (!recipe) return;
      recipe.ingredients.forEach(function (line) {
        const scaled = scaleIngredient(line, entry.servings, recipe.servings);
        rawItems.push({
          id: createId(),
          key: shoppingItemKey(scaled.display, scaled.parsed),
          display: scaled.display,
          parsed: scaled.parsed,
          available: false
        });
      });
    });

    return mergeShoppingItems(rawItems).map(function (item) {
      item.key = item.key || shoppingItemKey(item.display, item.parsed);
      item.id = item.key;
      item.available = Boolean(state.shopping.availableKeys[item.key]);
      return item;
    });
  }

  function generateQr() {
    const items = shoppingQrItems();
    const warning = document.getElementById("qrWarning");
    const holder = document.getElementById("qrCode");
    const linkBox = document.getElementById("qrLinkBox");
    const diagnostics = document.getElementById("qrDiagnostics");
    const qrFactory = getQrFactory();
    syncQrBaseUrlFromField();
    const baseUrl = getQrBaseUrl();
    const payload = { id: createId(), items };
    const encoded = items.length ? encodeBase64Url(JSON.stringify(payload)) : "";
    const url = baseUrl && encoded ? baseUrl + "#store?data=" + encoded : "";
    window.__lastListUrl = url;
    clearQrOutput(warning, holder, linkBox);
    renderQrDiagnostics(diagnostics, {
      itemCount: items.length,
      baseUrl,
      url,
      qrLoaded: Boolean(qrFactory),
      error: ""
    });

    if (!holder) {
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        qrLoaded: Boolean(qrFactory),
        error: "Erreur QR : conteneur QR introuvable"
      });
      setQrError(warning, "Erreur QR : conteneur QR introuvable");
      return;
    }
    if (!warning || !linkBox || !diagnostics) {
      setQrError(warning, "Erreur QR : zone de diagnostic introuvable");
      return;
    }
    if (!items.length) {
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        qrLoaded: Boolean(qrFactory),
        error: "Erreur QR : aucune liste de courses à encoder"
      });
      setQrError(warning, "Erreur QR : aucune liste de courses à encoder");
      return;
    }
    if (!qrFactory) {
      linkBox.innerHTML = qrLinkMarkup(url);
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        qrLoaded: false,
        error: "Erreur QR : bibliothèque QR non chargée"
      });
      setQrError(warning, "Erreur QR : bibliothèque QR non chargée");
      return;
    }

    if (!baseUrl) {
      linkBox.innerHTML = qrLinkMarkup(url);
      const hasManualBase = Boolean(getManualQrBaseUrl());
      const message = location.protocol === "file:" && !hasManualBase
        ? "Pour générer un QR code utilisable sur téléphone, lance l’application avec le serveur local."
        : getRawQrBaseUrlFromField()
          ? "Erreur QR : adresse invalide, utilise une adresse http:// ou https://"
          : "Erreur QR : indique l’adresse de l’application pour le QR";
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        qrLoaded: Boolean(qrFactory),
        error: message
      });
      setQrError(warning, message);
      return;
    }

    if (!url.includes("#store?data=")) {
      linkBox.innerHTML = qrLinkMarkup(url);
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        qrLoaded: Boolean(qrFactory),
        error: "Erreur QR : le lien ne contient pas #store?data="
      });
      setQrError(warning, "Erreur QR : le lien ne contient pas #store?data=");
      return;
    }

    if (url.includes("file://") || url.includes("localhost") || url.includes("127.0.0.1")) {
      linkBox.innerHTML = qrLinkMarkup(url);
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        qrLoaded: Boolean(qrFactory),
        error: "Erreur QR : l’URL contient file://, localhost ou 127.0.0.1"
      });
      setQrError(warning, "Erreur QR : l’URL contient file://, localhost ou 127.0.0.1");
      return;
    }

    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("l’adresse doit commencer par http:// ou https://");
      }
    } catch (error) {
      linkBox.innerHTML = qrLinkMarkup(url);
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        qrLoaded: Boolean(qrFactory),
        error: "Erreur QR : " + String(error && error.message ? error.message : error)
      });
      setQrError(warning, "Erreur QR : " + String(error && error.message ? error.message : error));
      return;
    }

    linkBox.innerHTML = qrLinkMarkup(url);
    try {
      if (qrFactory.stringToBytesFuncs && qrFactory.stringToBytesFuncs["UTF-8"]) {
        qrFactory.stringToBytes = qrFactory.stringToBytesFuncs["UTF-8"];
      }
      const qr = qrFactory(0, "M");
      qr.addData(url);
      qr.make();
      holder.innerHTML = qr.createImgTag(6, 8, "QR code de la liste de courses");
      warning.textContent = items.length > 50 || url.length > 2200
        ? "QR généré. La liste est longue pour un QR code confortable."
        : "QR généré. Le lien contient la liste de courses finale.";
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        qrLoaded: true,
        error: ""
      });
    } catch (error) {
      const message = "Erreur QR : " + String(error && error.message ? error.message : error);
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        qrLoaded: true,
        error: message
      });
      setQrError(warning, message);
    }
  }

  function getQrFactory() {
    if (typeof window.qrcode === "function") return window.qrcode;
    if (typeof window.QRCode === "function") return window.QRCode;
    if (typeof qrcode === "function") return qrcode;
    return null;
  }

  function getQrBaseUrl() {
    const manual = getManualQrBaseUrl();
    if (manual) return manual;
    if (location.protocol === "file:") return "";
    if (!/^https?:$/.test(location.protocol)) return "";
    return normalizeBaseUrl(location.origin + location.pathname);
  }

  function syncQrBaseUrlFromField() {
    const raw = getRawQrBaseUrlFromField();
    if (raw) {
      state.shopping.qrBaseUrl = raw;
      saveState();
    }
  }

  function getRawQrBaseUrlFromField() {
    const field = document.getElementById("qrBaseUrl");
    return String(field ? field.value : state.shopping.qrBaseUrl || "").trim();
  }

  function getManualQrBaseUrl() {
    const raw = getRawQrBaseUrlFromField();
    return raw ? normalizeBaseUrl(raw) : "";
  }

  function normalizeBaseUrl(value) {
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) return "";
      url.hash = "";
      url.search = "";
      let pathname = url.pathname || "/";
      if (/\/[^/]+\.[a-z0-9]+$/i.test(pathname)) {
        pathname = pathname.slice(0, pathname.lastIndexOf("/") + 1);
      }
      if (!pathname.endsWith("/")) pathname += "/";
      return url.origin + pathname;
    } catch (error) {
      return "";
    }
  }

  function clearQrOutput(warning, holder, linkBox) {
    if (warning) warning.textContent = "";
    if (holder) holder.innerHTML = "";
    if (linkBox) linkBox.innerHTML = "";
  }

  function setQrError(warning, message) {
    if (warning) warning.textContent = message;
  }

  function qrLinkMarkup(url) {
    if (!url) return "";
    return `
      <div class="qr-link">
        <label>Lien de la liste :</label>
        <textarea readonly>${escapeHtml(url)}</textarea>
        <div class="actions">
          <button type="button" class="secondary" data-action="copy-list-link" data-url="${escapeAttr(url)}">Copier le lien de la liste</button>
          <button type="button" class="secondary" data-action="test-list-link">Tester le lien de la liste</button>
        </div>
      </div>
    `;
  }

  function renderQrDiagnostics(element, details) {
    if (!element) return;
    window.__qrDiagnosticDetails = details;
    const hasError = Boolean(details.error);
    const open = Boolean(window.__qrDiagnosticsOpen);
    element.innerHTML = `
      <div class="diagnostic-summary">
        <strong>Diagnostic QR : ${hasError ? "erreur détectée" : "aucune erreur"}</strong>
        <button type="button" class="secondary" data-action="${open ? "hide-qr-diagnostics" : "show-qr-diagnostics"}">${open ? "Masquer le diagnostic" : "Afficher le diagnostic"}</button>
      </div>
      ${open ? qrDiagnosticDetailsMarkup(details) : ""}
    `;
  }

  function qrDiagnosticDetailsMarkup(details) {
    return `
      <div class="diagnostic-details">
        <div>Articles dans la liste finale : ${details.itemCount}</div>
        <div>Adresse utilisée : ${escapeHtml(details.baseUrl || "(aucune)")}</div>
        <label>URL générée</label>
        <textarea readonly>${escapeHtml(details.url || "(aucune)")}</textarea>
        <div>Bibliothèque QR chargée : ${details.qrLoaded ? "oui" : "non"}</div>
        <div>Message d’erreur : ${escapeHtml(details.error || "aucune erreur")}</div>
      </div>
    `;
  }

  function setQrDiagnosticsOpen(open) {
    window.__qrDiagnosticsOpen = open;
    const element = document.getElementById("qrDiagnostics");
    if (window.__qrDiagnosticDetails) {
      renderQrDiagnostics(element, window.__qrDiagnosticDetails);
    }
  }

  function copyListLink(url) {
    url = url || window.__lastListUrl || "";
    if (!url) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        showToast("Lien de la liste copié.");
      }).catch(function () {
        showToast("Copie impossible. Le lien est affiché sous le QR.");
      });
      return;
    }
    showToast("Copie impossible. Le lien est affiché sous le QR.");
  }

  function testListLink() {
    if (!window.__lastListUrl) {
      showToast("Aucun lien de liste généré.");
      return;
    }
    location.href = window.__lastListUrl;
  }

  function toggleStore(key, id, checked) {
    const values = new Set(JSON.parse(localStorage.getItem(key) || "[]"));
    if (checked) values.add(id);
    else values.delete(id);
    localStorage.setItem(key, JSON.stringify(Array.from(values)));
    handleHash();
  }

  function toggleHideStore(key) {
    const next = localStorage.getItem(key + "-hidden") === "1" ? "0" : "1";
    localStorage.setItem(key + "-hidden", next);
    handleHash();
  }

  function askEmptyStore(key) {
    confirmAction = { type: "empty-store", key };
    renderStoreMode("");
  }

  function confirmEmptyStore() {
    if (!confirmAction || confirmAction.type !== "empty-store") return;
    const key = confirmAction.key;
    localStorage.removeItem(STORE_LAST_KEY);
    if (key) {
      localStorage.removeItem(key);
      localStorage.removeItem(key + "-hidden");
    }
    confirmAction = null;
    window.__toast = "Liste supprimée de ce téléphone.";
    location.hash = "store";
    renderStoreMode("");
  }

  function quitApp() {
    saveState();
    window.close();
    setTimeout(function () {
      navigate("home", false);
      showToast("Tu peux maintenant fermer l’application.");
    }, 180);
  }

  function exportJson() {
    const data = {
      app: "Recettes Famille",
      version: 1,
      exportedAt: new Date().toISOString(),
      recipes: state.recipes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "recettes-famille-sauvegarde.json";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Export JSON préparé.");
  }

  function importJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result));
        const recipes = Array.isArray(data) ? data : data.recipes;
        if (!Array.isArray(recipes)) throw new Error("Format invalide");
        const existingIds = new Set(state.recipes.map(function (r) { return r.id; }));
        const normalized = recipes.map(normalizeRecipe);
        const conflicts = normalized.filter(function (recipe) { return existingIds.has(recipe.id); }).length;
        if (conflicts && !window.confirm("Certaines recettes existent déjà. Les remplacer avec le fichier importé ?")) {
          showToast("Import annulé.");
          return;
        }
        const importedIds = new Set(normalized.map(function (recipe) { return recipe.id; }));
        state.recipes = state.recipes.filter(function (recipe) { return !importedIds.has(recipe.id); }).concat(normalized);
        saveState();
        showToast("Import JSON terminé.");
        render();
      } catch (error) {
        showToast("Import impossible: fichier JSON invalide.");
      }
    };
    reader.readAsText(file);
  }

  function normalizeRecipe(recipe) {
    return {
      id: recipe.id || createId(),
      name: String(recipe.name || "Sans nom"),
      category: String(recipe.category || ""),
      servings: Math.max(1, Number(recipe.servings) || 1),
      youtube: String(recipe.youtube || ""),
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.map(String) : splitLines(recipe.ingredients),
      steps: Array.isArray(recipe.steps) ? recipe.steps.map(String) : splitLines(recipe.steps),
      notes: String(recipe.notes || "")
    };
  }

  function mergeShoppingItems(items) {
    const merged = [];
    items.forEach(function (item) {
      const parsed = item.parsed;
      if (!parsed || !parsed.canMerge) {
        const plainKey = shoppingItemKey(item.display, null);
        const plainMatch = merged.find(function (existing) {
          return !existing.parsed && existing.key === plainKey;
        });
        if (!plainMatch) {
          item.key = plainKey;
          item.display = cleanIngredientName(item.display);
          merged.push(item);
        }
        return;
      }
      item.key = shoppingItemKey(item.display, parsed);
      const match = merged.find(function (existing) {
        return existing.parsed &&
          existing.parsed.canMerge &&
          existing.parsed.unitKey === parsed.unitKey &&
          existing.parsed.nameKey === parsed.nameKey &&
          existing.available === item.available;
      });
      if (!match) {
        merged.push(item);
        return;
      }
      match.parsed.quantityBase += parsed.quantityBase;
      match.display = formatParsed(match.parsed);
      match.key = shoppingItemKey(match.display, match.parsed);
    });
    return merged;
  }

  function scaleIngredient(line, people, originalPeople) {
    const parsed = parseIngredient(line);
    if (!parsed) return { display: cleanIngredientName(line), parsed: null };
    parsed.quantityBase = parsed.quantityBase * people / originalPeople;
    return { display: formatParsed(parsed), parsed };
  }

  function shoppingItemKey(display, parsed) {
    if (parsed && parsed.canMerge) return "qty:" + parsed.unitKey + ":" + parsed.nameKey;
    return "plain:" + normalizeIngredientName(display);
  }

  function cleanIngredientName(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function parseIngredient(line) {
    const clean = String(line || "").trim();
    const match = clean.match(/^(\d+(?:[.,]\d+)?|(?:\d+\s*\/\s*\d+))\s*(.*)$/i);
    if (!match) return null;
    const quantity = parseQuantity(match[1]);
    if (!Number.isFinite(quantity)) return null;
    let rest = match[2].trim();
    const unit = detectUnit(rest);
    if (unit) rest = rest.slice(unit.raw.length).trim().replace(/^de\s+/i, "");
    else if (!rest) return null;
    const unitKey = unit ? unit.key : "piece";
    const factor = unit ? unit.factor : 1;
    const name = unit ? rest : rest.replace(/^de\s+/i, "");
    const mergeName = name || defaultNameForUnit(unit.key, unit.display);
    if (!mergeName) return null;
    return {
      quantityBase: quantity * factor,
      unitKey,
      displayUnit: unit ? unit.display : "",
      name,
      nameKey: normalizeName(mergeName),
      canMerge: Boolean(mergeName)
    };
  }

  function detectUnit(rest) {
    const units = [
      ["cuillère à soupe", "tbsp", "cuillère à soupe", 1],
      ["cuillères à soupe", "tbsp", "cuillères à soupe", 1],
      ["cuillère à café", "tsp", "cuillère à café", 1],
      ["cuillères à café", "tsp", "cuillères à café", 1],
      ["pièces", "piece", "pièce", 1],
      ["pièce", "piece", "pièce", 1],
      ["oeufs", "egg", "oeuf", 1],
      ["oeuf", "egg", "oeuf", 1],
      ["œufs", "egg", "œuf", 1],
      ["œuf", "egg", "œuf", 1],
      ["kg", "g", "g", 1000],
      ["g", "g", "g", 1],
      ["ml", "ml", "ml", 1],
      ["cl", "ml", "ml", 10],
      ["dl", "ml", "ml", 100],
      ["l", "ml", "ml", 1000]
    ];
    const lower = rest.toLowerCase();
    for (const unit of units) {
      if (lower === unit[0] || lower.startsWith(unit[0] + " ")) {
        return { raw: rest.slice(0, unit[0].length), key: unit[1], display: unit[2], factor: unit[3] };
      }
    }
    return null;
  }

  function defaultNameForUnit(unitKey, display) {
    if (unitKey === "egg") return "œuf";
    if (unitKey === "piece") return "pièce";
    return display;
  }

  function formatParsed(parsed) {
    const unit = parsed.unitKey;
    let quantity = parsed.quantityBase;
    let displayUnit = parsed.displayUnit;
    if (unit === "g" && quantity >= 1000 && quantity % 1000 === 0) {
      quantity = quantity / 1000;
      displayUnit = "kg";
    } else if (unit === "ml" && quantity >= 1000 && quantity % 1000 === 0) {
      quantity = quantity / 1000;
      displayUnit = "l";
    } else if (unit === "ml" && quantity % 100 === 0) {
      quantity = quantity / 100;
      displayUnit = "dl";
    } else if (unit === "piece") {
      displayUnit = "";
    } else if (unit === "egg") {
      displayUnit = Math.abs(quantity) > 1 ? "œufs" : "œuf";
    }
    const number = formatNumber(quantity);
    return [number, displayUnit, parsed.name].filter(Boolean).join(" ");
  }

  function formatNumber(value) {
    if (Math.abs(value - 0.5) < 0.001) return "1/2";
    if (Number.isInteger(value)) return String(value);
    return String(Math.round(value * 100) / 100).replace(".", ",");
  }

  function parseQuantity(value) {
    if (value.includes("/")) {
      const parts = value.split("/").map(function (part) { return Number(part.trim().replace(",", ".")); });
      return parts[1] ? parts[0] / parts[1] : NaN;
    }
    return Number(value.replace(",", "."));
  }

  function filterRecipes(query) {
    const q = normalizeName(query || "");
    if (!q) return state.recipes.slice().sort(byName);
    return state.recipes.filter(function (recipe) {
      return normalizeName(recipe.name).includes(q) ||
        recipe.ingredients.some(function (line) { return normalizeName(line).includes(q); });
    }).sort(byName);
  }

  function byName(a, b) {
    return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  }

  function findRecipe(id) {
    return state.recipes.find(function (recipe) { return recipe.id === id; });
  }

  function splitLines(value) {
    return String(value || "").split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
  }

  function lines(value) {
    return Array.isArray(value) ? value.join("\n") : String(value || "");
  }

  function shortIngredients(recipe) {
    return recipe.ingredients.slice(0, 3).join(", ");
  }

  function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : "";
  }

  function createId() {
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function normalizeName(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[’`´]/g, "'")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/œ/g, "oe")
      .replace(/æ/g, "ae")
      .replace(/^de\s+|^d'/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeIngredientName(value) {
    return normalizeName(value).replace(/\s*'\s*/g, "'").trim();
  }

  function encodeBase64Url(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach(function (byte) { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decodeBase64Url(text) {
    const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, function (char) { return char.charCodeAt(0); });
    return new TextDecoder().decode(bytes);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function showToast(message) {
    window.__toast = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      window.__toast = "";
      render();
    }, 2600);
  }

  function toastMarkup() {
    return window.__toast ? `<div class="toast">${escapeHtml(window.__toast)}</div>` : "";
  }

  function modalMarkup() {
    if (!confirmAction) return "";
    if (confirmAction.type === "empty-store") {
      return `
        <div class="modal-backdrop" role="dialog" aria-modal="true">
          <div class="modal">
            <h2>Vider la liste</h2>
            <p>Voulez-vous vraiment vider la liste de courses ?</p>
            <div class="actions">
              <button class="secondary" data-action="cancel-confirm">Annuler</button>
              <button class="danger" data-action="confirm-empty-store">Vider la liste</button>
            </div>
          </div>
        </div>
      `;
    }
    return `
      <div class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal">
          <h2>Supprimer la recette</h2>
          <p>Voulez-vous vraiment supprimer cette recette ?</p>
          <div class="actions">
            <button class="secondary" data-action="cancel-confirm">Annuler</button>
            <button class="danger" data-action="confirm-delete">Supprimer</button>
          </div>
        </div>
      </div>
    `;
  }
})();
