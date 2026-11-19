// =====================================
// STORAGE KEYS
// =====================================

const USER_KEY = "ims_single_user";
const SESSION_KEY = "ims_current_user";
const PRODUCTS_KEY = "ims_products";
const SALES_KEY = "ims_sales";


// =====================================
// LOGIN CHECK
// =====================================

function checkLogin() {
    const user = localStorage.getItem(USER_KEY);
    const session = localStorage.getItem(SESSION_KEY);

    if (!user || !session) {
        window.location.href = "./index.html";
        return false;
    }

    return true;
}


// =====================================
// LOCAL STORAGE FUNCTIONS
// =====================================

function getProducts() {
    try {
        return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
    } catch {
        return [];
    }
}

function saveProducts(products) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function getSales() {
    try {
        return JSON.parse(localStorage.getItem(SALES_KEY)) || [];
    } catch {
        return [];
    }
}

function saveSales(sales) {
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
}


// =====================================
// LOGOUT
// =====================================

function logout() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "./index.html";
    }
}


// =====================================
// HELPER FUNCTIONS
// =====================================

function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function showMessage(message, type) {
    const element = document.getElementById("message");

    element.textContent = message;
    element.className = "message " + type;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}


// =====================================
// LOAD PRODUCTS INTO SELECT
// =====================================

function populateProductSelect(select) {
    const products = getProducts();

    select.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Product";

    select.appendChild(defaultOption);

    const sortedProducts = [...products].sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
    );

    sortedProducts.forEach(product => {
        const option = document.createElement("option");

        option.value = String(product.id);

        option.textContent =
            `${product.name} (Stock: ${Number(product.quantity) || 0})`;

        option.dataset.price = Number(product.price) || 0;
        option.dataset.image = product.image || product.imageUrl || "";

        if (Number(product.quantity) <= 0) {
            option.disabled = true;
            option.textContent += " - Out of Stock";
        }

        select.appendChild(option);
    });
}


// =====================================
// UPDATE PRODUCT IMAGE
// =====================================

function updateProductImage(row) {
    const select = row.querySelector(".product-select");
    const preview = row.querySelector(".preview");

    const selectedOption = select.selectedOptions[0];

    const image = selectedOption?.dataset.image || "";

    if (image) {
        preview.src = image;
        preview.hidden = false;
    } else {
        preview.removeAttribute("src");
        preview.hidden = true;
    }

    calculateTotal();
}


// =====================================
// FILTER PRODUCT SELECT
// =====================================

function filterProducts(input) {
    const row = input.closest(".cart-row");
    const select = row.querySelector(".product-select");

    const search = input.value.trim().toLowerCase();

    let firstMatch = "";

    Array.from(select.options).forEach((option, index) => {
        if (index === 0) {
            option.hidden = false;
            return;
        }

        const matches = option.textContent.toLowerCase().includes(search);

        option.hidden = !matches;

        if (matches && !firstMatch) {
            firstMatch = option.value;
        }
    });

    // Clear selection if the selected product is filtered out.
    if (
        select.selectedOptions[0] &&
        select.selectedOptions[0].hidden
    ) {
        select.value = "";
        updateProductImage(row);
    }
}


// =====================================
// CALCULATE TOTAL
// =====================================

function calculateTotal() {
    const rows = document.querySelectorAll("#cart .cart-row");

    let total = 0;

    rows.forEach(row => {
        const select = row.querySelector(".product-select");
        const quantityInput = row.querySelector(".quantity-input");

        const option = select.selectedOptions[0];

        const price = Number(option?.dataset.price) || 0;
        const quantity = Number(quantityInput.value) || 0;

        total += price * quantity;
    });

    document.getElementById("total").textContent =
        formatCurrency(total);

    return total;
}


// =====================================
// ADD PRODUCT ROW
// =====================================

function addRow() {
    const cart = document.getElementById("cart");

    const firstRow = cart.querySelector(".cart-row");

    const newRow = firstRow.cloneNode(true);

    newRow.querySelector(".product-search").value = "";
    newRow.querySelector(".product-select").value = "";
    newRow.querySelector(".quantity-input").value = "";

    const preview = newRow.querySelector(".preview");

    preview.removeAttribute("src");
    preview.hidden = true;

    populateProductSelect(
        newRow.querySelector(".product-select")
    );

    cart.appendChild(newRow);

    updateRemoveButtons();
    calculateTotal();
}


