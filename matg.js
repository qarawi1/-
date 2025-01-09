import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// تكوين Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC5ZE1m5qe10pbAiZcSjBkIVDVNZExtf5U",
    authDomain: "elferdaws-1a362.firebaseapp.com",
    projectId: "elferdaws-1a362",
    storageBucket: "elferdaws-1a362.firebasestorage.app",
    messagingSenderId: "74289958469",
    appId: "1:74289958469:web:4ab94014a6afc191b61d2c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// عناصر الواجهة
const storeContent = document.getElementById('storeContent');
const addProductForm = document.getElementById('addProductForm');
const showStoreBtn = document.getElementById('showStoreBtn');
const showAddProductBtn = document.getElementById('showAddProductBtn');
const saveProductBtn = document.getElementById('saveProductBtn');
const cancelProductBtn = document.getElementById('cancelProductBtn');

// عرض المتجر وإخفاء نموذج الإضافة
showStoreBtn.addEventListener('click', () => {
    storeContent.style.display = 'block';
    addProductForm.style.display = 'none';
    loadProducts(); // إعادة تحميل المنتجات
});

// عرض نموذج الإضافة وإخفاء المتجر
showAddProductBtn.addEventListener('click', () => {
    storeContent.style.display = 'none';
    addProductForm.style.display = 'block';
});

// دالة لجلب وعرض المنتجات
async function loadProducts() {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = ''; // مسح المحتوى الحالي

    const querySnapshot = await getDocs(collection(db, 'products'));
    querySnapshot.forEach((doc) => {
        const product = doc.data();
        const productCard = `
            <div class="product-card">
                <img src="${product.imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="price">${product.price} جنيه</div>
            </div>
        `;
        productsList.innerHTML += productCard;
    });
}

// دالة لحفظ المنتج
saveProductBtn.addEventListener('click', async () => {
    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const description = document.getElementById('productDescription').value;
    const imageFile = document.getElementById('productImage').files[0];

    if (name && price && description && imageFile) {
        try {
            // رفع الصورة إلى Firebase Storage
            const storageRef = ref(storage, 'product-images/' + imageFile.name);
            await uploadBytes(storageRef, imageFile);
            const imageUrl = await getDownloadURL(storageRef);

            // إضافة المنتج إلى Firestore
            await addDoc(collection(db, 'products'), {
                name: name,
                price: price,
                description: description,
                imageUrl: imageUrl
            });

            alert('تمت إضافة المنتج بنجاح!');
            showStoreBtn.click(); // العودة إلى صفحة المتجر
        } catch (error) {
            console.error("Error adding product: ", error);
        }
    } else {
        alert('يرجى ملء جميع الحقول!');
    }
});

// إلغاء الإضافة والعودة إلى صفحة المتجر
cancelProductBtn.addEventListener('click', () => {
    showStoreBtn.click();
});

// تحميل المنتجات عند فتح الصفحة
window.addEventListener('load', loadProducts);