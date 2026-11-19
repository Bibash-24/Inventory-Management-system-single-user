// =====================================
// STORAGE KEYS
// =====================================

const USER_KEY = "ims_single_user";
const SESSION_KEY = "ims_current_user";
const PRODUCTS_KEY = "ims_products";
const PURCHASES_KEY = "ims_purchases";


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

function getPurchases() {
    try {
        return JSON.parse(localStorage.getItem(PURCHASES_KEY)) || [];
    } catch {
        return [];
    }
}

function savePurchases(purchases) {
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
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


// =====================================
// LOAD PRODUCTS
// =====================================

function populateProductSelect(select) {
    const products = getProducts();

    select.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "-- Select Product --";

    select.appendChild(defaultOption);

    const sortedProducts = [...products].sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
    );

    sortedProducts.forEach(product => {
        const option = document.createElement("option");

        option.value = String(product.id);

        option.textContent =
            `${product.name} (Stock: ${Number(product.quantity) || 0})`;

        if (Number(product.quantity) < 0) {
            option.disabled = true;
        }

        select.appendChild(option);
    });
}


// =====================================
// ADD PRODUCT ROW
// =====================================

function addProductRow() {
    const container = document.getElementById("productContainer");

    const firstRow = container.querySelector(".product-row");

    const newRow = firstRow.cloneNode(true);

    newRow.querySelector(".product-select").value = "";
    newRow.querySelector(".quantity-input").value = "";

    populateProductSelect(
        newRow.querySelector(".product-select")
    );

    container.appendChild(newRow);

    updateRemoveButtons();
    calculatePurchaseTotal();
}


// =====================================
// REMOVE PRODUCT ROW
// =====================================

function removeRow(button) {
    const container = document.getElementById("productContainer");

    const rows = container.querySelectorAll(".product-row");

    if (rows.length <= 1) {
        return;
    }

    button.closest(".product-row").remove();

    updateRemoveButtons();
    calculatePurchaseTotal();
}


function updateRemoveButtons() {
    const rows = document.querySelectorAll(
        "#productContainer .product-row"
    );

    rows.forEach(row => {
        row.querySelector(".remove-btn").disabled =
            rows.length === 1;
    });
}


// =====================================
// CALCULATE PURCHASE TOTAL
// =====================================

function calculatePurchaseTotal() {
    const rows = document.querySelectorAll(
        "#productContainer .product-row"
    );

    const products = getProducts();

    let total = 0;

    rows.forEach(row => {
        const select = row.querySelector(".product-select");

        const quantityInput = row.querySelector(".quantity-input");

        const product = products.find(
            item => String(item.id) === String(select.value)
        );

        const quantity = Number(quantityInput.value) || 0;
        const price = Number(product?.price) || 0;

        total += price * quantity;
    });

    document.getElementById("totalAmount").textContent =
        formatCurrency(total);

    return total;
}


// =====================================
// LOW STOCK ALERT
// =====================================

function loadLowStock() {
    const products = getProducts();

    const lowStockProducts = products
        .filter(product => Number(product.quantity) <= 5)
        .sort((a, b) =>
            Number(a.quantity) - Number(b.quantity)
        );

    const container = document.getElementById("lowStockContainer");

    const noLowStock = document.getElementById("noLowStock");

    container.replaceChildren();

    if (lowStockProducts.length === 0) {
        noLowStock.hidden = false;
        return;
    }

    noLowStock.hidden = true;

    lowStockProducts.forEach(product => {
        const card = document.createElement("div");
        card.className = "low-card";

        const image = document.createElement("img");

        image.alt = product.name || "Product image";

        image.src = product.image || product.imageUrl || "";

        image.onerror = function () {
            this.style.display = "none";
        };

        const name = document.createElement("p");
        name.textContent = product.name || "Unknown Product";

        const stock = document.createElement("p");
        stock.className = "stock-warning";

        stock.textContent =
            "Stock: " + Number(product.quantity || 0);

        card.appendChild(image);
        card.appendChild(name);
        card.appendChild(stock);

        container.appendChild(card);
    });
}


// =====================================
// TOGGLE LOW STOCK ALERT
// =====================================

function toggleAlert() {
    const box = document.getElementById("alertBox");

    box.hidden = !box.hidden;

    if (!box.hidden) {
        loadLowStock();
    }
}


// =====================================
// RECORD PURCHASE
// =====================================

