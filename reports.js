
/* =========================================
   INVENTORY MANAGEMENT SYSTEM
   REPORTS JAVASCRIPT
========================================= */

// LOGIN CHECK

const currentUser = localStorage.getItem("ims_current_user");

if (!currentUser) {
    window.location.href = "index.html";
}

// STORAGE HELPERS

function readStorage(key, fallback = []) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch (error) {
        return fallback;
    }
}

const mainData = readStorage("ims_single_user_v1", {});
const oldData = readStorage("ims_single_user", {});

function getRecords(key, property) {
    const separateRecords = readStorage(key, null);

    if (Array.isArray(separateRecords)) {
        return separateRecords;
    }

    const records =
        mainData[property] ??
        oldData[property] ??
        separateRecords ??
        [];

    return Array.isArray(records) ? records : [];
}

let products = getRecords("ims_products", "products");
let sales = getRecords("ims_sales", "sales");
let purchases = getRecords("ims_purchases", "purchases");

let lowStockMode = false;

// FIELD HELPERS

function getValue(record, ...names) {
    for (const name of names) {
        if (record[name] !== undefined && record[name] !== null) {
            return record[name];
        }
    }

    return "";
}

function getProductName(record) {
    return getValue(record, "productName", "product_name", "name");
}

function getQuantity(record) {
    return Number(
        getValue(record, "quantity", "qty")
    ) || 0;
}

function getPrice(record) {
    return Number(
        getValue(record, "price", "sellingPrice", "purchasePrice")
    ) || 0;
}

function getDate(record, type) {
    return getValue(
        record,
        "date",
        type === "sales" ? "sale_date" : "purchase_date",
        "createdAt"
    );
}

function getCustomer(record) {
    return getValue(
        record,
        "party",
        "customerName",
        "customer_name",
        "customer"
    );
}

function getContact(record) {
    return getValue(
        record,
        "customerContact",
        "customer_contact",
        "contact",
        "phone"
    );
}

