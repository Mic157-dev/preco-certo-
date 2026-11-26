const pricingForm = document.querySelector("#pricing-form");
const printerTabs = Array.from(document.querySelectorAll(".printer-subtab"));
const printerTabPanels = printerTabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));
const energyCalculator = document.querySelector("#energy-calculator");
const energyInputs = Array.from(energyCalculator.querySelectorAll("input"));
const energyDaysInput = document.querySelector("#energy-days");
const energyHoursInput = document.querySelector("#energy-hours");
const energyMinutesInput = document.querySelector("#energy-minutes");
const energyFormMessage = document.querySelector("#energy-form-message");
const energyGrossCost = document.querySelector("#energy-gross-cost");
const energyConsumption = document.querySelector("#energy-consumption");
const energyBaseCost = document.querySelector("#energy-base-cost");
const energyTaxCost = document.querySelector("#energy-tax-cost");
const energyAdditionalResult = document.querySelector("#energy-additional-result");
const formMessage = document.querySelector("#form-message");
const wizardWorkspace = document.querySelector("#wizard-workspace");
const wizardPanels = Array.from(pricingForm.querySelectorAll("[data-wizard-step]"));
const wizardIndicators = Array.from(document.querySelectorAll("[data-wizard-indicator]"));
const wizardStepCount = document.querySelector("#wizard-step-count");
const wizardStepTitle = document.querySelector("#wizard-step-title");
const wizardProgressTrack = document.querySelector("#wizard-progress-track");
const wizardProgressFill = document.querySelector("#wizard-progress-fill");
const wizardNextButton = document.querySelector("#wizard-next");
const wizardBackButton = document.querySelector("#wizard-back");
const resultsPanel = document.querySelector("#results-panel");
const resultsBackButton = document.querySelector("#results-back");
const resultsRestartButton = document.querySelector("#results-restart");
const qrSection = document.querySelector("#qr-section");
const wizardStepTitles = [
    "Material",
    "Impressora e manutenção",
    "Mão de obra e operação",
    "Margem e venda",
    "Resultado"
];
let activeWizardStep = 0;
const materialNameInput = document.querySelector("#material-name");
const materialPickerButton = document.querySelector("#material-picker-button");
const materialPickerList = document.querySelector("#material-picker-list");
const materialSuggestions = document.querySelector("#material-suggestions");
const materialPriceHint = document.querySelector("#material-price-hint");
const materialPriceSource = document.querySelector("#material-price-source");
const materialPricePerKg = document.querySelector("#material-price-per-kg");
const materialAmountKgInput = document.querySelector("#material-amount-kg");
const materialAmountGramsInput = document.querySelector("#material-amount-g");
const materialFinalPrice = document.querySelector("#material-final-price");
let selectedMaterialPricePerKg = null;
const appUrlInput = document.querySelector("#app-url");
const qrForm = document.querySelector("#qr-form");
const qrMessage = document.querySelector("#qr-message");
const qrImage = document.querySelector("#qr-image");
const qrPlaceholder = document.querySelector("#qr-placeholder");
const qrOpen = document.querySelector("#qr-open");
const qrCaption = document.querySelector("#qr-caption");
const machineCostInput = document.querySelector("#machine-cost");
const laborRateInput = document.querySelector("#labor-rate");
const packagingCostInput = document.querySelector("#packaging-cost");
const monthlyExpensesInput = document.querySelector("#monthly-expenses");
const monthlyPrintHoursInput = document.querySelector("#monthly-print-hours");
const weeklyPrintHoursInput = document.querySelector("#weekly-print-hours");
const finishingHoursInput = document.querySelector("#finishing-hours");
const finishingMinutesInput = document.querySelector("#finishing-minutes");

const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});
const preciseEnergyQuantity = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 6
});
let calculatedGrossEnergyCost = 0;
let calculatedEnergyDurationHours = 0;

function readAmount(id) {
    const input = document.querySelector(`#${id}`);
    const value = input.value.trim();
    const onlyStepMismatch =
        (id === "material-amount-kg" || id === "material-amount-g") &&
        input.validity.stepMismatch &&
        !input.validity.badInput &&
        !input.validity.rangeUnderflow &&
        !input.validity.rangeOverflow &&
        !input.validity.valueMissing;

    if (value === "" || (!input.validity.valid && !onlyStepMismatch)) {
        return null;
    }

    const amount = Number(value);
    return Number.isFinite(amount) ? amount : null;
}