// =====================================
// REMOVE PRODUCT ROW
// =====================================

function removeRow(button) {
    const cart = document.getElementById("cart");

    const rows = cart.querySelectorAll(".cart-row");

    if (rows.length <= 1) {
        return;
    }

    button.closest(".cart-row").remove();

    updateRemoveButtons();
    calculateTotal();
}

function updateRemoveButtons() {
    const rows = document.querySelectorAll("#cart .cart-row");

    rows.forEach(row => {
        const button = row.querySelector(".remove-row");

        button.disabled = rows.length === 1;
    });
}


// =====================================
// RENDER SALES RECORDS
// =====================================

function renderSales(search = "") {
    const table = document.getElementById("salesTable");
    const emptyMessage = document.getElementById("emptyMessage");

    table.replaceChildren();

    const sales = getSales();

    const filteredSales = sales
        .filter(sale => {
            const product = String(sale.product_name || "").toLowerCase();
            const customer = String(sale.customer_name || "").toLowerCase();

            return (
                product.includes(search) ||
                customer.includes(search)
            );
        })
        .sort((a, b) => {
            return new Date(b.sale_date || 0) -
                   new Date(a.sale_date || 0);
        })
        .slice(0, 20);

    if (filteredSales.length === 0) {
        emptyMessage.hidden = false;
        return;
    }

    emptyMessage.hidden = true;

    filteredSales.forEach((sale, index) => {
        const row = document.createElement("tr");

        const quantity = Number(sale.quantity) || 0;
        const price = Number(sale.price) || 0;
        const total = price * quantity;

        const date = sale.sale_date
            ? new Date(sale.sale_date).toLocaleString()
            : "N/A";

        const values = [
            index + 1,
            sale.product_name || "Unknown Product",
            null,
            quantity,
            "Rs. " + formatCurrency(price),
            "Rs. " + formatCurrency(total),
            sale.customer_name || "",
            sale.customer_contact || "",
            sale.payment_method || "Cash",
            date
        ];

        values.forEach((value, cellIndex) => {
            const cell = document.createElement("td");

            if (cellIndex === 2) {
                const image = document.createElement("img");

                image.alt = "Product image";
                image.src = sale.product_image || "";

                image.onerror = function () {
                    this.style.display = "none";
                };

                cell.appendChild(image);
            } else {
                cell.textContent = String(value);
            }

            row.appendChild(cell);
        });

        table.appendChild(row);
    });
}


// =====================================
// RECORD SALE
// =====================================

