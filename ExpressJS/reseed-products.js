import db from './src/models/index.js';

const reseedProducts = async () => {
  try {
    console.log('🔄 Clearing old data...');
    
    // Disable foreign key checks
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Xóa toàn bộ ProductImage, Product và Category
    await db.ProductImage.destroy({ where: {}, truncate: true, force: true });
    await db.Product.destroy({ where: {}, truncate: true, force: true });
    await db.Category.destroy({ where: {}, truncate: true, force: true });
    
    // Re-enable foreign key checks
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Creating categories...');
    
    const categoriesData = [
      { key: 'racket', name: 'Vợt cầu lông', slug: 'badminton-rackets', description: 'Các loại vợt cầu lông chuyên dụng' },
      { key: 'shoes', name: 'Giày cầu lông', slug: 'badminton-shoes', description: 'Giày chuyên dụng cho cầu lông' },
      { key: 'shirt', name: 'Áo cầu lông', slug: 'badminton-shirts', description: 'Áo thể thao cho cầu lông' },
      { key: 'accessory', name: 'Phụ kiện', slug: 'badminton-accessories', description: 'Phụ kiện cầu lông' }
    ];

    const categoryMap = {};
    for (const category of categoriesData) {
      const created = await db.Category.create({
        name: category.name,
        slug: category.slug,
        description: category.description
      });
      categoryMap[category.key] = created;
    }

    const productsData = [
      {
        name: 'Vợt Yonex Astrox 88D',
        description: 'Vợt cầu lông chuyên nghiệp, thiết kế hiện đại.',
        price: 2500000,
        categoryKey: 'racket',
        stock: 15,
        rating: 4.8,
        sold: 42,
        viewCount: 120,
        isBestseller: true,
        images: [{ imageUrl: '/images/products/product01.webp', alt: 'Vợt Yonex Astrox 88D', displayOrder: 1 }]
      },
      {
        name: 'Vợt Victor Thruster K 12',
        description: 'Vợt nhập khẩu, chất lượng cao, bền bỉ.',
        price: 1800000,
        categoryKey: 'racket',
        stock: 20,
        rating: 4.6,
        sold: 35,
        viewCount: 90,
        isBestseller: false,
        images: [{ imageUrl: '/images/products/product02.webp', alt: 'Vợt Victor Thruster K 12', displayOrder: 1 }]
      },
      {
        name: 'Vợt Lining Aeronaut 9000C',
        description: 'Vợt cân bằng, kiểm soát tốt.',
        price: 2200000,
        categoryKey: 'racket',
        stock: 12,
        rating: 4.7,
        sold: 28,
        viewCount: 70,
        isBestseller: false,
        images: [{ imageUrl: '/images/products/product03.webp', alt: 'Vợt Lining Aeronaut 9000C', displayOrder: 1 }]
      },
      {
        name: 'Vợt Mizuno Fortius 10',
        description: 'Vợt công thủ toàn diện.',
        price: 2600000,
        categoryKey: 'racket',
        stock: 8,
        rating: 4.5,
        sold: 18,
        viewCount: 55,
        isBestseller: false,
        images: [{ imageUrl: '/images/products/product04.webp', alt: 'Vợt Mizuno Fortius 10', displayOrder: 1 }]
      },
      {
        name: 'Giày Yonex Power Cushion 65Z',
        description: 'Giày nhẹ, bám sân tốt.',
        price: 1900000,
        categoryKey: 'shoes',
        stock: 14,
        rating: 4.6,
        sold: 26,
        viewCount: 80,
        isBestseller: true,
        images: [{ imageUrl: '/images/products/product05.webp', alt: 'Giày Yonex Power Cushion 65Z', displayOrder: 1 }]
      },
      {
        name: 'Giày Victor A970',
        description: 'Giày bền bỉ cho thi đấu.',
        price: 1700000,
        categoryKey: 'shoes',
        stock: 10,
        rating: 4.4,
        sold: 16,
        viewCount: 60,
        isBestseller: false,
        images: [{ imageUrl: '/images/products/product06.webp', alt: 'Giày Victor A970', displayOrder: 1 }]
      },
      {
        name: 'Áo cầu lông Yonex 10201',
        description: 'Áo thoáng khí, thấm hút mồ hôi.',
        price: 350000,
        categoryKey: 'shirt',
        stock: 30,
        rating: 4.3,
        sold: 40,
        viewCount: 110,
        isBestseller: false,
        images: [{ imageUrl: '/images/products/product07.webp', alt: 'Áo cầu lông Yonex 10201', displayOrder: 1 }]
      },
      {
        name: 'Áo cầu lông Victor T-400',
        description: 'Áo thi đấu, form thoải mái.',
        price: 320000,
        categoryKey: 'shirt',
        stock: 25,
        rating: 4.2,
        sold: 22,
        viewCount: 75,
        isBestseller: false,
        images: [{ imageUrl: '/images/products/product08.webp', alt: 'Áo cầu lông Victor T-400', displayOrder: 1 }]
      },
      {
        name: 'Dây cước Yonex BG65',
        description: 'Dây bền, kiểm soát tốt.',
        price: 150000,
        categoryKey: 'accessory',
        stock: 80,
        rating: 4.7,
        sold: 120,
        viewCount: 200,
        isBestseller: true,
        images: [{ imageUrl: '/images/products/product10.webp', alt: 'Dây cước Yonex BG65', displayOrder: 1 }]
      },
      {
        name: 'Vợt Apacs Z-Ziggler',
        description: 'Vợt dễ chơi cho người mới.',
        price: 1300000,
        categoryKey: 'racket',
        stock: 18,
        rating: 4.1,
        sold: 15,
        viewCount: 45,
        isBestseller: false,
        images: [{ imageUrl: '/images/products/product11.webp', alt: 'Vợt Apacs Z-Ziggler', displayOrder: 1 }]
      },
      {
        name: 'Vợt Flypower Enigma',
        description: 'Vợt thiên công, lực tốt.',
        price: 1600000,
        categoryKey: 'racket',
        stock: 11,
        rating: 4.0,
        sold: 12,
        viewCount: 40,
        isBestseller: false,
        images: [{ imageUrl: '/images/products/product12.webp', alt: 'Vợt Flypower Enigma', displayOrder: 1 }]
      },
      {
        name: 'Giày Lining Ranger 1',
        description: 'Giày bám sân, êm chân.',
        price: 1400000,
        categoryKey: 'shoes',
        stock: 16,
        rating: 4.2,
        sold: 19,
        viewCount: 65,
        isBestseller: false,
        images: [{ imageUrl: '/images/products/product13.webp', alt: 'Giày Lining Ranger 1', displayOrder: 1 }]
      },
      {
        name: 'Giày Yonex Aerus Z',
        description: 'Giày siêu nhẹ, linh hoạt.',
        price: 2100000,
        categoryKey: 'shoes',
        stock: 9,
        rating: 4.6,
        sold: 24,
        viewCount: 95,
        isBestseller: false,
        images: [{ imageUrl: '/images/products/product14.webp', alt: 'Giày Yonex Aerus Z', displayOrder: 1 }]
      },
      {
        name: 'Bịt cổ tay Yonex',
        description: 'Thấm hút mồ hôi tốt.',
        price: 90000,
        categoryKey: 'accessory',
        stock: 100,
        rating: 4.3,
        sold: 60,
        viewCount: 130,
        isBestseller: false,
        images: [{ imageUrl: '/images/products/product15.webp', alt: 'Bịt cổ tay Yonex', displayOrder: 1 }]
      },
      {
        name: 'Ống cầu lông Victor Gold',
        description: 'Ống cầu tiêu chuẩn tập luyện.',
        price: 280000,
        categoryKey: 'accessory',
        stock: 50,
        rating: 4.5,
        sold: 85,
        viewCount: 160,
        isBestseller: false,
        images: [{ imageUrl: '/images/products/product16.webp', alt: 'Ống cầu lông Victor Gold', displayOrder: 1 }]
      }
    ];

    console.log('Creating products with images...');
    
    // Thêm sản phẩm + images
    for (const productData of productsData) {
      const { images, categoryKey, ...productInfo } = productData;
      const category = categoryMap[categoryKey];
      
      const product = await db.Product.create({ ...productInfo, categoryId: category.id });

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