function readOptionalAmount(id) {
    const input = document.querySelector(`#${id}`);
    if (input.value.trim() === "") {
        return input.validity.badInput ? null : 0;
    }

    return readAmount(id);
}

function formatCurrencyInput(input) {
    if (input.value.trim() !== "") {
        input.value = Number(input.value).toFixed(2);
    }
}

function updateCurrencyStep(input) {
    const amount = Number(input.value);
    input.step = amount >= 100000 ? "1000" : amount >= 10000 ? "100" : amount >= 1000 ? "10" : "0.1";
}

function updateMaterialPriceFromName() {
    const enteredName = materialNameInput.value.trim();
    const materialName = enteredName.toLocaleLowerCase("pt-BR");
    const suggestion = Array.from(materialSuggestions.options).find(
        (option) => option.value.toLocaleLowerCase("pt-BR") === materialName
    );

    if (suggestion && suggestion.dataset.pricePerKg) {
        selectedMaterialPricePerKg = Number(suggestion.dataset.pricePerKg);
        materialPriceHint.textContent = suggestion.dataset.priceNote || "Preço de referência do material selecionado.";
        if (suggestion.dataset.priceSource) {
            materialPriceSource.href = suggestion.dataset.priceSource;
            materialPriceSource.hidden = false;
        } else {
            materialPriceSource.hidden = true;
        }
    } else if (enteredName) {
        selectedMaterialPricePerKg = null;
        materialPriceHint.textContent = "Material não cadastrado; selecione um material da lista para carregar seu preço por kg.";
        materialPriceSource.hidden = true;
    } else {
        selectedMaterialPricePerKg = null;
        materialPriceHint.textContent = "Selecione um material cadastrado para carregar seu preço de referência.";
        materialPriceSource.hidden = true;
    }
}

