// فتح أو إنشاء قاعدة بيانات
let db;
const request = indexedDB.open('MotorStoreDB', 1);

request.onupgradeneeded = function (event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
    }
};

request.onsuccess = function (event) {
    db = event.target.result;
    loadProducts(); // تحميل المنتجات عند فتح الصفحة
};

request.onerror = function (event) {
    console.error('Error opening database:', event.target.error);
};

// دالة لإضافة منتج جديد
function addProduct(product) {
    const transaction = db.transaction('products', 'readwrite');
    const store = transaction.objectStore('products');
    const request = store.add(product);

    request.onsuccess = function () {
        alert('تمت إضافة المنتج بنجاح!');
        loadProducts(); // إعادة تحميل المنتجات
    };

    request.onerror = function (event) {
        console.error('Error adding product:', event.target.error);
    };
}

// دالة لحذف المنتج
window.deleteProduct = function (productId) {
    const transaction = db.transaction('products', 'readwrite');
    const store = transaction.objectStore('products');
    const request = store.delete(productId);

    request.onsuccess = function () {
        alert('تم حذف المنتج بنجاح!');
        loadProducts(); // إعادة تحميل المنتجات بعد الحذف
    };

    request.onerror = function (event) {
        console.error('Error deleting product:', event.target.error);
    };
};

// دالة لجلب وعرض المنتجات
function loadProducts() {
    const productsGrid = document.querySelector('.products-grid');
    productsGrid.innerHTML = ''; // مسح المحتوى الحالي

    // جلب المنتجات من IndexedDB
    const transaction = db.transaction('products', 'readonly');
    const store = transaction.objectStore('products');
    const request = store.getAll();

    request.onsuccess = function () {
        const products = request.result;

        // عرض المنتجات
        products.forEach(product => {
            const productCard = `
                <div class="product-card">
                    <img src="${product.imageUrl || product.image}" alt="${product.name}">
                    <div class="details">
                        <h3>${product.name}</h3>
                        <p class="price">${product.price}</p>
                        <button class="delete-btn" onclick="deleteProduct(${product.id})">حذف</button>
                    </div>
                </div>
            `;
            productsGrid.innerHTML += productCard;
        });
    };

    request.onerror = function (event) {
        console.error('Error loading products:', event.target.error);
    };
}

// دالة لحفظ المنتج
document.getElementById('saveProductBtn').addEventListener('click', () => {
    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const description = document.getElementById('productDescription').value;
    const imageFile = document.getElementById('productImage').files[0];

    if (name && price && description && imageFile) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const imageUrl = event.target.result; // تحويل الصورة إلى Base64

            const product = {
                name: name,
                price: price,
                description: description,
                imageUrl: imageUrl
            };

            addProduct(product); // إضافة المنتج إلى IndexedDB
        };
        reader.readAsDataURL(imageFile); // تحويل الصورة إلى Base64
    } else {
        alert('يرجى ملء جميع الحقول!');
    }
});

// التنقل بين الصفحات
document.getElementById('showStoreBtn').addEventListener('click', () => {
    document.getElementById('storeContent').style.display = 'block';
    document.getElementById('addProductForm').style.display = 'none';
    loadProducts(); // إعادة تحميل المنتجات
});

document.getElementById('showAddProductBtn').addEventListener('click', () => {
    document.getElementById('storeContent').style.display = 'none';
    document.getElementById('addProductForm').style.display = 'block';
});

// إلغاء الإضافة والعودة إلى صفحة المتجر
document.getElementById('cancelProductBtn').addEventListener('click', () => {
    document.getElementById('showStoreBtn').click();
});