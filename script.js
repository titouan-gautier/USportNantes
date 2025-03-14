const puppeteer = require("puppeteer");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logMessage(message, type = "info") {
  console.log(message);

  // Pour GitHub Actions
  if (process.env.GITHUB_ACTIONS === "true") {
    switch (type) {
      case "success":
        console.log(`::notice::${message}`);
        break;
      case "error":
        console.log(`::error::${message}`);
        break;
      case "warning":
        console.log(`::warning::${message}`);
        break;
      default:
        console.log(`::debug::${message}`);
    }
  }
}

async function updateGitHubSummary(titre, message, status) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    const fs = require("fs");
    const summary = `
## ${titre}
**Status**: ${status}
**Détails**: ${message}
    `;

    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
}

async function initBrowser() {
  const options = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };

  // Utiliser le chemin d'exécutable fourni par l'environnement s'il existe
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  page.on("console", (msg) => console.log("Log du navigateur:", msg.text()));
  return { browser, page };
}

async function login(page) {
  await page.goto("https://u-sport.univ-nantes.fr", {
    waitUntil: "domcontentloaded",
  });

  await page
    .locator("button")
    .filter((button) => button.innerText === "Connexion")
    .click();

  await page.waitForSelector('input[name="username"]');
  await page.waitForSelector('input[name="password"]');

  await page.type('input[name="username"]', "E217657J");
  await page.type('input[name="password"]', "Tit042003!");
  await page.click('button[type="submit"]');
}

async function handleLoginDialog(page) {
  await page.waitForSelector("app-login-infos-dialog button.c-btn--warning", {
    visible: true,
    timeout: 10000,
  });
  await page.click("app-login-infos-dialog .c-btn.c-btn--warning");
}

async function navigateToBooking(page) {
  await page.waitForSelector(".nav-link", { visible: true });
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll(".nav-link"));
    const reserverLink = links.find((el) =>
      el.textContent.includes("Réserver mes créneaux")
    );
    if (reserverLink) reserverLink.click();
  });
}

async function selectActivity(page, nomActivite) {
  await page.waitForSelector("li.l-col.l-col-4\\@main.l-col-12-sm\\@main", {
    visible: true,
    timeout: 10000,
  });

  await sleep(1000);

  await page.evaluate(async (activiteRecherchee) => {
    const elements = Array.from(
      document.querySelectorAll("li.l-col.l-col-4\\@main.l-col-12-sm\\@main")
    );

    const elementTrouve = elements.find((el) => {
      const nomElement = el.querySelector(".nom");
      return (
        nomElement &&
        nomElement.textContent.trim().startsWith(activiteRecherchee)
      );
    });

    if (elementTrouve) {
      const bouton = elementTrouve.querySelector("button.c-btn.c-btn--primary");
      if (bouton) bouton.click();
    }
  }, nomActivite);
}

async function selectTimeSlot(page, criteresRecherche) {
  await page.waitForSelector("p-table.c-table", {
    visible: true,
    timeout: 10000,
  });

  return await page.evaluate((criteresRecherche) => {
    const { jour, start, end, lieu } = criteresRecherche;
    const lignes = Array.from(document.querySelectorAll("tr.c-table__row"));

    const ligneCorrespondante = lignes.find((ligne) => {
      const cellules = ligne.querySelectorAll("td.c-table__cell");
      if (!cellules || cellules.length < 6) return false;

      const jourTexte = cellules[0].textContent.trim();
      const horaires = cellules[1].textContent.split("Horaires")[1].trim();
      const heureDebut = horaires.split("-")[0].trim();
      const heureFin = horaires.split("-")[1].trim();
      const lieuTexte = cellules[2].textContent.trim();

      return (
        jourTexte.includes(jour.toUpperCase()) &&
        heureDebut === start &&
        heureFin === end &&
        lieuTexte.includes(lieu)
      );
    });

    if (ligneCorrespondante) {
      const inputSwitch = ligneCorrespondante.querySelector(
        "p-inputswitch .p-inputswitch"
      );
      const switchElement = inputSwitch.querySelector("input");

      if (inputSwitch && switchElement.ariaChecked === "false") {
        inputSwitch.click();
        return true;
      }
    }
    return false;
  }, criteresRecherche);
}

