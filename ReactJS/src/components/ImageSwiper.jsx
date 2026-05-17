import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Zoom } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';
import './ImageSwiper.css';

const ImageSwiper = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="image-swiper-empty">
        <img src="https://via.placeholder.com/500x500?text=No+Image" alt="No image available" />
      </div>
    );
  }

  return (
    <div className="image-swiper-container">
      <Swiper
        modules={[Navigation, Pagination, Zoom]}
        navigation
        pagination={{ clickable: true }}
        zoom
        onSlideChange={(swiper) => setSelectedImage(swiper.activeIndex)}
        className="main-swiper"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index} zoom>
            <img 
              src={image.imageUrl} 
              alt={image.alt || `Product image ${index + 1}`}
              className="product-image-large"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {images.length > 1 && (
        <div className="thumbnail-swiper">
          <Swiper
            slidesPerView={4}
            spaceBetween={10}
            className="thumbnails"
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <img
                  src={image.imageUrl}
                  alt={`Thumbnail ${index + 1}`}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => {
                    const swiper = document.querySelector('.main-swiper').swiper;
                    swiper.slideTo(index);
                  }}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
};

export default ImageSwiper;
