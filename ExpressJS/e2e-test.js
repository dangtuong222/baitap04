// Simple E2E test script: login -> add to cart -> get cart -> checkout -> get orders
const BASE = process.env.BACKEND_URL || 'http://localhost:8080';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  try {
    console.log('E2E: starting');

    const testEmail = process.env.TEST_USER_EMAIL || 'testuser@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'Password123!';

    // Login
    let res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const login = await res.json();
    console.log('Login response:', login);
    if (!login?.token) {
      console.error('Login failed');
      process.exit(1);
    }
    const token = login.token;

    // Get products -> choose first
    res = await fetch(`${BASE}/api/products`);
    const prodList = await res.json();
    const first = prodList?.data?.[0];
    if (!first) {
      console.error('No products found');
      process.exit(1);
    }
    console.log('First product:', first.id, first.name || first.title || '');

    // Add to cart
    res = await fetch(`${BASE}/api/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ productId: first.id, quantity: 1 })
    });
    const addRes = await res.json();
    console.log('Add to cart response:', addRes);

    // Get cart
    res = await fetch(`${BASE}/api/cart`, { headers: { 'Authorization': `Bearer ${token}` } });
    const cart = await res.json();
    console.log('Cart:', cart);

    // Checkout
    const orderBody = {
      shippingAddress: '123 Test St',
      phoneNumber: '0123456789',
      note: 'Test order',
      paymentMethod: 'COD'
    };
    res = await fetch(`${BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(orderBody)
    });
    const orderRes = await res.json();
    console.log('Create order response:', orderRes);

    // Get orders
    res = await fetch(`${BASE}/api/orders`, { headers: { 'Authorization': `Bearer ${token}` } });
    const orders = await res.json();
    console.log('Orders list:', orders?.data?.length || 0);

    console.log('E2E: done');
    process.exit(0);
  } catch (err) {
    console.error('E2E error', err);
    process.exit(1);
  }
})();
