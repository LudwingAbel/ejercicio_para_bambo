// 1. IMPORTACIONES (Siempre al principio)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. CONFIGURACIÓN FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyC8Wrts8dkHIMRVAknb1XIdC0t8o3tmryM",
    authDomain: "proyecto-test-validacion.firebaseapp.com",
    projectId: "proyecto-test-validacion",
    storageBucket: "proyecto-test-validacion.firebasestorage.app",
    messagingSenderId: "1075785642281",
    appId: "G-TK8671FLZ3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. LÓGICA PRINCIPAL
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;

    // --- SECCIÓN: TIENDA ---
    if (path.includes('store-test.html')) {
        const buyButtons = document.querySelectorAll('button[data-id]');
        buyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                let selectId = id === "1" ? "option_color" : (id === "2" ? "option_tallas" : "option_color_two");
                let suffix = id === "1" ? "one" : (id === "2" ? "two" : "three");

                const product = {
                    id: id,
                    name: document.getElementById(`title_product_${suffix}`).innerText,
                    price: parseFloat(document.getElementById(`precio_descuento_${suffix}`).querySelector('span').innerText.replace('$', '').replace(',', '')),
                    image: document.getElementById(`image_product_${suffix}`).src,
                    variant: document.getElementById(selectId)?.value || "Único",
                    quantity: 1
                };

                if (document.getElementById(selectId) && product.variant === "") {
                    alert("Selecciona una opción antes de comprar.");
                    return;
                }

                localStorage.setItem('selectedProduct', JSON.stringify(product));
                window.location.href = 'carrito.html';
            });
        });
    }

    // --- SECCIÓN: CARRITO ---
    if (path.includes('carrito.html')) {
        const product = JSON.parse(localStorage.getItem('selectedProduct'));
        if (product) {
            document.getElementById('name_product_cart').innerText = product.name;
            document.getElementById('price_product_cart').innerText = `$${product.price}`;
            document.getElementById('imagen_product_cart').src = product.image;
            document.getElementById('option_product_cart').innerText = `Seleccionaste: ${product.variant}`;
            
            const totalDisplay = document.getElementById('precio_total_products');
            const updateSummary = () => {
                totalDisplay.innerText = `$${product.price * product.quantity}`;
                localStorage.setItem('selectedProduct', JSON.stringify(product));
            };

            document.getElementById('btn_mas').onclick = () => { product.quantity++; document.getElementById('count_block').innerText = product.quantity; updateSummary(); };
            document.getElementById('btn_menos').onclick = () => { if(product.quantity > 1) { product.quantity--; document.getElementById('count_block').innerText = product.quantity; updateSummary(); }};
            document.getElementById('finalizar_compra').onclick = () => window.location.href = 'finalizar_compra.html';
            updateSummary();
        }
    }

    // --- SECCIÓN: FINALIZAR COMPRA (Aquí es donde unimos todo) ---
    if (path.includes('finalizar_compra.html')) {
        const product = JSON.parse(localStorage.getItem('selectedProduct'));
        if (product) {
            document.getElementById('nombre_product_final').innerText = product.name;
            document.getElementById('precio_producto_total_final').innerText = `$${product.price * product.quantity}`;
            document.getElementById('option_value_product_final').innerText = `Talla/Color: ${product.variant}`;
        }

        // Lógica de Códigos Postales
        const inputCP = document.getElementById('codigo_postal_usuario');
        if (inputCP) {
            inputCP.addEventListener('input', async (e) => {
                const cp = e.target.value;
                if (cp.length === 5) {
                    try {
                        const res = await fetch('./data/codepostalmexico.json');
                        const data = await res.json();
                        const registro = data.find(item => item.d_codigo === cp);
                        if (registro) {
                            document.getElementById('colonia_usuario').value = registro.d_asenta;
                            document.getElementById('direccion_usuario').value = registro.D_mnpio;
                        }
                    } catch (err) { console.error("Error cargando CP", err); }
                }
            });
        }

        // Lógica de Envío a Firebase
        const btnEnviar = document.querySelector('input[value="Enviar"]');
        if (btnEnviar) {
            btnEnviar.addEventListener('click', async (e) => {
                e.preventDefault();
                btnEnviar.disabled = true;
                btnEnviar.value = "Procesando...";

                const pedido = {
                    cliente: document.getElementById('nombre_usuario').value,
                    email: document.getElementById('emal_usuario').value,
                    telefono: document.getElementById('telefono_usuario').value,
                    colonia: document.getElementById('colonia_usuario').value,
                    municipio: document.getElementById('direccion_usuario').value,
                    cp: document.getElementById('codigo_postal_usuario').value,
                    producto: product.name,
                    variante: product.variant,
                    total: product.price * product.quantity,
                    fecha: new Date().toISOString()
                };

                try {
                    await addDoc(collection(db, "pedidos"), pedido);
                    document.getElementById('modal_exito').classList.remove('hidden');
                } catch (error) {
                    alert("Error: " + error.message);
                    btnEnviar.disabled = false;
                }
            });
        }
    }
});

// Función global para el modal
window.cerrarModal = () => {
    document.getElementById('modal_exito').classList.add('hidden');
    localStorage.removeItem('selectedProduct');
    window.location.href = 'store-test.html';
};