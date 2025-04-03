import React, { useRef, useState, useEffect } from 'react';

const LazyImage = ({ src, alt, placeholder, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const imgElement = imgRef.current;
    let observer;

    const onLoad = () => {
      setIsLoaded(true);
      if (imgElement) {
        imgElement.classList.add('loaded');
      }
    };

    if (imgElement) {
      if ('loading' in HTMLImageElement.prototype) {
        // Браузер поддерживает native lazy loading
        imgElement.src = src;
        imgElement.loading = 'lazy';
        imgElement.onload = onLoad;
      } else {
        // Используем IntersectionObserver для ленивой загрузки
        observer = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                imgElement.src = src;
                imgElement.onload = onLoad;
                observer.unobserve(imgElement);
              }
            });
          },
          {
            rootMargin: '0px 0px 100px 0px',
            threshold: 0.1,
          }
        );
        observer.observe(imgElement);
      }
    }

    return () => {
      if (observer && imgElement) {
        observer.unobserve(imgElement);
      }
    };
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={placeholder}
      alt={alt}
      {...props}
    />
  );
};

export default LazyImage;