function recordSale(event) {
    event.preventDefault();

    const rows = document.querySelectorAll("#cart .cart-row");

    const customerName =
        document.getElementById("customerName").value.trim();

    const customerContact =
        document.getElementById("customerContact").value.trim();

    const paymentMethod =
        document.getElementById("paymentMethod").value;

    if (!customerName || !customerContact) {
        showMessage("Please enter customer details.", "error");
        return;
    }

    const products = getProducts();
    const sales = getSales();

    const saleItems = [];

    // Collect and validate all selected products.
    for (const row of rows) {
        const select = row.querySelector(".product-select");
        const quantityInput = row.querySelector(".quantity-input");

        const productId = select.value;
        const quantity = Number(quantityInput.value);

        if (!productId) {
            showMessage("Please select a product in every row.", "error");
            return;
        }

        if (
            !Number.isSafeInteger(quantity) ||
            quantity <= 0
        ) {
            showMessage("Please enter a valid quantity.", "error");
            return;
        }

        const product = products.find(
            item => String(item.id) === String(productId)
        );

        if (!product) {
            showMessage("A selected product could not be found.", "error");
            return;
        }

        const price = Number(product.price);

        if (!Number.isFinite(price) || price < 0) {
            showMessage(
                `Invalid price for ${product.name}.`,
                "error"
            );
            return;
        }

        saleItems.push({
            productId: product.id,
            quantity: quantity,
            product: product,
            price: price
        });
    }

    // Check total quantities for duplicate product selections.
    const requiredQuantities = {};

    saleItems.forEach(item => {
        const key = String(item.productId);

        requiredQuantities[key] =
            (requiredQuantities[key] || 0) + item.quantity;
    });

    for (const item of saleItems) {
        const key = String(item.productId);
        const available = Number(item.product.quantity) || 0;
        const required = requiredQuantities[key];

        if (available < required) {
            showMessage(
                `Not enough stock for ${item.product.name}. Available: ${available}, Required: ${required}.`,
                "error"
            );
            return;
        }
    }

    // Prepare updated product stock.
    const updatedProducts = products.map(product => {
        const key = String(product.id);
        const required = requiredQuantities[key] || 0;

        if (required > 0) {
            return {
                ...product,
                quantity: Number(product.quantity) - required
            };
        }

        return product;
    });

    // Create one sales record per product.
    const saleDate = new Date().toISOString();

    const newSales = saleItems.map((item, index) => ({
        id: Date.now() + index,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        customer_name: customerName,
        customer_contact: customerContact,
        product_image:
            item.product.image || item.product.imageUrl || "",
        payment_method: paymentMethod,
        sale_date: saleDate,
        total: item.price * item.quantity
    }));

    // Save both arrays. Restore previous data if saving fails.
    try {
        const oldProducts = localStorage.getItem(PRODUCTS_KEY);
        const oldSales = localStorage.getItem(SALES_KEY);

        try {
            saveProducts(updatedProducts);
            saveSales([...sales, ...newSales]);
        } catch (error) {
            if (oldProducts === null) {
                localStorage.removeItem(PRODUCTS_KEY);
            } else {
                localStorage.setItem(PRODUCTS_KEY, oldProducts);
            }

            if (oldSales === null) {
                localStorage.removeItem(SALES_KEY);
            } else {
                localStorage.setItem(SALES_KEY, oldSales);
            }

            throw error;
        }

        const total = newSales.reduce(
            (sum, sale) => sum + sale.total,
            0
        );

        showMessage(
            `Sale completed successfully! ${newSales.length} product(s) recorded. Total: Rs. ${formatCurrency(total)}`,
            "success"
        );

        document.getElementById("salesForm").reset();

        const cart = document.getElementById("cart");
        const firstRow = cart.querySelector(".cart-row");

        // Keep only one empty row.
        cart.replaceChildren(firstRow);

        firstRow.querySelector(".product-search").value = "";
        firstRow.querySelector(".product-select").value = "";
        firstRow.querySelector(".quantity-input").value = "";

        const preview = firstRow.querySelector(".preview");
        preview.removeAttribute("src");
        preview.hidden = true;

        populateProductSelect(
            firstRow.querySelector(".product-select")
        );

        updateRemoveButtons();
        calculateTotal();

        renderSales(
            document.getElementById("salesSearch").value
                .trim()
                .toLowerCase()
        );

    } catch (error) {
        console.error("Sale saving error:", error);

        showMessage(
            "Could not save the sale. Your browser storage may be full.",
            "error"
        );
    }
}


// =====================================
// INITIALIZE PAGE
// =====================================

document.addEventListener("DOMContentLoaded", function () {
    if (!checkLogin()) {
        return;
    }

    // Load products into the first row.
    const firstSelect = document.querySelector(".product-select");

    populateProductSelect(firstSelect);

    // Add product row.
    document.getElementById("addRowButton")
        .addEventListener("click", addRow);

    // Product selection, search and quantity events.
    document.getElementById("cart").addEventListener("input", function (event) {
        if (event.target.classList.contains("product-search")) {
            filterProducts(event.target);
        }

        if (event.target.classList.contains("quantity-input")) {
            calculateTotal();
        }
    });

    document.getElementById("cart").addEventListener("change", function (event) {
        if (event.target.classList.contains("product-select")) {
            updateProductImage(event.target.closest(".cart-row"));
        }
    });

    // Remove row.
    document.getElementById("cart").addEventListener("click", function (event) {
        if (event.target.classList.contains("remove-row")) {
            removeRow(event.target);
        }
    });

    // Submit sale.
    document.getElementById("salesForm")
        .addEventListener("submit", recordSale);

    // Search previous sales.
    document.getElementById("salesSearch")
        .addEventListener("input", function () {
            renderSales(this.value.trim().toLowerCase());
        });

    updateRemoveButtons();
    calculateTotal();
    renderSales();
});