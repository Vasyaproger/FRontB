// import React, { useState, useEffect, useRef } from 'react';
// import '../styles/Stories.css';

// // Импортируем изображения
// import image1 from '../images/halal_png.png';
// import image2 from './Loader/logo.png';
// import image3 from '../images/halal_png.png';

// function Stories() {
//   const storiesData = [
//     { id: 1, img: image1, text: 'Попробуйте наш освежающий лимонад!' },
//     { id: 2, img: image2, text: 'Пицца дня: Маргарита с сырным бортиком!' },
//     { id: 3, img: image3, text: 'Десерт недели: клубничный чизкейк.' },
//   ];

//   const [currentStory, setCurrentStory] = useState(0);
//   const [progress, setProgress] = useState(0);
//   const [isPaused, setIsPaused] = useState(false);
//   const [isStoryOpen, setIsStoryOpen] = useState(false); // Состояние для открытия истории
//   const intervalIdRef = useRef(null);
//   const timeoutIdRef = useRef(null);

//   // Функция для переключения на следующую историю
//   const handleNextStory = () => {
//     setCurrentStory((prev) => (prev + 1) % storiesData.length);
//     setProgress(0);
//   };

//   // Функция для переключения на предыдущую историю
//   const handlePrevStory = () => {
//     setCurrentStory((prev) => (prev === 0 ? storiesData.length - 1 : prev - 1));
//     setProgress(0);
//   };

//   // Функция для открытия истории
//   const openStory = () => {
//     setIsStoryOpen(true); // Открываем историю
//     document.body.style.overflow = 'hidden';
//   };

//   // Функция для закрытия истории
//   const closeStory = () => {
//     setIsStoryOpen(false); // Закрываем историю
//     document.body.style.overflow = '';
//   };

//   const handleClick = (e) => {
//     const screenWidth = window.innerWidth;
//     const clickPosition = e.clientX;

//     // Проверяем, на какой части экрана был клик
//     if (clickPosition < screenWidth / 2) {
//       handlePrevStory(); // Клик в левую половину экрана
//     } else {
//       handleNextStory(); // Клик в правую половину экрана
//     }
//   };

//   const updateProgress = () => {
//     setProgress((prevProgress) => {
//       if (prevProgress < 100) {
//         return prevProgress + 2;
//       } else {
//         handleNextStory(); // Когда прогресс достигает 100, переключаемся на следующую историю
//         return 0;
//       }
//     });
//   };

//   useEffect(() => {
//     if (!isPaused) {
//       intervalIdRef.current = setInterval(updateProgress, 100); // Обновляем прогресс каждую 0.1 секунду
//       timeoutIdRef.current = setTimeout(handleNextStory, 5000); // Переход к следующей истории через 5 секунд
//     }

//     return () => {
//       clearInterval(intervalIdRef.current);
//       clearTimeout(timeoutIdRef.current);
//     };
//   }, [isPaused, currentStory]);

//   return (
//     <div className="stories">
//     {/* Фон с анимацией, который будет скрываться при открытии модального окна */}
//     {!isStoryOpen && (
//       <div className="background-animation"></div>
//     )}
  
//     <div className="stories-container" onClick={handleClick}>
//       <div className="story-card" onClick={openStory}>
//         <p>Нажмите, чтобы узнать больше об акциях</p>
//       </div>
  
//       {isStoryOpen && (
//         <div className="story-modal">
//           <div className="progress-bar">
//             <div
//               className="progress"
//               style={{ width: `${progress}%` }}
//             ></div>
//           </div>
  
//           <div className="story-content">
//             <img src={storiesData[currentStory].img} alt={`Story ${currentStory}`} />
//             <p>{storiesData[currentStory].text}</p>
//             <button className="close-button" onClick={closeStory}>Закрыть</button>
//           </div>
//         </div>
//       )}
//     </div>
//   </div>
  
//   );
// }

// export default Stories;
