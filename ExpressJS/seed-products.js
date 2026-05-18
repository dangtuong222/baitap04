import db from './src/models/index.js';

const seedProducts = async () => {
  try {
    console.log('Seeding products...');

    // Tạo category nếu chưa có
    const [categoryBadminton] = await db.Category.findOrCreate({
      where: { name: 'Vợt cầu lông' },
      defaults: { slug: 'badminton-rackets', description: 'Các loại vợt cầu lông chuyên dụng' }
    });

    // Dữ liệu sản phẩm mẫu
    const productsData = [
      {
        name: 'Vợt Yonex Astrox 88D',
        description: 'Vợt cầu lông chuyên nghiệp, thiết kế hiện đại, phù hợp với các vận động viên.',
        price: 2500000,
        categoryId: categoryBadminton.id,
        stock: 15,
        rating: 4.8,
        sold: 42,
        isBestseller: true,
        images: [
          { imageUrl: '/images/products/yonex1.jpg', alt: 'Vợt Yonex Astrox 88D', displayOrder: 1 },
          { imageUrl: '/images/products/yonex2.jpg', alt: 'Vợt Yonex chi tiết', displayOrder: 2 }
        ]
      },
      {
        name: 'Vợt Victor Thruster K 12',
        description: 'Vợt nhập khẩu từ Đài Loan, chất lượng cao, bền bỉ.',
        price: 1800000,
        categoryId: categoryBadminton.id,
        stock: 20,
        rating: 4.6,
        sold: 35,
        isBestseller: false,
        images: [
          { imageUrl: '/images/products/victor1.jpg', alt: 'Vợt Victor Thruster', displayOrder: 1 }
        ]
      }
    ];

    // Thêm sản phẩm và ảnh
    for (const productData of productsData) {
      const { images, ...productInfo } = productData;
      
      const [product, created] = await db.Product.findOrCreate({
        where: { name: productData.name },
        defaults: productInfo
      });

      if (images && images.length > 0) {
        for (const image of images) {
          await db.ProductImage.findOrCreate({
            where: { productId: product.id, imageUrl: image.imageUrl },
            defaults: image
          });
        }
      }

      console.log(`✓ ${product.name}`);
    }

    console.log('✅ Seed dữ liệu thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  }
};

seedProducts();
