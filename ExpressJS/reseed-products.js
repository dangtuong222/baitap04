import db from './src/models/index.js';

const reseedProducts = async () => {
  try {
    console.log('🔄 Clearing old data...');
    
    // Disable foreign key checks
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Xóa toàn bộ ProductImage và Product
    await db.ProductImage.destroy({ where: {}, truncate: true, force: true });
    await db.Product.destroy({ where: {}, truncate: true, force: true });
    
    // Re-enable foreign key checks
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Creating categories...');
    
    // Tạo categories
    const categoryBadminton = await db.Category.findOrCreate({
      where: { name: 'Vợt cầu lông' },
      defaults: { slug: 'badminton-rackets', description: 'Các loại vợt cầu lông chuyên dụng' }
    });

    // Dữ liệu sản phẩm
    const productsData = [
      {
        name: 'Vợt Yonex Astrox 88D',
        description: 'Vợt cầu lông chuyên nghiệp, thiết kế hiện đại, phù hợp với các vận động viên.',
        price: 2500000,
        categoryId: categoryBadminton[0].id,
        stock: 15,
        rating: 4.8,
        sold: 42,
        isBestseller: true,
        images: [
          { imageUrl: '/images/products/product01.webp', alt: 'Vợt Yonex Astrox 88D', displayOrder: 1 }
        ]
      },
      {
        name: 'Vợt Victor Thruster K 12',
        description: 'Vợt nhập khẩu từ Đài Loan, chất lượng cao, bền bỉ.',
        price: 1800000,
        categoryId: categoryBadminton[0].id,
        stock: 20,
        rating: 4.6,
        sold: 35,
        isBestseller: false,
        images: [
          { imageUrl: '/images/products/product02.webp', alt: 'Vợt Victor Thruster', displayOrder: 1 }
        ]
      }
    ];

    console.log('Creating products with images...');
    
    // Thêm sản phẩm + images
    for (const productData of productsData) {
      const { images, ...productInfo } = productData;
      
      const product = await db.Product.create(productInfo);

      if (images && images.length > 0) {
        for (const image of images) {
          await db.ProductImage.create({
            productId: product.id,
            ...image
          });
        }
      }

      console.log(`✓ ${product.name} với ${images?.length || 0} ảnh`);
    }

    console.log('✅ Re-seed dữ liệu thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
};

reseedProducts();
