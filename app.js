(function () {
  "use strict";

  const STORAGE_KEY = "recettes-famille-v1";
  const STORE_STATE_PREFIX = "recettes-famille-store-";
  const STORE_LAST_KEY = "recettes-famille-store-last";
  const app = document.getElementById("app");
  const SERVING_CHOICES = [1, 2, 3, 4, 5, 6, 8, 10, 12];
  const MANUAL_UNITS = ["", "pce", "g", "kg", "ml", "cl", "dl", "l", "paquet", "bouteille", "boîte", "sachet"];
  const MANUAL_CATEGORIES = [
    ["Crémerie", ["œufs", "beurre", "crème fraîche", "fromage", "yaourts", "pâte à tarte"]],
    ["Viande", ["bœuf", "veau", "porc", "volaille", "lardons", "jambon", "charcuterie"]],
    ["Poisson", ["saumon", "thon", "cabillaud", "crevettes", "poisson pané"]],
    ["Fruits / Légumes", ["pommes", "poires", "bananes", "citrons", "salade", "tomates", "carottes", "pommes de terre", "oignons", "ail / échalote"]],
    ["Épicerie", ["pâtes", "riz", "lentilles", "purée", "bouillon cube", "épices", "poivre / sel", "moutarde", "mayonnaise", "ketchup", "huile", "vinaigre", "farine", "sucre", "levure", "pain", "chips"]],
    ["Conserves", ["tomates pelées", "thon", "maïs", "haricots", "petits pois", "soupe"]],
    ["Petit-déj / Goûter", ["céréales", "confiture", "miel", "biscuits", "chocolat", "compote"]],
    ["Boissons", ["eau", "eau gazeuse", "lait", "jus de fruits", "sodas", "sirop"]],
    ["Surgelés", ["légumes surgelés", "frites", "glaces", "pizza"]],
    ["Hygiène", ["savon", "dentifrice", "coton", "gel douche", "shampoing", "rasoirs / lames", "mouchoirs"]],
    ["Entretien", ["éponges", "sacs poubelle", "film étirable", "papier alu", "essuie-tout", "liquide vaisselle", "lessive", "papier toilette"]],
    ["Maison", ["piles", "ampoules", "bougies", "stylo / crayon", "colle", "ruban adhésif", "enveloppes"]],
    ["Animaux", ["croquettes", "pâtée", "litière", "friandises"]],
    ["Pharmacie", ["pansements", "désinfectant", "paracétamol", "vitamines"]],
    ["Autre", ["papier cadeau", "cartes", "sac cabas"]]
  ];
  const SHOPPING_CATEGORY_ORDER = [
    "Fruits / Légumes",
    "Viande",
    "Poisson",
    "Crémerie",
    "Épicerie",
    "Conserves",
    "Petit-déj / Goûter",
    "Boissons",
    "Surgelés",
    "Hygiène",
    "Entretien",
    "Maison",
    "Animaux",
    "Pharmacie",
    "Autre"
  ];
  const CATEGORY_CODES = {
    "Fruits / Légumes": "fl",
    "Viande": "vi",
    "Poisson": "po",
    "Crémerie": "cr",
    "Épicerie": "ep",
    "Conserves": "co",
    "Petit-déj / Goûter": "pg",
    "Boissons": "bo",
    "Surgelés": "su",
    "Hygiène": "hy",
    "Entretien": "en",
    "Maison": "ma",
    "Animaux": "an",
    "Pharmacie": "ph",
    "Autre": "au"
  };
  const CATEGORY_NAMES_BY_CODE = Object.fromEntries(Object.entries(CATEGORY_CODES).map(function (entry) {
    return [entry[1], entry[0]];
  }));
  const SHOPPING_CATEGORY_KEYWORDS = {
    "Fruits / Légumes": ["oignon", "oignons", "ail", "échalote", "carotte", "carottes", "tomate", "tomates", "pomme", "pommes", "poire", "poires", "banane", "bananes", "citron", "citrons", "salade", "chou", "asperge", "asperges", "poireau", "poireaux", "pommes de terre", "pomme de terre", "patate", "courgette", "aubergine", "champignon", "champignons", "persil", "coriandre", "basilic", "ciboulette", "cébette", "cébettes", "gingembre", "piment", "poivron", "germes de soja", "légumes"],
    "Viande": ["bœuf", "boeuf", "veau", "porc", "poulet", "volaille", "dinde", "canard", "agneau", "lard", "lardons", "jambon", "charcuterie", "saucisse", "steak", "viande", "filet mignon", "magret"],
    "Poisson": ["saumon", "thon", "cabillaud", "crevette", "crevettes", "crabe", "poisson", "poissons", "lotte", "gambas", "saint-jacques", "omble", "truite"],
    "Crémerie": ["lait", "beurre", "crème", "crème fraîche", "fromage", "mozzarella", "gruyère", "parmesan", "yaourt", "yogourt", "œuf", "œufs", "oeuf", "oeufs"],
    "Épicerie": ["farine", "sucre", "sel", "poivre", "riz", "pâtes", "pâte", "nouilles", "chapelure", "levure", "fécule", "maïzena", "huile", "vinaigre", "sauce soja", "sauce d’huître", "sauce d'huitre", "sauce huitre", "moutarde", "mayonnaise", "ketchup", "bouillon", "épices", "curry", "paprika", "cannelle", "miel", "chocolat", "cacao", "vanille", "alcool de riz", "shaoxing"],
    "Conserves": ["tomates pelées", "concentré de tomate", "sauce tomate", "thon en boîte", "maïs", "petits pois", "haricots verts", "cornichons", "olives"],
    "Boissons": ["eau", "eau gazeuse", "jus", "soda", "sirop", "bière", "vin"],
    "Surgelés": ["frites", "glace", "glaces", "légumes surgelés", "pizza surgelée"],
    "Hygiène": ["savon", "dentifrice", "shampoing", "gel douche", "coton", "mouchoirs", "rasoir"],
    "Entretien": ["lessive", "liquide vaisselle", "papier toilette", "essuie-tout", "sacs poubelle", "papier alu", "film étirable", "éponges"],
    "Maison": ["piles", "ampoules", "bougies", "enveloppes", "stylo", "colle", "ruban adhésif"],
    "Animaux": ["croquettes", "litière", "jouet"],
    "Pharmacie": ["pansements", "désinfectant", "paracétamol", "vitamines"]
  };
  const DEFAULT_MANUAL_UNITS = {
    "œufs": "pce",
    "beurre": "g",
    "crème fraîche": "dl",
    "fromage": "g",
    "yaourts": "pce",
    "bœuf": "g",
    "veau": "g",
    "porc": "g",
    "volaille": "g",
    "lardons": "g",
    "jambon": "g",
    "saumon": "g",
    "thon": "g",
    "cabillaud": "g",
    "crevettes": "g",
    "pommes": "pce",
    "poires": "pce",
    "bananes": "pce",
    "citrons": "pce",
    "tomates": "pce",
    "carottes": "pce",
    "pommes de terre": "kg",
    "oignons": "pce",
    "pâtes": "g",
    "riz": "g",
    "farine": "g",
    "sucre": "g",
    "eau": "l",
    "eau gazeuse": "l",
    "lait": "l",
    "sodas": "bouteille",
    "pansements": "pce",
    "piles": "pce",
    "ampoules": "pce",
    "enveloppes": "pce"
  };
  const defaultShopping = { items: [], entries: [], availableKeys: {}, selectedServings: 4, qrBaseUrl: "" };
  const state = loadState();
  const searchQueries = { recipeSearch: "", cookingSearch: "", shoppingSearch: "" };
  const navStack = [];
  let currentRoute = "home";
  let editingRecipeId = null;
  let currentRecipeImage = null;
  let selectedCookingId = null;
  let cookingPeopleByRecipe = {};
  let realizationSteps = {};
  let wakeLock = null;
  let wakeLockActive = false;
  let selectedShoppingId = null;
  let shoppingIngredientsOpen = false;
  let shoppingIngredientSelections = {};
  let shoppingRecipeCategoriesOpen = {};
  let openManualCategory = "Viande";
  let manualCatalogInputs = {};
  let customManualItem = { name: "", quantity: "", unit: "", category: "Autre" };
  let pendingManualItems = [];
  let shoppingSectionsOpen = { recipes: false, manual: false };
  let toastTimer = null;
  let confirmAction = null;
  let pendingBackupImport = null;

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
        shopping: normalizeShopping(saved.shopping),
        manualCatalog: normalizeManualCatalog(saved.manualCatalog)
      };
    } catch (error) {
      return { recipes: [], shopping: cloneDefaultShopping(), manualCatalog: defaultManualCatalog() };
    }
  }

  function cloneDefaultShopping() {
    return { items: [], entries: [], manualItems: [], availableKeys: {}, selectedServings: defaultShopping.selectedServings, qrBaseUrl: "" };
  }

  function normalizeShopping(shopping) {
    const normalized = cloneDefaultShopping();
    if (!shopping || typeof shopping !== "object") return normalized;
    normalized.items = Array.isArray(shopping.items) ? shopping.items : [];
    normalized.entries = Array.isArray(shopping.entries) ? shopping.entries : [];
    normalized.manualItems = Array.isArray(shopping.manualItems) ? shopping.manualItems : [];
    normalized.availableKeys = shopping.availableKeys && typeof shopping.availableKeys === "object" ? shopping.availableKeys : {};
    normalized.selectedServings = Number(shopping.selectedServings) || defaultShopping.selectedServings;
    normalized.qrBaseUrl = String(shopping.qrBaseUrl || "");
    return normalized;
  }

  function defaultManualCatalog() {
    return MANUAL_CATEGORIES.map(function (category) {
      return {
        id: createId(),
        name: category[0],
        items: category[1].map(function (name) {
          return {
            id: createId(),
            name,
            unit: DEFAULT_MANUAL_UNITS[normalizeIngredientName(name)] || ""
          };
        })
      };
    });
  }

  function normalizeManualCatalog(catalog) {
    if (!Array.isArray(catalog)) return defaultManualCatalog();
    const categories = catalog.map(function (category) {
      const name = cleanIngredientName(category && category.name);
      if (!name) return null;
      const items = Array.isArray(category.items) ? category.items.map(function (item) {
        if (typeof item === "string") {
          return { id: createId(), name: cleanIngredientName(item), unit: DEFAULT_MANUAL_UNITS[normalizeIngredientName(item)] || "" };
        }
        const itemName = cleanIngredientName(item && item.name);
        if (!itemName) return null;
        return {
          id: item.id || createId(),
          name: itemName,
          unit: MANUAL_UNITS.includes(item.unit) ? item.unit : ""
        };
      }).filter(Boolean) : [];
      return { id: category.id || createId(), name, items };
    }).filter(Boolean);
    return categories.length ? categories : defaultManualCatalog();
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
    if (hash === "store" || hash.startsWith("store?z=")) {
      currentRoute = hash;
      renderStoreMode(hash.startsWith("store?z=") ? hash.slice("store?z=".length) : "");
      return;
    }

    currentRoute = ["recipes", "cooking", "realization", "shopping", "manual", "manual-customize"].includes(hash) ? hash : "home";
    render();
  }

  function render() {
    if (currentRoute.startsWith("store?z=")) return;
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
    if (currentRoute === "realization") return realizationView();
    if (currentRoute === "shopping") return shoppingView();
    if (currentRoute === "manual") return manualAddView();
    if (currentRoute === "manual-customize") return manualCustomizeView();
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
            <button class="secondary" data-action="export-json">Exporter recettes seulement</button>
            <label class="file-button">Importer recettes seulement<input type="file" accept="application/json,.json" data-action="import-json"></label>
          </div>
        </div>
        <div class="box backup-box">
          <div>
            <h2>Sauvegarde</h2>
            <p class="muted">Les données sont sauvegardées dans le navigateur de cet appareil. Pense à exporter régulièrement une sauvegarde complète, surtout avant une mise à jour ou un changement d'appareil.</p>
          </div>
          <div class="actions">
            <button class="primary" data-action="export-full-backup">Exporter sauvegarde complète</button>
            <label class="file-button">Importer sauvegarde complète<input type="file" accept="application/json,.json" data-action="import-full-backup"></label>
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
        ${recipe.image ? `<img class="recipe-thumb" src="${escapeAttr(recipe.image)}" alt="">` : ""}
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
    const image = currentRecipeImage === null ? (recipe?.image || "") : currentRecipeImage;
    return `
      <form id="recipeForm" class="form-grid" action="javascript:void(0)" method="post">
        <input type="hidden" name="id" value="${escapeAttr(recipe?.id || "")}">
        <input type="hidden" id="imageData" name="image" value="${escapeAttr(image)}">
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
          <label for="imageInput">Image du plat</label>
          <div class="image-editor">
            <div id="imagePreview" class="image-preview">
              ${image ? `<img src="${escapeAttr(image)}" alt="Image du plat">` : '<span>Aucune image</span>'}
            </div>
            <div class="actions">
              <label class="file-button">Choisir une image<input id="imageInput" type="file" accept="image/*" data-action="recipe-image"></label>
              <button type="button" class="ghost" data-action="remove-recipe-image">Retirer l’image</button>
            </div>
          </div>
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
    const people = recipe ? getCookingPeople(recipe) : 4;
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
                  ${r.image ? `<img class="recipe-thumb" src="${escapeAttr(r.image)}" alt="">` : ""}
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
      return `<div class="ingredient-line">${index + 1}. ${escapeHtml(step)}</div>`;
    }).join("");
    return `
      <div class="panel cooking-card">
        <div class="cooking-hero">
          <div class="panel">
            <div>
              <h2>${escapeHtml(recipe.name)}</h2>
              <p class="muted">Recette originale pour ${recipe.servings} personne${recipe.servings > 1 ? "s" : ""}.</p>
            </div>
            <div class="field">
              <label for="cookingServings">Nombre de personnes</label>
              <select id="cookingServings" data-recipe-id="${recipe.id}">
                ${cookingServingOptions(recipe.servings, people)}
              </select>
            </div>
            <div class="actions">
              <button class="primary start-button" data-action="start-realization" data-id="${recipe.id}">Commencer la recette</button>
              ${recipe.youtube ? `<a class="secondary" href="${escapeAttr(recipe.youtube)}" target="_blank" rel="noopener">Ouvrir la vidéo</a>` : ""}
            </div>
          </div>
          ${recipeImageBlock(recipe)}
        </div>
        <div>
          <h3>Ingrédients</h3>
          <ul class="ingredients-list">${ingredients}</ul>
        </div>
        ${recipe.notes ? `<div class="notes-box"><h3>Notes</h3><p>${escapeHtml(recipe.notes)}</p></div>` : ""}
        <div>
          <h3>Préparation</h3>
          <div class="steps">${steps}</div>
        </div>
      </div>
    `;
  }

  function realizationView() {
    const recipe = selectedCookingId ? findRecipe(selectedCookingId) : null;
    if (!recipe) {
      return '<section class="panel"><div class="empty">Sélectionne une recette dans le mode cuisine.</div></section>';
    }
    const people = getCookingPeople(recipe);
    const ingredients = recipe.ingredients.map(function (line) {
      return `<li class="ingredient-line">${escapeHtml(scaleIngredient(line, people, recipe.servings).display)}</li>`;
    }).join("");
    const steps = recipe.steps.map(function (step, index) {
      const key = stepKey(recipe.id, index);
      const checked = Boolean(realizationSteps[key]);
      return `
        <label class="realization-step ${checked ? "done" : ""}">
          <input type="checkbox" data-action="toggle-realization-step" data-key="${key}" ${checked ? "checked" : ""}>
          <span>${escapeHtml(step)}</span>
        </label>
      `;
    }).join("");
    return `
      <section class="panel realization-page">
        <div class="page-head">
          <div>
            <h1>${escapeHtml(recipe.name)}</h1>
            <p class="muted">${people} personne${people > 1 ? "s" : ""}</p>
          </div>
          <div class="actions">
            <button class="secondary" data-action="back-to-cooking">Retour à la fiche recette</button>
            <button class="secondary" data-action="toggle-wake-lock">${wakeLockActive ? "Écran allumé activé" : "Garder l’écran allumé"}</button>
            <button class="ghost" data-action="reset-realization-steps">Tout décocher</button>
          </div>
        </div>
        <div class="realization-hero">
          ${recipeImageBlock(recipe)}
          <div class="panel">
            ${recipe.youtube ? `<a class="secondary" href="${escapeAttr(recipe.youtube)}" target="_blank" rel="noopener">Ouvrir la vidéo</a>` : ""}
            ${recipe.notes ? `<div class="notes-box"><h3>Notes</h3><p>${escapeHtml(recipe.notes)}</p></div>` : ""}
          </div>
        </div>
        <div class="realization-grid">
          <div class="box">
            <h2>Ingrédients</h2>
            <ul class="ingredients-list">${ingredients}</ul>
          </div>
          <div class="box">
            <h2>Préparation</h2>
            <div class="realization-steps">${steps}</div>
          </div>
        </div>
      </section>
    `;
  }

  function getCookingPeople(recipe) {
    return Number(cookingPeopleByRecipe[recipe.id] || recipe.servings || 4);
  }

  function cookingServingOptions(original, selected) {
    const values = Array.from(new Set(SERVING_CHOICES.concat([Number(original), Number(selected)]))).sort(function (a, b) { return a - b; });
    return values.map(function (value) {
      const label = value === Number(original) ? value + " ← original" : String(value);
      return `<option value="${value}" ${value === Number(selected) ? "selected" : ""}>${escapeHtml(label)}</option>`;
    }).join("");
  }

  function recipeImageBlock(recipe) {
    return `<div class="dish-image">${recipe.image ? `<img src="${escapeAttr(recipe.image)}" alt="Image du plat">` : '<span>Aucune image</span>'}</div>`;
  }

  function stepKey(recipeId, index) {
    return recipeId + ":" + index;
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
          <button class="primary" data-route="manual">Ajout manuel</button>
        </div>
        <div class="grid-two">
          <div class="box panel">
            ${recipe ? shoppingSelector(recipe, selectedServings) : '<div class="empty compact-empty">Sélectionne une recette pour préparer ta liste.</div>'}
            <div class="search-row">
              <input id="shoppingSearch" type="search" placeholder="Rechercher par nom ou ingrédient" value="${escapeAttr(query)}">
            </div>
            ${shoppingRecipeCategoryList(matches, query)}
          </div>
          <div class="box panel">
            ${shoppingCollapsibleSection("recipes", "Recettes ajoutées", state.shopping.entries.length, state.shopping.entries.map(shoppingEntryRow).join(""))}
            ${shoppingCollapsibleSection("manual", "Articles ajoutés manuellement", state.shopping.manualItems.length, state.shopping.manualItems.map(manualItemRow).join(""))}
            <div class="page-head">
              <div>
                <h2>Ma liste</h2>
                <p class="muted">${shoppingItems.length} article${shoppingItems.length > 1 ? "s" : ""}</p>
              </div>
              <div class="actions">
                <button class="ghost" data-action="ask-clear-shopping" ${state.shopping.entries.length || shoppingItems.length ? "" : "disabled"}>Vider</button>
              </div>
            </div>
            <div class="list">
              ${shoppingItems.length ? shoppingGroupedList(shoppingItems, shoppingItemRow) : '<div class="empty">La liste est vide.</div>'}
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
    const ingredientRows = shoppingIngredientRows(recipe, selectedServings);
    const selectedCount = selectedShoppingIngredientIndexes(recipe).length;
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
        <section class="shopping-ingredients-picker">
          <button class="shopping-section-toggle" data-action="toggle-shopping-ingredients">
            ${shoppingIngredientsOpen ? "▼" : "▶"} Choisir les ingrédients (${selectedCount}/${recipe.ingredients.length})
          </button>
          ${shoppingIngredientsOpen ? `
            <div class="actions">
              <button type="button" class="secondary" data-action="select-all-shopping-ingredients" data-id="${recipe.id}">Tout cocher</button>
              <button type="button" class="secondary" data-action="unselect-all-shopping-ingredients" data-id="${recipe.id}">Tout décocher</button>
            </div>
            <div class="list shopping-ingredient-list">
              ${ingredientRows}
            </div>
          ` : ""}
        </section>
      </div>
    `;
  }

  function shoppingRecipeCategoryList(recipes, query) {
    if (!recipes.length) return '<div class="empty">Aucune recette trouvée.</div>';
    const groups = groupRecipesByCategory(recipes);
    const hasQuery = Boolean(String(query || "").trim());
    return `
      <div class="list shopping-recipe-categories">
        ${groups.map(function (group) {
          const key = shoppingCategoryKey(group.category);
          const isOpen = hasQuery ? true : Boolean(shoppingRecipeCategoriesOpen[key]);
          return `
            <section class="shopping-recipe-category">
              <button class="shopping-section-toggle" data-action="toggle-shopping-recipe-category" data-category="${escapeAttr(key)}">
                ${isOpen ? "▼" : "▶"} ${escapeHtml(group.category)} (${group.recipes.length})
              </button>
              ${isOpen ? `
                <div class="shopping-recipe-category-list">
                  ${group.recipes.map(shoppingRecipeSelectRow).join("")}
                </div>
              ` : ""}
            </section>
          `;
        }).join("")}
      </div>
    `;
  }

  function groupRecipesByCategory(recipes) {
    const byCategory = new Map();
    recipes.forEach(function (recipe) {
      const category = recipe.category && recipe.category.trim() ? recipe.category.trim() : "Sans catégorie";
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category).push(recipe);
    });
    return Array.from(byCategory.entries()).map(function ([category, categoryRecipes]) {
      return { category, recipes: categoryRecipes.sort(byName) };
    }).sort(function (a, b) {
      if (a.category === "Sans catégorie") return 1;
      if (b.category === "Sans catégorie") return -1;
      return a.category.localeCompare(b.category, "fr", { sensitivity: "base" });
    });
  }

  function shoppingRecipeSelectRow(recipe) {
    return `<button class="recipe-row" data-action="select-shopping" data-id="${recipe.id}">
      <span><span class="row-title">${escapeHtml(recipe.name)}</span><br><span class="row-meta">Original: ${recipe.servings} personne${recipe.servings > 1 ? "s" : ""}</span></span>
      <span>Sélectionner</span>
    </button>`;
  }

  function shoppingCategoryKey(category) {
    return normalizeName(category || "Sans catégorie") || "sans-categorie";
  }

  function shoppingIngredientRows(recipe, selectedServings) {
    return recipe.ingredients.map(function (line, index) {
      const scaled = scaleIngredient(line, selectedServings, recipe.servings);
      const checked = isShoppingIngredientSelected(recipe.id, index);
      return `
        <label class="shopping-ingredient-choice ${checked ? "" : "unchecked"}">
          <input type="checkbox" data-action="toggle-shopping-ingredient" data-recipe-id="${escapeAttr(recipe.id)}" data-index="${index}" ${checked ? "checked" : ""}>
          <span>${escapeHtml(scaled.display)}</span>
        </label>
      `;
    }).join("");
  }

  function isShoppingIngredientSelected(recipeId, index) {
    const selection = shoppingIngredientSelections[recipeId] || {};
    return selection[index] !== false;
  }

  function selectedShoppingIngredientIndexes(recipe) {
    return recipe.ingredients
      .map(function (_line, index) { return index; })
      .filter(function (index) { return isShoppingIngredientSelected(recipe.id, index); });
  }

  function setAllShoppingIngredients(recipeId, checked) {
    const recipe = findRecipe(recipeId);
    if (!recipe) return;
    const selection = {};
    recipe.ingredients.forEach(function (_line, index) {
      selection[index] = checked;
    });
    shoppingIngredientSelections[recipeId] = selection;
    render();
  }

  function toggleShoppingIngredient(recipeId, index, checked) {
    const selection = shoppingIngredientSelections[recipeId] || {};
    selection[index] = checked;
    shoppingIngredientSelections[recipeId] = selection;
    render();
  }

  function shoppingCollapsibleSection(key, title, count, content) {
    const open = Boolean(shoppingSectionsOpen[key]);
    return `
      <section class="shopping-compact-section">
        <button class="shopping-section-toggle" data-action="toggle-shopping-section" data-section="${key}">
          ${open ? "▼" : "▶"} ${escapeHtml(title)} (${count})
        </button>
        ${open && count ? `<div class="list shopping-section-content">${content}</div>` : ""}
      </section>
    `;
  }

  function servingOptions(original, selected) {
    const values = Array.from(new Set(SERVING_CHOICES.concat([Number(original), Number(selected)]))).sort(function (a, b) { return a - b; });
    return values.map(function (value) {
      const label = value === Number(original) ? value + " ← original" : String(value);
      return `<option value="${value}" ${value === Number(selected) ? "selected" : ""}>${escapeHtml(label)}</option>`;
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

  function shoppingGroupedList(items, rowRenderer) {
    const groups = groupShoppingItems(items);
    return groups.map(function (group) {
      return `
        <section class="shopping-rayon">
          <h3>${escapeHtml(group.category)} (${group.items.length})</h3>
          <div class="list">
            ${group.items.map(rowRenderer).join("")}
          </div>
        </section>
      `;
    }).join("");
  }

  function shoppingEntryRow(entry) {
    const selectedCount = Array.isArray(entry.ingredientIndexes) ? entry.ingredientIndexes.length : null;
    const totalCount = Number(entry.ingredientCount) || null;
    const detail = selectedCount !== null && totalCount
      ? `${entry.servings} personne${Number(entry.servings) > 1 ? "s" : ""} · Ingrédients sélectionnés : ${selectedCount}/${totalCount}`
      : `${entry.servings} personne${Number(entry.servings) > 1 ? "s" : ""}`;
    return `
      <article class="recipe-row">
        <div>
          <div class="row-title">${escapeHtml(entry.recipeName)}</div>
          <div class="row-meta">${escapeHtml(detail)}</div>
        </div>
        <button type="button" class="ghost" data-action="remove-shopping-entry" data-id="${entry.id}">Retirer</button>
      </article>
    `;
  }

  function manualItemRow(item) {
    return `
      <article class="recipe-row">
        <div>
          <div class="row-title">${escapeHtml(item.display)}</div>
          <div class="row-meta">Ajout manuel</div>
        </div>
        <button type="button" class="ghost" data-action="remove-manual-item" data-id="${item.id}">Retirer</button>
      </article>
    `;
  }

  function manualAddView() {
    return `
      <section class="panel">
        <div class="page-head">
          <div>
            <h1>Ajout manuel</h1>
            <p class="muted">Ajoute des articles à la même liste finale que les recettes.</p>
          </div>
          <button class="secondary" data-route="shopping">Retour vers la liste de courses</button>
        </div>
        <div class="grid-two">
          <div class="box panel">
            <div class="page-head compact-head">
              <h2>Rayons</h2>
              <button class="secondary" data-route="manual-customize">Personnaliser</button>
            </div>
            ${manualCategories().map(manualCategoryBlock).join("")}
            <button class="secondary" data-action="add-filled-catalog-items">Ajouter les articles renseignés</button>
            <div class="manual-custom">
              <h2>Articles personnalisés</h2>
              <div class="form-grid">
                <div class="field full">
                  <label for="customName">Nom de l’article</label>
                  <input id="customName" data-custom-manual-field="name" placeholder="Clavier gaming" value="${escapeAttr(customManualItem.name)}">
                </div>
                <div class="field">
                  <label for="customQty">Quantité</label>
                  <input id="customQty" data-custom-manual-field="quantity" type="number" min="0" step="0.1" placeholder="1" value="${escapeAttr(customManualItem.quantity)}">
                </div>
                <div class="field">
                  <label for="customUnit">Unité</label>
                  <select id="customUnit" data-custom-manual-field="unit">${unitOptions(customManualItem.unit)}</select>
                </div>
                <div class="field">
                  <label for="customCategory">Rayon</label>
                  <select id="customCategory" data-custom-manual-field="category">${categoryOptions(customManualItem.category || "Autre")}</select>
                </div>
                <div class="actions full">
                  <button class="secondary" data-action="add-custom-manual">Ajouter</button>
                </div>
              </div>
            </div>
          </div>
          <div class="box panel">
            <div>
              <h2>Articles à ajouter</h2>
              <p class="muted">${pendingManualItems.length} article${pendingManualItems.length > 1 ? "s" : ""} en attente.</p>
            </div>
            <div class="list">
              ${pendingManualItems.length ? pendingManualItems.map(pendingManualRow).join("") : '<div class="empty">Aucun article à ajouter.</div>'}
            </div>
            <button class="primary" data-action="commit-manual-items" ${pendingManualItems.length ? "" : "disabled"}>Ajouter à la liste de courses</button>
          </div>
        </div>
      </section>
    `;
  }

  function manualCustomizeView() {
    return `
      <section class="panel">
        <div class="page-head">
          <div>
            <h1>Personnaliser les rayons</h1>
            <p class="muted">Ajoute tes rayons, tes articles et leurs unités par défaut.</p>
          </div>
          <div class="actions">
            <button class="secondary" data-route="manual">Retour vers Ajout manuel</button>
            <button class="danger" data-action="ask-reset-manual-catalog">Réinitialiser les rayons par défaut</button>
          </div>
        </div>
        <div class="box panel">
          <h2>Ajouter un rayon</h2>
          <div class="selector-grid">
            <div class="field">
              <label for="newManualCategoryName">Nom du nouveau rayon</label>
              <input id="newManualCategoryName" placeholder="Bricolage">
            </div>
            <button class="primary" data-action="add-manual-category">Ajouter le rayon</button>
          </div>
        </div>
        <div class="panel">
          ${manualCategories().map(manualCustomizeCategoryBlock).join("")}
        </div>
      </section>
    `;
  }

  function manualCustomizeCategoryBlock(category) {
    const open = openManualCategory === category.name;
    const categoryId = category.id;
    return `
      <section class="manual-category customize-category">
        <button class="manual-category-toggle" data-action="toggle-manual-category" data-name="${escapeAttr(category.name)}">${open ? "▾" : "▸"} ${escapeHtml(category.name)} (${category.items.length})</button>
        ${open ? `
          <div class="manual-customize-body">
            <div class="form-grid">
              <div class="field">
                <label for="categoryName-${escapeAttr(categoryId)}">Nom du rayon</label>
                <input id="categoryName-${escapeAttr(categoryId)}" value="${escapeAttr(category.name)}">
              </div>
              <div class="actions">
                <button class="secondary" data-action="rename-manual-category" data-category-id="${escapeAttr(categoryId)}">Renommer</button>
                <button class="ghost" data-action="ask-delete-manual-category" data-category-id="${escapeAttr(categoryId)}">Supprimer</button>
              </div>
            </div>
            <div class="manual-customize-add">
              <h3>Ajouter un article</h3>
              <div class="form-grid">
                <div class="field">
                  <label for="newItemName-${escapeAttr(categoryId)}">Nom de l'article</label>
                  <input id="newItemName-${escapeAttr(categoryId)}" placeholder="mangues">
                </div>
                <div class="field">
                  <label for="newItemUnit-${escapeAttr(categoryId)}">Unité par défaut</label>
                  <select id="newItemUnit-${escapeAttr(categoryId)}">${unitOptions("")}</select>
                </div>
                <div class="actions full">
                  <button class="secondary" data-action="add-catalog-item" data-category-id="${escapeAttr(categoryId)}">Ajouter l'article</button>
                </div>
              </div>
            </div>
            <div class="list">
              ${category.items.length ? category.items.map(function (item) { return manualCustomizeItemRow(category, item); }).join("") : '<div class="empty">Aucun article dans ce rayon.</div>'}
            </div>
          </div>
        ` : ""}
      </section>
    `;
  }

  function manualCustomizeItemRow(category, item) {
    return `
      <article class="manual-edit-row">
        <div class="field">
          <label for="itemName-${escapeAttr(item.id)}">Article</label>
          <input id="itemName-${escapeAttr(item.id)}" value="${escapeAttr(item.name)}">
        </div>
        <div class="field">
          <label for="itemUnit-${escapeAttr(item.id)}">Unité par défaut</label>
          <select id="itemUnit-${escapeAttr(item.id)}">${unitOptions(item.unit || "")}</select>
        </div>
        <div class="actions">
          <button class="secondary" data-action="rename-catalog-item" data-category-id="${escapeAttr(category.id)}" data-item-id="${escapeAttr(item.id)}">Modifier</button>
          <button class="ghost" data-action="ask-delete-catalog-item" data-category-id="${escapeAttr(category.id)}" data-item-id="${escapeAttr(item.id)}">Supprimer</button>
        </div>
      </article>
    `;
  }

  function manualCategories() {
    if (!Array.isArray(state.manualCatalog) || !state.manualCatalog.length) {
      state.manualCatalog = defaultManualCatalog();
    }
    return state.manualCatalog;
  }

  function manualCategoryBlock(category) {
    const name = category.name;
    const items = category.items || [];
    const open = openManualCategory === name;
    return `
      <section class="manual-category">
        <button class="manual-category-toggle" data-action="toggle-manual-category" data-name="${escapeAttr(name)}">${open ? "▾" : "▸"} ${escapeHtml(name)}</button>
        ${open ? `<div class="manual-items">${items.map(function (item) { return manualPresetRow(item, name); }).join("")}</div>` : ""}
      </section>
    `;
  }

  function manualPresetRow(name, categoryName) {
    const item = typeof name === "string" ? { name, unit: "" } : name;
    const itemName = item.name;
    const key = manualCatalogKey(itemName, categoryName);
    const itemState = manualCatalogInputs[key] || { quantity: "" };
    const unit = Object.prototype.hasOwnProperty.call(itemState, "unit") ? itemState.unit : (item.unit || "");
    const id = "manual-" + key;
    return `
      <div class="manual-row">
        <div class="row-title">${escapeHtml(itemName)}</div>
        <input id="${id}-qty" data-manual-key="${escapeAttr(key)}" data-manual-name="${escapeAttr(itemName)}" data-manual-category="${escapeAttr(categoryName)}" data-manual-default-unit="${escapeAttr(item.unit || "")}" data-manual-field="quantity" data-manual-qty type="number" min="0" step="0.1" placeholder="Qté" value="${escapeAttr(itemState.quantity || "")}" aria-label="Quantité ${escapeAttr(itemName)}">
        <select id="${id}-unit" data-manual-key="${escapeAttr(key)}" data-manual-name="${escapeAttr(itemName)}" data-manual-category="${escapeAttr(categoryName)}" data-manual-default-unit="${escapeAttr(item.unit || "")}" data-manual-field="unit" data-manual-unit aria-label="Unité ${escapeAttr(itemName)}">${unitOptions(unit)}</select>
        <button type="button" class="secondary" data-action="add-preset-manual" data-name="${escapeAttr(itemName)}" data-key="${escapeAttr(key)}" data-category="${escapeAttr(categoryName)}">Ajouter</button>
      </div>
    `;
  }

  function unitOptions(selected) {
    return MANUAL_UNITS.map(function (unit) {
      const label = unit || "Sans unité";
      return `<option value="${escapeAttr(unit)}" ${unit === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
    }).join("");
  }

  function categoryOptions(selected) {
    const categories = ["Autre"].concat(getShoppingCategoryOrder().filter(function (category) { return category !== "Autre"; }));
    return categories.map(function (category) {
      return `<option value="${escapeAttr(category)}" ${category === selected ? "selected" : ""}>${escapeHtml(category)}</option>`;
    }).join("");
  }

  function manualCatalogKey(name, category) {
    return normalizeIngredientName((category || "") + "-" + name).replace(/[^a-z0-9]+/g, "-");
  }

  function pendingManualRow(item) {
    return `
      <article class="recipe-row">
        <div>
          <div class="row-title">${escapeHtml(item.display)}</div>
          <div class="row-meta">Rayon: ${escapeHtml(item.category || "Autre")}</div>
        </div>
        <button type="button" class="ghost" data-action="remove-pending-manual" data-id="${item.id}">Retirer</button>
      </article>
    `;
  }

  function renderStoreMode(encoded) {
    let payload;
    let loadedFromQr = false;
    let savedPayload = getSavedStorePayload();
    if (encoded) {
      try {
        payload = expandCompactQrPayload(JSON.parse(decompressQrPayload(encoded)));
        payload.id = "qr-" + shortHash(encoded);
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
      showStoreToast("Liste chargée sur ce téléphone.");
    }
    const hasSavedList = Boolean(savedPayload && Array.isArray(savedPayload.items) && savedPayload.items.length);
    const openedWithoutData = !encoded;
    const key = STORE_STATE_PREFIX + (payload.id || "list");
    const checked = new Set(JSON.parse(localStorage.getItem(key) || "[]"));
    const hidden = localStorage.getItem(key + "-hidden") === "1";
    const visibleItems = payload.items.filter(function (item) { return !(hidden && checked.has(item.id)); });
    app.className = "app-shell store-mode";
    app.innerHTML = `
      <header class="topbar">
        <div class="brand">Mode magasin</div>
      </header>
      <main class="main">
        <section class="panel">
          <div class="store-head">
            <h1>Liste de courses</h1>
            <p class="muted">${payload.items.length} article${payload.items.length > 1 ? "s" : ""}</p>
            ${loadedFromQr ? '<p class="muted store-saved-note">Liste sauvegardée sur ce téléphone.</p>' : ""}
          </div>
          ${storeSavedNotice(openedWithoutData, hasSavedList)}
          <div class="store-tools">
            <button class="secondary" data-action="toggle-hide-store" data-key="${key}">${hidden ? "Afficher les cochés" : "Masquer les articles cochés"}</button>
            <button class="secondary" data-action="uncheck-store" data-key="${key}">Tout décocher</button>
            <button class="danger" data-action="ask-empty-store" data-key="${key}">Vider la liste</button>
          </div>
          <div class="list" id="storeList">
            ${visibleItems.length ? storeGroupedList(visibleItems, checked, key) : '<div class="empty">La liste est vide.</div>'}
          </div>
        </section>
      </main>
      ${toastMarkup()}
    `;
  }

  function showStoreToast(message) {
    window.__toast = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      window.__toast = "";
      if (currentRoute === "store" || String(currentRoute).startsWith("store?z=")) {
        const toast = document.querySelector(".toast");
        if (toast) toast.remove();
        return;
      }
      render();
    }, 3000);
  }

  function storeGroupedList(items, checked, storageKey) {
    return groupShoppingItems(items).map(function (group) {
      return `
        <section class="shopping-rayon store-rayon">
          <h2>${escapeHtml(group.category)} (${group.items.length})</h2>
          <div class="list">
            ${group.items.map(function (item) {
              const isChecked = checked.has(item.id);
              return `<label class="store-row ${isChecked ? "checked" : ""}">
                <input type="checkbox" data-action="toggle-store" data-id="${escapeAttr(item.id)}" data-key="${escapeAttr(storageKey)}" ${isChecked ? "checked" : ""}>
                <span class="store-text">${escapeHtml(item.display)}</span>
              </label>`;
            }).join("")}
          </div>
        </section>
      `;
    }).join("");
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
      image: String(data.get("image") || "").trim(),
      ingredients: splitLines(data.get("ingredients")),
      steps: splitLines(data.get("steps")),
      notes: String(data.get("notes") || "").trim()
    };
    const existing = state.recipes.findIndex(function (r) { return r.id === id; });
    if (existing >= 0) state.recipes[existing] = recipe;
    else state.recipes.push(recipe);
    editingRecipeId = id;
    currentRecipeImage = recipe.image || "";
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
      currentRecipeImage = "";
      render();
    }
    if (action === "edit-recipe") {
      editingRecipeId = target.dataset.id;
      const recipe = findRecipe(editingRecipeId);
      currentRecipeImage = recipe?.image || "";
      render();
    }
    if (action === "ask-delete-recipe") askDeleteRecipe(target.dataset.id);
    if (action === "confirm-delete") confirmDelete();
    if (action === "cancel-confirm") {
      if (confirmAction && ["import-full-backup", "replace-full-backup"].includes(confirmAction.type)) {
        pendingBackupImport = null;
      }
      confirmAction = null;
      render();
    }
    if (action === "export-json") exportJson();
    if (action === "export-full-backup") exportFullBackup();
    if (action === "backup-merge") applyPendingBackupImport("merge");
    if (action === "backup-replace") askReplaceBackup();
    if (action === "confirm-replace-backup") applyPendingBackupImport("replace");
    if (action === "select-cooking") {
      selectedCookingId = target.dataset.id;
      const recipe = findRecipe(selectedCookingId);
      if (recipe && !cookingPeopleByRecipe[recipe.id]) cookingPeopleByRecipe[recipe.id] = recipe.servings || 4;
      render();
    }
    if (action === "start-realization") {
      selectedCookingId = target.dataset.id;
      navigate("realization");
    }
    if (action === "back-to-cooking") navigate("cooking");
    if (action === "toggle-realization-step") {
      realizationSteps[target.dataset.key] = event.target.checked;
      render();
    }
    if (action === "reset-realization-steps") resetRealizationSteps();
    if (action === "toggle-wake-lock") toggleWakeLock();
    if (action === "remove-recipe-image") removeRecipeImage();
    if (action === "select-shopping") {
      selectedShoppingId = target.dataset.id;
      const recipe = findRecipe(selectedShoppingId);
      state.shopping.selectedServings = recipe?.servings || 4;
      shoppingIngredientsOpen = false;
      saveState();
      render();
    }
    if (action === "add-shopping") addRecipeToShopping(target.dataset.id);
    if (action === "toggle-shopping-ingredients") {
      shoppingIngredientsOpen = !shoppingIngredientsOpen;
      render();
    }
    if (action === "toggle-shopping-ingredient") {
      toggleShoppingIngredient(target.dataset.recipeId, Number(target.dataset.index), event.target.checked);
    }
    if (action === "select-all-shopping-ingredients") setAllShoppingIngredients(target.dataset.id, true);
    if (action === "unselect-all-shopping-ingredients") setAllShoppingIngredients(target.dataset.id, false);
    if (action === "toggle-shopping-recipe-category") {
      const category = target.dataset.category;
      shoppingRecipeCategoriesOpen[category] = !shoppingRecipeCategoriesOpen[category];
      render();
    }
    if (action === "toggle-shopping-section") {
      const section = target.dataset.section;
      shoppingSectionsOpen[section] = !shoppingSectionsOpen[section];
      render();
    }
    if (action === "toggle-manual-category") {
      openManualCategory = openManualCategory === target.dataset.name ? "" : target.dataset.name;
      render();
    }
    if (action === "add-preset-manual") addManualItemFromRow(target);
    if (action === "add-filled-catalog-items") addFilledCatalogItems();
    if (action === "add-custom-manual") addCustomManualItem();
    if (action === "add-manual-category") addManualCategory();
    if (action === "rename-manual-category") renameManualCategory(target.dataset.categoryId);
    if (action === "ask-delete-manual-category") askDeleteManualCategory(target.dataset.categoryId);
    if (action === "confirm-delete-manual-category") confirmDeleteManualCategory();
    if (action === "add-catalog-item") addCatalogItem(target.dataset.categoryId);
    if (action === "rename-catalog-item") renameCatalogItem(target.dataset.categoryId, target.dataset.itemId);
    if (action === "ask-delete-catalog-item") askDeleteCatalogItem(target.dataset.categoryId, target.dataset.itemId);
    if (action === "confirm-delete-catalog-item") confirmDeleteCatalogItem();
    if (action === "ask-reset-manual-catalog") askResetManualCatalog();
    if (action === "confirm-reset-manual-catalog") confirmResetManualCatalog();
    if (action === "remove-pending-manual") removePendingManualItem(target.dataset.id);
    if (action === "commit-manual-items") commitManualItems();
    if (action === "remove-manual-item") removeManualItem(target.dataset.id);
    if (action === "toggle-available") toggleAvailable(target.dataset.key, event.target.checked);
    if (action === "remove-shopping-entry") removeShoppingEntry(target.dataset.id);
    if (action === "ask-clear-shopping") askClearShopping();
    if (action === "confirm-clear-shopping") clearShopping();
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
    if (event.target.id === "qrBaseUrl") {
      state.shopping.qrBaseUrl = event.target.value.trim();
      saveState();
    }
    if (event.target.dataset.manualField) {
      updateManualCatalogInput(event.target);
    }
    if (event.target.dataset.customManualField) {
      updateCustomManualInput(event.target);
    }
  }

  function handleChange(event) {
    const action = event.target.dataset.action;
    if (event.target.id === "shoppingServings") {
      state.shopping.selectedServings = Number(event.target.value);
      saveState();
      render();
    }
    if (event.target.id === "cookingServings") {
      const recipeId = event.target.dataset.recipeId || selectedCookingId;
      if (recipeId) cookingPeopleByRecipe[recipeId] = Number(event.target.value);
      render();
    }
    if (event.target.dataset.manualField) {
      updateManualCatalogInput(event.target);
    }
    if (event.target.dataset.customManualField) {
      updateCustomManualInput(event.target);
    }
    if (action === "import-json") importJson(event.target.files[0]);
    if (action === "import-full-backup") importFullBackup(event.target.files[0]);
    if (action === "recipe-image") handleRecipeImage(event.target.files[0]);
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

  function resetRealizationSteps() {
    const recipe = selectedCookingId ? findRecipe(selectedCookingId) : null;
    if (!recipe) return;
    recipe.steps.forEach(function (_step, index) {
      delete realizationSteps[stepKey(recipe.id, index)];
    });
    render();
  }

  async function toggleWakeLock() {
    if (wakeLockActive && wakeLock) {
      await wakeLock.release().catch(function () {});
      wakeLock = null;
      wakeLockActive = false;
      showToast("Écran allumé désactivé.");
      return;
    }
    if (!("wakeLock" in navigator)) {
      showToast("Cette fonction n’est pas disponible sur ce navigateur.");
      return;
    }
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLockActive = true;
      wakeLock.addEventListener("release", function () {
        wakeLockActive = false;
        wakeLock = null;
      });
      showToast("Écran allumé activé.");
    } catch (error) {
      showToast("Cette fonction n’est pas disponible sur ce navigateur.");
    }
  }

  function removeRecipeImage() {
    currentRecipeImage = "";
    const field = document.getElementById("imageData");
    const preview = document.getElementById("imagePreview");
    if (field) field.value = "";
    if (preview) preview.innerHTML = "<span>Aucune image</span>";
  }

  function handleRecipeImage(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Choisis un fichier image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      resizeImage(String(reader.result), 800, 0.78).then(function (dataUrl) {
        currentRecipeImage = dataUrl;
        const field = document.getElementById("imageData");
        const preview = document.getElementById("imagePreview");
        if (field) field.value = dataUrl;
        if (preview) preview.innerHTML = `<img src="${escapeAttr(dataUrl)}" alt="Image du plat">`;
        showToast("Image ajoutée.");
      }).catch(function () {
        showToast("Impossible de préparer cette image.");
      });
    };
    reader.readAsDataURL(file);
  }

  function resizeImage(dataUrl, maxWidth, quality) {
    return new Promise(function (resolve, reject) {
      const image = new Image();
      image.onload = function () {
        const ratio = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.onerror = reject;
      image.src = dataUrl;
    });
  }

  function addRecipeToShopping(id) {
    const recipe = findRecipe(id);
    if (!recipe) return;
    const servings = Number(state.shopping.selectedServings || recipe.servings);
    const ingredientIndexes = selectedShoppingIngredientIndexes(recipe);
    if (!ingredientIndexes.length) {
      showToast("Aucun ingrédient sélectionné.");
      return;
    }
    state.shopping.entries.push({
      id: createId(),
      recipeId: recipe.id,
      recipeName: recipe.name,
      servings,
      ingredientIndexes,
      ingredientCount: recipe.ingredients.length
    });
    state.shopping.items = buildShoppingItems();
    saveState();
    showToast("Recette ajoutée à la liste.");
    render();
  }

  function addManualItemFromRow(button) {
    const row = button.closest(".manual-row");
    const name = button.dataset.name || "";
    const category = button.dataset.category || "Autre";
    const key = button.dataset.key || manualCatalogKey(name, category);
    const qty = row ? row.querySelector("[data-manual-qty]").value : (manualCatalogInputs[key]?.quantity || "");
    const unit = row ? row.querySelector("[data-manual-unit]").value : (manualCatalogInputs[key]?.unit || "");
    rememberManualCatalogInput(key, name, qty, unit, category);
    addPendingManualItem(name, qty, unit, category, "catalog");
  }

  function addCustomManualItem() {
    const name = document.getElementById("customName")?.value || customManualItem.name || "";
    const qty = document.getElementById("customQty")?.value || customManualItem.quantity || "";
    const unit = document.getElementById("customUnit")?.value || customManualItem.unit || "";
    const category = document.getElementById("customCategory")?.value || customManualItem.category || "Autre";
    if (addPendingManualItem(name, qty, unit, category, "custom")) {
      customManualItem = { name: "", quantity: "", unit: "", category: "Autre" };
      const nameInput = document.getElementById("customName");
      const qtyInput = document.getElementById("customQty");
      const unitInput = document.getElementById("customUnit");
      const categoryInput = document.getElementById("customCategory");
      if (nameInput) nameInput.value = "";
      if (qtyInput) qtyInput.value = "";
      if (unitInput) unitInput.value = "";
      if (categoryInput) categoryInput.value = "Autre";
    }
  }

  function addFilledCatalogItems() {
    const additions = Object.entries(manualCatalogInputs).filter(function (entry) {
      const item = entry[1];
      return item.name && (String(item.quantity || "").trim() || String(item.unit || "").trim());
    });
    if (!additions.length) {
      showToast("Aucun article renseigné");
      return;
    }
    const pendingAdditions = additions.map(function (entry) {
      const item = entry[1];
      return createPendingManualItem(item.name, item.quantity, item.unit, "catalog", item.category);
    }).filter(Boolean);
    pendingManualItems = pendingManualItems.concat(pendingAdditions);
    additions.forEach(function (entry) { delete manualCatalogInputs[entry[0]]; });
    showToast("Articles ajoutés aux articles à ajouter");
    render();
  }

  function findManualCategory(categoryId) {
    return manualCategories().find(function (category) { return category.id === categoryId; });
  }

  function addManualCategory() {
    const name = cleanIngredientName(document.getElementById("newManualCategoryName")?.value || "");
    if (!name) {
      showToast("Indique un nom de rayon.");
      return;
    }
    if (manualCategories().some(function (category) { return normalizeIngredientName(category.name) === normalizeIngredientName(name); })) {
      showToast("Ce rayon existe déjà.");
      return;
    }
    state.manualCatalog.push({ id: createId(), name, items: [] });
    openManualCategory = name;
    saveState();
    showToast("Rayon ajouté.");
    render();
  }

  function renameManualCategory(categoryId) {
    const category = findManualCategory(categoryId);
    if (!category) return;
    const name = cleanIngredientName(document.getElementById("categoryName-" + categoryId)?.value || "");
    if (!name) {
      showToast("Indique un nom de rayon.");
      return;
    }
    if (manualCategories().some(function (other) {
      return other.id !== categoryId && normalizeIngredientName(other.name) === normalizeIngredientName(name);
    })) {
      showToast("Ce rayon existe déjà.");
      return;
    }
    const previousName = category.name;
    category.name = name;
    if (openManualCategory === previousName) openManualCategory = name;
    saveState();
    showToast("Rayon modifié.");
    render();
  }

  function askDeleteManualCategory(categoryId) {
    const category = findManualCategory(categoryId);
    if (!category) return;
    confirmAction = { type: "delete-manual-category", categoryId };
    render();
  }

  function confirmDeleteManualCategory() {
    if (!confirmAction || confirmAction.type !== "delete-manual-category") return;
    const category = findManualCategory(confirmAction.categoryId);
    state.manualCatalog = manualCategories().filter(function (item) { return item.id !== confirmAction.categoryId; });
    if (category && openManualCategory === category.name) {
      openManualCategory = state.manualCatalog[0]?.name || "Viande";
    }
    manualCatalogInputs = {};
    confirmAction = null;
    saveState();
    showToast("Rayon supprimé.");
    render();
  }

  function addCatalogItem(categoryId) {
    const category = findManualCategory(categoryId);
    if (!category) return;
    const name = cleanIngredientName(document.getElementById("newItemName-" + categoryId)?.value || "");
    const unit = document.getElementById("newItemUnit-" + categoryId)?.value || "";
    if (!name) {
      showToast("Indique un nom d'article.");
      return;
    }
    if (category.items.some(function (item) { return normalizeIngredientName(item.name) === normalizeIngredientName(name); })) {
      showToast("Cet article existe déjà dans ce rayon.");
      return;
    }
    category.items.push({ id: createId(), name, unit: MANUAL_UNITS.includes(unit) ? unit : "" });
    saveState();
    showToast("Article ajouté.");
    render();
  }

  function renameCatalogItem(categoryId, itemId) {
    const category = findManualCategory(categoryId);
    const item = category?.items.find(function (candidate) { return candidate.id === itemId; });
    if (!category || !item) return;
    const name = cleanIngredientName(document.getElementById("itemName-" + itemId)?.value || "");
    const unit = document.getElementById("itemUnit-" + itemId)?.value || "";
    if (!name) {
      showToast("Indique un nom d'article.");
      return;
    }
    if (category.items.some(function (other) {
      return other.id !== itemId && normalizeIngredientName(other.name) === normalizeIngredientName(name);
    })) {
      showToast("Cet article existe déjà dans ce rayon.");
      return;
    }
    item.name = name;
    item.unit = MANUAL_UNITS.includes(unit) ? unit : "";
    manualCatalogInputs = {};
    saveState();
    showToast("Article modifié.");
    render();
  }

  function askDeleteCatalogItem(categoryId, itemId) {
    confirmAction = { type: "delete-catalog-item", categoryId, itemId };
    render();
  }

  function confirmDeleteCatalogItem() {
    if (!confirmAction || confirmAction.type !== "delete-catalog-item") return;
    const category = findManualCategory(confirmAction.categoryId);
    if (category) {
      category.items = category.items.filter(function (item) { return item.id !== confirmAction.itemId; });
    }
    manualCatalogInputs = {};
    confirmAction = null;
    saveState();
    showToast("Article supprimé.");
    render();
  }

  function askResetManualCatalog() {
    confirmAction = { type: "reset-manual-catalog" };
    render();
  }

  function confirmResetManualCatalog() {
    if (!confirmAction || confirmAction.type !== "reset-manual-catalog") return;
    state.manualCatalog = defaultManualCatalog();
    manualCatalogInputs = {};
    openManualCategory = "Viande";
    confirmAction = null;
    saveState();
    showToast("Rayons par défaut restaurés.");
    render();
  }

  function updateManualCatalogInput(input) {
    const key = input.dataset.manualKey;
    const name = input.dataset.manualName || "";
    const category = input.dataset.manualCategory || "Autre";
    const defaultUnit = input.dataset.manualDefaultUnit || "";
    if (!key) return;
    const current = manualCatalogInputs[key] || { name, quantity: "", unit: defaultUnit, category };
    current.name = name || current.name;
    current.category = category || current.category || "Autre";
    if (!Object.prototype.hasOwnProperty.call(current, "unit")) current.unit = defaultUnit;
    current[input.dataset.manualField] = input.value;
    manualCatalogInputs[key] = current;
  }

  function rememberManualCatalogInput(key, name, quantity, unit, category) {
    manualCatalogInputs[key] = {
      name,
      quantity: String(quantity || "").trim(),
      unit: String(unit || "").trim(),
      category: category || "Autre"
    };
  }

  function updateCustomManualInput(input) {
    customManualItem[input.dataset.customManualField] = input.value;
  }

  function addPendingManualItem(name, qty, unit, category, source) {
    const item = createPendingManualItem(name, qty, unit, source || "custom", category);
    if (!item) {
      showToast("Indique un nom d’article.");
      return false;
    }
    pendingManualItems = pendingManualItems.concat([item]);
    showToast("Article ajouté aux articles à ajouter");
    render();
    return true;
  }

  function createPendingManualItem(name, qty, unit, source, category) {
    const display = formatManualDisplay(name, qty, unit);
    if (!display) return null;
    return {
      id: createId(),
      name: cleanIngredientName(name),
      quantity: String(qty || "").trim(),
      unit: String(unit || "").trim(),
      source,
      category: category || (source === "catalog" ? classifyShoppingItem(name) : "Autre"),
      display
    };
  }

  function commitManualItems() {
    if (!pendingManualItems.length) {
      showToast("Aucun article à ajouter");
      return;
    }
    state.shopping.manualItems = state.shopping.manualItems.concat(pendingManualItems.map(function (item) {
      return { ...item, id: createId() };
    }));
    pendingManualItems = [];
    state.shopping.items = buildShoppingItems();
    saveState();
    showToast("Articles ajoutés à la liste de courses");
    navigate("shopping");
  }

  function removePendingManualItem(id) {
    pendingManualItems = pendingManualItems.filter(function (item) { return item.id !== id; });
    render();
  }

  function addManualItem(name, qty, unit, category) {
    const display = formatManualDisplay(name, qty, unit);
    if (!display) return false;
    state.shopping.manualItems.push({
      id: createId(),
      name: cleanIngredientName(name),
      quantity: String(qty || "").trim(),
      unit: String(unit || "").trim(),
      category: category || "Autre",
      display
    });
    state.shopping.items = buildShoppingItems();
    saveState();
    return true;
  }

  function removeManualItem(id) {
    state.shopping.manualItems = state.shopping.manualItems.filter(function (item) { return item.id !== id; });
    state.shopping.items = state.shopping.entries.length || state.shopping.manualItems.length ? buildShoppingItems() : [];
    saveState();
    render();
  }

  function formatManualDisplay(name, qty, unit) {
    const cleanName = cleanIngredientName(name);
    const cleanQty = String(qty || "").trim().replace(",", ".");
    const cleanUnit = String(unit || "").trim();
    if (!cleanName) return "";
    return [cleanQty, cleanUnit, cleanName].filter(Boolean).join(" ");
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
    state.shopping.items = state.shopping.entries.length || state.shopping.manualItems.length ? buildShoppingItems() : [];
    saveState();
    render();
  }

  function askClearShopping() {
    confirmAction = { type: "clear-shopping" };
    render();
  }

  function clearShopping() {
    state.shopping.items = [];
    state.shopping.entries = [];
    state.shopping.manualItems = [];
    state.shopping.availableKeys = {};
    confirmAction = null;
    saveState();
    render();
  }

  function shoppingQrItems() {
    return buildShoppingItems()
      .filter(function (item) { return !item.available; });
  }

  function buildShoppingItems() {
    if (!state.shopping.entries.length && !state.shopping.manualItems.length) {
      return state.shopping.items.map(function (item) {
        const key = item.key || shoppingItemKey(item.display, item.parsed);
        return {
          id: key,
          key,
          display: item.display,
          parsed: item.parsed || null,
          category: getItemCategory(item.display, { parsed: item.parsed, category: item.category }),
          available: Boolean(state.shopping.availableKeys[key] || item.available)
        };
      });
    }

    const rawItems = [];
    state.shopping.entries.forEach(function (entry) {
      const recipe = findRecipe(entry.recipeId);
      if (!recipe) return;
      const includedIndexes = Array.isArray(entry.ingredientIndexes)
        ? new Set(entry.ingredientIndexes.map(Number))
        : null;
      recipe.ingredients.forEach(function (line, index) {
        if (includedIndexes && !includedIndexes.has(index)) return;
        const scaled = scaleIngredient(line, entry.servings, recipe.servings);
        rawItems.push({
          id: createId(),
          key: shoppingItemKey(scaled.display, scaled.parsed),
          display: scaled.display,
          parsed: scaled.parsed,
          category: getItemCategory(scaled.display, { parsed: scaled.parsed }),
          available: false
        });
      });
    });
    state.shopping.manualItems.forEach(function (manual) {
      const display = manual.display || formatManualDisplay(manual.name, manual.quantity, manual.unit);
      const parsed = parseIngredient(display);
      rawItems.push({
        id: manual.id,
        key: shoppingItemKey(display, parsed),
        display,
        parsed,
        category: getItemCategory(display, { parsed, category: manual.category }),
        available: false
      });
    });

    return mergeShoppingItems(rawItems).map(function (item) {
      item.key = item.key || shoppingItemKey(item.display, item.parsed);
      item.id = item.key;
      item.category = getItemCategory(item.display, { parsed: item.parsed, category: item.category });
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
    const compactPayload = createCompactQrPayload(items);
    const compactJson = items.length ? JSON.stringify(compactPayload) : "";
    const encoded = compactJson ? compressQrPayload(compactJson) : "";
    const url = baseUrl && encoded ? baseUrl + "#store?z=" + encoded : "";
    window.__lastListUrl = url;
    clearQrOutput(warning, holder, linkBox);
    renderQrDiagnostics(diagnostics, {
      itemCount: items.length,
      baseUrl,
      url,
      compactJsonSize: compactJson.length,
      compressedSize: encoded.length,
      qrLoaded: Boolean(qrFactory),
      error: ""
    });

    if (!holder) {
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        compactJsonSize: compactJson.length,
        compressedSize: encoded.length,
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
        compactJsonSize: compactJson.length,
        compressedSize: encoded.length,
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
        compactJsonSize: compactJson.length,
        compressedSize: encoded.length,
        qrLoaded: false,
        error: "Erreur QR : bibliothèque QR non chargée"
      });
      setQrError(warning, "Erreur QR : bibliothèque QR non chargée");
      return;
    }
    if (!getQrCompression()) {
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        compactJsonSize: compactJson.length,
        compressedSize: encoded.length,
        qrLoaded: Boolean(qrFactory),
        error: "Erreur QR : bibliothèque de compression non chargée"
      });
      setQrError(warning, "Erreur QR : bibliothèque de compression non chargée");
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
        compactJsonSize: compactJson.length,
        compressedSize: encoded.length,
        qrLoaded: Boolean(qrFactory),
        error: message
      });
      setQrError(warning, message);
      return;
    }

    if (!url.includes("#store?z=")) {
      linkBox.innerHTML = qrLinkMarkup(url);
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        compactJsonSize: compactJson.length,
        compressedSize: encoded.length,
        qrLoaded: Boolean(qrFactory),
        error: "Erreur QR : le lien ne contient pas #store?z="
      });
      setQrError(warning, "Erreur QR : le lien ne contient pas #store?z=");
      return;
    }

    if (url.includes("file://") || url.includes("localhost") || url.includes("127.0.0.1")) {
      linkBox.innerHTML = qrLinkMarkup(url);
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        compactJsonSize: compactJson.length,
        compressedSize: encoded.length,
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
        compactJsonSize: compactJson.length,
        compressedSize: encoded.length,
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
      holder.innerHTML = qr.createImgTag(7, 8, "QR code de la liste de courses");
      warning.textContent = items.length > 50 || url.length > 1800
        ? "La liste est peut-être trop longue pour un QR fiable. Utilise le bouton Copier le lien."
        : "QR généré. Le lien compact contient la liste de courses finale.";
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        compactJsonSize: compactJson.length,
        compressedSize: encoded.length,
        qrLoaded: true,
        error: ""
      });
    } catch (error) {
      const message = "Erreur QR : " + String(error && error.message ? error.message : error);
      renderQrDiagnostics(diagnostics, {
        itemCount: items.length,
        baseUrl,
        url,
        compactJsonSize: compactJson.length,
        compressedSize: encoded.length,
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

  function getQrCompression() {
    return window.QRCompression && typeof window.QRCompression.compress === "function" && typeof window.QRCompression.decompress === "function"
      ? window.QRCompression
      : null;
  }

  function compressQrPayload(json) {
    const compression = getQrCompression();
    return compression ? compression.compress(json) : "";
  }

  function decompressQrPayload(value) {
    const compression = getQrCompression();
    if (!compression) throw new Error("Bibliothèque de compression non chargée");
    return compression.decompress(value);
  }

  function createCompactQrPayload(items) {
    return {
      v: 2,
      i: items.map(compactQrItem)
    };
  }

  function compactQrItem(item) {
    const category = getItemCategory(item.display, { parsed: item.parsed, category: item.category });
    const code = CATEGORY_CODES[category] || category || "au";
    if (item.parsed && item.parsed.canMerge) {
      const parts = parsedCompactParts(item.parsed);
      return [parts.name, parts.quantity, parts.unit, code];
    }
    return [cleanIngredientName(item.display), "", "", code];
  }

  function parsedCompactParts(parsed) {
    const copy = { ...parsed };
    let quantity = copy.quantityBase;
    let unit = copy.displayUnit;
    if (copy.unitKey === "g" && quantity >= 1000 && quantity % 1000 === 0) {
      quantity = quantity / 1000;
      unit = "kg";
    } else if (copy.unitKey === "ml" && quantity >= 1000 && quantity % 1000 === 0) {
      quantity = quantity / 1000;
      unit = "l";
    } else if (copy.unitKey === "ml" && quantity % 100 === 0) {
      quantity = quantity / 100;
      unit = "dl";
    } else if (copy.unitKey === "piece") {
      unit = "";
    } else if (copy.unitKey === "pce") {
      unit = "pce";
    } else if (copy.unitKey === "egg") {
      unit = Math.abs(quantity) > 1 ? "œufs" : "œuf";
    }
    return {
      name: cleanIngredientName(copy.name || defaultNameForUnit(copy.unitKey, unit)),
      quantity: Number.isInteger(quantity) ? quantity : Number((Math.round(quantity * 1000) / 1000).toFixed(3)),
      unit
    };
  }

  function expandCompactQrPayload(payload) {
    if (!payload || Number(payload.v) !== 2 || !Array.isArray(payload.i)) {
      throw new Error("Format QR compact invalide");
    }
    return {
      id: "qr",
      items: payload.i.map(function (item, index) {
        const name = cleanIngredientName(item[0]);
        const quantity = item[1];
        const unit = cleanIngredientName(item[2]);
        const category = CATEGORY_NAMES_BY_CODE[item[3]] || cleanIngredientName(item[3]) || "Autre";
        const display = formatCompactQrDisplay(name, quantity, unit);
        return {
          id: "store-" + index + "-" + normalizeIngredientName(category + " " + display),
          display,
          category
        };
      })
    };
  }

  function formatCompactQrDisplay(name, quantity, unit) {
    if (quantity === "" || quantity === null || typeof quantity === "undefined") return name;
    return [formatNumber(Number(quantity)), unit, name].filter(Boolean).join(" ");
  }

  function shortHash(value) {
    let hash = 0;
    String(value || "").split("").forEach(function (char) {
      hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    });
    return Math.abs(hash).toString(36);
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
        <div>Articles : ${details.itemCount}</div>
        <div>JSON compact : ${details.compactJsonSize || 0} caractères</div>
        <div>Compressé : ${details.compressedSize || 0} caractères</div>
        <div>URL finale : ${details.url ? details.url.length : 0} caractères</div>
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
      dataVersion: 1,
      type: "recipes-only",
      exportedAt: new Date().toISOString(),
      recipes: state.recipes
    };
    downloadJson(data, "recettes-famille-recettes-" + todayStamp() + ".json");
    showToast("Export recettes préparé.");
  }

  function exportFullBackup() {
    downloadJson(createFullBackupData(), "recettes-famille-sauvegarde-" + todayStamp() + ".json");
    showToast("Sauvegarde complète préparée.");
  }

  function createFullBackupData() {
    return {
      app: "Recettes Famille",
      version: 1,
      dataVersion: 1,
      type: "full-backup",
      exportedAt: new Date().toISOString(),
      recipes: state.recipes,
      manualCatalog: manualCategories(),
      shopping: normalizeShopping(state.shopping),
      settings: {
        selectedServings: state.shopping.selectedServings,
        qrBaseUrl: state.shopping.qrBaseUrl
      }
    };
  }

  function downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function todayStamp() {
    return new Date().toISOString().slice(0, 10);
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
        showToast("Import recettes terminé.");
        render();
      } catch (error) {
        showToast("Import impossible: fichier JSON invalide.");
      }
    };
    reader.readAsText(file);
  }

  function importFullBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result));
        const backup = normalizeFullBackup(data);
        pendingBackupImport = backup;
        confirmAction = { type: "import-full-backup", summary: backupSummary(backup) };
        render();
      } catch (error) {
        pendingBackupImport = null;
        showToast("Import impossible: sauvegarde complète invalide.");
      }
    };
    reader.readAsText(file);
  }

  function normalizeFullBackup(data) {
    if (!data || data.app !== "Recettes Famille") throw new Error("Application invalide");
    if (data.type === "recipes-only") throw new Error("Ce fichier contient seulement les recettes");
    if (!Array.isArray(data.manualCatalog) && !data.shopping && !data.settings) {
      throw new Error("Sauvegarde complète invalide");
    }
    const recipes = Array.isArray(data.recipes) ? data.recipes.map(normalizeRecipe) : [];
    const manualCatalog = normalizeManualCatalog(data.manualCatalog);
    const shopping = normalizeShopping(data.shopping);
    return {
      app: "Recettes Famille",
      version: Number(data.version) || 1,
      dataVersion: Number(data.dataVersion) || 1,
      exportedAt: String(data.exportedAt || ""),
      recipes,
      manualCatalog,
      shopping,
      settings: data.settings && typeof data.settings === "object" ? data.settings : {}
    };
  }

  function backupSummary(backup) {
    const articleCount = backup.manualCatalog.reduce(function (total, category) {
      return total + category.items.length;
    }, 0);
    return {
      recipes: backup.recipes.length,
      categories: backup.manualCatalog.length,
      catalogItems: articleCount,
      manualItems: backup.shopping.manualItems.length
    };
  }

  function askReplaceBackup() {
    if (!pendingBackupImport) return;
    confirmAction = { type: "replace-full-backup", summary: backupSummary(pendingBackupImport) };
    render();
  }

  function applyPendingBackupImport(mode) {
    if (!pendingBackupImport) return;
    if (mode === "replace") replaceWithBackup(pendingBackupImport);
    else mergeBackup(pendingBackupImport);
    pendingBackupImport = null;
    confirmAction = null;
    saveState();
    state.shopping.items = buildShoppingItems();
    saveState();
    showToast(mode === "replace" ? "Sauvegarde restaurée." : "Sauvegarde fusionnée.");
    render();
  }

  function replaceWithBackup(backup) {
    state.recipes = backup.recipes;
    state.manualCatalog = backup.manualCatalog;
    state.shopping = normalizeShopping(backup.shopping);
    if (backup.settings.qrBaseUrl && !state.shopping.qrBaseUrl) {
      state.shopping.qrBaseUrl = String(backup.settings.qrBaseUrl);
    }
    manualCatalogInputs = {};
    pendingManualItems = [];
  }

  function mergeBackup(backup) {
    mergeRecipes(backup.recipes);
    mergeManualCatalog(backup.manualCatalog);
    mergeShoppingBackup(backup.shopping, backup.settings);
    manualCatalogInputs = {};
  }

  function mergeRecipes(recipes) {
    const existingIds = new Set(state.recipes.map(function (recipe) { return recipe.id; }));
    const existingNames = new Set(state.recipes.map(function (recipe) { return normalizeIngredientName(recipe.name); }));
    recipes.forEach(function (recipe) {
      if (existingIds.has(recipe.id) || existingNames.has(normalizeIngredientName(recipe.name))) return;
      state.recipes.push(recipe);
      existingIds.add(recipe.id);
      existingNames.add(normalizeIngredientName(recipe.name));
    });
  }

  function mergeManualCatalog(catalog) {
    catalog.forEach(function (incomingCategory) {
      let category = manualCategories().find(function (existing) {
        return normalizeIngredientName(existing.name) === normalizeIngredientName(incomingCategory.name);
      });
      if (!category) {
        state.manualCatalog.push({
          id: incomingCategory.id || createId(),
          name: incomingCategory.name,
          items: incomingCategory.items.map(function (item) { return { ...item, id: item.id || createId() }; })
        });
        return;
      }
      incomingCategory.items.forEach(function (incomingItem) {
        const existingItem = category.items.find(function (item) {
          return normalizeIngredientName(item.name) === normalizeIngredientName(incomingItem.name);
        });
        if (!existingItem) {
          category.items.push({ ...incomingItem, id: incomingItem.id || createId() });
        } else if (!existingItem.unit && incomingItem.unit) {
          existingItem.unit = incomingItem.unit;
        }
      });
    });
  }

  function mergeShoppingBackup(shopping, settings) {
    const current = normalizeShopping(state.shopping);
    const incoming = normalizeShopping(shopping);
    const manualKeys = new Set(current.manualItems.map(function (item) {
      return normalizeIngredientName((item.category || "") + " " + (item.display || formatManualDisplay(item.name, item.quantity, item.unit)));
    }));
    incoming.manualItems.forEach(function (item) {
      const key = normalizeIngredientName((item.category || "") + " " + (item.display || formatManualDisplay(item.name, item.quantity, item.unit)));
      if (manualKeys.has(key)) return;
      current.manualItems.push({ ...item, id: createId() });
      manualKeys.add(key);
    });
    const entryKeys = new Set(current.entries.map(function (entry) {
      return [entry.recipeId, entry.recipeName, entry.servings].join("|");
    }));
    incoming.entries.forEach(function (entry) {
      const key = [entry.recipeId, entry.recipeName, entry.servings].join("|");
      if (entryKeys.has(key)) return;
      current.entries.push({ ...entry, id: createId() });
      entryKeys.add(key);
    });
    current.availableKeys = { ...incoming.availableKeys, ...current.availableKeys };
    current.selectedServings = current.selectedServings || incoming.selectedServings;
    current.qrBaseUrl = current.qrBaseUrl || incoming.qrBaseUrl || String(settings?.qrBaseUrl || "");
    state.shopping = current;
  }

  function normalizeRecipe(recipe) {
    return {
      id: recipe.id || createId(),
      name: String(recipe.name || "Sans nom"),
      category: String(recipe.category || ""),
      servings: Math.max(1, Number(recipe.servings) || 1),
      youtube: String(recipe.youtube || ""),
      image: String(recipe.image || ""),
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.map(String) : splitLines(recipe.ingredients),
      steps: Array.isArray(recipe.steps) ? recipe.steps.map(String) : splitLines(recipe.steps),
      notes: String(recipe.notes || "")
    };
  }

  function mergeShoppingItems(items) {
    const merged = [];
    items.forEach(function (item) {
      const parsed = item.parsed;
      item.category = getItemCategory(item.display, { parsed, category: item.category });
      if (!parsed || !parsed.canMerge) {
        const plainKey = shoppingItemKey(item.display, null);
        const plainMatch = merged.find(function (existing) {
          return !existing.parsed && existing.key === plainKey;
        });
        if (!plainMatch) {
          item.key = plainKey;
          item.display = cleanIngredientName(item.display);
          merged.push(item);
        } else if (!plainMatch.category || plainMatch.category === "Autre") {
          plainMatch.category = item.category || plainMatch.category;
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
      if (!match.category || match.category === "Autre") {
        match.category = item.category || match.category;
      }
      match.parsed.quantityBase += parsed.quantityBase;
      match.display = formatParsed(match.parsed);
      match.key = shoppingItemKey(match.display, match.parsed);
    });
    return merged;
  }

  function groupShoppingItems(items) {
    const buckets = new Map();
    items.forEach(function (item) {
      const category = getItemCategory(item.display, { parsed: item.parsed, category: item.category });
      if (!buckets.has(category)) buckets.set(category, []);
      buckets.get(category).push({ ...item, category });
    });
    return getShoppingCategoryOrder(items)
      .filter(function (category) { return buckets.has(category); })
      .map(function (category) { return { category, items: buckets.get(category) }; });
  }

  function normalizeShoppingCategory(category) {
    return getShoppingCategoryOrder().includes(category) ? category : (category || "Autre");
  }

  function classifyShoppingItem(display, parsed) {
    return getItemCategory(display, { parsed });
  }

  function getItemCategory(itemName, options) {
    options = options || {};
    if (options.category) return normalizeShoppingCategory(options.category);
    const text = normalizeItemNameForCategory(options.parsed && options.parsed.name ? options.parsed.name : itemName);
    if (!text) return "Autre";

    const manualCategory = findManualCatalogCategory(text);
    if (manualCategory) return manualCategory;

    for (const category of SHOPPING_CATEGORY_ORDER) {
      const keywords = SHOPPING_CATEGORY_KEYWORDS[category] || [];
      if (keywords.some(function (keyword) {
        return categoryTextMatches(text, keyword);
      })) {
        return category;
      }
    }
    return "Autre";
  }

  function findManualCatalogCategory(normalizedItemName) {
    const categories = manualCategories();
    for (const category of categories) {
      for (const item of category.items || []) {
        const manualName = normalizeItemNameForCategory(item.name);
        if (!manualName) continue;
        if (manualName === "lait" && category.name === "Boissons") continue;
        if (normalizedItemName === manualName || normalizedItemName.includes(manualName) || manualName.includes(normalizedItemName)) {
          return normalizeShoppingCategory(category.name);
        }
      }
    }
    return "";
  }

  function categoryTextMatches(normalizedText, keyword) {
    const normalizedKeyword = normalizeItemNameForCategory(keyword);
    if (!normalizedKeyword) return false;
    return normalizedText === normalizedKeyword ||
      normalizedText.includes(normalizedKeyword) ||
      singularizeCategoryText(normalizedText).includes(singularizeCategoryText(normalizedKeyword));
  }

  function normalizeItemNameForCategory(value) {
    const parsed = parseIngredient(value);
    let text = parsed && parsed.name ? parsed.name : String(value || "");
    text = text
      .replace(/^\s*(\d+(?:[.,]\d+)?|(?:\d+\s*\/\s*\d+))\s*/i, "")
      .replace(/^(kg|g|ml|cl|dl|l|pce|pièces?|paquets?|bouteilles?|boîtes?|sachets?)\s+/i, "");
    text = normalizeIngredientName(text)
      .replace(/\b(de la|de l'|des|du|de|le|la|les)\b/g, " ")
      .replace(/\b(d'|l')/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return singularizeCategoryText(text);
  }

  function singularizeCategoryText(text) {
    return String(text || "").split(" ").map(function (word) {
      if (word.endsWith("aux") && word.length > 4) return word.slice(0, -3) + "al";
      if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
      return word;
    }).join(" ");
  }

  function getShoppingCategoryOrder(items) {
    const order = SHOPPING_CATEGORY_ORDER.filter(function (category) { return category !== "Autre"; });
    const addCategory = function (category) {
      const clean = cleanIngredientName(category);
      if (clean && clean !== "Autre" && !order.includes(clean)) order.push(clean);
    };
    if (state && Array.isArray(state.manualCatalog)) {
      state.manualCatalog.forEach(function (category) { addCategory(category.name); });
    }
    if (state && state.shopping && Array.isArray(state.shopping.manualItems)) {
      state.shopping.manualItems.forEach(function (item) { addCategory(item.category); });
    }
    if (Array.isArray(items)) {
      items.forEach(function (item) { addCategory(item.category); });
    }
    order.push("Autre");
    return order;
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
      ["pce", "pce", "pce", 1],
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
    } else if (unit === "pce") {
      displayUnit = "pce";
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
        normalizeName(recipe.category).includes(q) ||
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
      .replace(/[’‘`´]/g, "'")
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
    if (confirmAction.type === "clear-shopping") {
      return `
        <div class="modal-backdrop" role="dialog" aria-modal="true">
          <div class="modal">
            <h2>Vider la liste de courses ?</h2>
            <p>Cette action supprimera toutes les recettes ajoutées et tous les articles manuels de la liste de courses.</p>
            <div class="actions">
              <button class="secondary" data-action="cancel-confirm">Annuler</button>
              <button class="danger" data-action="confirm-clear-shopping">Vider la liste</button>
            </div>
          </div>
        </div>
      `;
    }
    if (confirmAction.type === "delete-catalog-item") {
      return `
        <div class="modal-backdrop" role="dialog" aria-modal="true">
          <div class="modal">
            <h2>Supprimer l'article</h2>
            <p>Voulez-vous vraiment supprimer cet article ?</p>
            <div class="actions">
              <button class="secondary" data-action="cancel-confirm">Annuler</button>
              <button class="danger" data-action="confirm-delete-catalog-item">Supprimer</button>
            </div>
          </div>
        </div>
      `;
    }
    if (confirmAction.type === "delete-manual-category") {
      const category = findManualCategory(confirmAction.categoryId);
      const hasItems = Boolean(category && category.items && category.items.length);
      return `
        <div class="modal-backdrop" role="dialog" aria-modal="true">
          <div class="modal">
            <h2>Supprimer le rayon</h2>
            <p>${hasItems ? "Ce rayon contient des articles. Voulez-vous vraiment le supprimer ?" : "Voulez-vous vraiment supprimer ce rayon ?"}</p>
            <div class="actions">
              <button class="secondary" data-action="cancel-confirm">Annuler</button>
              <button class="danger" data-action="confirm-delete-manual-category">Supprimer</button>
            </div>
          </div>
        </div>
      `;
    }
    if (confirmAction.type === "reset-manual-catalog") {
      return `
        <div class="modal-backdrop" role="dialog" aria-modal="true">
          <div class="modal">
            <h2>Réinitialiser les rayons</h2>
            <p>Voulez-vous vraiment réinitialiser les rayons et articles par défaut ?</p>
            <div class="actions">
              <button class="secondary" data-action="cancel-confirm">Annuler</button>
              <button class="danger" data-action="confirm-reset-manual-catalog">Réinitialiser</button>
            </div>
          </div>
        </div>
      `;
    }
    if (confirmAction.type === "import-full-backup") {
      const summary = confirmAction.summary;
      return `
        <div class="modal-backdrop" role="dialog" aria-modal="true">
          <div class="modal">
            <h2>Importer une sauvegarde complète</h2>
            <p>Cette sauvegarde contient :</p>
            <ul class="summary-list">
              <li>${summary.recipes} recette${summary.recipes > 1 ? "s" : ""}</li>
              <li>${summary.categories} rayon${summary.categories > 1 ? "s" : ""}</li>
              <li>${summary.catalogItems} article${summary.catalogItems > 1 ? "s" : ""} dans les rayons</li>
              <li>${summary.manualItems} article${summary.manualItems > 1 ? "s" : ""} ajouté${summary.manualItems > 1 ? "s" : ""} manuellement à la liste</li>
            </ul>
            <p>Voulez-vous importer cette sauvegarde ?</p>
            <div class="actions">
              <button class="secondary" data-action="cancel-confirm">Annuler</button>
              <button class="secondary" data-action="backup-merge">Fusionner avec les données actuelles</button>
              <button class="danger" data-action="backup-replace">Remplacer les données actuelles</button>
            </div>
          </div>
        </div>
      `;
    }
    if (confirmAction.type === "replace-full-backup") {
      return `
        <div class="modal-backdrop" role="dialog" aria-modal="true">
          <div class="modal">
            <h2>Remplacer les données</h2>
            <p>Attention, les données actuelles seront remplacées. Pensez à exporter une sauvegarde avant de continuer.</p>
            <div class="actions">
              <button class="secondary" data-action="cancel-confirm">Annuler</button>
              <button class="danger" data-action="confirm-replace-backup">Remplacer</button>
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