function updatePrice() {
    const materialAmountKg = readOptionalAmount("material-amount-kg");
    const materialAmountGrams = readOptionalAmount("material-amount-g");
    const materialAmountInKg = materialAmountKg === null || materialAmountGrams === null
        ? null
        : materialAmountKg + materialAmountGrams / 1000;
    const materialUnitCost = selectedMaterialPricePerKg;
    materialFinalPrice.textContent = materialAmountInKg === 0
        ? currency.format(0)
        : materialAmountInKg !== null && materialUnitCost !== null
            ? currency.format(materialAmountInKg * materialUnitCost)
            : "—";
    const machineCost = readAmount("machine-cost");
    const printerLifetimeHours = readAmount("printer-lifetime-hours");
    const printerMaintenanceRate = readAmount("printer-maintenance-rate");
    const printerConsumablesCost = readAmount("printer-consumables-cost");
    const printerFixedCost = readAmount("printer-fixed-cost");
    const finishingHours = readAmount("finishing-hours");
    const finishingMinutes = readAmount("finishing-minutes");
    const laborRate = readAmount("labor-rate");
    const packagingCost = readAmount("packaging-cost");
    const monthlyExpenses = readAmount("monthly-expenses");
    const monthlyPrintHours = readAmount("monthly-print-hours");
    const weeklyPrintHours = readAmount("weekly-print-hours");
    const failureRate = readAmount("failure-rate");
    const margin = readAmount("profit-margin");
    const salesFees = readAmount("sales-fees");
    const platformFee = readAmount("platform-fee");
    const quantity = readAmount("quantity");
    materialPricePerKg.textContent = materialUnitCost === null
        ? "Selecione um material"
        : `${currency.format(materialUnitCost)}/kg`;
    const values = [
        materialUnitCost,
        materialAmountInKg,
        calculatedGrossEnergyCost,
        calculatedEnergyDurationHours,
        machineCost,
        printerLifetimeHours,
        printerMaintenanceRate,
        printerConsumablesCost,
        printerFixedCost,
        finishingHours,
        finishingMinutes,
        laborRate,
        packagingCost,
        monthlyExpenses,
        monthlyPrintHours,
        weeklyPrintHours,
        failureRate,
        margin,
        salesFees,
        platformFee,
        quantity
    ];

    if (values.some((value) => value === null)) {
        formMessage.textContent = materialUnitCost === null
            ? "Selecione um material cadastrado para carregar o preço por kg."
            : calculatedGrossEnergyCost === null || calculatedEnergyDurationHours === null
                ? "Corrija os valores na aba Cálculo de Energia Bruta."
                : "Confira os valores preenchidos e use números iguais ou maiores que zero.";
        return;
    }

    const totalMonthlyPrintHours = weeklyPrintHours * 4;
    if (totalMonthlyPrintHours === 0) {
        formMessage.textContent = "As horas produtivas calculadas para o mês precisam ser maiores que zero.";
        return;
    }

    if (printerLifetimeHours === 0) {
        formMessage.textContent = "A vida útil da impressora precisa ser maior que zero.";
        return;
    }

    if (failureRate >= 100) {
        formMessage.textContent = "A taxa de falhas precisa ser menor que 100%.";
        return;
    }

    const totalSalesFees = salesFees + platformFee;
    if (totalSalesFees >= 100) {
        formMessage.textContent = "A soma dos impostos, comissões e taxa de plataforma precisa ser menor que 100%.";
        return;
    }

    formMessage.textContent = "";
    const printDurationHours = calculatedEnergyDurationHours;
    const finishingDurationHours = finishingHours + finishingMinutes / 60;
    const costs = {
        material: materialUnitCost * materialAmountInKg,
        energy: calculatedGrossEnergyCost,
        depreciation: machineCost / printerLifetimeHours * printDurationHours,
        maintenance: printerMaintenanceRate * printDurationHours,
        consumables: printerConsumablesCost,
        printerFixed: printerFixedCost,
        labor: finishingDurationHours * laborRate,
        packaging: packagingCost,
        overhead: monthlyExpenses / totalMonthlyPrintHours * printDurationHours
    };
    const productionCost = Object.values(costs).reduce((total, cost) => total + cost, 0);
    const unitCost = productionCost / (1 - failureRate / 100);
    const failureCost = unitCost - productionCost;
    const calculatedPrice = unitCost * (1 + margin / 100) / (1 - totalSalesFees / 100);
    const unitPrice = Math.round((calculatedPrice + Number.EPSILON) * 100) / 100;
    const totalRevenue = unitPrice * quantity;
    const totalCosts = unitCost * quantity;
    const totalProfit = totalRevenue - totalCosts - totalRevenue * totalSalesFees / 100;
    const materialName = materialNameInput.value.trim();

    document.querySelector("#unit-price").textContent = currency.format(unitPrice);
    document.querySelector("#total-revenue").textContent = currency.format(totalRevenue);
    document.querySelector("#total-costs").textContent = currency.format(totalCosts);
    document.querySelector("#total-profit").textContent = currency.format(Math.max(0, totalProfit));
    document.querySelector("#result-product").textContent = materialName ? `Material: ${materialName}` : "por unidade";
    document.querySelector("#material-cost").textContent = currency.format(costs.material);
    document.querySelector("#energy-cost").textContent = currency.format(costs.energy);
    document.querySelector("#depreciation-cost").textContent = currency.format(costs.depreciation);
    document.querySelector("#maintenance-cost").textContent = currency.format(costs.maintenance);
    document.querySelector("#consumables-cost").textContent = currency.format(costs.consumables);
    document.querySelector("#printer-fixed-cost-result").textContent = currency.format(costs.printerFixed);
    document.querySelector("#labor-cost").textContent = currency.format(costs.labor);
    document.querySelector("#packaging-cost-result").textContent = currency.format(costs.packaging);
    document.querySelector("#overhead-cost").textContent = currency.format(costs.overhead);
    document.querySelector("#failure-cost").textContent = currency.format(failureCost);
    document.querySelector("#unit-cost-total").textContent = currency.format(unitCost);
}