function recordPurchase(event) {
    event.preventDefault();

    const rows = document.querySelectorAll(
        "#productContainer .product-row"
    );

    const vendorName =
        document.getElementById("vendorName").value.trim();

    const vendorPhone =
        document.getElementById("vendorPhone").value.trim();

    const vendorAddress =
        document.getElementById("vendorAddress").value.trim();

    const paymentMethod =
        document.getElementById("paymentMethod").value;

    const paymentStatus =
        document.getElementById("paymentStatus").value;

    if (!vendorName) {
        showMessage("Please enter the vendor name.", "error");
        return;
    }

    if (!paymentMethod || !paymentStatus) {
        showMessage("Please select payment details.", "error");
        return;
    }

    const products = getProducts();
    const purchases = getPurchases();

    const purchaseItems = [];

    // Collect and validate products.
    for (const row of rows) {
        const productId =
            row.querySelector(".product-select").value;

        const quantity = Number(
            row.querySelector(".quantity-input").value
        );

        if (!productId) {
            showMessage("Please select a product in every row.", "error");
            return;
        }

        if (
            !Number.isSafeInteger(quantity) ||
            quantity <= 0
        ) {
            showMessage("Enter a valid purchase quantity.", "error");
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
        const currentStock = Number(product.quantity);

        if (
            !Number.isFinite(price) ||
            price < 0 ||
            !Number.isSafeInteger(currentStock) ||
            currentStock < 0
        ) {
            showMessage(
                `Invalid price or stock information for ${product.name}.`,
                "error"
            );
            return;
        }

        if (!Number.isSafeInteger(currentStock + quantity)) {
            showMessage(
                `The resulting stock for ${product.name} is too large.`,
                "error"
            );
            return;
        }

        purchaseItems.push({
            product: product,
            quantity: quantity,
            price: price
        });
    }

    // Check combined quantities for duplicate product selections.
    const addedQuantities = {};

    purchaseItems.forEach(item => {
        const key = String(item.product.id);

        addedQuantities[key] =
            (addedQuantities[key] || 0) + item.quantity;
    });

    for (const item of purchaseItems) {
        const key = String(item.product.id);

        if (
            !Number.isSafeInteger(
                Number(item.product.quantity) + addedQuantities[key]
            )
        ) {
            showMessage(
                `The resulting stock for ${item.product.name} is too large.`,
                "error"
            );
            return;
        }
    }

    // Calculate new stock.
    const updatedProducts = products.map(product => {
        const key = String(product.id);

        const additionalStock = addedQuantities[key] || 0;

        if (additionalStock > 0) {
            return {
                ...product,
                quantity: Number(product.quantity) + additionalStock
            };
        }

        return product;
    });

    // Create purchase history records.
    const purchaseDate = new Date().toISOString();

    const newPurchases = purchaseItems.map((item, index) => {
        const totalAmount = item.quantity * item.price;

        const paidAmount =
            paymentStatus === "Paid" ? totalAmount : 0;

        const dueAmount =
            paymentStatus === "Credit" ? totalAmount : 0;

        return {
            id: Date.now() + index,

            product_id: item.product.id,
            product_name: item.product.name,

            quantity: item.quantity,
            price: item.price,

            product_image:
                item.product.image || item.product.imageUrl || "",

            vendor_name: vendorName,
            vendor_phone: vendorPhone,
            vendor_address: vendorAddress,

            payment_method: paymentMethod,
            payment_status: paymentStatus,

            paid_amount: paidAmount,
            due_amount: dueAmount,

            total: totalAmount,
            purchase_date: purchaseDate
        };
    });

    // Save products and purchases.
    // Restore previous data if either save fails.
    try {
        const oldProducts = localStorage.getItem(PRODUCTS_KEY);
        const oldPurchases = localStorage.getItem(PURCHASES_KEY);

        try {
            saveProducts(updatedProducts);

            savePurchases([
                ...purchases,
                ...newPurchases
            ]);

        } catch (error) {
            if (oldProducts === null) {
                localStorage.removeItem(PRODUCTS_KEY);
            } else {
                localStorage.setItem(PRODUCTS_KEY, oldProducts);
            }

            if (oldPurchases === null) {
                localStorage.removeItem(PURCHASES_KEY);
            } else {
                localStorage.setItem(PURCHASES_KEY, oldPurchases);
            }

            throw error;
        }

        const total = newPurchases.reduce(
            (sum, purchase) => sum + purchase.total,
            0
        );

        showMessage(
            `${newPurchases.length} product(s) purchased successfully! Total: Rs. ${formatCurrency(total)}`,
            "success"
        );

        // Reset form.
        document.getElementById("purchaseForm").reset();

        const container = document.getElementById("productContainer");

        const firstRow = container.querySelector(".product-row");

        container.replaceChildren(firstRow);

        firstRow.querySelector(".product-select").value = "";
        firstRow.querySelector(".quantity-input").value = "";

        populateProductSelect(
            firstRow.querySelector(".product-select")
        );

        updateRemoveButtons();
        calculatePurchaseTotal();

        // Refresh page data.
        loadLowStock();

        renderPurchases(
            document.getElementById("purchaseSearch")
                .value.trim().toLowerCase()
        );

        // Refresh low-stock alert if it is open.
        if (!document.getElementById("alertBox").hidden) {
            loadLowStock();
        }

    } catch (error) {
        console.error("Purchase saving error:", error);

        showMessage(
            "Unable to save purchase. Your browser storage may be full.",
            "error"
        );
    }
}


// =====================================
// DISPLAY PURCHASE HISTORY
// =====================================

function renderPurchases(search = "") {
    const table = document.getElementById("purchaseTable");

    const emptyMessage = document.getElementById("emptyMessage");

    table.replaceChildren();

    const purchases = getPurchases();

    const filteredPurchases = purchases
        .filter(purchase => {
            const product = String(
                purchase.product_name || ""
            ).toLowerCase();

            const vendor = String(
                purchase.vendor_name || ""
            ).toLowerCase();

            return (
                product.includes(search) ||
                vendor.includes(search)
            );
        })
        .sort((a, b) => {
            return new Date(b.purchase_date || 0) -
                   new Date(a.purchase_date || 0);
        })
        .slice(0, 20);

    if (filteredPurchases.length === 0) {
        emptyMessage.hidden = false;
        return;
    }

    emptyMessage.hidden = true;

    filteredPurchases.forEach((purchase, index) => {
        const row = document.createElement("tr");

        const quantity = Number(purchase.quantity) || 0;
        const price = Number(purchase.price) || 0;

        const total =
            Number(purchase.total) || quantity * price;

        const paid =
            Number(purchase.paid_amount) || 0;

        const due =
            Number(purchase.due_amount) || 0;

        const date = purchase.purchase_date
            ? new Date(purchase.purchase_date).toLocaleString()
            : "N/A";

        const values = [
            index + 1,
            purchase.product_name || "Unknown Product",
            purchase.vendor_name || "",
            null,
            quantity,
            "Rs. " + formatCurrency(price),
            "Rs. " + formatCurrency(total),
            purchase.payment_method || "",
            purchase.payment_status || "",
            "Rs. " + formatCurrency(paid),
            "Rs. " + formatCurrency(due),
            date
        ];

        values.forEach((value, cellIndex) => {
            const cell = document.createElement("td");

            if (cellIndex === 3) {
                const image = document.createElement("img");

                image.alt = "Product image";
                image.src = purchase.product_image || "";

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
// INITIALIZE PAGE
// =====================================

document.addEventListener("DOMContentLoaded", function () {

    if (!checkLogin()) {
        return;
    }

    // Load products.
    const firstSelect = document.querySelector(".product-select");

    populateProductSelect(firstSelect);

    // Add product row.
    document.getElementById("addProductButton")
        .addEventListener("click", addProductRow);

    // Remove product row.
    document.getElementById("productContainer")
        .addEventListener("click", function (event) {
            if (event.target.classList.contains("remove-btn")) {
                removeRow(event.target);
            }
        });

    // Update estimated total.
    document.getElementById("productContainer")
        .addEventListener("input", calculatePurchaseTotal);

    document.getElementById("productContainer")
        .addEventListener("change", calculatePurchaseTotal);

    // Submit purchase.
    document.getElementById("purchaseForm")
        .addEventListener("submit", recordPurchase);

    // Low-stock alert.
    document.getElementById("lowStockButton")
        .addEventListener("click", toggleAlert);

    // Search purchase history.
    document.getElementById("purchaseSearch")
        .addEventListener("input", function () {
            renderPurchases(this.value.trim().toLowerCase());
        });

    updateRemoveButtons();

    calculatePurchaseTotal();

    loadLowStock();

    renderPurchases();
});