function formatMoney(amount) {
    return "Rs " + Number(amount).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getImage(record) {
    const image = getValue(
        record,
        "image",
        "product_image",
        "imageUrl"
    );

    if (!image) {
        return "";
    }

    if (/^(https?:\/\/|data:image\/)/i.test(image)) {
        return image;
    }

    return "uploads/" + image;
}

// SUMMARY CALCULATIONS

function updateSummary() {

    const totalSales = sales.reduce(
        (sum, item) =>
            sum + getQuantity(item) * getPrice(item),
        0
    );

    const totalPurchases = purchases.reduce(
        (sum, item) =>
            sum + getQuantity(item) * getPrice(item),
        0
    );

    const totalProfit = totalSales - totalPurchases;

    const lowStockItems = products.filter(
        item => getQuantity(item) <= 5
    );

    const customers = new Set(
        sales
            .map(getCustomer)
            .filter(name => name !== "")
    );

    document.getElementById("totalSales").textContent =
        formatMoney(totalSales);

    document.getElementById("totalPurchases").textContent =
        formatMoney(totalPurchases);

    document.getElementById("totalProfit").textContent =
        formatMoney(totalProfit);

    document.getElementById("totalProducts").textContent =
        products.length;

    document.getElementById("totalCustomers").textContent =
        customers.size;

    document.getElementById("lowStockCount").textContent =
        lowStockItems.length;
}

// FILTERS

function getFilteredRecords() {

    const type = document.getElementById("reportType").value;

    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    const search = document.getElementById("search")
        .value.toLowerCase().trim();

    let records = type === "sales" ? sales : purchases;

    records = records.filter(item => {

        const name = String(getProductName(item)).toLowerCase();

        const date = String(getDate(item, type)).substring(0, 10);

        const customer = String(getCustomer(item)).toLowerCase();

        // SEARCH FILTER

        if (
            search &&
            !name.includes(search) &&
            !(type === "sales" && customer.includes(search))
        ) {
            return false;
        }

        // START DATE FILTER

        if (startDate && (!date || date < startDate)) {
            return false;
        }

        // END DATE FILTER

        if (endDate && (!date || date > endDate)) {
            return false;
        }

        // LOW STOCK FILTER

        if (lowStockMode && getQuantity(item) > 5) {
            return false;
        }

        return true;
    });

    return records.sort((a, b) => {
        const dateA = new Date(getDate(a, type)).getTime() || 0;
        const dateB = new Date(getDate(b, type)).getTime() || 0;

        return dateB - dateA;
    });
}

// DISPLAY REPORTS

function displayReports() {

    const type = document.getElementById("reportType").value;

    const records = getFilteredRecords();

    const title = document.getElementById("reportTitle");

    const head = document.getElementById("reportHead");

    const body = document.getElementById("reportBody");

    if (lowStockMode) {
        title.textContent = "Low Stock Reports";
    } else {
        title.textContent =
            type === "sales"
                ? "Sales Reports"
                : "Purchase Reports";
    }

    // TABLE HEADINGS

    if (type === "sales") {

        head.innerHTML = `
            <tr>
                <th>No</th>
                <th>Product</th>
                <th>Image</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Date</th>
            </tr>
        `;

    } else {

        head.innerHTML = `
            <tr>
                <th>No</th>
                <th>Product</th>
                <th>Image</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
            </tr>
        `;
    }

    if (records.length === 0) {

        body.innerHTML = `
            <tr>
                <td colspan="${type === "sales" ? 10 : 8}"
                    class="empty-message">
                    No records found.
                </td>
            </tr>
        `;

        return;
    }

    body.innerHTML = records.map((item, index) => {

        const name = getProductName(item);

        const quantity = getQuantity(item);

        const price = getPrice(item);

        const total = quantity * price;

        const date = getDate(item, type);

        const image = getImage(item);

        const status = quantity <= 5
            ? `<span class="low-stock">Low Stock</span>`
            : `<span class="available">Available</span>`;

        const imageHTML = image
            ? `<img class="product-image"
                    src="${escapeHTML(image)}"
                    alt="Product"
                    onerror="this.style.display='none'">`
            : "No Image";

        if (type === "sales") {

            return `
                <tr>
                    <td>${index + 1}</td>

                    <td>${escapeHTML(name)}</td>

                    <td>${imageHTML}</td>

                    <td>${quantity}</td>

                    <td>${formatMoney(price)}</td>

                    <td>${formatMoney(total)}</td>

                    <td>${escapeHTML(getCustomer(item))}</td>

                    <td>${escapeHTML(getContact(item))}</td>

                    <td>${status}</td>

                    <td>${escapeHTML(date)}</td>
                </tr>
            `;

        }

        return `
            <tr>
                <td>${index + 1}</td>

                <td>${escapeHTML(name)}</td>

                <td>${imageHTML}</td>

                <td>${quantity}</td>

                <td>${formatMoney(price)}</td>

                <td>${formatMoney(total)}</td>

                <td>${status}</td>

                <td>${escapeHTML(date)}</td>
            </tr>
        `;

    }).join("");
}

// TOP SELLING PRODUCTS

function displayTopProducts() {

    const productSales = {};

    sales.forEach(item => {

        const name = getProductName(item);

        if (!name) return;

        if (!productSales[name]) {

            productSales[name] = {
                quantity: 0,
                total: 0
            };

        }

        const quantity = getQuantity(item);

        const price = getPrice(item);

        productSales[name].quantity += quantity;

        productSales[name].total += quantity * price;

    });

    const topProducts = Object.entries(productSales)
        .sort((a, b) =>
            b[1].quantity - a[1].quantity
        )
        .slice(0, 5);

    const body = document.getElementById("topProductsBody");

    if (topProducts.length === 0) {

        body.innerHTML = `
            <tr>
                <td colspan="3" class="empty-message">
                    No sales records available.
                </td>
            </tr>
        `;

        return;
    }

    body.innerHTML = topProducts.map(([name, data]) => {

        return `
            <tr>
                <td>${escapeHTML(name)}</td>

                <td>${data.quantity}</td>

                <td>${formatMoney(data.total)}</td>
            </tr>
        `;

    }).join("");
}

// REFRESH REPORTS

function refreshReports() {

    updateSummary();

    displayReports();

    displayTopProducts();
}

// FILTER FORM

document.getElementById("filterForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        lowStockMode = false;

        refreshReports();

    });

// LOW STOCK BUTTON

document.getElementById("lowStockBtn")
    .addEventListener("click", function() {

        lowStockMode = true;

        refreshReports();

    });

// RESET BUTTON

document.getElementById("resetBtn")
    .addEventListener("click", function() {

        document.getElementById("filterForm").reset();

        lowStockMode = false;

        refreshReports();

    });

// REPORT TYPE CHANGE

document.getElementById("reportType")
    .addEventListener("change", function() {

        lowStockMode = false;

        refreshReports();

    });

// LOGOUT

function logout() {

    localStorage.removeItem("ims_current_user");

    window.location.href = "index.html";

}

// INITIALIZE

refreshReports();