function updateEnergyCalculation() {
    const amounts = energyInputs.map((input) => {
        if (input.validity.badInput) {
            return null;
        }

        const rawValue = input.value.trim();
        if (rawValue === "") {
            return 0;
        }

        const amount = Number(rawValue);
        return input.validity.valid && Number.isFinite(amount) && amount >= 0 ? amount : null;
    });

    if (amounts.some((amount) => amount === null)) {
        calculatedGrossEnergyCost = null;
        calculatedEnergyDurationHours = null;
        energyFormMessage.textContent = "Use valores numéricos iguais ou maiores que zero.";
        energyGrossCost.textContent = "—";
        energyConsumption.textContent = "—";
        energyBaseCost.textContent = "—";
        energyTaxCost.textContent = "—";
        energyAdditionalResult.textContent = "—";
        return;
    }

    const [powerWatts, days, hours, minutes, tariff, taxPercentage, additionalCost] = amounts;
    const totalHours = days * 24 + hours + minutes / 60;
    const consumptionKwh = powerWatts / 1000 * totalHours;
    const baseCost = consumptionKwh * tariff;
    const taxCost = baseCost * taxPercentage / 100;
    const grossCost = baseCost + taxCost + additionalCost;

    if (![totalHours, consumptionKwh, baseCost, taxCost, grossCost].every(Number.isFinite)) {
        calculatedGrossEnergyCost = null;
        calculatedEnergyDurationHours = null;
        energyFormMessage.textContent = "Os valores informados são muito altos para calcular.";
        energyGrossCost.textContent = "—";
        energyConsumption.textContent = "—";
        energyBaseCost.textContent = "—";
        energyTaxCost.textContent = "—";
        energyAdditionalResult.textContent = "—";
        return;
    }

    calculatedGrossEnergyCost = grossCost;
    calculatedEnergyDurationHours = totalHours;
    energyFormMessage.textContent = "";
    energyGrossCost.textContent = currency.format(grossCost);
    energyConsumption.textContent = `${preciseEnergyQuantity.format(consumptionKwh)} kWh`;
    energyBaseCost.textContent = currency.format(baseCost);
    energyTaxCost.textContent = currency.format(taxCost);
    energyAdditionalResult.textContent = currency.format(additionalCost);
}

function normalizeEnergyDuration() {
    const timeInputs = [energyDaysInput, energyHoursInput, energyMinutesInput];
    if (timeInputs.some((input) => input.validity.badInput)) {
        return;
    }

    const [days, hours, minutes] = timeInputs.map((input) => (
        input.value.trim() === "" ? 0 : Number(input.value)
    ));
    if (![days, hours, minutes].every(Number.isFinite) || [days, hours, minutes].some((value) => value < 0)) {
        return;
    }

    const totalHours = hours + Math.floor(minutes / 60);
    energyDaysInput.value = String(days + Math.floor(totalHours / 24));
    energyHoursInput.value = String(totalHours % 24);
    energyMinutesInput.value = String(minutes % 60);
}

