// Contador de calorias simples em JavaScript
// Execute com Node.js: node aula.js

class CalorieCounter {
  constructor() {
    this.entries = [];
  }

  addEntry(food, calories, date = new Date()) {
    const entry = {
      food: String(food),
      calories: Number(calories),
      date: this._normalizeDate(date),
    };

    if (Number.isNaN(entry.calories) || entry.calories < 0) {
      throw new Error("Calorias devem ser um número maior ou igual a 0.");
    }

    this.entries.push(entry);
  }

  removeEntry(index) {
    if (index < 0 || index >= this.entries.length) {
      throw new Error("Índice inválido para remover entrada.");
    }
    this.entries.splice(index, 1);
  }

  getTotalCalories(date = null) {
    return this.entries
      .filter((entry) => (date ? entry.date === this._normalizeDate(date) : true))
      .reduce((sum, entry) => sum + entry.calories, 0);
  }

  getEntries(date = null) {
    return this.entries.filter((entry) => (date ? entry.date === this._normalizeDate(date) : true));
  }

  getSummary() {
    const summary = {};

    for (const entry of this.entries) {
      if (!summary[entry.date]) {
        summary[entry.date] = 0;
      }
      summary[entry.date] += entry.calories;
    }

    return summary;
  }

  _normalizeDate(date) {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Data inválida. Use YYYY-MM-DD ou um objeto Date válido.");
    }
    return parsed.toISOString().slice(0, 10);
  }
}

function printEntries(entries) {
  if (entries.length === 0) {
    console.log("Nenhuma entrada encontrada.");
    return;
  }

  entries.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.date} - ${entry.food} - ${entry.calories} calorias`);
  });
}

function printSummary(counter) {
  const summary = counter.getSummary();
  console.log("\nResumo de calorias por dia:");
  if (Object.keys(summary).length === 0) {
    console.log("Nenhuma entrada registrada ainda.");
    return;
  }
  for (const date of Object.keys(summary).sort()) {
    console.log(`${date}: ${summary[date]} calorias`);
  }
}

// Exemplo de uso automático
const counter = new CalorieCounter();

counter.addEntry("Banana", 105, "2026-04-16");
counter.addEntry("Arroz e feijão", 320, "2026-04-16");
counter.addEntry("Frango grelhado", 180, "2026-04-16");
counter.addEntry("Maçã", 95, "2026-04-17");

console.log("=== Entradas de exemplo ===");
printEntries(counter.getEntries());
console.log("Total geral:", counter.getTotalCalories(), "calorias");
printSummary(counter);

// Modo interativo para Node.js
if (typeof process !== "undefined" && process.versions && process.versions.node) {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function ask(question) {
    return new Promise((resolve) => rl.question(question, resolve));
  }

  async function main() {
    console.log("\nContador de calorias interativo");
    while (true) {
      console.log("\nEscolha uma opção:");
      console.log("1 - Adicionar entrada");
      console.log("2 - Mostrar todas as entradas");
      console.log("3 - Total de calorias do dia");
      console.log("4 - Resumo por dia");
      console.log("0 - Sair");

      const option = await ask("Opção: ");

      if (option === "0") {
        console.log("Até mais!");
        break;
      }

      if (option === "1") {
        const food = await ask("Nome do alimento: ");
        const calories = await ask("Calorias: ");
        const date = await ask("Data (YYYY-MM-DD) [opcional]: ");
        try {
          counter.addEntry(food, Number(calories), date || new Date());
          console.log("Entrada adicionada com sucesso!");
        } catch (error) {
          console.log("Erro:", error.message);
        }
      } else if (option === "2") {
        printEntries(counter.getEntries());
      } else if (option === "3") {
        const date = await ask("Data (YYYY-MM-DD): ");
        try {
          console.log("Total:", counter.getTotalCalories(date), "calorias");
        } catch (error) {
          console.log("Erro:", error.message);
        }
      } else if (option === "4") {
        printSummary(counter);
      } else {
        console.log("Opção inválida.");
      }
    }
    rl.close();
  }

  main().catch((error) => {
    console.error("Erro inesperado:", error.message);
    rl.close();
  });
}