async function confirmBooking(page) {
  await page.waitForSelector(".p-confirm-dialog", {
    visible: true,
    timeout: 10000,
  });
  await page.click(".p-confirm-dialog-accept");
}

async function waitForToastMessage(page, timeout = 10000) {
  try {
    // Attendre qu'un toast apparaisse (succès ou erreur)
    await page.waitForSelector("p-toastitem", {
      visible: true,
      timeout,
    });

    // Analyser le type de toast et extraire le message
    const toastInfo = await page.evaluate(() => {
      const toastElement = document.querySelector("p-toastitem");

      if (!toastElement)
        return {
          success: false,
          summary: "Inconnu",
          detail: "Toast non trouvé",
        };

      // Vérifier si c'est un toast de succès ou d'erreur
      const isSuccess =
        toastElement.querySelector(".p-toast-message-success") !== null;
      const isError =
        toastElement.querySelector(".p-toast-message-error") !== null;

      // Extraire le message
      const summaryElement = toastElement.querySelector(".p-toast-summary");
      const detailElement = toastElement.querySelector(".p-toast-detail");

      const summary = summaryElement ? summaryElement.textContent.trim() : "";
      const detail = detailElement ? detailElement.textContent.trim() : "";

      return {
        success: isSuccess,
        error: isError,
        summary,
        detail,
      };
    });

    return {
      success: toastInfo.success,
      error: toastInfo.error,
      message: `${toastInfo.summary}: ${toastInfo.detail}`,
    };
  } catch (error) {
    console.log("Aucun toast n'est apparu dans le délai imparti.");
    return {
      success: false,
      error: false,
      message: "Aucun toast de confirmation n'est apparu",
    };
  }
}

async function main(nomActivite, jour, start, end, lieu) {
  let browser;
  let page;

  try {
    const browserSession = await initBrowser();
    browser = browserSession.browser;
    page = browserSession.page;
    await login(page);
    await handleLoginDialog(page);
    await navigateToBooking(page);
    await selectActivity(page, nomActivite);
    const valid = await selectTimeSlot(page, { jour, start, end, lieu });

    if (valid) {
      await confirmBooking(page);
      const result = await waitForToastMessage(page);

      if (result.success) {
        logMessage("✅ Réservation effectuée avec succès !", "success");
        logMessage(`Message: ${result.message}`, "success");
        if (process.env.GITHUB_ACTIONS === "true") {
          await updateGitHubSummary("Réservation", result.message, "✅ Succès");
        }
      } else if (result.error) {
        logMessage("❌ Échec de la réservation", "error");
        logMessage(`Erreur: ${result.message}`, "error");
        if (process.env.GITHUB_ACTIONS === "true") {
          await updateGitHubSummary("Réservation", result.message, "❌ Échec");
        }
      } else {
        logMessage("⚠️ Résultat incertain de la réservation", "warning");
        logMessage(`Message: ${result.message}`, "warning");
        if (process.env.GITHUB_ACTIONS === "true") {
          await updateGitHubSummary(
            "Réservation",
            result.message,
            "⚠️ Incertain"
          );
        }
      }
    } else {
      logMessage("❌ Vous etes peut etre déja inscrit à ce créneau", "warning");
      if (process.env.GITHUB_ACTIONS === "true") {
        await updateGitHubSummary(
          "Réservation",
          result.message,
          "❌ Vous etes peut etre déja inscrit à ce créneau"
        );
      }
    }
  } catch (error) {
    logMessage(`Une erreur est survenue : ${error.message}`, "error");
  } finally {
    if (browser) await browser.close();
  }
}

const args = process.argv.slice(2);
const nomActivite = args[0] || "Badminton";
const jour = args[1] || " MERCREDI";
const start = args[2] || "20:00";
const end = args[3] || "21:30";
const lieu = args[4] || "Polytech'";

main(nomActivite, jour, start, end, lieu);