function activatePrinterTab(activeTab) {
    printerTabs.forEach((tab, index) => {
        const isActive = tab === activeTab;
        tab.setAttribute("aria-selected", String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
        printerTabPanels[index].hidden = !isActive;
    });
    wizardWorkspace.classList.toggle(
        "is-energy-calculator",
        activeTab.id === "energy-calculation-tab" && activeWizardStep === 1
    );
}

function updateWizardView() {
    const isResultsStep = activeWizardStep === wizardPanels.length;
    pricingForm.hidden = isResultsStep;
    resultsPanel.hidden = !isResultsStep;
    qrSection.hidden = !isResultsStep;
    wizardWorkspace.classList.toggle("is-results", isResultsStep);
    wizardWorkspace.classList.toggle(
        "is-energy-calculator",
        !isResultsStep &&
        activeWizardStep === 1 &&
        printerTabs[1].getAttribute("aria-selected") === "true"
    );

    wizardPanels.forEach((panel, index) => {
        panel.hidden = index !== activeWizardStep;
    });

    wizardIndicators.forEach((indicator, index) => {
        indicator.classList.toggle("is-current", index === activeWizardStep);
        indicator.classList.toggle("is-complete", index < activeWizardStep);
        if (index === activeWizardStep) {
            indicator.setAttribute("aria-current", "step");
        } else {
            indicator.removeAttribute("aria-current");
        }
    });

    const displayedStep = activeWizardStep + 1;
    wizardStepCount.textContent = `ETAPA ${displayedStep} DE ${wizardStepTitles.length}`;
    wizardStepTitle.textContent = wizardStepTitles[activeWizardStep];
    wizardProgressTrack.setAttribute("aria-valuenow", String(displayedStep));
    wizardProgressFill.style.width = `${displayedStep / wizardStepTitles.length * 100}%`;
    wizardBackButton.hidden = isResultsStep || activeWizardStep === 0;
    wizardNextButton.hidden = isResultsStep;
    resultsBackButton.hidden = !isResultsStep;
}

function validateWizardStep() {
    formMessage.textContent = "";
    const currentPanel = wizardPanels[activeWizardStep];

    if (activeWizardStep === 0) {
        if (selectedMaterialPricePerKg === null) {
            formMessage.textContent = "Selecione um material cadastrado para continuar.";
            materialNameInput.focus();
            return false;
        }

        const materialKg = readOptionalAmount("material-amount-kg");
        const materialGrams = readOptionalAmount("material-amount-g");
        if (materialKg === null || materialGrams === null) {
            formMessage.textContent = "Confira o consumo de material informado.";
            materialAmountKgInput.focus();
            return false;
        }

        if (materialKg + materialGrams / 1000 <= 0) {
            formMessage.textContent = "Informe um consumo de material maior que zero.";
            materialAmountKgInput.focus();
            return false;
        }
    }

    const requiredFields = Array.from(currentPanel.querySelectorAll("input[required], select[required]"))
        .filter((field) => {
            const tabPanel = field.closest('[role="tabpanel"]');
            return !tabPanel || !tabPanel.hidden;
        });
    const invalidField = requiredFields.find((field) => !field.checkValidity());
    if (invalidField) {
        invalidField.reportValidity();
        return false;
    }

    if (activeWizardStep === 2 && Number(weeklyPrintHoursInput.value) === 0) {
        formMessage.textContent = "As horas produtivas na semana precisam ser maiores que zero.";
        weeklyPrintHoursInput.focus();
        return false;
    }

    return true;
}

function focusCurrentWizardStep() {
    const currentPage = activeWizardStep === wizardPanels.length
        ? resultsPanel
        : wizardPanels[activeWizardStep];
    currentPage.focus();
}

wizardNextButton.addEventListener("click", () => {
    if (!validateWizardStep()) {
        return;
    }

    if (activeWizardStep === wizardPanels.length - 1) {
        updatePrice();
        if (formMessage.textContent) {
            return;
        }
        activeWizardStep = wizardPanels.length;
    } else {
        activeWizardStep += 1;
    }

    updateWizardView();
    focusCurrentWizardStep();
});

function returnToPreviousWizardStep() {
    activeWizardStep = Math.max(0, activeWizardStep - 1);
    updateWizardView();
    focusCurrentWizardStep();
}

wizardBackButton.addEventListener("click", returnToPreviousWizardStep);
resultsBackButton.addEventListener("click", returnToPreviousWizardStep);
resultsRestartButton.addEventListener("click", () => {
    pricingForm.reset();
});

pricingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    wizardNextButton.click();
});

function normalizeTimeInputs(hoursInput, minutesInput) {
    const minutes = Number(minutesInput.value);
    const hours = Number(hoursInput.value);
    if (
        minutesInput.value.trim() === "" ||
        hoursInput.value.trim() === "" ||
        !Number.isInteger(minutes) ||
        !Number.isInteger(hours) ||
        minutes < 60
    ) {
        return;
    }

    hoursInput.value = String(hours + Math.floor(minutes / 60));
    minutesInput.value = String(minutes % 60);
}

function updateMonthlyPrintHours() {
    const weeklyHours = weeklyPrintHoursInput.value.trim();
    monthlyPrintHoursInput.value = weeklyHours === ""
        ? ""
        : String(Number(weeklyHours) * 4);
}

finishingMinutesInput.addEventListener("input", () => {
    normalizeTimeInputs(finishingHoursInput, finishingMinutesInput);
});

machineCostInput.addEventListener("blur", () => {
    formatCurrencyInput(machineCostInput);
});

