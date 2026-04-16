const form = document.getElementById('food-form');
const foodNameInput = document.getElementById('food-name');
const foodDescriptionInput = document.getElementById('food-description');
const foodCaloriesInput = document.getElementById('food-calories');
const foodDateInput = document.getElementById('food-date');
const estimateButton = document.getElementById('estimate-button');
const estimateResult = document.getElementById('estimate-result');
const entriesList = document.getElementById('entries');
const emptyMessage = document.getElementById('empty-message');
const totalCaloriesElement = document.getElementById('total-calories');
const dayCaloriesElement = document.getElementById('day-calories');
const selectedDateElement = document.getElementById('selected-date');

const DB_NAME = 'CalorieDB';
const DB_VERSION = 1;
const STORE_NAME = 'entries';
let db = null;
let entries = [];

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function normalizeDate(date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Data inválida.');
  }
  return parsed.toISOString().slice(0, 10);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = event.target.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        const store = dbInstance.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('date', 'date', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function getAllEntries() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function addEntryToDatabase(entry) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(entry);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function removeEntryFromDatabase(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

async function loadEntries() {
  entries = await getAllEntries();
  renderEntries();
}

function estimateCalories(food, description) {
  const text = `${food} ${description}`.toLowerCase();

  const baseCalories = {
    arroz: 130,
    feijao: 110,
    feijão: 110,
    carne: 250,
    frango: 165,
    peixe: 160,
    ovo: 78,
    banana: 105,
    maçã: 95,
    maca: 95,
    pão: 80,
    pao: 80,
    batata: 77,
    massa: 180,
    macarrao: 180,
    hamburguer: 250,
    salada: 35,
    abacate: 160,
    queijo: 110,
    leite: 60,
    pizza: 280,
    bolo: 320,
    chocolate: 230,
  };

  let base = 160;
  for (const key in baseCalories) {
    if (text.includes(key)) {
      base = baseCalories[key];
      break;
    }
  }

  const modifiers = [
    { keywords: ['frito', 'frita', 'frita', 'fritar', 'fritas'], factor: 1.5 },
    { keywords: ['grelhado', 'grelha', 'grelhada'], factor: 1.1 },
    { keywords: ['assado', 'assar', 'assada'], factor: 1.2 },
    { keywords: ['cozido', 'cozida', 'cozida', 'cozida'], factor: 0.9 },
    { keywords: ['sem óleo', 'sem oleo', 'sem óleo', 'light'], factor: 0.8 },
    { keywords: ['com azeite', 'azeite', 'com manteiga', 'manteiga'], factor: 1.2 },
    { keywords: ['cremoso', 'molho', 'empanado'], factor: 1.4 },
  ];

  let factor = 1;
  modifiers.forEach((modifier) => {
    if (modifier.keywords.some((keyword) => text.includes(keyword))) {
      factor *= modifier.factor;
    }
  });

  return Math.max(20, Math.round(base * factor));
}

async function addEntry(food, calories, date, description) {
  const normalizedDate = normalizeDate(date);
  const entry = { food, calories, date: normalizedDate, description };
  await addEntryToDatabase(entry);
  await loadEntries();
}

async function removeEntry(id) {
  await removeEntryFromDatabase(id);
  await loadEntries();
}

function getTotalCalories() {
  return entries.reduce((sum, entry) => sum + entry.calories, 0);
}

function getCaloriesByDate(date) {
  const normalizedDate = normalizeDate(date);
  return entries
    .filter((entry) => entry.date === normalizedDate)
    .reduce((sum, entry) => sum + entry.calories, 0);
}

function renderEntries() {
  entriesList.innerHTML = '';

  if (entries.length === 0) {
    emptyMessage.style.display = 'block';
  } else {
    emptyMessage.style.display = 'none';
    entries.forEach((entry) => {
      const item = document.createElement('li');
      item.className = 'entry-item';
      item.innerHTML = `
        <span>${formatDate(entry.date)} — <strong>${entry.food}</strong>${entry.description ? ` (${entry.description})` : ''} — ${entry.calories} calorias</span>
        <button type="button" aria-label="Remover entrada ${entry.food}">Remover</button>
      `;
      item.querySelector('button').addEventListener('click', () => removeEntry(entry.id));
      entriesList.appendChild(item);
    });
  }

  const selectedDay = foodDateInput.value || normalizeDate(new Date());
  totalCaloriesElement.textContent = getTotalCalories();
  dayCaloriesElement.textContent = entries.length ? getCaloriesByDate(selectedDay) : 0;
  selectedDateElement.textContent = formatDate(selectedDay);
}

estimateButton.addEventListener('click', () => {
  const food = foodNameInput.value.trim();
  const description = foodDescriptionInput.value.trim();

  if (!food) {
    alert('Digite o alimento para estimar as calorias.');
    return;
  }

  const estimate = estimateCalories(food, description);
  foodCaloriesInput.value = estimate;
  estimateResult.textContent = `Estimativa: ${estimate} calorias`;
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const food = foodNameInput.value.trim();
  const description = foodDescriptionInput.value.trim();
  let calories = foodCaloriesInput.value ? Number(foodCaloriesInput.value) : null;
  const date = foodDateInput.value;

  if (!food || !date || (foodCaloriesInput.value && Number.isNaN(calories))) {
    alert('Preencha o alimento e a data corretamente.');
    return;
  }

  if (calories === null) {
    calories = estimateCalories(food, description);
    estimateResult.textContent = `Estimativa usada: ${calories} calorias`;
  }

  if (calories < 0) {
    alert('Calorias inválidas.');
    return;
  }

  try {
    await addEntry(food, calories, date, description);
    form.reset();
    estimateResult.textContent = '';
    foodDateInput.value = normalizeDate(new Date());
  } catch (error) {
    alert('Erro ao salvar a entrada. Tente novamente.');
    console.error(error);
  }
});

foodDateInput.addEventListener('change', () => renderEntries());

(async function initialize() {
  foodDateInput.value = normalizeDate(new Date());

  try {
    await openDatabase();
    await loadEntries();
  } catch (error) {
    console.error('Não foi possível abrir o banco de dados:', error);
    alert('Erro ao abrir o banco de dados do navegador.');
  }
})();