materialAmountGramsInput.addEventListener("input", () => {
    const rawGrams = materialAmountGramsInput.value.trim();
    if (rawGrams === "") {
        return;
    }

    const grams = Number(rawGrams);
    if (Number.isFinite(grams) && !Number.isInteger(grams)) {
        materialAmountGramsInput.value = String(Math.round(grams));
    }
});

materialAmountGramsInput.addEventListener("change", () => {
    const grams = Number(materialAmountGramsInput.value);
    if (grams >= 1000) {
        const wholeKilograms = Math.floor(grams / 1000);
        const remainingGrams = Math.round(grams - wholeKilograms * 1000);
        const currentKilograms = Number(materialAmountKgInput.value || 0);
        materialAmountKgInput.value = (currentKilograms + wholeKilograms).toFixed(2);
        materialAmountGramsInput.value = String(remainingGrams);
    }

    updatePrice();
});

[
    laborRateInput,
    packagingCostInput,
    monthlyExpensesInput
].forEach((input) => {
    input.addEventListener("input", () => {
        updateCurrencyStep(input);
    });
});

weeklyPrintHoursInput.addEventListener("input", updateMonthlyPrintHours);
materialNameInput.addEventListener("input", () => {
    updateMaterialPriceFromName();
    renderMaterialPickerOptions(materialNameInput.value);
    if (materialPickerList.hidden) {
        openMaterialPicker();
    }
});

materialPickerButton.addEventListener("click", () => {
    if (materialPickerList.hidden) {
        openMaterialPicker();
        materialNameInput.focus();
    } else {
        closeMaterialPicker();
    }
});

function renderMaterialPickerOptions(filter = "") {
    const normalizedFilter = filter.trim().toLocaleLowerCase("pt-BR");
    const matchingSuggestions = Array.from(materialSuggestions.options).filter((suggestion) =>
        suggestion.value.toLocaleLowerCase("pt-BR").includes(normalizedFilter)
    );

    materialPickerList.replaceChildren();
    if (matchingSuggestions.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.className = "material-picker-empty";
        emptyMessage.textContent = "Nenhum material encontrado";
        materialPickerList.appendChild(emptyMessage);
        materialNameInput.removeAttribute("aria-activedescendant");
        return;
    }

    matchingSuggestions.forEach((suggestion, index) => {
        const option = document.createElement("button");
        option.className = "material-picker-option";
        option.id = `material-picker-option-${index}`;
        option.type = "button";
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");
        option.dataset.materialName = suggestion.value;
        option.textContent = suggestion.value;
        materialPickerList.appendChild(option);
    });
    materialNameInput.removeAttribute("aria-activedescendant");
}

function openMaterialPicker() {
    renderMaterialPickerOptions(materialNameInput.value);
    materialPickerList.hidden = false;
    materialNameInput.setAttribute("aria-expanded", "true");
    materialPickerButton.setAttribute("aria-expanded", "true");
}

function closeMaterialPicker() {
    materialPickerList.hidden = true;
    materialNameInput.setAttribute("aria-expanded", "false");
    materialPickerButton.setAttribute("aria-expanded", "false");
    materialNameInput.removeAttribute("aria-activedescendant");
}

function activateMaterialOption(index) {
    const options = Array.from(materialPickerList.querySelectorAll(".material-picker-option"));
    if (options.length === 0) {
        return;
    }

    const activeIndex = Math.max(0, Math.min(index, options.length - 1));
    options.forEach((option, optionIndex) => {
        const isActive = optionIndex === activeIndex;
        option.setAttribute("aria-selected", String(isActive));
        option.classList.toggle("is-active", isActive);
    });
    materialNameInput.setAttribute("aria-activedescendant", options[activeIndex].id);
    options[activeIndex].scrollIntoView({ block: "nearest" });
}

materialNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !materialPickerList.hidden) {
        closeMaterialPicker();
        return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        if (event.key === "Enter" && !materialPickerList.hidden) {
            const activeOption = materialPickerList.querySelector('[aria-selected="true"]');
            if (activeOption) {
                event.preventDefault();
                activeOption.click();
            }
        }
        return;
    }

    event.preventDefault();
    if (materialPickerList.hidden) {
        openMaterialPicker();
    }
    const options = Array.from(materialPickerList.querySelectorAll(".material-picker-option"));
    const activeIndex = options.findIndex((option) => option.getAttribute("aria-selected") === "true");
    activateMaterialOption(activeIndex + (event.key === "ArrowDown" ? 1 : -1));
});

materialPickerList.addEventListener("click", (event) => {
    const option = event.target.closest(".material-picker-option");
    if (!option) {
        return;
    }

    materialNameInput.value = option.dataset.materialName;
    materialNameInput.dispatchEvent(new Event("input", { bubbles: true }));
    closeMaterialPicker();
    materialNameInput.focus();
});

document.addEventListener("click", (event) => {
    if (!materialNameInput.parentElement.contains(event.target)) {
        closeMaterialPicker();
    }
});

printerTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
        activatePrinterTab(tab);
    });

    tab.addEventListener("keydown", (event) => {
        let nextIndex = index;
        if (event.key === "ArrowRight") {
            nextIndex = (index + 1) % printerTabs.length;
        } else if (event.key === "ArrowLeft") {
            nextIndex = (index - 1 + printerTabs.length) % printerTabs.length;
        } else if (event.key === "Home") {
            nextIndex = 0;
        } else if (event.key === "End") {
            nextIndex = printerTabs.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        printerTabs[nextIndex].focus();
        activatePrinterTab(printerTabs[nextIndex]);
    });
});

energyCalculator.addEventListener("input", updateEnergyCalculation);
energyDaysInput.addEventListener("input", normalizeEnergyDuration);
energyHoursInput.addEventListener("input", normalizeEnergyDuration);
energyMinutesInput.addEventListener("input", normalizeEnergyDuration);
energyCalculator.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
    }
});
pricingForm.addEventListener("input", updatePrice);
pricingForm.addEventListener("reset", () => {
    window.setTimeout(() => {
        closeMaterialPicker();
        activeWizardStep = 0;
        activatePrinterTab(printerTabs[0]);
        updateMonthlyPrintHours();
        updateMaterialPriceFromName();
        updateEnergyCalculation();
        updatePrice();
        updateWizardView();
    }, 0);
});

function showQrError(message) {
    qrMessage.textContent = message;
    qrMessage.classList.add("is-error");
    qrImage.hidden = true;
    qrPlaceholder.hidden = false;
    qrOpen.hidden = true;
    qrCaption.textContent = "Seu QR Code aparecerá aqui";
}

qrImage.addEventListener("load", () => {
    qrMessage.textContent = "QR Code pronto! Teste com a câmera do celular.";
    qrMessage.classList.remove("is-error");
    qrCaption.textContent = "Aponte a câmera para abrir o app";
});

qrImage.addEventListener("error", () => {
    showQrError("Não foi possível gerar a imagem. Verifique sua conexão e tente novamente.");
});

qrForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const enteredUrl = appUrlInput.value.trim();
    let appUrl;

    try {
        appUrl = new URL(enteredUrl);
    } catch {
        showQrError("Informe um endereço público válido, como https://seu-app.com.br.");
        appUrlInput.focus();
        return;
    }

    if (appUrl.protocol !== "https:" && appUrl.protocol !== "http:") {
        showQrError("Use o endereço público do app começando com https://.");
        appUrlInput.focus();
        return;
    }

    const qrUrl = new URL("https://api.qrserver.com/v1/create-qr-code/");
    qrUrl.searchParams.set("size", "320x320");
    qrUrl.searchParams.set("format", "svg");
    qrUrl.searchParams.set("margin", "12");
    qrUrl.searchParams.set("data", appUrl.href);

    qrMessage.textContent = "Gerando seu QR Code...";
    qrMessage.classList.remove("is-error");
    qrCaption.textContent = "Carregando imagem...";
    qrPlaceholder.hidden = true;
    qrImage.hidden = false;
    qrImage.src = qrUrl.toString();
    qrOpen.href = qrUrl.toString();
    qrOpen.hidden = false;
});

if (window.location.protocol === "https:" || window.location.protocol === "http:") {
    appUrlInput.value = window.location.href.split("#")[0];
}

updateMonthlyPrintHours();
updateMaterialPriceFromName();
updateEnergyCalculation();
updatePrice();
updateWizardView();
